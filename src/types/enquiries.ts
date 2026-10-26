/** Browser-safe shapes for the shared `enquiries` collection. Dates are ISO strings. */
export const ENQUIRY_STATUSES = ["unread", "read", "contacted", "resolved"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export const ENQUIRY_TABS = ["app", "website", "all"] as const;
export type EnquiryTab = (typeof ENQUIRY_TABS)[number];
export const CUSTOMER_STATES = ["waiting", "open", "closed"] as const;
export type CustomerState = (typeof CUSTOMER_STATES)[number];

export const TOPICS: Record<string, string> = {
  consults: "Doctor consults", pods: "Pod tests", records: "Health records", medicines: "Medicines",
  account: "My account", billing: "Plans & payments", app: "App problem", other: "Something else",
};
export const topicLabel = (topic?: string) => (topic && TOPICS[topic]) || "Something else";

export const WEBSITE_STATUS_LABELS: Record<EnquiryStatus, string> = { unread: "Unread", read: "Read", contacted: "Contacted", resolved: "Resolved" };
export const CHAT_STATUS_LABELS: Record<EnquiryStatus, string> = { unread: "Waiting", read: "Read", contacted: "Replied", resolved: "Ended" };
export const CUSTOMER_STATE_LABELS: Record<CustomerState, string> = { waiting: "Waiting", open: "Open", closed: "No open chat" };

export interface ChatMessage { id: string; from: "member" | "support"; text: string; agentName?: string; at: string }

export interface EnquiryRow {
  id: string;
  type: string;
  source: "app" | "website";
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  message?: string;
  status: EnquiryStatus;
  topic?: string;
  memberId?: string;
  member?: string;
  last?: ChatMessage;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRow {
  member: string;
  name: string;
  memberId?: string;
  phone?: string;
  email?: string;
  chats: number;
  waiting: number;
  open: number;
  lastAt: string;
  topic?: string;
  last?: ChatMessage;
}

export interface ChatSummary {
  id: string;
  topic?: string;
  status: EnquiryStatus;
  messageCount: number;
  last?: ChatMessage;
  endedAt?: string;
  endedBy?: "member" | "support";
  createdAt: string;
  updatedAt: string;
}

export interface ChatDetail extends ChatSummary {
  name: string;
  email: string;
  phone: string;
  memberId?: string;
  member: string;
  message?: string;
  messages: ChatMessage[];
  memberReadAt?: string;
  supportReadAt?: string;
}

export interface CustomerProfile {
  member: string;
  name: string;
  memberId?: string;
  phone?: string;
  email?: string;
  plan?: string;
}

export interface EnquiryQuery { tab: EnquiryTab; status: string; q: string; page: number }

export interface Page<T> { items: T[]; total: number; page: number; pages: number; pageSize: number }

export interface EnquiryListData {
  query: EnquiryQuery;
  counts: { app: number; website: number; all: number; waiting: number };
  website?: Page<EnquiryRow>;
  customers?: Page<CustomerRow>;
  now: string;
}

export interface ChatPoll { chat: ChatDetail; from: number; now: string }
