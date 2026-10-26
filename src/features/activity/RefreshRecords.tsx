"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
export function RefreshRecords() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="button button-light refresh-records" disabled={pending} onClick={() => startTransition(() => router.refresh())}><RefreshCw size={14} aria-hidden />{pending ? "Refreshing…" : "Refresh"}</button>;
}
