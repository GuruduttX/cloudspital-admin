import "server-only";
import { ObjectId, type Document, type Filter } from "mongodb";
import { database } from "@/db/client";
import { recordSources, type RecordKey } from "@/lib/activity-config";
import type { ActorKind } from "@/types/directory";

export const PAGE_SIZE = 20;
const options = { maxTimeMS: 10000 };
const aggregateOptions = { ...options, allowDiskUse: true };
export type Scope = { kind: ActorKind; id: string };
export type RecordRow = { id: string; data: Record<string, unknown> };
export type RecordPage = { rows: RecordRow[]; total: number; page: number; pages: number };
const doctorRelations: RecordKey[] = ["consultations", "requests", "prescriptions", "vaccinations", "access", "accessLogs", "tests", "conversations"];
export function projection(key: RecordKey) {
  return Object.fromEntries(["_id", "createdAt", "updatedAt", ...recordSources[key].fields.split(" ")].map(field => [field, 1]));
}
function scopeFilter(key: RecordKey, scope?: Scope): Filter<Document> {
  if (!scope) return {};
  const id = new ObjectId(scope.id);
  if (scope.kind === "doctors") return key === "doctors" ? { _id: id } : { doctor: id };
  if (key === "members") return { _id: id };
  if (key === "family") return { $or: [{ owner: id }, { member: id }] };
  return { [key === "invites" ? "owner" : "member"]: id };
}
export async function readRecords(key: RecordKey, page: number, scope?: Scope, recordId?: string): Promise<RecordPage> {
  const db = await database();
  const collection = db.collection(recordSources[key].collection);
  const filter = { ...scopeFilter(key, scope), ...(recordId ? { _id: new ObjectId(recordId) } : {}) };
  const total = await collection.countDocuments(filter, options);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  page = Math.min(page, pages);
  const docs = await collection.find(filter, { projection: projection(key), ...options }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray();
  return { rows: docs.map(doc => ({ id: String(doc._id), data: doc })), total, page, pages };
}
export async function readDoctorPatients(id: string, page: number): Promise<RecordPage> {
  const db = await database();
  const branch = () => [{ $match: { doctor: new ObjectId(id), member: { $type: "objectId" } } }, { $project: { member: 1, createdAt: 1 } }];
  const pipeline: Document[] = [...branch(), ...doctorRelations.slice(1).map(key => ({ $unionWith: { coll: recordSources[key].collection, pipeline: branch() } })),
    { $group: { _id: "$member", firstSeen: { $min: "$createdAt" }, lastSeen: { $max: "$createdAt" } } },
    { $lookup: { from: "members", localField: "_id", foreignField: "_id", as: "patient", pipeline: [{ $project: projection("members") }] } },
    { $unwind: "$patient" }, { $sort: { lastSeen: -1, _id: -1 } },
    { $facet: { count: [{ $count: "total" }], rows: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }] } }];
  const [result] = await db.collection("consults").aggregate(pipeline, aggregateOptions).toArray();
  const total = result?.count[0]?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) return readDoctorPatients(id, pages);
  return { total, pages, page, rows: (result?.rows ?? []).map((row: Document) => ({ id: String(row._id), data: { ...row.patient, firstSeen: row.firstSeen, lastSeen: row.lastSeen } })) };
}

const eventDates = ["createdAt", "updatedAt", "signedAt", "startedAt", "endedAt", "cancelledAt", "respondedAt", "approvedAt", "revokedAt", "reviewedAt", "scannedAt", "mobilab.webhookAt"];
export async function readActivity(page: number, scope?: Scope, source?: RecordKey): Promise<RecordPage> {
  const db = await database();
  const keys = source ? [source] : (Object.keys(recordSources) as RecordKey[]).filter(key => !scope || (scope.kind === "doctors" ? [...doctorRelations, "doctors", "doctorSessions"].includes(key) : !["doctors", "pods", "doctorSessions", "conversations"].includes(key)));
  const branch = (key: RecordKey): Document[] => [
    { $match: scopeFilter(key, scope) },
    { $project: { _id: 1, member: 1, doctor: 1, owner: 1, name: 1, title: 1, status: 1, action: 1, events: { $concatArrays: [
      eventDates.map(field => ({ at: `$${field}`, event: field })),
      ...(key === "access" ? [{ $map: { input: { $ifNull: ["$views", []] }, as: "view", in: { at: "$$view.at", event: "recordViewed", detail: "$$view.what" } } }] : []),
      ...(key === "reminders" ? [{ $map: { input: { $ifNull: ["$log", []] }, as: "dose", in: { at: { $ifNull: ["$$dose.at", "$$dose.takenAt"] }, event: "doseRecorded", detail: { $ifNull: ["$$dose.status", "taken"] } } } }] : []),
      ...(key === "conversations" ? [{ $map: { input: { $ifNull: ["$exchanges", []] }, as: "exchange", in: { at: "$$exchange.askedAt", event: "recordQuestion", detail: "Question saved" } } }] : []),
      ...(key === "vaccinations" ? [{ $map: { input: { $ifNull: ["$doses", []] }, as: "dose", in: { at: "$$dose.givenAt", event: "vaccineGiven", detail: "Dose marked given" } } }] : []),
    ] } } },
    { $unwind: "$events" }, { $match: { "events.at": { $type: "date" } } },
    // updatedAt is the most recent change, not a history of every edit; avoid duplicate creation events.
    { $match: { $expr: { $or: [{ $ne: ["$events.event", "updatedAt"] }, { $ne: ["$events.at", "$createdAt"] }] } } },
    { $project: { _id: 1, member: 1, doctor: 1, owner: 1, name: 1, title: 1, status: 1, action: 1, detail: "$events.detail", at: "$events.at", event: "$events.event", source: { $literal: key } } },
  ];
  // Keep createdAt only long enough to remove an updatedAt equal to creation time.
  const pipelines = keys.map(key => { const stages = branch(key); (stages[1].$project as Document).createdAt = 1; return stages; });
  const pipeline = [...pipelines[0], ...keys.slice(1).map((key, i) => ({ $unionWith: { coll: recordSources[key].collection, pipeline: pipelines[i + 1] } })),
    { $sort: { at: -1, source: 1, _id: -1, event: 1 } },
    { $facet: { count: [{ $count: "total" }], rows: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }] } }];
  const [result] = await db.collection(recordSources[keys[0]].collection).aggregate(pipeline, aggregateOptions).toArray();
  const total = result?.count[0]?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) return readActivity(pages, scope, source);
  return { total, pages, page, rows: (result?.rows ?? []).map((row: Document) => ({ id: String(row._id), data: row })) };
}

/** Resolve only names of people referenced on the current page, never entire profiles. */
export async function recordPeople(rows: RecordRow[]) {
  const db = await database();
  const ids = new Set<string>();
  for (const { data } of rows) for (const field of ["member", "doctor", "owner"]) if (data[field] instanceof ObjectId) ids.add(String(data[field]));
  const objectIds = [...ids].map(id => new ObjectId(id));
  const [members, doctors] = await Promise.all([db.collection("members").find({ _id: { $in: objectIds } }, { projection: { name: 1 }, ...options }).toArray(), db.collection("doctors").find({ _id: { $in: objectIds } }, { projection: { name: 1 }, ...options }).toArray()]);
  return new Map<string, { name: string; kind: ActorKind }>([...members.map(doc => [String(doc._id), { name: String(doc.name || "Unnamed patient"), kind: "patients" }] as const), ...doctors.map(doc => [String(doc._id), { name: String(doc.name || "Unnamed doctor"), kind: "doctors" }] as const)]);
}

export async function readAccountSummary(scope: Scope) {
  const db = await database();
  const keys: RecordKey[] = scope.kind === "doctors"
    ? ["consultations", "prescriptions", "vaccinations", "access"]
    : ["consultations", "prescriptions", "records", "bookings"];
  return Promise.all(keys.map(async key => ({ key, title: recordSources[key].title,
    total: await db.collection(recordSources[key].collection).countDocuments(scopeFilter(key, scope), options) })));
}

export async function readDoctorOverview(scope: Scope) {
  const db = await database();
  const keys = ["consultations", "prescriptions", "requests"] as const;
  return Promise.all(keys.map(async key => {
    const docs = await db.collection(recordSources[key].collection)
      .find(scopeFilter(key, scope), { projection: projection(key), ...options })
      .sort({ createdAt: -1, _id: -1 }).limit(5).toArray();
    return { key, title: recordSources[key].title, rows: docs.map(doc => ({ id: String(doc._id), data: doc })) };
  }));
}
