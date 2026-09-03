"use client";

import { useQuery } from "@tanstack/react-query";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { getStudioUsers } from "@/lib/api/projects";

export default function UsersPage() {
  usePageHeader([{ label: "Users" }]);
  const users = useQuery({ queryKey: ["studio", "users"], queryFn: getStudioUsers });

  if (users.isLoading) return <ContentSkeleton rows={5} />;
  if (users.isError || !users.data) return <ErrorState title="Studio users could not be loaded" description="Check your access and try again." onRetry={() => void users.refetch()} />;

  return (
    <>
      <h1>Users</h1>
      <p className="sub">Active Studio profiles available for project membership.</p>
      {users.data.length === 0 ? (
        <EmptyState title="No Studio users" description="Provision users in Studio Supabase Auth, then add their Studio profiles and roles." />
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((user) => (
              <tr key={user.id}>
                <td>
                  <span className="flex items-center gap-2.5">
                    <span className="avatar !h-7 !w-7 !text-[11px]">{initials(user.displayName)}</span>
                    <span className="font-bold">{user.displayName}</span>
                  </span>
                </td>
                <td>{user.email}</td>
                <td>
                  {user.status === "active" ? <span className="tag good">active</span> : <span className="tag bad">{user.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
