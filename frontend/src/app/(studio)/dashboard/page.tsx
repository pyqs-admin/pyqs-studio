"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentStudioUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter(); const user = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });
  const signOut = async () => { await createClient().auth.signOut(); router.replace("/sign-in"); router.refresh(); };
  return <main className="mx-auto flex min-h-screen max-w-7xl items-center px-4 sm:px-6 lg:px-8"><section className="w-full rounded-xl border bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-6"><div><p className="text-sm font-medium text-slate-600">PYQS Content Studio</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{user.isLoading ? "Loading workspace…" : `Welcome, ${user.data?.displayName ?? "there"}`}</h1><p className="mt-2 text-sm text-slate-600">The authenticated Studio foundation is ready. Project and authoring screens follow in later phases.</p></div><Button variant="outline" onClick={signOut}><LogOut className="size-4" />Sign out</Button></div>{user.isError && <p className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">We could not load your Studio access. Please sign in again or ask an admin to provision your account.</p>}</section></main>;
}
