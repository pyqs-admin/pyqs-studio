"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Studio route error", error); }, [error]);
  return (
    <main className="auth">
      <section className="card text-center" style={{ maxWidth: 420 }}>
        <img src="/theme/assets/mascot/lens.svg" alt="" className="mascot" />
        <h1>This page could not be loaded</h1>
        <p className="hint">Your work has not been changed. Try again, or return to the dashboard if the problem continues.</p>
        <div className="addrow justify-center">
          <button type="button" className="btn pri" onClick={reset}>Try again</button>
          <button type="button" className="btn" onClick={() => { window.location.href = "/dashboard"; }}>Dashboard</button>
        </div>
        {error.digest && <p className="mono small mt-3">Reference: {error.digest}</p>}
      </section>
    </main>
  );
}
