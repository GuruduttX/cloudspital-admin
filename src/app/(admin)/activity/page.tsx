import { Suspense } from "react";
import { Activity } from "lucide-react";
import { RecordWorkspace } from "@/features/activity/RecordWorkspace";
import type { SearchParams } from "@/lib/activity-config";
export const metadata = { title: "System activity | HealthMatrix Admin" };
async function Feed({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <RecordWorkspace params={await searchParams} />;
}
export default function Page(props: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">ACROSS THE ECOSYSTEM</p>
          <h1>System activity</h1>
          <p>
            Follow consultations, care, bookings and account activity across
            both products.
          </p>
        </div>
        <span className="badge badge-glass">
          <Activity size={14} aria-hidden /> App + doctor dashboard
        </span>
      </header>
      <Suspense
        fallback={
          <div className="page-loading" role="status">
            Loading system activity…
          </div>
        }
      >
        <Feed {...props} />
      </Suspense>
    </>
  );
}