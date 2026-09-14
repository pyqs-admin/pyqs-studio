"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardCheck, FolderKanban, LayoutDashboard, LogOut, Menu as MenuIcon, Moon, Search, Send, ShieldCheck, Sun, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHeaderState } from "@/components/layout/header-context";
import { Menu, MenuLabel, MenuSeparator } from "@/components/ui/menu";
import { getCurrentStudioUser } from "@/lib/api/auth";

const initials = (name?: string) =>
  String(name ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function StudioShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const header = useHeaderState();
  const crumbs = header?.crumbs ?? [];
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useStateTheme();
  const user = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });

  const signOut = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      await createClient().auth.signOut();
    } catch {
      // Missing runtime configuration must not leave the user stranded.
    } finally {
      router.replace("/sign-in");
      router.refresh();
    }
  };

  const canManageUsers = Boolean(user.data?.permissions.includes("users.manage"));
  const navigation = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/questions", label: "Questions", icon: Search },
    { href: "/review", label: "Review", icon: ClipboardCheck },
    { href: "/publish", label: "Publishing", icon: Send },
    { href: "/taxonomy", label: "Taxonomy index", icon: BookOpen },
    ...(canManageUsers ? [{ href: "/users", label: "Users", icon: Users }] : []),
  ];
  const isTaxonomyPage = pathname === "/taxonomy";
  const isQuestionPreview = pathname.startsWith("/questions/") && pathname.endsWith("/preview");
  const isQuestionEditor = pathname.endsWith("/questions/new") || (pathname.startsWith("/questions/") && pathname !== "/questions");
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={`studio-frame ${isQuestionPreview ? "is-qbank-preview" : ""}`}>
      {!isQuestionPreview && <header className="top">
        {!isTaxonomyPage && !isQuestionEditor && <button type="button" className="btn-icon sidebar-toggle" aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} onClick={() => setSidebarOpen((open) => !open)}><MenuIcon className="sidebar-menu-icon size-[19px]" aria-hidden="true" /><X className="sidebar-close-icon size-[19px]" aria-hidden="true" /></button>}
        <Link className="brand" href="/dashboard" title="pyqs Content Studio">
          <img className="wordmark" src="/theme/assets/logos/logo.png" alt="pyqs" />
          <img className="mark" src="/theme/assets/logos/favicon-192.png" alt="pyqs" />
          <span className="who">Content Studio</span>
        </Link>
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.length === 0 ? (
            <b>Dashboard</b>
          ) : (
            crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="contents">
                {index > 0 && (
                  <span className="sep" aria-hidden="true">
                    ·
                  </span>
                )}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <b>{crumb.label}</b>
                )}
              </span>
            ))
          )}
        </nav>
        <span className="grow" />
        <Link className="btn ghost sm index-link" href="/taxonomy" title="Browse the Master Index"><BookOpen className="size-[15px]" aria-hidden="true" /><span className="lbl">Index</span></Link>
        {header?.actions}
        <button
          type="button"
          className="btn-icon"
          id="theme-toggle"
          title="Light or dark"
          aria-label="Switch between light and dark"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="ic-light size-[18px]" aria-hidden="true" />
          <Moon className="ic-dark size-[18px]" aria-hidden="true" />
        </button>
        <Menu
          trigger={
            <span className="avatar" title={user.data?.displayName}>
              {initials(user.data?.displayName)}
            </span>
          }
        >
          <MenuLabel>
            {user.data?.displayName} · {user.data?.email}
          </MenuLabel>
          <MenuSeparator />
          <button type="button" onClick={signOut}>
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </Menu>
      </header>}
      <div className="studio-body">
        {!isTaxonomyPage && !isQuestionEditor && <aside className={`studio-sidebar ${sidebarOpen ? "is-open" : ""}`} aria-label="Studio navigation">
          <div className="sidebar-heading"><ShieldCheck className="size-4" aria-hidden="true" /><span>Workspace</span></div>
          <nav className="sidebar-nav">
            {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "is-active" : ""} aria-current={isActive(href) ? "page" : undefined} onClick={() => setSidebarOpen(false)}><Icon className="size-[18px]" aria-hidden="true" /><span>{label}</span></Link>)}
          </nav>
          <div className="sidebar-foot"><span className="sidebar-foot-dot" />Content Studio</div>
        </aside>}
        {!isTaxonomyPage && !isQuestionEditor && sidebarOpen && <button type="button" className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
        <main className="page grow overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function useStateTheme(): [string, (next: string) => void] {
  const [theme, setTheme] = useState(() => (typeof document !== "undefined" ? document.documentElement.dataset.theme ?? "light" : "light"));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("studio.theme", theme);
    } catch {
      // storage unavailable
    }
  }, [theme]);
  return [theme, setTheme];
}
