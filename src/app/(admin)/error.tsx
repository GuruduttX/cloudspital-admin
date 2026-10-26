"use client";
import { DatabaseZap } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel error-panel" role="alert">
      <DatabaseZap size={32} aria-hidden />
      <h1>We couldn’t load this view</h1>
      <p>
        The connection may be temporarily unavailable. Your data has not been
        changed.
      </p>
      <button className="button button-primary" onClick={() => reset()}>
        Try again
      </button>
    </section>
  );
}
