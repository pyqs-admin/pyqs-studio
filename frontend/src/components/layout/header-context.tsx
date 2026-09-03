"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

interface HeaderState {
  crumbs: Crumb[];
  actions: ReactNode;
  setCrumbs: (crumbs: Crumb[]) => void;
  setActions: (actions: ReactNode) => void;
}

const HeaderContext = createContext<HeaderState | null>(null);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [actions, setActions] = useState<ReactNode>(null);
  const value = useMemo(() => ({ crumbs, actions, setCrumbs, setActions }), [crumbs, actions]);
  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function usePageHeader(crumbs: Crumb[], actions?: ReactNode) {
  const context = useContext(HeaderContext);
  const setCrumbs = context?.setCrumbs;
  const setActions = context?.setActions;
  const key = JSON.stringify(crumbs);
  const nextActions = actions ?? null;
  const lastApplied = useRef<{ key: string; actions: ReactNode | null } | null>(null);

  useEffect(() => {
    if (!setCrumbs || !setActions) return;
    if (lastApplied.current?.key === key && lastApplied.current.actions === nextActions) return;
    lastApplied.current = { key, actions: nextActions };
    setCrumbs(crumbs);
    setActions(nextActions);
  }, [crumbs, key, nextActions, setActions, setCrumbs]);

  useEffect(() => {
    if (!setCrumbs || !setActions) return;
    return () => {
      lastApplied.current = null;
      setCrumbs([]);
      setActions(null);
    };
  }, [setActions, setCrumbs]);
}

export function useHeaderState() {
  return useContext(HeaderContext);
}
