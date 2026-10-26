import { CUSTOMER_STATES, ENQUIRY_STATUSES, ENQUIRY_TABS, type ChatMessage, type EnquiryQuery, type EnquiryTab } from "@/types/enquiries";

export const isObjectId = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);

/** Status chips depend on the tab: app chats are filtered by customer state, others by enquiry status. */
export const statusOptions = (tab: EnquiryTab): readonly string[] => tab === "app" ? CUSTOMER_STATES : ENQUIRY_STATUSES;

export function enquiryQuery(params: URLSearchParams): EnquiryQuery {
  const rawTab = params.get("tab") || "app";
  const tab = (ENQUIRY_TABS as readonly string[]).includes(rawTab) ? rawTab as EnquiryTab : "app";
  const rawStatus = params.get("status") || "all";
  const status = statusOptions(tab).includes(rawStatus) ? rawStatus : "all";
  const rawPage = params.get("page") || "1";
  const page = /^\d{1,5}$/.test(rawPage) ? Math.min(10000, Math.max(1, Number(rawPage))) : 1;
  return { tab, status, q: (params.get("q") || "").trim().slice(0, 80), page };
}

export function enquiryHref(query: Partial<EnquiryQuery>) {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "app") params.set("tab", query.tab);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `/enquiries?${search}` : "/enquiries";
}

/** "#A1B2C3": the last six characters of the chat id, as the app shows it. */
export const chatReference = (id: string) => `#${id.slice(-6).toUpperCase()}`;

/** wa.me needs the country code; 10-digit numbers are Indian mobiles. */
export function whatsappUrl(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `https://wa.me/91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `https://wa.me/${digits}`;
  return undefined;
}

/** Website messages start "Enquiring for: …"; lists show that first line. */
export const firstLine = (text?: string) => (text || "").split("\n").map((line) => line.trim()).find(Boolean) || "No message";
export const lastPreview = (last?: ChatMessage) => last ? `${last.from === "member" ? "Member" : last.agentName || "Team"}: ${last.text}` : "No messages yet";
