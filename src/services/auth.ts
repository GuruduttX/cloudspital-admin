import "server-only";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { adminCollections } from "@/db/client";
import { configuredAdmin, hashToken, normalizeEmail, validEmail, verifyCredentials } from "@/lib/auth/crypto.mjs";

import { createAdminJwt, verifyAdminJwt, SESSION_SECONDS } from "@/lib/auth/jwt.mjs";
const WINDOW_MS = 15 * 60 * 1000;
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-hm_admin" : "hm_admin";

export const currentAdmin = cache(async () => {
  // JWT expiry must use request time, including during development prerender checks.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = new Date();
  const claims = await verifyAdminJwt(token, process.env.ADMIN_JWT_SECRET, now);
  if (!claims) return null;
  const configured = configuredAdmin();
  if (!configured) return null;
  const { sessions } = await adminCollections();
  const session = await sessions.findOne({
    _id: hashToken(token), adminId: new ObjectId(claims.sub), credentialVersion: configured.credentialVersion, expiresAt: { $gt: now },
  });
  if (!session) return null;
  return { id: session.adminId, email: configured.email, name: configured.name };
});

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

export async function authenticate(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const configured = configuredAdmin();
  if (!configured) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local.");
  if (!validEmail(email) || !password || password.length > 128) return "invalid" as const;
  const { sessions, loginBuckets, audit } = await adminCollections();
  const now = Date.now();
  // Shared across instances; atomic counters include attempts in flight, not just failures.
  const window = Math.floor(now / WINDOW_MS);
  const bucket = await loginBuckets.findOneAndUpdate({ _id: `${hashToken(email)}:${window}` }, {
    $inc: { attempts: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * WINDOW_MS) },
  }, { upsert: true, returnDocument: "after" });
  if (!bucket || bucket.attempts > 5) return "limited" as const;

  if (!verifyCredentials(email, password, configured)) {
    await audit.insertOne({ action: "login_failure", createdAt: new Date(now) });
    return "invalid" as const;
  }
  const adminId = new ObjectId(hashToken(configured.email).slice(0, 24));

  const token = await createAdminJwt(adminId.toHexString(), process.env.ADMIN_JWT_SECRET, new Date(now));
  const expiresAt = new Date(Math.floor(now / 1000) * 1000 + SESSION_SECONDS * 1000);
  const oldToken = (await cookies()).get(SESSION_COOKIE)?.value;
  if (oldToken) await sessions.deleteOne({ _id: hashToken(oldToken) });
  await audit.insertOne({ adminId, action: "login_success", createdAt: new Date(now) });
  await sessions.insertOne({ _id: hashToken(token), adminId, credentialVersion: configured.credentialVersion, createdAt: new Date(now), expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS, expires: expiresAt,
  });
  return "success" as const;
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const { sessions, audit } = await adminCollections();
    const session = await sessions.findOneAndDelete({ _id: hashToken(token) });
    if (session) await audit.insertOne({ adminId: session.adminId, action: "logout", createdAt: new Date() });
  }
  store.delete(SESSION_COOKIE);
}
