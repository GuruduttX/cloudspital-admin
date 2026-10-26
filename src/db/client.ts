import "server-only";
import { MongoClient } from "mongodb";
import type { AdminSessionDocument, AuditDocument, LoginBucketDocument } from "@/models/admin";
import type { WithId } from "mongodb";
import type { Doctor } from "@/models/doctor.model";
import type { Member } from "@/models/member.model";

type DoctorDocument = WithId<Doctor>;
type PatientDocument = WithId<Member>;

const globalDb = globalThis as typeof globalThis & { adminMongo?: Promise<MongoClient> };

export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Admin database is not configured.");
  globalDb.adminMongo ??= new MongoClient(uri, {
    appName: "healthmatrix-super-admin", maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000,
  }).connect().catch(() => {
    globalDb.adminMongo = undefined;
    throw new Error("Admin database is unavailable.");
  });
  return (await globalDb.adminMongo).db(process.env.MONGODB_DB_NAME || "healthmatrix");
}

/** No schema registration or automatic indexes on shared actor collections. */
export async function actorCollections() {
  const db = await database();
  return { doctors: db.collection<DoctorDocument>("doctors"), patients: db.collection<PatientDocument>("members") };
}

/** Admin-owned collections only. */
export async function adminCollections() {
  const db = await database();
  return {
    sessions: db.collection<AdminSessionDocument>("admin_sessions"),
    loginBuckets: db.collection<LoginBucketDocument>("admin_login_buckets"),
    audit: db.collection<AuditDocument>("admin_audit_logs"),
  };
}
