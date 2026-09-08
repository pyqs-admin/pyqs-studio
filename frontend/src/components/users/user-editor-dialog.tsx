"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { setUserPermissions, setUserRoles, setUserStatus, type StudioPermission, type StudioRole, type StudioUserWithAccess } from "@/lib/api/users";

const GROUPS: { key: string; label: string }[] = [
  { key: "project", label: "Project" },
  { key: "question", label: "Questions" },
  { key: "review", label: "Review" },
  { key: "medical", label: "Medical" },
  { key: "explanation", label: "Explanation" },
  { key: "media", label: "Media" },
  { key: "taxonomy", label: "Taxonomy" },
  { key: "audit", label: "Audit" },
  { key: "users", label: "Users" },
];

const sameSet = (a: string[], b: string[]) => [...a].sort().join("\u0000") === [...b].sort().join("\u0000");
const sentenceCase = (value: string) => {
  const label = value.replaceAll("_", " ").replaceAll(".", " ").replace(/\s+/g, " ").trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
};
const permissionLabel = (code: string) => sentenceCase(code.includes(".") ? code.slice(code.indexOf(".") + 1) : code);

function Section({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--pq-ink-3)]">{label}</p>
        {hint && <p className="mt-1 text-[12.5px] text-[var(--pq-ink-3)]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function UserEditorDialog({ user, roles, permissions, isSelf, onClose }: { user: StudioUserWithAccess; roles: StudioRole[]; permissions: StudioPermission[]; isSelf: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [draftRoles, setDraftRoles] = useState<string[]>(user.roles);
  const [draftPermissions, setDraftPermissions] = useState<string[]>(user.directPermissions);
  const [draftStatus, setDraftStatus] = useState<string>(user.status);
  const [error, setError] = useState("");

  const inherited = new Set<string>();
  for (const role of roles) {
    if (draftRoles.includes(role.code)) for (const permission of role.permissions) inherited.add(permission);
  }

  const toggleRole = (code: string) => setDraftRoles((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]));
  const togglePermission = (code: string) => setDraftPermissions((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]));

  const save = useMutation({
    mutationFn: async () => {
      const tasks: Promise<unknown>[] = [];
      if (!sameSet(draftRoles, user.roles)) tasks.push(setUserRoles(user.id, draftRoles));
      if (!sameSet(draftPermissions, user.directPermissions)) tasks.push(setUserPermissions(user.id, draftPermissions));
      if (draftStatus !== user.status) tasks.push(setUserStatus(user.id, draftStatus as "active" | "inactive"));
      await Promise.all(tasks);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["studio", "users", "access"] });
      onClose();
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "The changes could not be saved."),
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-[18px] text-[var(--pq-blue)]" aria-hidden="true" />
            Manage access
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2.5 pt-0.5">
            <span className="avatar !h-7 !w-7 !text-[11px]">{initials(user.displayName)}</span>
            <span>{user.displayName} · {user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-5 py-5">
          <Section label="Roles" hint="Roles bundle related permissions together. A user can hold more than one role.">
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const selected = draftRoles.includes(role.code);
                return (
                  <button
                    type="button"
                    key={role.code}
                    className={cn(badgeVariants({ variant: selected ? "solid" : "outline" }), "cursor-pointer px-3.5 py-1.5 text-[13px]")}
                    aria-pressed={selected}
                    onClick={() => toggleRole(role.code)}
                  >
                    {selected && <Check className="size-3.5" aria-hidden="true" />}
                    {sentenceCase(role.name)}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="Permissions" hint="Grant extra permissions directly on top of roles. Permissions locked by a role are marked “via role”.">
            <div className="space-y-4">
              {GROUPS.map((group) => {
                const items = permissions.filter((permission) => permission.code.startsWith(`${group.key}.`));
                if (!items.length) return null;
                return (
                  <div key={group.key}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--pq-ink-4)]">{group.label}</p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {items.map((permission) => {
                        const fromRole = inherited.has(permission.code);
                        const direct = draftPermissions.includes(permission.code);
                        const effective = fromRole || direct;
                        const id = `perm-${permission.code}`;
                        return (
                          <div
                            key={permission.code}
                            className={cn(
                              "flex items-center gap-3 rounded-[var(--pq-r-sm)] border-2 px-3 py-2 transition-colors",
                              fromRole
                                ? "border-transparent bg-[var(--pq-muted-bg)]"
                                : direct
                                  ? "border-[var(--pq-blue-15)] bg-[var(--pq-blue-10)]"
                                  : "border-transparent hover:bg-[var(--pq-muted-bg-2)]",
                            )}
                          >
                            <Checkbox id={id} checked={effective} disabled={fromRole || save.isPending} onCheckedChange={() => togglePermission(permission.code)} />
                            <Label htmlFor={id} className={cn("flex-1 cursor-pointer font-medium", fromRole && "text-[var(--pq-ink-3)]")}>{permissionLabel(permission.code)}</Label>
                            {fromRole && <Badge variant="secondary">via role</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section label="Status" hint="Inactive users keep their access but cannot sign in.">
            <div className="flex items-center gap-3 rounded-[var(--pq-r-sm)] border-2 border-[var(--pq-line-soft)] px-3.5 py-3">
              <Switch id="status-switch" checked={draftStatus === "active"} disabled={isSelf || save.isPending} onCheckedChange={(checked) => setDraftStatus(checked ? "active" : "inactive")} />
              <Label htmlFor="status-switch" className="flex-1 cursor-pointer">
                <span className="block text-[13px] font-bold text-[var(--pq-ink)]">{draftStatus === "active" ? "Active" : "Inactive"}</span>
                <span className="block text-[12px] font-normal text-[var(--pq-ink-3)]">{draftStatus === "active" ? "Can sign in and work." : "Cannot sign in, but keeps access and history."}</span>
              </Label>
            </div>
            {isSelf && <p className="small mt-2 text-[var(--pq-ink-3)]">You cannot deactivate your own account.</p>}
          </Section>
        </div>

        <DialogFooter>
          {error && <p className="err mr-auto">{error}</p>}
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
