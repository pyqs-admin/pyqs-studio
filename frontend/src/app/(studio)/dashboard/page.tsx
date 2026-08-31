"use client";

import { useQuery } from "@tanstack/react-query";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStudioUser } from "@/lib/api/auth";

export default function DashboardPage() {
  const user = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });
  if (user.isLoading) return <ContentSkeleton rows={3} />;
  if (user.isError) return <ErrorState title="Your Studio access could not be loaded" description="Please sign in again or ask an administrator to provision your account." onRetry={() => user.refetch()} />;
  return <><PageHeader eyebrow="PYQS Content Studio" title={`Welcome, ${user.data?.displayName ?? "there"}`} description="Your focused content workspace is ready. Projects, authoring, and review workflows will appear here as the next phases are completed." /><section className="rounded-xl border bg-white p-6"><h2 className="font-semibold">Workspace ready</h2><p className="mt-1 text-sm leading-6 text-slate-600">Use the navigation to move between Studio areas. Your available tools are determined by your Studio permissions.</p></section></>;
}
