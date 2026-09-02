"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { getStudioUsers } from "@/lib/api/projects";

export default function UsersPage() {
  const users = useQuery({ queryKey: ["studio", "users"], queryFn: getStudioUsers });
  if (users.isLoading) return <ContentSkeleton rows={5} />;
  if (users.isError || !users.data) return <ErrorState title="Studio users could not be loaded" description="Check your access and try again." onRetry={() => void users.refetch()} />;
  return <><PageHeader eyebrow="Access directory" title="Studio users" description="Active Studio profiles available for project membership." />{users.data.length === 0 ? <EmptyState title="No Studio users" description="Provision users in Studio Supabase Auth, then add their Studio profiles and roles." /> : <section className="overflow-hidden rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{users.data.map((user) => <tr key={user.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{user.displayName}</td><td className="px-5 py-4 text-slate-600">{user.email}</td><td className="px-5 py-4 capitalize">{user.status}</td></tr>)}</tbody></table></section>}</>;
}
