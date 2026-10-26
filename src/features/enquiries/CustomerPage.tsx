import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, History, MessagesSquare } from "lucide-react";
import { getCustomer } from "@/services/enquiries";
import { chatReference, lastPreview } from "@/lib/enquiries";
import { date, dateTime, initials, label, memberId, number, relativeTime } from "@/lib/format";
import { RefreshRecords } from "@/features/activity/RefreshRecords";
import { topicLabel, type ChatSummary } from "@/types/enquiries";
import { ContactActions, SourceBadge, StatusBadge, customerState, StateBadge } from "./EnquiryBadges";

function endedNote(chat: ChatSummary) {
  if (chat.status !== "resolved") return null;
  const who = chat.endedBy === "support" ? "Ended by Cloudspital" : chat.endedBy === "member" ? "Ended by customer" : "Ended";
  return chat.endedAt ? `${who} · ${dateTime(chat.endedAt)}` : who;
}

function ChatCard({ chat, now, open = false }: { chat: ChatSummary; now: string; open?: boolean }) {
  return <li className={`chat-card${open ? " is-open" : ""}`}>
    <Link href={`/enquiries/chats/${chat.id}`} className="chat-card-link">
      <span className="event-icon" aria-hidden><MessagesSquare size={16} /></span>
      <span className="chat-card-main">
        <span className="chat-card-heading"><strong>{topicLabel(chat.topic)}</strong><StatusBadge status={chat.status} source="app" /><span className="record-id">{chatReference(chat.id)}</span></span>
        <span className="chat-card-preview">{lastPreview(chat.last)}</span>
        <span className="chat-card-meta"><span>Started {dateTime(chat.createdAt)}</span><span>{chat.messageCount === 1 ? "1 message" : `${number(chat.messageCount)} messages`}</span>{open ? <span>Last activity {relativeTime(chat.updatedAt, now)}</span> : <span>{endedNote(chat)}</span>}</span>
      </span>
      <ChevronRight size={18} aria-hidden className="chat-card-arrow" />
    </Link>
  </li>;
}

export async function CustomerPage({ id }: { id: string }) {
  const data = await getCustomer(id);
  if (!data) notFound();
  const { profile, chats, now } = data;
  const open = chats.filter((chat) => chat.status !== "resolved");
  const past = chats.filter((chat) => chat.status === "resolved");
  const first = chats.at(-1);
  const state = customerState(chats.filter((chat) => chat.status === "unread").length, open.length);
  return <>
    <Link href="/enquiries" className="back-link"><ArrowLeft size={16} aria-hidden /> Back to enquiries</Link>
    <header className="panel profile-heading customer-heading">
      <span className="avatar avatar-large" aria-hidden>{initials(profile.name)}</span>
      <div className="profile-intro">
        <p className="eyebrow">APP CUSTOMER</p>
        <h1>{profile.name}</h1>
        <p>{memberId(profile.memberId)}</p>
        <div className="profile-context">{profile.phone && <span>{profile.phone}</span>}{profile.email && <span>{profile.email}</span>}{profile.plan && <span>{label(profile.plan)} plan</span>}</div>
        <ContactActions phone={profile.phone} compact />
      </div>
      <div className="customer-heading-side"><SourceBadge source="app" /><StateBadge state={state} /></div>
    </header>
    <p className="customer-note">{first ? <>Customer since {date(first.createdAt)} · {chats.length === 1 ? "1 chat" : `${number(chats.length)} chats`}</> : "No chats yet"}</p>
    <section className="panel records-panel customer-chats" aria-labelledby="open-chat-heading">
      <div className="panel-heading"><div><h2 id="open-chat-heading">Open chat</h2><p>The member can have one open chat at a time.</p></div><RefreshRecords /></div>
      {open.length ? <ul className="chat-list">{open.map((chat) => <ChatCard key={chat.id} chat={chat} now={now} open />)}</ul> : <div className="empty-state"><h3>No open chat</h3><p>When this member starts a new chat in the app, it shows here.</p></div>}
    </section>
    <section className="panel records-panel customer-chats" aria-labelledby="past-chats-heading">
      <div className="panel-heading"><div><h2 id="past-chats-heading"><History size={16} aria-hidden /> Past chats <span className="heading-count">{number(past.length)}</span></h2><p>Ended chats are read-only.</p></div></div>
      {past.length ? <ul className="chat-list">{past.map((chat) => <ChatCard key={chat.id} chat={chat} now={now} />)}</ul> : <div className="empty-state"><h3>No past chats</h3><p>Ended chats appear here, newest first.</p></div>}
    </section>
  </>;
}
