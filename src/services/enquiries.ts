import "server-only";
import { adminCollections } from "@/db/client";
import { readChat, readCustomer, readEnquiryList, readMemberChats } from "@/db/repositories/enquiries";
import { requireAdmin } from "@/services/auth";
import { isObjectId } from "@/lib/enquiries";
import { ObjectId } from "mongodb";
import type { EnquiryQuery } from "@/types/enquiries";

// Page views are audited; the polls that keep them live are not, so the log stays readable.
async function audit(action: "view_enquiries" | "view_enquiry_customer" | "view_enquiry_chat", adminId: ObjectId, targetId?: string, section?: string) {
  await (await adminCollections()).audit.insertOne({ adminId, action, ...(targetId ? { targetId } : {}), ...(section ? { section } : {}), createdAt: new Date() });
}

export async function getEnquiryList(query: EnquiryQuery) {
  const admin = await requireAdmin();
  const data = await readEnquiryList(query);
  await audit("view_enquiries", admin.id, undefined, query.tab);
  return data;
}

export async function getCustomer(id: string) {
  const admin = await requireAdmin();
  const data = await readCustomer(id);
  if (!data) return null;
  await audit("view_enquiry_customer", admin.id, id);
  return { ...data, now: new Date().toISOString() };
}

export async function getChat(id: string) {
  const admin = await requireAdmin();
  const chat = await readChat(id);
  if (!chat) return null;
  const others = isObjectId(chat.member) ? (await readMemberChats(new ObjectId(chat.member))).filter((item) => item.id !== chat.id) : [];
  await audit("view_enquiry_chat", admin.id, id);
  return { chat, others, now: new Date().toISOString() };
}
