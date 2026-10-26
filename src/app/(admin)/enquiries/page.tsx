import { Suspense } from "react";
import { EnquiriesPage, type SearchParams } from "@/features/enquiries/EnquiriesPage";
export const metadata = { title: "Enquiries | HealthMatrix Admin" };
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading enquiries…
        </div>
      }
    >
      <EnquiriesPage searchParams={searchParams} />
    </Suspense>
  );
}
