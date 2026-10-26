import { Suspense } from "react";
import { ActorDetail } from "@/features/directory/ActorDetail";
import type { SearchParams } from "@/lib/activity-config";
export const metadata = { title: "Doctor workspace | HealthMatrix Admin" };
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};
async function Detail({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <ActorDetail kind="doctors" id={id} params={query} />;
}
export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading account records…
        </div>
      }
    >
      <Detail {...props} />
    </Suspense>
  );
}
