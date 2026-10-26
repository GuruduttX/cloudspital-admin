"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Inbox, Search, Smartphone } from "lucide-react";
import { pollJson, usePoll } from "@/hooks/usePoll";
import { enquiryHref, firstLine, lastPreview, statusOptions } from "@/lib/enquiries";
import { initials, memberId, number, relativeTime } from "@/lib/format";
import { LIST_POLL_MS } from "@/config/enquiries";
import { CHAT_STATUS_LABELS, CUSTOMER_STATE_LABELS, WEBSITE_STATUS_LABELS, topicLabel, type CustomerRow, type EnquiryListData, type EnquiryQuery, type EnquiryRow, type EnquiryStatus, type EnquiryTab, type Page } from "@/types/enquiries";
import { customerState, SourceBadge, StateBadge, StatusBadge } from "./EnquiryBadges";
import { WebsiteDrawer } from "./WebsiteDrawer";
import { updateWebsiteStatus } from "./actions";

const TAB_LABELS: Record<EnquiryTab, string> = { app: "App chats", website: "Website", all: "All" };

function chipLabel(tab: EnquiryTab, value: string) {
  if (value === "all") return "All";
  if (tab === "app") return CUSTOMER_STATE_LABELS[value as keyof typeof CUSTOMER_STATE_LABELS];
  return tab === "website" ? WEBSITE_STATUS_LABELS[value as EnquiryStatus] : `${WEBSITE_STATUS_LABELS[value as EnquiryStatus]} / ${CHAT_STATUS_LABELS[value as EnquiryStatus]}`;
}

function Pagination({ page, query }: { page: Page<unknown>; query: EnquiryQuery }) {
  if (page.total <= page.pageSize) return null;
  const href = (to: number) => enquiryHref({ ...query, page: to });
  return <footer className="pagination"><span>Showing {number((page.page - 1) * page.pageSize + 1)}–{number(Math.min(page.page * page.pageSize, page.total))} of {number(page.total)}</span><div>{page.page > 1 ? <Link className="pagination-link" href={href(page.page - 1)}><ArrowLeft size={14} aria-hidden /> Previous</Link> : <span className="pagination-link disabled">Previous</span>}<span className="page-position">{page.page} / {page.pages}</span>{page.page < page.pages ? <Link className="pagination-link" href={href(page.page + 1)}>Next <ArrowRight size={14} aria-hidden /></Link> : <span className="pagination-link disabled">Next</span>}</div></footer>;
}

function CustomerTable({ customers, now }: { customers: CustomerRow[]; now: string }) {
  const router = useRouter();
  return <div className="table-scroll"><table className="directory-table enquiry-table"><thead><tr><th scope="col">Customer</th><th scope="col">State</th><th scope="col">Latest chat</th><th scope="col">Chats</th><th scope="col">Last activity</th><th scope="col"><span className="sr-only">Open customer</span></th></tr></thead><tbody>
    {customers.map((customer) => {
      const href = `/enquiries/customers/${customer.member}`;
      const state = customerState(customer.waiting, customer.open);
      return <tr key={customer.member} className={state === "waiting" ? "is-waiting" : undefined} onClick={(event) => { if (!(event.target as HTMLElement).closest("a")) router.push(href); }}>
        <td><div className="identity"><span className="avatar" aria-hidden>{initials(customer.name)}</span><div><Link href={href} className="person-name">{customer.name}</Link><span className="person-meta">{memberId(customer.memberId)}{customer.phone ? ` · ${customer.phone}` : ""}</span></div></div></td>
        <td><StateBadge state={state} /></td>
        <td className="enquiry-preview-cell"><strong className="enquiry-topic">{topicLabel(customer.topic)}</strong><span className="enquiry-preview">{lastPreview(customer.last)}</span></td>
        <td className="nowrap">{customer.chats === 1 ? "1 chat" : `${number(customer.chats)} chats`}</td>
        <td className="nowrap"><time dateTime={customer.lastAt}>{relativeTime(customer.lastAt, now)}</time></td>
        <td><Link className="row-link" href={href} aria-label={`Open ${customer.name}`}><ChevronRight size={18} aria-hidden /></Link></td>
      </tr>;
    })}
  </tbody></table></div>;
}

function EnquiryTable({ rows, now, onOpen }: { rows: EnquiryRow[]; now: string; onOpen: (row: EnquiryRow) => void }) {
  const router = useRouter();
  return <div className="table-scroll"><table className="directory-table enquiry-table"><thead><tr><th scope="col">Source</th><th scope="col">From</th><th scope="col">Contact</th><th scope="col">Message</th><th scope="col">Updated</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Open</span></th></tr></thead><tbody>
    {rows.map((row) => {
      const isApp = row.source === "app";
      const href = `/enquiries/chats/${row.id}`;
      const open = () => isApp ? router.push(href) : onOpen(row);
      return <tr key={row.id} className={row.status === "unread" ? "is-waiting" : undefined} onClick={(event) => { if (!(event.target as HTMLElement).closest("a, button")) open(); }}>
        <td><SourceBadge source={row.source} /></td>
        <td>{isApp ? <Link href={href} className="person-name">{row.name}</Link> : <button type="button" className="row-button person-name" onClick={() => onOpen(row)}>{row.name}</button>}<span className="person-meta">{isApp ? memberId(row.memberId) : row.organization || (row.type === "demo" ? "Demo request" : "Contact form")}</span></td>
        <td><span>{row.phone || "No phone"}</span>{row.email && <small className="table-secondary">{row.email}</small>}</td>
        <td className="enquiry-preview-cell">{isApp ? <><strong className="enquiry-topic">{topicLabel(row.topic)}</strong><span className="enquiry-preview">{lastPreview(row.last)}</span></> : <span className="enquiry-preview">{firstLine(row.message)}</span>}</td>
        <td className="nowrap"><time dateTime={row.updatedAt}>{relativeTime(row.updatedAt, now)}</time></td>
        <td><StatusBadge status={row.status} source={row.source} /></td>
        <td>{isApp ? <Link className="row-link" href={href} aria-label={`Open chat with ${row.name}`}><ChevronRight size={18} aria-hidden /></Link> : <button type="button" className="row-link row-button" aria-label={`Open enquiry from ${row.name}`} onClick={() => onOpen(row)}><ChevronRight size={18} aria-hidden /></button>}</td>
      </tr>;
    })}
  </tbody></table></div>;
}

export function EnquiryBoard({ initial }: { initial: EnquiryListData }) {
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<EnquiryRow | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const { query, counts, now } = data;
  const filtered = Boolean(query.q) || query.status !== "all";

  const refresh = useCallback(async () => {
    const next = await pollJson<EnquiryListData>(`/api${enquiryHref(query)}`);
    if (next) setData(next);
  }, [query]);
  usePoll(refresh, LIST_POLL_MS);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !target.closest("input, textarea, select, [contenteditable]")) { event.preventDefault(); search.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const patchStatus = (id: string, status: EnquiryStatus) => setData((current) => current.website ? { ...current, website: { ...current.website, items: current.website.items.map((row) => row.id === id ? { ...row, status } : row) } } : current);
  const openEnquiry = (row: EnquiryRow) => {
    setSelected(row);
    if (row.status === "unread") {
      patchStatus(row.id, "read");
      void updateWebsiteStatus(row.id, "read", "unread").then(refresh);
    }
  };
  // Prefer the polled copy so the drawer shows changes made from another screen.
  const current = selected ? data.website?.items.find((row) => row.id === selected.id) ?? selected : null;

  const list = query.tab === "app" ? data.customers : data.website;
  return <>
    <header className="page-heading"><div><p className="eyebrow">SUPPORT DESK</p><h1>Enquiries <span className="heading-count">{number(counts.all)}</span></h1><p>Website enquiries and live chats from HealthMatrix members, in one place.</p></div>{counts.waiting > 0 && <Link href={enquiryHref({ tab: "app", status: "waiting" })} className="badge waiting-banner"><Smartphone size={14} aria-hidden /> {counts.waiting} {counts.waiting === 1 ? "chat" : "chats"} waiting</Link>}</header>
    <nav className="profile-tabs enquiry-tabs no-scrollbar" aria-label="Enquiry sources">
      {(Object.keys(TAB_LABELS) as EnquiryTab[]).map((tab) => <Link key={tab} prefetch={false} href={enquiryHref({ tab })} aria-current={query.tab === tab ? "page" : undefined}>{TAB_LABELS[tab]}<span className="tab-count">{number(counts[tab])}</span>{tab === "app" && counts.waiting > 0 && <span className="tab-waiting" aria-label={`${counts.waiting} waiting`}>{counts.waiting}</span>}</Link>)}
    </nav>
    <section className="panel directory-panel" aria-label={`${TAB_LABELS[query.tab]} enquiries`}>
      <div className="enquiry-toolbar">
        <form className="search-field" action="/enquiries" role="search">
          <Search size={18} aria-hidden />
          <label className="sr-only" htmlFor="enquiry-search">Search enquiries</label>
          <input ref={search} id="enquiry-search" name="q" defaultValue={query.q} maxLength={80} placeholder="Search name, phone, HM ID, email or organisation  ( / )" />
          {query.tab !== "app" && <input type="hidden" name="tab" value={query.tab} />}
          {query.status !== "all" && <input type="hidden" name="status" value={query.status} />}
        </form>
        <div className="status-chips" role="group" aria-label="Filter by status">
          {["all", ...statusOptions(query.tab)].map((value) => <Link key={value} prefetch={false} className="chip" href={enquiryHref({ ...query, status: value, page: 1 })} aria-current={query.status === value ? "true" : undefined}>{chipLabel(query.tab, value)}</Link>)}
        </div>
        {filtered && <Link href={enquiryHref({ tab: query.tab })} className="text-link">Clear</Link>}
      </div>
      {list && list.items.length ? <>
        {query.tab === "app" ? <CustomerTable customers={data.customers!.items} now={now} /> : <EnquiryTable rows={data.website!.items} now={now} onOpen={openEnquiry} />}
        <Pagination page={list} query={query} />
      </> : <div className="empty-state directory-empty"><Inbox size={30} aria-hidden /><h2>{filtered ? "Nothing matches" : query.tab === "website" ? "No website enquiries yet" : "No enquiries yet"}</h2><p>{filtered ? "Try another search or clear your filters." : "New enquiries appear here within a few seconds."}</p>{filtered && <Link href={enquiryHref({ tab: query.tab })} className="button button-light">Clear filters</Link>}</div>}
    </section>
    <p className="directory-note">Updates every few seconds while this tab is open. Press <kbd>/</kbd> to search.</p>
    {current && <WebsiteDrawer enquiry={current} now={now} onClose={() => setSelected(null)} onChanged={(status) => { patchStatus(current.id, status); void refresh(); }} />}
  </>;
}
