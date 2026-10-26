"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { tabTitle } from "@/lib/activity-config";
export function ProfileTabs({ tabs, selected, base, kind }: { tabs: readonly string[]; selected: string; base: string; kind: string }) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = nav.current;
    const current = container?.querySelector<HTMLElement>('[aria-current="page"]');
    if (container && current) container.scrollTo({ left: Math.max(0, current.offsetLeft - container.offsetLeft - (container.clientWidth - current.clientWidth) / 2) });
  }, [selected]);
  return <nav ref={nav} className="profile-tabs no-scrollbar" aria-label={`${kind === "doctors" ? "Doctor" : "Patient"} sections`}>{tabs.map(tab => <Link key={tab} prefetch={false} href={`${base}?tab=${tab}`} aria-current={selected === tab ? "page" : undefined}>{tabTitle(tab)}</Link>)}</nav>;
}
