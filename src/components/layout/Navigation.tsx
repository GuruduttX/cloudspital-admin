"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { Activity, Headset, LayoutDashboard, Stethoscope, Users } from "lucide-react";
import { pollJson, usePoll } from "@/hooks/usePoll";
import { LIST_POLL_MS } from "@/config/enquiries";
const items = [{ href: "/", label: "Overview", Icon: LayoutDashboard }, { href: "/activity", label: "Activity", Icon: Activity }, { href: "/enquiries", label: "Enquiries", Icon: Headset }, { href: "/doctors", label: "Doctors", Icon: Stethoscope }, { href: "/patients", label: "Patients", Icon: Users }];
export function Navigation() {
  const path = usePathname();
  const [waiting, setWaiting] = useState(0);
  // App chats waiting on the team, so staff notice new chats from any page.
  const refresh = useCallback(async () => { const data = await pollJson<{ waiting: number }>("/api/enquiries/waiting"); if (data) setWaiting(data.waiting); }, []);
  usePoll(refresh, LIST_POLL_MS, { immediate: true });
  return <nav aria-label="Main navigation" className="navigation">{items.map(({ href, label, Icon }) => <Link key={href} href={href} prefetch={false} aria-current={(href === "/" ? path === "/" : path.startsWith(href)) ? "page" : undefined}><Icon size={19} aria-hidden /><span>{label}</span>{href === "/enquiries" && waiting > 0 ? <span className="nav-badge" aria-label={`${waiting} waiting`}>{waiting > 99 ? "99+" : waiting}</span> : <span className="nav-indicator" />}</Link>)}</nav>;
}
