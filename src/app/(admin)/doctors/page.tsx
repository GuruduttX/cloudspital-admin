import { Suspense } from "react";
import {
  DirectoryPage,
  type SearchParams,
} from "@/features/directory/DirectoryPage";
export const metadata = { title: "Doctors | HealthMatrix Admin" };
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading doctors…
        </div>
      }
    >
      <DirectoryPage kind="doctors" searchParams={searchParams} />
    </Suspense>
  );
}
