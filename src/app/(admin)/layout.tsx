import { Suspense } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Opening secure workspace…
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
