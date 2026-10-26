"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Building2, CircleCheck, Eye, PhoneCall, X } from "lucide-react";
import { dateTime, relativeTime } from "@/lib/format";
import type { EnquiryRow, EnquiryStatus } from "@/types/enquiries";
import { ContactActions, SourceBadge, StatusBadge } from "./EnquiryBadges";
import { updateWebsiteStatus } from "./actions";

const STEPS: { status: EnquiryStatus; label: string; Icon: typeof Eye }[] = [
  { status: "read", label: "Mark read", Icon: Eye },
  { status: "contacted", label: "Contacted", Icon: PhoneCall },
  { status: "resolved", label: "Resolved", Icon: CircleCheck },
];

/** Website senders have no login, so there is no reply box: the team follows up by phone or email. */
export function WebsiteDrawer({ enquiry, now, onClose, onChanged }: { enquiry: EnquiryRow; now: string; onClose: () => void; onChanged: (status: EnquiryStatus) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  const change = (status: EnquiryStatus) => startTransition(async () => {
    setError("");
    const result = await updateWebsiteStatus(enquiry.id, status);
    if (result.ok) onChanged(status); else setError(result.error);
  });
  return <dialog ref={dialog} className="enquiry-drawer" aria-labelledby={titleId} onClose={onClose} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
    <div className="drawer-inner">
      <header className="drawer-header">
        <div><div className="drawer-badges"><SourceBadge source="website" /><StatusBadge status={enquiry.status} source="website" /></div><h2 id={titleId}>{enquiry.name}</h2><p>{enquiry.type === "demo" ? "Demo request" : "Contact form"} · <time dateTime={enquiry.createdAt} title={dateTime(enquiry.createdAt)}>{relativeTime(enquiry.createdAt, now)}</time></p></div>
        <button type="button" className="icon-button" aria-label="Close" onClick={() => dialog.current?.close()}><X size={18} aria-hidden /></button>
      </header>
      <dl className="drawer-details">
        {enquiry.organization && <div><dt><Building2 size={13} aria-hidden /> Organisation</dt><dd>{enquiry.organization}</dd></div>}
        <div><dt>Phone</dt><dd>{enquiry.phone || "Not given"}</dd></div>
        <div><dt>Email</dt><dd>{enquiry.email || "Not given"}</dd></div>
        <div><dt>Received</dt><dd>{dateTime(enquiry.createdAt)}</dd></div>
      </dl>
      <ContactActions phone={enquiry.phone} email={enquiry.email} />
      <section className="drawer-message" aria-label="Message"><h3>Message</h3><p className="record-text">{enquiry.message || "No message was included."}</p></section>
      <footer className="drawer-status">
        <h3>Follow-up status</h3>
        <div className="status-steps" role="group" aria-label="Set status">
          {STEPS.map(({ status, label, Icon }) => <button key={status} type="button" className={`button ${enquiry.status === status ? "button-dark" : "button-light"}`} aria-pressed={enquiry.status === status} disabled={pending || enquiry.status === status} onClick={() => change(status)}><Icon size={15} aria-hidden /> {label}</button>)}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="field-hint">The sender can&apos;t see replies typed here, so follow up by phone, WhatsApp or email.</p>
      </footer>
    </div>
  </dialog>;
}
