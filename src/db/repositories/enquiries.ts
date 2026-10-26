import "server-only";
import { ObjectId, type Document, type Filter } from "mongodb";
import { database } from "@/db/client";
import { escapedSearch } from "@/lib/directory.mjs";
import { isObjectId } from "@/lib/enquiries";
import { ENQUIRY_PAGE_SIZE, MAX_CHAT_MESSAGES } from "@/config/enquiries";
import type { ChatDetail, ChatMessage, ChatSummary, CustomerProfile, CustomerRow, EnquiryListData, EnquiryQuery, EnquiryRow, EnquiryStatus, Page } from "@/types/enquiries";

/** Shape the website and the app write. Never change it from here. */
interface MessageDocument { _id: ObjectId; from: "member" | "support"; text: string; agentName?: string; at: Date }
interface EnquiryDocument {
  _id: ObjectId;
  type: string;
  source?: string;
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  message?: string;
  status: EnquiryStatus;
  memberId?: string;
  member?: ObjectId;
  topic?: string;
  messages?: MessageDocument[];
  memberReadAt?: Date;
  supportReadAt?: Date;
  endedAt?: Date;
  endedBy?: "member" | "support";
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORT = "support";
const MAX_TIME = { maxTimeMS: 5000 };
const iso = (value?: Date | null) => value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : undefined;
const now = () => new Date().toISOString();

async function enquiries() {
  return (await database()).collection<EnquiryDocument>("enquiries");
}

function message(doc?: MessageDocument | null): ChatMessage | undefined {
  if (!doc) return undefined;
  return { id: doc._id?.toHexString?.() ?? "", from: doc.from === "support" ? "support" : "member", text: doc.text || "", agentName: doc.agentName || undefined, at: iso(doc.at) ?? "" };
}

function row(doc: EnquiryDocument): EnquiryRow {
  const isApp = doc.type === SUPPORT;
  return {
    id: doc._id.toHexString(), type: doc.type, source: isApp ? "app" : "website",
    name: doc.name || "Unnamed", email: doc.email || "", phone: doc.phone || undefined, organization: doc.organization || undefined,
    message: doc.message || undefined, status: doc.status, topic: doc.topic, memberId: doc.memberId || undefined,
    member: doc.member?.toHexString(), last: isApp ? message(doc.messages?.at(-1)) : undefined,
    createdAt: iso(doc.createdAt) ?? "", updatedAt: iso(doc.updatedAt) ?? "",
  };
}

/** Name, phone, email, organisation and HM ID. "HM 4829 1057" matches the stored digits. */
function searchFilter(q: string): Filter<EnquiryDocument> {
  if (!q) return {};
  const conditions: Filter<EnquiryDocument>[] = ["name", "phone", "email", "organization", "memberId"].map((field) => ({ [field]: { $regex: escapedSearch(q), $options: "i" } }));
  const digits = q.replace(/^hm\s*/i, "").replace(/[\s-]/g, "");
  if (/^\d{3,}$/.test(digits) && digits !== q) conditions.push({ memberId: { $regex: digits } }, { phone: { $regex: digits } });
  return { $or: conditions };
}

function paged<T>(items: T[], total: number, page: number): Page<T> {
  return { items, total, page, pages: Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE)), pageSize: ENQUIRY_PAGE_SIZE };
}

const clampPage = (page: number, total: number) => Math.min(page, Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE)));

/** List fields only: one trailing message instead of the whole thread. */
const LIST_FIELDS = {
  type: 1, name: 1, email: 1, phone: 1, organization: 1, message: 1, status: 1, topic: 1, memberId: 1, member: 1,
  createdAt: 1, updatedAt: 1, messages: { $slice: ["$messages", -1] },
};

export async function readCounts() {
  const collection = await enquiries();
  const [app, website, waiting] = await Promise.all([
    collection.countDocuments({ type: SUPPORT }, MAX_TIME),
    collection.countDocuments({ type: { $ne: SUPPORT } }, MAX_TIME),
    collection.countDocuments({ type: SUPPORT, status: "unread" }, MAX_TIME),
  ]);
  return { app, website, all: app + website, waiting };
}

export async function readWaitingCount() {
  return (await enquiries()).countDocuments({ type: SUPPORT, status: "unread" }, MAX_TIME);
}

/** Website and All tabs. App chats waiting on the team are pinned to the top. */
async function readRows(query: EnquiryQuery): Promise<Page<EnquiryRow>> {
  const collection = await enquiries();
  const filter: Filter<EnquiryDocument> = { ...searchFilter(query.q), ...(query.tab === "website" ? { type: { $ne: SUPPORT } } : {}), ...(query.status !== "all" ? { status: query.status as EnquiryStatus } : {}) };
  const total = await collection.countDocuments(filter, MAX_TIME);
  const page = clampPage(query.page, total);
  const docs = await collection.aggregate<EnquiryDocument>([
    { $match: filter },
    { $addFields: { pinned: { $cond: [{ $and: [{ $eq: ["$type", SUPPORT] }, { $eq: ["$status", "unread"] }] }, 1, 0] } } },
    { $sort: { pinned: -1, updatedAt: -1, _id: -1 } },
    { $skip: (page - 1) * ENQUIRY_PAGE_SIZE },
    { $limit: ENQUIRY_PAGE_SIZE },
    { $project: LIST_FIELDS },
  ], MAX_TIME).toArray();
  return paged(docs.map(row), total, page);
}

const STATE_MATCH: Record<string, Document> = {
  waiting: { waiting: { $gt: 0 } },
  open: { waiting: 0, open: { $gt: 0 } },
  closed: { open: 0 },
};

interface CustomerGroup {
  _id: ObjectId; name?: string; memberId?: string; phone?: string; email?: string;
  chats: number; waiting: number; open: number; lastAt: Date;
  latest: { topic?: string; last?: MessageDocument };
}

/** App chats grouped by member: one row per customer, waiting customers first. */
async function readCustomers(query: EnquiryQuery): Promise<Page<CustomerRow>> {
  const collection = await enquiries();
  const [result] = await collection.aggregate<{ items: CustomerGroup[]; total: { count: number }[] }>([
    { $match: { type: SUPPORT, ...searchFilter(query.q) } },
    { $sort: { updatedAt: -1 } },
    { $group: {
      _id: "$member",
      name: { $first: "$name" }, memberId: { $first: "$memberId" }, phone: { $first: "$phone" }, email: { $first: "$email" },
      chats: { $sum: 1 },
      waiting: { $sum: { $cond: [{ $eq: ["$status", "unread"] }, 1, 0] } },
      open: { $sum: { $cond: [{ $ne: ["$status", "resolved"] }, 1, 0] } },
      lastAt: { $max: "$updatedAt" },
      latest: { $first: { topic: "$topic", last: { $arrayElemAt: ["$messages", -1] } } },
    } },
    ...(query.status !== "all" && STATE_MATCH[query.status] ? [{ $match: STATE_MATCH[query.status] }] : []),
    { $sort: { waiting: -1, lastAt: -1, _id: -1 } },
    { $facet: {
      items: [{ $skip: (query.page - 1) * ENQUIRY_PAGE_SIZE }, { $limit: ENQUIRY_PAGE_SIZE }],
      total: [{ $count: "count" }],
    } },
  ], MAX_TIME).toArray();
  const total = result?.total[0]?.count ?? 0;
  const items = (result?.items ?? []).filter((group) => group._id).map((group): CustomerRow => ({
    member: group._id.toHexString(), name: group.name || "Unnamed member", memberId: group.memberId, phone: group.phone, email: group.email || undefined,
    chats: group.chats, waiting: group.waiting, open: group.open, lastAt: iso(group.lastAt) ?? "",
    topic: group.latest?.topic, last: message(group.latest?.last),
  }));
  return paged(items, total, query.page);
}

export async function readEnquiryList(query: EnquiryQuery): Promise<EnquiryListData> {
  const [counts, list] = await Promise.all([readCounts(), query.tab === "app" ? readCustomers(query) : readRows(query)]);
  return { query, counts, ...(query.tab === "app" ? { customers: list as Page<CustomerRow> } : { website: list as Page<EnquiryRow> }), now: now() };
}

function summary(doc: EnquiryDocument & { messageCount?: number }): ChatSummary {
  return {
    id: doc._id.toHexString(), topic: doc.topic, status: doc.status, messageCount: doc.messageCount ?? doc.messages?.length ?? 0,
    last: message(doc.messages?.at(-1)), endedAt: iso(doc.endedAt), endedBy: doc.endedBy,
    createdAt: iso(doc.createdAt) ?? "", updatedAt: iso(doc.updatedAt) ?? "",
  };
}

/** Every chat for one member, newest first, with only the last message of each. */
export async function readMemberChats(member: ObjectId): Promise<(ChatSummary & { name?: string; memberId?: string; phone?: string; email?: string })[]> {
  const docs = await (await enquiries()).aggregate<EnquiryDocument & { messageCount: number }>([
    { $match: { type: SUPPORT, member } },
    { $sort: { createdAt: -1 } },
    { $project: {
      topic: 1, status: 1, endedAt: 1, endedBy: 1, createdAt: 1, updatedAt: 1, name: 1, memberId: 1, phone: 1, email: 1,
      messageCount: { $size: { $ifNull: ["$messages", []] } }, messages: { $slice: [{ $ifNull: ["$messages", []] }, -1] },
    } },
  ], MAX_TIME).toArray();
  return docs.map((doc) => ({ ...summary(doc), name: doc.name, memberId: doc.memberId, phone: doc.phone, email: doc.email || undefined }));
}

/** Contact fields only: the members collection also holds health data, which support never reads. */
export async function readCustomerProfile(member: ObjectId, fallback?: { name?: string; memberId?: string; phone?: string; email?: string }): Promise<CustomerProfile | null> {
  const doc = await (await database()).collection("members").findOne({ _id: member }, { projection: { name: 1, phone: 1, email: 1, memberId: 1, plan: 1 }, ...MAX_TIME });
  if (!doc && !fallback) return null;
  return {
    member: member.toHexString(), name: doc?.name || fallback?.name || "Unnamed member", memberId: doc?.memberId || fallback?.memberId,
    phone: doc?.phone || fallback?.phone, email: doc?.email || fallback?.email || undefined, plan: doc?.plan || undefined,
  };
}

export async function readCustomer(id: string) {
  if (!isObjectId(id)) return null;
  const member = new ObjectId(id);
  const chats = await readMemberChats(member);
  const profile = await readCustomerProfile(member, chats[0]);
  return profile ? { profile, chats } : null;
}

/**
 * Messages are append-only, so a poll can ask for the ones after `from`.
 * The client keeps what it already has and appends the rest.
 */
export async function readChat(id: string, from = 0): Promise<ChatDetail | null> {
  if (!isObjectId(id)) return null;
  const [doc] = await (await enquiries()).aggregate<EnquiryDocument & { messageCount: number }>([
    { $match: { _id: new ObjectId(id), type: SUPPORT } },
    { $project: {
      name: 1, email: 1, phone: 1, memberId: 1, member: 1, topic: 1, message: 1, status: 1, memberReadAt: 1, supportReadAt: 1, endedAt: 1, endedBy: 1, createdAt: 1, updatedAt: 1,
      messageCount: { $size: { $ifNull: ["$messages", []] } },
      messages: { $slice: [{ $ifNull: ["$messages", []] }, Math.max(0, from), MAX_CHAT_MESSAGES] },
    } },
  ], MAX_TIME).toArray();
  if (!doc) return null;
  return {
    ...summary(doc), name: doc.name || "Unnamed member", email: doc.email || "", phone: doc.phone || "", memberId: doc.memberId,
    member: doc.member?.toHexString() ?? "", message: doc.message, messages: (doc.messages ?? []).map((item) => message(item)!),
    memberReadAt: iso(doc.memberReadAt), supportReadAt: iso(doc.supportReadAt),
  };
}

/**
 * The team has the chat on screen. Sets supportReadAt and flips only `unread` to `read`, in one update.
 * Deliberately leaves updatedAt alone so reading never reorders the lists.
 */
export async function markChatRead(id: string) {
  if (!isObjectId(id)) return;
  await (await enquiries()).updateOne({ _id: new ObjectId(id), type: SUPPORT }, [
    { $set: { supportReadAt: new Date(), status: { $cond: [{ $eq: ["$status", "unread"] }, "read", "$status"] } } },
  ], MAX_TIME);
}

export type ReplyResult = "sent" | "ended" | "full" | "missing";

export async function appendReply(id: string, text: string, agentName: string): Promise<ReplyResult> {
  const collection = await enquiries();
  const _id = new ObjectId(id);
  const at = new Date();
  const result = await collection.updateOne(
    { _id, type: SUPPORT, status: { $ne: "resolved" }, [`messages.${MAX_CHAT_MESSAGES - 1}`]: { $exists: false } },
    {
      $push: { messages: { _id: new ObjectId(), from: "support", text, agentName, at } },
      $set: { status: "contacted", supportReadAt: at, updatedAt: at },
    },
    MAX_TIME,
  );
  if (result.matchedCount) return "sent";
  // Only to choose the message for the agent; the write above already decided the outcome.
  const current = await collection.findOne({ _id, type: SUPPORT }, { projection: { status: 1 }, ...MAX_TIME });
  if (!current) return "missing";
  return current.status === "resolved" ? "ended" : "full";
}

export async function endChat(id: string) {
  const at = new Date();
  const result = await (await enquiries()).updateOne(
    { _id: new ObjectId(id), type: SUPPORT, status: { $ne: "resolved" } },
    { $set: { status: "resolved", endedAt: at, endedBy: "support", updatedAt: at } },
    MAX_TIME,
  );
  return result.matchedCount > 0;
}

/** Website enquiries only. `expected` makes "mark read on open" a no-op once someone has moved it on. */
export async function setWebsiteStatus(id: string, status: EnquiryStatus, expected?: EnquiryStatus) {
  const result = await (await enquiries()).updateOne(
    { _id: new ObjectId(id), type: { $ne: SUPPORT }, ...(expected ? { status: expected } : {}) },
    { $set: { status, updatedAt: new Date() } },
    MAX_TIME,
  );
  return result.matchedCount > 0;
}
