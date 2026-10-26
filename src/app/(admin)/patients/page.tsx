import { Suspense } from "react";
import {
  DirectoryPage,
  type SearchParams,
} from "@/features/directory/DirectoryPage";
export const metadata = { title: "Patients | HealthMatrix Admin" };
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading patients…
        </div>
      }
    >
      <DirectoryPage kind="patients" searchParams={searchParams} />
    </Suspense>
  );
}
