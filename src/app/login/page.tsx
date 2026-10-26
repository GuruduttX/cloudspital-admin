import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Activity, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { currentAdmin } from "@/services/auth";
import { LoginForm } from "@/features/auth/LoginForm";
import { BrandMark } from "@/components/ui/BrandMark";
export const metadata = { title: "Sign in | HealthMatrix Admin" };
async function Login() {
  if (await currentAdmin()) redirect("/");
  return <main className="login-page">
    <header className="login-brand"><BrandMark /><span>HealthMatrix<small>Super admin</small></span></header>
    <div className="login-layout">
      <section className="login-story" aria-labelledby="login-heading"><h1 id="login-heading">Your entire care network,<br />in one clear view.</h1><div className="login-benefits">
        <div><span className="login-feature-icon"><Users size={22} aria-hidden /></span><div><h2>The people behind the care</h2><p>Doctors, patients and their connected records, all in one place.</p></div></div>
        <div><span className="login-feature-icon"><Activity size={22} aria-hidden /></span><div><h2>Stay close to what’s happening</h2><p>Follow consultations, prescriptions and activity across the ecosystem.</p></div></div>
        <div><span className="login-feature-icon"><ShieldCheck size={22} aria-hidden /></span><div><h2>Protected administrator access</h2><p>A secure workspace with a record of the information you access.</p></div></div>
      </div></section>
      <div className="login-form-column"><section className="login-card"><h2>Welcome back</h2><p className="login-description">Sign in with your administrator credentials to manage the HealthMatrix network.</p><LoginForm /></section><p className="login-security"><LockKeyhole size={14} aria-hidden /> Your session is protected. Administrator access only.</p></div>
    </div><footer className="login-bottom">HealthMatrix · Cloudspital · Powered by Ekaay.AI</footer>
  </main>;
}
export default function LoginPage() { return <Suspense fallback={<div className="page-loading">Opening sign in…</div>}><Login /></Suspense>; }
