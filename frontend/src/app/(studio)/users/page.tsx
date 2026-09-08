"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { UserEditorDialog } from "@/components/users/user-editor-dialog";
import { getCurrentStudioUser } from "@/lib/api/auth";
import { getPermissions, getRoles, getUsersWithAccess } from "@/lib/api/users";

export default function UsersPage() {
  usePageHeader([{ label: "Users" }]);
  const currentUser = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });
  const users = useQuery({ queryKey: ["studio", "users", "access"], queryFn: getUsersWithAccess });
  const roles = useQuery({ queryKey: ["studio", "roles"], queryFn: getRoles });
  const permissions = useQuery({ queryKey: ["studio", "permissions"], queryFn: getPermissions });
  const [editingId, setEditingId] = useState<string | null>(null);

  if (currentUser.isLoading || users.isLoading || roles.isLoading || permissions.isLoading) return <ContentSkeleton rows={5} />;
  if (currentUser.isError || !currentUser.data) return <ErrorState title="Your Studio access could not be loaded" description="Please sign in again." onRetry={() => void currentUser.refetch()} />;

  const canManage = currentUser.data.permissions.includes("users.manage");
  if (!canManage) return <ErrorState title="Access restricted" description="Only Studio owners can manage users, roles, and permissions." />;

  if (users.isError || roles.isError || permissions.isError || !users.data || !roles.data || !permissions.data) {
    return <ErrorState title="Studio users could not be loaded" description="Check your access and try again." onRetry={() => void users.refetch()} />;
  }

  const editingUser = users.data.find((user) => user.id === editingId) ?? null;

  return (
    <>
      <h1>Users</h1>
      <p className="sub">Studio profiles and their roles. Roles bundle permissions; extra permissions can be granted per user.</p>
      {users.data.length === 0 ? (
        <EmptyState title="No Studio users" description="Provision users in Studio Supabase Auth, then add their Studio profiles and roles." />
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roles</th>
              <th>Status</th>
              <th className="text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((user) => (
              <tr key={user.id}>
                <td>
                  <span className="flex items-center gap-2.5">
                    <span className="avatar !h-7 !w-7 !text-[11px]">{initials(user.displayName)}</span>
                    <span className="min-w-0">
                      <span className="block font-bold">{user.displayName}</span>
                      <span className="block small">{user.email}</span>
                    </span>
                  </span>
                </td>
                <td>
                  <span className="flex flex-wrap gap-1.5">
                    {user.roles.length ? (
                      user.roles.map((role) => (
                        <Badge key={role} variant={role === "admin" ? "solid" : "outline"}>{sentenceCase(role)}</Badge>
                      ))
                    ) : (
                      <Badge variant="default">no roles</Badge>
                    )}
                  </span>
                </td>
                <td>
                  {user.status === "active" ? <Badge variant="success">active</Badge> : <Badge variant="destructive">{user.status}</Badge>}
                </td>
                <td className="text-right">
                  <button type="button" className="btn sm" onClick={() => setEditingId(user.id)}>Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingUser && (
        <UserEditorDialog
          user={editingUser}
          roles={roles.data}
          permissions={permissions.data}
          isSelf={editingUser.id === currentUser.data.profileId}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function sentenceCase(value: string) {
  const label = value.replaceAll("_", " ").replaceAll(".", " ").replace(/\s+/g, " ").trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
}
