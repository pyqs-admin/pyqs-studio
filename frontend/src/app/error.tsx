"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Studio route error", error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-xl border bg-white p-6 text-center"><h1 className="text-xl font-semibold">This Studio page could not be loaded</h1><p className="mt-2 text-sm leading-6 text-slate-600">Your work has not been changed. Try again, or return to the dashboard if the problem continues.</p><div className="mt-5 flex justify-center gap-2"><Button onClick={reset}>Try again</Button><Button variant="outline" onClick={() => { window.location.href = "/dashboard"; }}>Dashboard</Button></div>{error.digest && <p className="mt-4 font-mono text-xs text-slate-400">Reference: {error.digest}</p>}</section></main>;
}
