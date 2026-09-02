"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, BookOpenCheck, ChevronRight, FileText, FolderKanban, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentStudioUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type NavigationItem = { label: string; href: string; icon: typeof LayoutDashboard; admin?: boolean };
const navigation: NavigationItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "My questions", href: "/questions", icon: FileText },
  { label: "Review", href: "/review", icon: BookOpenCheck },
  { label: "Publishing", href: "/publish", icon: ShieldCheck, admin: true },
  { label: "Users", href: "/users", icon: Users, admin: true },
];

function canSeeAdminTools(roles: string[], permissions: string[]) {
  return roles.some((role) => ["admin", "super_admin"].includes(role)) || permissions.some((permission) => ["question.publish", "taxonomy.manage", "users.manage"].includes(permission));
}

function Navigation({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname(); const user = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });
  const items = navigation.filter((item) => !item.admin || canSeeAdminTools(user.data?.roles ?? [], user.data?.permissions ?? []));
  return <nav aria-label="Studio navigation" className="space-y-1">{items.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950", active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><item.icon className="size-4" aria-hidden="true" />{item.label}</Link>; })}</nav>;
}

export function StudioShell({ children }: { children: ReactNode }) {
  const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false); const [searchOpen, setSearchOpen] = useState(false); const [query, setQuery] = useState("");
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, []);
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const q = query.trim(); if (!q) return; setSearchOpen(false); router.push(`/questions?q=${encodeURIComponent(q)}`); };
  const signOut = async () => { try { await createClient().auth.signOut(); } catch { /* Missing runtime configuration must not leave the user stranded. */ } finally { router.replace("/sign-in"); router.refresh(); } };
  return <div className="min-h-screen bg-slate-50"><aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-white p-4 lg:block"><Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2 text-sm font-semibold tracking-tight"><span className="grid size-7 place-items-center rounded-md bg-slate-950 text-xs text-white">P</span>PYQS Studio</Link><Navigation /><div className="absolute inset-x-4 bottom-4 border-t pt-4"><Button variant="ghost" className="w-full justify-start text-slate-600" onClick={signOut}><LogOut className="size-4" />Sign out</Button></div></aside><div className="lg:pl-60"><header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white/95 px-4 backdrop-blur sm:px-6"><Button variant="ghost" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button><button onClick={() => setSearchOpen(true)} className="hidden h-9 w-full max-w-md items-center gap-2 rounded-md border bg-slate-50 px-3 text-left text-sm text-slate-500 transition-colors hover:bg-white sm:flex"><Search className="size-4" />Search questions, QIDs, topics…<kbd className="ml-auto hidden rounded border bg-white px-1.5 py-0.5 text-[10px] sm:inline">⌘ K</kbd></button><div className="ml-auto flex items-center gap-2"><Button variant="ghost" aria-label="Notifications"><Bell className="size-4" /></Button><Button variant="ghost" className="hidden sm:inline-flex" onClick={signOut}><LogOut className="size-4" />Sign out</Button></div></header><main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">{children}</main></div>{mobileOpen && <div className="fixed inset-0 z-40 lg:hidden"><button className="absolute inset-0 bg-slate-950/30" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /><aside className="relative h-full w-72 bg-white p-4 shadow-xl"><div className="mb-8 flex items-center justify-between"><span className="font-semibold">PYQS Studio</span><Button variant="ghost" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-5" /></Button></div><Navigation mobile onNavigate={() => setMobileOpen(false)} /></aside></div>}{searchOpen && <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/30 px-4 pt-[15vh]" role="dialog" aria-modal="true" aria-label="Search Studio"><form onSubmit={submitSearch} className="w-full max-w-xl rounded-xl border bg-white p-2 shadow-xl"><div className="flex items-center gap-2"><Search className="ml-2 size-5 text-slate-500" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by QID, question, topic, or tutor…" className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none" /><Button type="button" variant="ghost" aria-label="Close search" onClick={() => setSearchOpen(false)}><X className="size-4" /></Button></div><p className="border-t px-3 py-2 text-xs text-slate-500">Press Enter to open the filtered questions workspace.</p></form></div>}</div>;
}
