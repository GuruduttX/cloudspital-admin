"use server";

import { adminCollections } from "@/db/client";
import { appendReply, endChat, setWebsiteStatus } from "@/db/repositories/enquiries";
import { requireAdmin } from "@/services/auth";
import { isObjectId } from "@/lib/enquiries";
import { MAX_REPLY_LENGTH, SUPPORT_AGENT_NAME } from "@/config/enquiries";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/types/enquiries";

type Result = { ok: true } | { ok: false; error: string; reload?: boolean };
const UNAVAILABLE: Result = { ok: false, error: "Could not reach the database. Check your connection and try again." };

async function record(action: "reply_enquiry_chat" | "end_enquiry_chat" | "set_enquiry_status", adminId: Awaited<ReturnType<typeof requireAdmin>>["id"], targetId: string, section?: string) {
  await (await adminCollections()).audit.insertOne({ adminId, action, targetId, ...(section ? { section } : {}), createdAt: new Date() });
}

export async function sendReply(id: string, input: string): Promise<Result> {
  const admin = await requireAdmin();
  const text = typeof input === "string" ? input.trim() : "";
  if (!isObjectId(id)) return { ok: false, error: "This chat link is not valid." };
  if (!text) return { ok: false, error: "Type a message first." };
  if (text.length > MAX_REPLY_LENGTH) return { ok: false, error: `Keep replies under ${MAX_REPLY_LENGTH} characters.` };
  try {
    const result = await appendReply(id, text, SUPPORT_AGENT_NAME);
    if (result === "ended") return { ok: false, error: "The customer ended this chat.", reload: true };
    if (result === "full") return { ok: false, error: "This chat has reached its 400-message limit. Ask the customer to start a new chat.", reload: true };
    if (result === "missing") return { ok: false, error: "This chat no longer exists.", reload: true };
    await record("reply_enquiry_chat", admin.id, id);
    return { ok: true };
  } catch {
    return UNAVAILABLE;
  }
}

export async function closeChat(id: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!isObjectId(id)) return { ok: false, error: "This chat link is not valid." };
  try {
    if (!(await endChat(id))) return { ok: false, error: "This chat has already ended.", reload: true };
    await record("end_enquiry_chat", admin.id, id);
    return { ok: true };
  } catch {
    return UNAVAILABLE;
  }
}

/** `expected` is only used when opening an unread enquiry, so it never overrides a later status. */
export async function updateWebsiteStatus(id: string, status: EnquiryStatus, expected?: EnquiryStatus): Promise<Result> {
  const admin = await requireAdmin();
  const valid = (value: unknown) => (ENQUIRY_STATUSES as readonly unknown[]).includes(value);
  if (!isObjectId(id) || !valid(status) || (expected !== undefined && !valid(expected))) return { ok: false, error: "Invalid status change." };
  try {
    const changed = await setWebsiteStatus(id, status, expected);
    if (!changed) return expected ? { ok: true } : { ok: false, error: "This enquiry no longer exists.", reload: true };
    await record("set_enquiry_status", admin.id, id, status);
    return { ok: true };
  } catch {
    return UNAVAILABLE;
  }
}
