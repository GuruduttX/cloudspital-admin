import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getActor } from "@/services/directory";
import { memberId, label } from "@/lib/format";
import { ActorAvatar, ActorBadge } from "@/components/ui/ActorIdentity";
import { RecordWorkspace } from "@/features/activity/RecordWorkspace";
import { DoctorAccess } from "./DoctorAccess";
import type { ActorKind } from "@/types/directory";
import type { SearchParams } from "@/lib/activity-config";

export async function ActorDetail({ kind, id, params = {} }: { kind: ActorKind; id: string; params?: SearchParams }) {
  const actor = await getActor(kind, id);
  if (!actor) notFound();
  const isDoctor = kind === "doctors";
  return <><Link href={`/${kind}`} className="back-link"><ArrowLeft size={16} aria-hidden /> Back to {kind}</Link>
    <header className="panel profile-heading"><ActorAvatar actor={actor} large /><div className="profile-intro"><p className="eyebrow">{isDoctor ? "DOCTOR WORKSPACE" : "PATIENT WORKSPACE"}</p><h1>{actor.name}</h1><p>{isDoctor ? actor.qualifications || "HealthMatrix doctor" : memberId(actor.memberId)}</p><div className="profile-context"><span>{actor.phone}</span>{isDoctor ? <span>{actor.specialties?.map(label).join(" · ")}</span> : <span>{label(actor.plan)} membership</span>}</div></div>{isDoctor ? <DoctorAccess id={actor.id} isActive={actor.isActive} /> : <ActorBadge actor={actor} />}</header>
    <RecordWorkspace params={params} scope={{ kind, id }} />
  </>;
}
