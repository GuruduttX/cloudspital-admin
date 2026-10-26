import Link from "next/link";
import { Activity, ArrowRight, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { ObjectId } from "mongodb";
import { RecentRecords } from "./RecentRecords";
import { ProfileTabs } from "./ProfileTabs";
import { RefreshRecords } from "./RefreshRecords";
import { getWorkspace } from "@/services/activity";
import { doctorTabs, patientTabs, recordSources, tabTitle, type SearchParams } from "@/lib/activity-config";
import type { Scope, RecordRow } from "@/db/repositories/activity";
import { label, number } from "@/lib/format";

function fieldLabel(key: string) { return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, c => c.toUpperCase()); }
function time(value: unknown) {
  const parsed = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(parsed) : "Not recorded";
}
type People = Awaited<ReturnType<typeof getWorkspace>>["people"];
function Value({ value, people, depth = 0 }: { value: unknown; people: People; depth?: number }): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span className="record-muted">Not recorded</span>;
  if (value instanceof ObjectId) {
    const person = people.get(value.toHexString());
    return person ? <Link className="record-person" href={`/${person.kind}/${value}`} prefetch={false}>{person.name}<ArrowRight size={12} aria-hidden /></Link> : <span className="record-id">{value.toHexString()}</span>;
  }
  if (value instanceof Date) return <time dateTime={value.toISOString()}>{time(value)}</time>;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? <ul className="record-values">{value.map((item, i) => <li key={i}><Value value={item} people={people} depth={depth + 1} /></li>)}</ul> : <span className="record-muted">None recorded</span>;
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([key]) => key !== "_id");
    return entries.length ? <dl className={`record-nested depth-${Math.min(depth, 3)}`}>{entries.map(([key, item]) => <div key={key}><dt>{fieldLabel(key)}</dt><dd><Value value={item} people={people} depth={depth + 1} /></dd></div>)}</dl> : <span className="record-muted">Not recorded</span>;
  }
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return <a className="record-person" href={value} target="_blank" rel="noopener noreferrer">Open attachment or link <ArrowRight size={12} aria-hidden /></a>;
  return <span className="record-text">{String(value)}</span>;
}
function recordTitle(data: Record<string, unknown>, tab: string) {
  if (typeof data.name === "string") return data.name;
  if (typeof data.title === "string") return data.title;
  if (typeof data.test === "string") return data.test;
  if (typeof data.specialty === "string") return label(data.specialty);
  return tabTitle(tab).replace(/s$/, "");
}
const events: Record<string, string> = { createdAt: "Created", updatedAt: "Last updated", signedAt: "Prescription signed", startedAt: "Consultation started", endedAt: "Consultation ended", cancelledAt: "Cancelled", respondedAt: "Booking request answered", approvedAt: "Access approved", revokedAt: "Revoked", reviewedAt: "Results reviewed", scannedAt: "QR scanned", "mobilab.webhookAt": "Lab webhook received", recordViewed: "Patient record viewed", doseRecorded: "Medicine dose logged", recordQuestion: "Ask the record question", vaccineGiven: "Vaccine dose given" };
function Pagination({ page, pages, total, base, tab, source }: { page: number; pages: number; total: number; base: string; tab: string; source?: string }) {
  const href = (p: number) => `${base}?${new URLSearchParams({ tab, page: String(p), ...(source ? { source } : {}), ...(tab === "records" ? { view: "records" } : {}) })}`;
  return <footer className="pagination"><span>{number(total)} {tab === "activity" ? "recorded events" : "records"} · 20 per page</span><div>{page > 1 ? <Link prefetch={false} className="pagination-link" href={href(page - 1)}><ChevronLeft size={14} /> Previous</Link> : <span className="pagination-link disabled">Previous</span>}<span className="page-position">Page {number(page)} of {number(pages)}</span>{page < pages ? <Link prefetch={false} className="pagination-link" href={href(page + 1)}>Next <ChevronRight size={14} /></Link> : <span className="pagination-link disabled">Next</span>}</div></footer>;
}
function EventRow({ row, people, base }: { row: RecordRow; people: People; base: string }) {
  const data = row.data;
  const source = String(data.source);
  const date = data.at instanceof Date ? data.at : undefined;
  const subject = data.name || data.title;
  const isAccount = source === "members" || source === "doctors";
  const scopeHref = isAccount ? `/${source === "members" ? "patients" : "doctors"}/${row.id}?tab=info` : base === "/activity" ? (data.doctor instanceof ObjectId ? `/doctors/${data.doctor}?tab=${source}&record=${row.id}` : data.member instanceof ObjectId ? `/patients/${data.member}?tab=${source}&record=${row.id}` : data.owner instanceof ObjectId ? `/patients/${data.owner}?tab=${source}&record=${row.id}` : `/activity?source=${source}&view=records&record=${row.id}`) : `${base}?tab=${source}&record=${row.id}`;
  return <li className="event-row"><span className="event-icon"><Activity size={16} aria-hidden /></span><div className="event-main"><div className="event-heading"><strong>{(data.source === "adminAudit" ? label(String(data.action)) : events[String(data.event)]) || fieldLabel(String(data.event))}</strong><span className="badge badge-neutral">{tabTitle(source)}</span></div>{data.detail ? <p className="event-subject">{String(data.detail)}</p> : null}{subject ? <p className="event-subject">{String(subject)}</p> : null}<div className="event-people">{["doctor", "member", "owner"].filter(key => data[key] instanceof ObjectId).map(key => <span key={key}>{key === "member" ? "Patient" : fieldLabel(key)}: <Value value={data[key]} people={people} /></span>)}</div><div className="event-foot"><span className="record-id">Record {row.id}</span>{scopeHref && <Link prefetch={false} className="text-link" href={scopeHref}>View records <ArrowRight size={12} aria-hidden /></Link>}</div></div><time className="event-time" dateTime={date?.toISOString()}>{time(data.at)}<small>IST</small></time></li>;
}
export async function RecordWorkspace({ params, scope }: { params: SearchParams; scope?: Scope }) {
  const data = await getWorkspace(params, scope);
  const base = scope ? `/${scope.kind}/${scope.id}` : "/activity";
  const tabs = scope?.kind === "doctors" ? doctorTabs : patientTabs;
  const description = data.tab === "patients" ? "Distinct patients linked through consultations, requests, prescriptions, vaccines, test reviews and record access." : data.tab === "activity" ? "Stored lifecycle events, newest first. All times are India Standard Time." : "Expand a record to see its full stored details and linked people.";
  const title = data.tab === "records" && data.source ? tabTitle(data.source) : tabTitle(data.tab);
  return <>
    {scope && <div className="stats-grid account-stats">{data.summary.map(item => <Link key={item.key} className="panel stat-card" prefetch={false} href={`${base}?tab=${item.key}`}><span className="stat-label">{item.title}<ArrowRight size={14} aria-hidden /></span><strong className="stat-number">{number(item.total)}</strong><p>View all records</p></Link>)}</div>}
    {scope && <ProfileTabs tabs={tabs} selected={data.tab} base={base} kind={scope.kind} />}
    {data.tab === "overview" ? <section aria-label="Doctor overview">
      <header className="doctor-overview-heading"><div><h2>Overview</h2><p>The latest consultations, prescriptions and booking requests.</p></div><RefreshRecords /></header>
      <RecentRecords sections={data.overview.map(section => ({ key: section.key, title: section.title, content: <>
        <header className="panel-heading"><div><h2>Recent {section.title.toLowerCase()}</h2><p>Five most recently created records</p></div><Link className="text-link" prefetch={false} href={`${base}?tab=${section.key}`}>View all <ArrowRight size={12} aria-hidden /></Link></header>
        {section.rows.length ? <ul className="doctor-recent-list">{section.rows.map(row => <li key={row.id}>
          <div className="doctor-recent-heading"><Link className="person-name" prefetch={false} href={`${base}?tab=${section.key}&record=${row.id}`}>{recordTitle(row.data, section.key)}</Link>{typeof row.data.status === "string" && <span className="badge badge-neutral">{label(row.data.status)}</span>}</div>
          <div className="doctor-recent-meta"><Value value={row.data.member} people={data.people} /><span>Added {time(row.data.createdAt)}</span></div>
          {typeof row.data.reason === "string" && <p className="doctor-recent-note">{row.data.reason}</p>}
        </li>)}</ul> : <div className="empty-state"><FileText size={24} aria-hidden /><h3>No {section.title.toLowerCase()} yet</h3><p>Recent records will appear here.</p></div>}
      </> }))} />
    </section> : <section className="panel records-panel" aria-label={title}><header className="panel-heading"><div><h2>{title} <span className="heading-count">{number(data.total)}</span></h2><p>{description}</p></div><RefreshRecords /></header>
    {data.recordId && <div className="record-filter-note">Showing one selected record. <Link className="text-link" href={`${base}?tab=${data.tab}${data.source ? `&source=${data.source}` : ""}${data.tab === "records" ? "&view=records" : ""}`}>Show all records</Link></div>}
    {!scope && <form className="directory-toolbar" action={base}><label htmlFor="activity-source">Record type</label><select id="activity-source" name="source" defaultValue={data.source || ""}><option value="">All activity</option>{Object.entries(recordSources).map(([key, source]) => <option key={key} value={key}>{source.title}</option>)}</select><label htmlFor="activity-view">View</label><select id="activity-view" name="view" defaultValue={data.tab === "records" ? "records" : "activity"}><option value="activity">Activity timeline</option><option value="records">Full records (choose a type)</option></select><button className="button button-dark">Apply filter</button><Link className="text-link" href={base}>Reset</Link></form>}
    {data.rows.length === 0 ? <div className="empty-state"><FileText size={28} aria-hidden /><h3>No {data.tab === "activity" ? "activity" : "records"} recorded</h3><p>{scope ? "This account has no matching records in this section yet." : "No stored events match this record type."}</p></div> : data.tab === "activity" ? <ol className="event-list">{data.rows.map((row, i) => <EventRow key={`${row.data.source}-${row.id}-${row.data.event}-${String(row.data.at)}-${i}`} row={row} people={data.people} base={base} />)}</ol> : <div className="record-list">{data.rows.map(row => {
      const title = recordTitle(row.data, data.tab === "records" && data.source ? data.source : data.tab);
      const status = typeof row.data.status === "string" ? row.data.status : typeof row.data.isActive === "boolean" ? row.data.isActive ? "active" : "inactive" : ["sessions", "doctorSessions"].includes(data.tab) && row.data.expiresAt instanceof Date ? row.data.expiresAt.getTime() > data.loadedAt ? "active" : "expired" : undefined;
      return <details className="record-card" key={row.id} open={data.tab === "info" || data.tab === "emergency" || data.recordId === row.id}><summary><span className="record-summary"><strong>{title}</strong><span className="record-summary-meta">{["doctor", "member"].map(key => row.data[key] instanceof ObjectId ? <span key={key}><Value value={row.data[key]} people={data.people} /></span> : null)}<span>{time(row.data.scheduledAt || row.data.requestedAt || row.data.recordedAt || row.data.createdAt)}</span></span></span>{status && <span className={`badge ${["active", "completed", "signed", "approved"].includes(status) ? "badge-success" : "badge-neutral"}`}>{label(status)}</span>}<span className="record-expand" aria-hidden>+</span></summary><div className="record-card-body">{data.tab === "patients" && <Link className="button button-light" prefetch={false} href={`/patients/${row.id}`}>Open patient profile <ArrowRight size={14} aria-hidden /></Link>}<dl className="record-grid">{Object.entries(row.data).filter(([key]) => key !== "_id").map(([key, value]) => <div key={key}><dt>{fieldLabel(key)}</dt><dd><Value value={value} people={data.people} /></dd></div>)}</dl><p className="record-id">Record ID · {row.id}</p></div></details>;
    })}</div>}
    {data.tab !== "info" && <Pagination page={data.page} pages={data.pages} total={data.total} base={base} tab={data.tab} source={data.source} />}
    </section>}
    {data.tab === "activity" && <p className="directory-note">Activity is reconstructed from saved records. “Last updated” is the latest saved change; it does not identify who made it. Deleted or expired records and intermediate edits are not retained in this view.</p>}
  </>;
}
