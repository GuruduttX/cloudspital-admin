import Link from "next/link";
import { Activity, ArrowUpRight, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { signOut } from "@/features/auth/actions";
import { BrandMark } from "@/components/ui/BrandMark";
import { Navigation } from "./Navigation";
import { initials } from "@/lib/format";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="sidebar">
        <Link href="/" className="brand"><BrandMark /><span>HealthMatrix<small>Super admin</small></span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <Navigation />
        <div className="sidebar-bottom"><div className="security-note"><ShieldCheck size={19} aria-hidden /><div>Protected workspace<small>Administrator access</small></div></div><div className="admin-profile"><span className="avatar avatar-admin" aria-hidden>{initials(admin.name)}</span><div><strong>{admin.name}</strong><small>Super administrator</small></div><form action={signOut}><button className="icon-button" aria-label="Sign out" title="Sign out"><LogOut size={18} aria-hidden /></button></form></div></div>
      </aside>
      <div className="workspace"><header className="topbar"><div className="breadcrumb"><LayoutDashboard size={16} aria-hidden /><span>Workspace</span><span className="separator">/</span><strong>Administration</strong></div><div className="topbar-right"><form action={signOut} className="mobile-signout"><button className="icon-button" aria-label="Sign out on mobile" title="Sign out"><LogOut size={18} aria-hidden /></button></form><span className="protected-label"><ShieldCheck size={15} aria-hidden /> Secure session</span><span className="topbar-divider" /><span className="avatar avatar-admin small" aria-label={admin.name}>{initials(admin.name)}</span></div></header><main id="main" className="main-content">{children}</main><footer className="workspace-footer"><span><Activity size={13} aria-hidden /> HealthMatrix ecosystem</span><span>Member app <ArrowUpRight size={12} aria-hidden /> &nbsp; · &nbsp; Doctor dashboard <ArrowUpRight size={12} aria-hidden /></span></footer></div>
    </div>
  );
}

