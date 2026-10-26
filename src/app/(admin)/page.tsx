import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { getOverview } from "@/services/directory";
import { number } from "@/lib/format";
import { BrandMark } from "@/components/ui/BrandMark";
import { ActorIdentity, ActorBadge } from "@/components/ui/ActorIdentity";
import type { Actor } from "@/types/directory";
export const metadata = { title: "Overview | HealthMatrix Admin" };
function RecentActors({
  title,
  description,
  actors,
  href,
}: {
  title: string;
  description: string;
  actors: Actor[];
  href: string;
}) {
  return (
    <section className="panel recent-panel">
      <header className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link href={href} className="text-link">
          View all <ArrowRight size={15} aria-hidden />
        </Link>
      </header>
      {actors.length ? (
        <ul className="recent-list">
          {actors.map((actor) => (
            <li key={actor.id}>
              <ActorIdentity actor={actor} />
              <ActorBadge actor={actor} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <Users size={27} aria-hidden />
          <h3>No registrations yet</h3>
          <p>Accounts will appear here when people join HealthMatrix.</p>
        </div>
      )}
    </section>
  );
}
async function Overview() {
  const data = await getOverview();
  const stats = [
    {
      title: "Total patients",
      value: data.patients,
      detail: "Registered HealthMatrix members",
      Icon: Users,
      href: "/patients",
    },
    {
      title: "Total doctors",
      value: data.doctors,
      detail: "Across the doctor network",
      Icon: Stethoscope,
      href: "/doctors",
    },
    {
      title: "Active doctors",
      value: data.activeDoctors,
      detail: "Accounts marked active",
      Icon: ShieldCheck,
      href: "/doctors?filter=active",
    },
    {
      title: "New patients",
      value: data.newPatients,
      detail: "Registered in the last 30 days",
      Icon: UserPlus,
      href: "/patients",
    },
  ];
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">YOUR CARE NETWORK</p>
          <h1>Overview</h1>
          <p>A shared view of your patients and care network.</p>
        </div>
        <span className="badge badge-glass">
          <span className="status-dot" /> Shared database
        </span>
      </header>
      <section className="stats-grid" aria-label="Network statistics">
        {stats.map(({ title, value, detail, Icon, href }) => (
          <Link
            href={href}
            className="panel stat-card network-stat"
            key={title}
          >
            <div className="stat-top">
              <span className="stat-icon">
                <Icon size={23} aria-hidden />
              </span>
              <span className="stat-arrow">
                <ArrowUpRight size={17} aria-hidden />
              </span>
            </div>
            <strong className="stat-number">{number(value)}</strong>
            <h2 className="stat-title">{title}</h2>
            <p>{detail}</p>
          </Link>
        ))}
      </section>
      <section className="ecosystem-banner">
        <div className="banner-icon">
          <BrandMark />
        </div>
        <div>
          <p className="eyebrow">CONNECTED CARE</p>
          <h2>One connected view of care.</h2>
          <p>
            Members from the app. Doctors from the dashboard.
            <br className="desktop-break" /> All connected through the same
            source of truth.
          </p>
        </div>
        <Link href="/activity" className="button button-primary">
          Explore activity <ArrowUpRight size={17} aria-hidden />
        </Link>
      </section>
      <div className="recent-grid">
        <RecentActors
          title="Recently joined patients"
          description="The latest members in your ecosystem"
          actors={data.recentPatients}
          href="/patients"
        />
        <RecentActors
          title="Recently joined doctors"
          description="The latest additions to your care network"
          actors={data.recentDoctors}
          href="/doctors"
        />
      </div>
      <div className="scope-note">
        <ShieldCheck size={17} aria-hidden />
        <p>
          <strong>Connected account workspaces.</strong> Open a doctor or
          patient to explore their consultations, prescriptions and related
          records.
        </p>
      </div>
    </>
  );
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading overview…
        </div>
      }
    >
      <Overview />
    </Suspense>
  );
}
