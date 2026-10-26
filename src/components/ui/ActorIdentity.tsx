import Link from "next/link";
import { initials, label, memberId } from "@/lib/format";
import type { Actor } from "@/types/directory";

export function ActorAvatar({ actor, large = false }: { actor: Actor; large?: boolean }) {
  const isDoctor = actor.kind === "doctors";
  const status = actor.isActive === true ? "Active" : "Inactive";
  return <span className={`avatar ${large ? "avatar-large" : ""} ${isDoctor ? "avatar-doctor" : ""}`}>
    <span aria-hidden="true">{initials(actor.name)}</span>
    {isDoctor && <span className={`avatar-status ${actor.isActive === true ? "avatar-status-active" : "avatar-status-inactive"}`} role="img" aria-label={status} title={status} />}
  </span>;
}

export function ActorIdentity({ actor }: { actor: Actor }) {
  return <div className="identity"><ActorAvatar actor={actor} /><div><Link href={`/${actor.kind}/${actor.id}`} className="person-name">{actor.name}</Link><span className="person-meta">{actor.kind === "patients" ? memberId(actor.memberId) : actor.qualifications || actor.registrationNumber || "Doctor"}</span></div></div>;
}
export function ActorBadge({ actor }: { actor: Actor }) {
  return actor.kind === "patients" ? <span className="membership-label">{label(actor.plan)}</span> : null;
}
