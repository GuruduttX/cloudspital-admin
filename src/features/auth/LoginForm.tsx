"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, { error: "" });
  return (
    <form action={action} className="login-form">
      <label htmlFor="email">Work email</label>
      <input id="email" name="email" type="email" autoComplete="username" placeholder="you@company.com" required maxLength={254} />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required />
      {state.error && <p role="alert" className="form-error">{state.error}</p>}
      <button className="button button-primary" disabled={pending} type="submit">{pending ? "Verifying…" : "Sign in securely"}<ArrowRight size={17} aria-hidden /></button>
      <p className="login-footnote"><LockKeyhole size={14} aria-hidden /> Administrator access only.</p>
    </form>
  );
}
