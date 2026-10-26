"use client";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Ban, CheckCheck, ChevronRight, MessageSquareText, Send, X } from "lucide-react";
import { pollJson, usePoll } from "@/hooks/usePoll";
import { chatReference, lastPreview } from "@/lib/enquiries";
import { dateTime, dayLabel, initials, memberId, number, sameDay, time } from "@/lib/format";
import { CANNED_REPLIES, CHAT_POLL_MS, MAX_REPLY_LENGTH, SUPPORT_AGENT_NAME } from "@/config/enquiries";
import { topicLabel, type ChatDetail, type ChatMessage, type ChatPoll, type ChatSummary } from "@/types/enquiries";
import { ContactActions, SourceBadge, StatusBadge } from "./EnquiryBadges";
import { closeChat, sendReply } from "./actions";

/** Messages are append-only: keep what we have and add the ones after it. */
function merge(current: ChatDetail, poll: ChatPoll): ChatDetail {
  const known = current.messages.length;
  const messages = poll.from <= known ? [...current.messages, ...poll.chat.messages.slice(known - poll.from)] : current.messages;
  return { ...poll.chat, messages };
}

/** Older chats may hold the opening message only in `message`. */
function thread(chat: ChatDetail): ChatMessage[] {
  if (chat.messages.length || !chat.message) return chat.messages;
  return [{ id: "opening", from: "member", text: chat.message, at: chat.createdAt }];
}

function EndChat({ id, onEnded }: { id: string; onEnded: (error?: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, startTransition] = useTransition();
  const end = () => startTransition(async () => {
    const result = await closeChat(id);
    dialog.current?.close();
    onEnded(result.ok ? undefined : result.error);
  });
  return <>
    <button type="button" className="button button-revoke chat-end" onClick={() => dialog.current?.showModal()}><Ban size={14} aria-hidden /> End chat</button>
    <dialog ref={dialog} className="access-dialog" aria-labelledby={titleId} onCancel={(event) => { if (pending) event.preventDefault(); }}>
      <h2 id={titleId}>End this chat?</h2>
      <p>Nobody can send messages in it after this, and the customer sees that the chat has ended. They can start a new chat from the app at any time.</p>
      <div className="access-dialog-actions"><button type="button" className="button button-light" disabled={pending} onClick={() => dialog.current?.close()}>Cancel</button><button type="button" className="button button-revoke" disabled={pending} onClick={end}>{pending ? "Ending…" : "End chat"}</button></div>
    </dialog>
  </>;
}

function CannedReplies({ onPick }: { onPick: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menu.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  return <div className="canned" ref={menu}>
    <button type="button" className="button button-light canned-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}><MessageSquareText size={15} aria-hidden /> Saved replies</button>
    {open && <div className="canned-menu" role="menu">{CANNED_REPLIES.map((reply) => <button key={reply.label} type="button" role="menuitem" onClick={() => { onPick(reply.text); setOpen(false); }}><strong>{reply.label}</strong><span>{reply.text}</span></button>)}</div>}
  </div>;
}

function Composer({ id, onSent }: { id: string; onSent: (error?: string) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const box = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const tooLong = trimmed.length > MAX_REPLY_LENGTH;
  const send = () => {
    if (!trimmed || tooLong || pending) return;
    startTransition(async () => {
      setError("");
      const result = await sendReply(id, trimmed);
      if (result.ok) { setText(""); onSent(); box.current?.focus(); return; }
      // A chat that ended meanwhile is reported above the composer, which then turns read-only.
      if (result.reload) onSent(result.error); else setError(result.error);
    });
  };
  const insert = (reply: string) => {
    setText((current) => current.trim() ? `${current.trimEnd()}\n${reply}` : reply);
    requestAnimationFrame(() => { const element = box.current; if (element) { element.focus(); element.setSelectionRange(element.value.length, element.value.length); } });
  };
  return <form className="composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
    <label className="sr-only" htmlFor={`reply-${id}`}>Reply to the customer</label>
    <textarea ref={box} id={`reply-${id}`} value={text} rows={3} maxLength={MAX_REPLY_LENGTH + 200} autoFocus placeholder={`Reply as ${SUPPORT_AGENT_NAME}…  Enter to send, Shift+Enter for a new line`} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); }
    }} />
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="composer-bar">
      <CannedReplies onPick={insert} />
      <span className={`composer-count${tooLong ? " over" : ""}`} aria-live="polite">{trimmed.length > MAX_REPLY_LENGTH - 200 ? `${number(trimmed.length)} / ${number(MAX_REPLY_LENGTH)}` : ""}</span>
      <button type="submit" className="button button-dark" disabled={!trimmed || tooLong || pending}><Send size={15} aria-hidden /> {pending ? "Sending…" : "Send"}</button>
    </div>
  </form>;
}

function OtherChats({ chats, member, name }: { chats: ChatSummary[]; member: string; name: string }) {
  return <aside className="panel chat-side" aria-labelledby="other-chats-heading">
    <div className="panel-heading"><div><h2 id="other-chats-heading">Other chats</h2><p>{chats.length ? `${chats.length} more from ${name}` : "This is their only chat."}</p></div></div>
    {chats.length > 0 && <ul className="side-chat-list">{chats.map((chat) => <li key={chat.id}><Link href={`/enquiries/chats/${chat.id}`}><span className="side-chat-top"><strong>{topicLabel(chat.topic)}</strong><StatusBadge status={chat.status} source="app" /></span><span className="side-chat-preview">{lastPreview(chat.last)}</span><span className="side-chat-meta">{dateTime(chat.createdAt)} · {chat.messageCount === 1 ? "1 message" : `${chat.messageCount} messages`}</span></Link></li>)}</ul>}
    {member && <Link href={`/enquiries/customers/${member}`} className="text-link side-customer-link">All chats for this customer <ChevronRight size={14} aria-hidden /></Link>}
  </aside>;
}

export function ChatView({ initial, others, initialNow }: { initial: ChatDetail; others: ChatSummary[]; initialNow: string }) {
  const [chat, setChat] = useState(initial);
  const [now, setNow] = useState(initialNow);
  const [notice, setNotice] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const count = useRef(initial.messages.length);
  const ended = chat.status === "resolved";

  const poll = useCallback(async () => {
    const result = await pollJson<ChatPoll>(`/api/enquiries/chats/${initial.id}?from=${count.current}`);
    if (!result) return;
    setChat((current) => merge(current, result));
    setNow(result.now);
  }, [initial.id]);
  useEffect(() => { count.current = chat.messages.length; }, [chat.messages.length]);
  // The first poll runs straight away: opening the chat marks it read for the customer's "Seen".
  usePoll(poll, CHAT_POLL_MS, { immediate: true });

  const messages = thread(chat);
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && pinned.current) element.scrollTop = element.scrollHeight;
  }, [messages.length]);

  const lastSupport = [...messages].reverse().find((item) => item.from === "support");
  const seen = lastSupport && chat.memberReadAt && new Date(chat.memberReadAt) >= new Date(lastSupport.at);
  const after = (error?: string) => {
    setNotice(error ?? "");
    pinned.current = true;
    void poll();
  };

  return <>
    <Link href={chat.member ? `/enquiries/customers/${chat.member}` : "/enquiries"} className="back-link"><ArrowLeft size={16} aria-hidden /> Back to {chat.member ? "customer" : "enquiries"}</Link>
    <div className="chat-layout">
      <section className="panel chat-panel" aria-label={`Chat with ${chat.name}`}>
        <header className="chat-header">
          <span className="avatar" aria-hidden>{initials(chat.name)}</span>
          <div className="chat-header-main">
            <div className="chat-title">{chat.member ? <Link href={`/enquiries/customers/${chat.member}`} className="person-name">{chat.name}</Link> : <strong className="person-name">{chat.name}</strong>}<SourceBadge source="app" /><StatusBadge status={chat.status} source="app" /></div>
            <p className="chat-meta"><span>{memberId(chat.memberId)}</span>{chat.phone && <span>{chat.phone}</span>}<span>{topicLabel(chat.topic)}</span><span className="record-id">{chatReference(chat.id)}</span><span>Started {dateTime(chat.createdAt)}</span></p>
          </div>
          <div className="chat-header-actions"><ContactActions phone={chat.phone} compact />{!ended && <EndChat id={chat.id} onEnded={after} />}</div>
        </header>
        <div className="chat-scroll" ref={scroller} onScroll={(event) => { const element = event.currentTarget; pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }} role="log" aria-live="polite" aria-label="Messages">
          {messages.length === 0 && <p className="chat-empty">No messages yet.</p>}
          {messages.map((item, index) => {
            const newDay = index === 0 || !sameDay(messages[index - 1].at, item.at);
            const mine = item.from === "support";
            return <Fragment key={item.id || index}>
              {newDay && <div className="day-separator"><span>{dayLabel(item.at, now)}</span></div>}
              <div className={`bubble-row ${mine ? "from-support" : "from-member"}`}>
                <div className="bubble">
                  <span className="bubble-author">{mine ? item.agentName || "Team" : chat.name}</span>
                  <p className="record-text">{item.text}</p>
                  <time className="bubble-time" dateTime={item.at} title={dateTime(item.at)}>{time(item.at)}</time>
                </div>
                {mine && item === lastSupport && seen && <span className="seen-note"><CheckCheck size={13} aria-hidden /> Seen by customer</span>}
              </div>
            </Fragment>;
          })}
        </div>
        {notice && <div className="chat-notice" role="alert"><span>{notice}</span><button type="button" className="icon-button" aria-label="Dismiss" onClick={() => setNotice("")}><X size={15} aria-hidden /></button></div>}
        {ended
          ? <footer className="chat-ended"><Ban size={15} aria-hidden /> {chat.endedBy === "support" ? "Ended by Cloudspital" : chat.endedBy === "member" ? "The customer ended this chat" : "This chat has ended"}{chat.endedAt ? ` on ${dateTime(chat.endedAt)}` : ""}. It is read-only.</footer>
          : <Composer key={chat.id} id={chat.id} onSent={after} />}
      </section>
      <OtherChats chats={others} member={chat.member} name={chat.name} />
    </div>
  </>;
}
