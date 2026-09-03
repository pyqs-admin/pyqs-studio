import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth">
      <section className="card text-center" style={{ maxWidth: 420 }}>
        <img src="/theme/assets/mascot/lens.svg" alt="" className="mascot" />
        <h1>Page not found</h1>
        <p className="hint">The Studio page you requested does not exist or you no longer have access to it.</p>
        <Link className="btn pri mt-2" href="/dashboard">Back to dashboard</Link>
      </section>
    </main>
  );
}
