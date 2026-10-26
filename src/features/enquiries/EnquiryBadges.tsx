import { Globe, Mail, MessageCircle, Phone, Smartphone } from "lucide-react";
import { whatsappUrl } from "@/lib/enquiries";
import { CHAT_STATUS_LABELS, CUSTOMER_STATE_LABELS, WEBSITE_STATUS_LABELS, type CustomerState, type EnquiryStatus } from "@/types/enquiries";

export function SourceBadge({ source }: { source: "app" | "website" }) {
  return source === "app"
    ? <span className="badge source-badge source-app"><Smartphone size={12} aria-hidden /> App</span>
    : <span className="badge source-badge source-website"><Globe size={12} aria-hidden /> Website</span>;
}

export function StatusBadge({ status, source }: { status: EnquiryStatus; source: "app" | "website" }) {
  const text = (source === "app" ? CHAT_STATUS_LABELS : WEBSITE_STATUS_LABELS)[status] ?? status;
  return <span className={`badge enquiry-status status-${status}`}><span className="status-dot" aria-hidden />{text}</span>;
}

export function customerState(waiting: number, open: number): CustomerState {
  return waiting > 0 ? "waiting" : open > 0 ? "open" : "closed";
}

export function StateBadge({ state }: { state: CustomerState }) {
  return <span className={`badge enquiry-status state-${state}`}><span className="status-dot" aria-hidden />{CUSTOMER_STATE_LABELS[state]}</span>;
}

/** One-tap follow-up. Only the channels we have details for are shown. */
export function ContactActions({ phone, email, compact = false }: { phone?: string; email?: string; compact?: boolean }) {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  const whatsapp = whatsappUrl(phone);
  const size = compact ? 14 : 15;
  return <div className={`contact-actions${compact ? " compact" : ""}`}>
    {digits && <a className="button button-light" href={`tel:${digits}`}><Phone size={size} aria-hidden /> Call</a>}
    {whatsapp && <a className="button button-light" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={size} aria-hidden /> WhatsApp</a>}
    {email && <a className="button button-light" href={`mailto:${email}`}><Mail size={size} aria-hidden /> Email</a>}
  </div>;
}
