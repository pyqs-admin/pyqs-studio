"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHeaderState } from "@/components/layout/header-context";
import { Menu, MenuLabel, MenuSeparator } from "@/components/ui/menu";
import { getCurrentStudioUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/client";

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
  const [theme, setTheme] = useStateTheme();
  const user = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });

  const signOut = async () => {
    try {
      await createClient().auth.signOut();
    } catch {
      // Missing runtime configuration must not leave the user stranded.
    } finally {
      router.replace("/sign-in");
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="top">
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
      </header>
      <main className="page grow overflow-y-auto">{children}</main>
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
