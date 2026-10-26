import Link from "next/link";
export default function NotFound() {
  return (
    <section className="panel error-panel">
      <h1>Page not found</h1>
      <p>This page or account is no longer available.</p>
      <Link href="/" className="button button-primary">
        Go to overview
      </Link>
    </section>
  );
}
