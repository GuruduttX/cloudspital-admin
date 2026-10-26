import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_SECONDS = 8 * 60 * 60;
const ISSUER = 'healthmatrix-admin';
const AUDIENCE = 'healthmatrix-admin-dashboard';

function signingKey(secret) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new Error('Set ADMIN_JWT_SECRET to a random secret of at least 32 bytes.');
  }
  return new TextEncoder().encode(secret);
}

/** Only an account ID and role are public claims; no credentials go into the JWT. */
export async function createAdminJwt(adminId, secret, now = new Date()) {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({ role: 'super_admin' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(adminId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_SECONDS)
    .sign(signingKey(secret));
}

export async function verifyAdminJwt(token, secret, now = new Date()) {
  try {
    if (typeof token !== 'string' || token.length > 4096) return null;
    const { payload } = await jwtVerify(token, signingKey(secret), {
      algorithms: ['HS256'], typ: 'JWT', issuer: ISSUER, audience: AUDIENCE,
      requiredClaims: ['sub', 'jti', 'iat', 'exp', 'role'], currentDate: now,
    });
    if (payload.role !== 'super_admin' || !/^[a-f0-9]{24}$/.test(payload.sub ?? '') ||
        typeof payload.jti !== 'string' || !payload.jti ||
        typeof payload.iat !== 'number' || typeof payload.exp !== 'number' ||
        payload.iat > Math.floor(now.getTime() / 1000) || payload.exp - payload.iat !== SESSION_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}
