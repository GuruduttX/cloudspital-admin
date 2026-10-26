"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Stethoscope, Users } from "lucide-react";
const items = [{ href: "/", label: "Overview", Icon: LayoutDashboard }, { href: "/activity", label: "Activity", Icon: Activity }, { href: "/doctors", label: "Doctors", Icon: Stethoscope }, { href: "/patients", label: "Patients", Icon: Users }];
export function Navigation() {
  const path = usePathname();
  return <nav aria-label="Main navigation" className="navigation">{items.map(({ href, label, Icon }) => <Link key={href} href={href} prefetch={false} aria-current={(href === "/" ? path === "/" : path.startsWith(href)) ? "page" : undefined}><Icon size={19} aria-hidden /><span>{label}</span><span className="nav-indicator" /></Link>)}</nav>;
}
