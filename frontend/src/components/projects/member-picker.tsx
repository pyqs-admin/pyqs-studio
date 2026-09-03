"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { addProjectMember, getStudioUsers } from "@/lib/api/projects";

export function MemberPicker({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [role, setRole] = useState("tutor");
  const users = useQuery({ queryKey: ["studio", "users"], queryFn: getStudioUsers, enabled: open });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => addProjectMember(projectId, { profileId, projectRole: role }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
      setOpen(false);
      setProfileId("");
    },
  });

  if (!open) {
    return (
      <button type="button" className="btn sm mt-3.5 w-full justify-center" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" aria-hidden="true" /> Add member
      </button>
    );
  }
  return (
    <div className="mt-3.5 space-y-2 border-t-2 border-pq-line-soft pt-3.5">
      <div className="f">
        <label>Who</label>
        <Select aria-label="Studio user" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
          <option value="">Choose a person…</option>
          {users.data?.filter((user) => user.status === "active").map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName} · {user.email}
            </option>
          ))}
        </Select>
      </div>
      <div className="f">
        <label>Project role</label>
        <Select aria-label="Project role" value={role} onChange={(event) => setRole(event.target.value)}>
          {["tutor", "reviewer", "explanation_editor", "project_admin", "viewer"].map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </div>
      {mutation.isError && <p className="err">This user could not be added to the project.</p>}
      <div className="addrow">
        <button type="button" className="btn sm pri" disabled={!profileId || mutation.isPending} onClick={() => mutation.mutate()}>
          Add
        </button>
        <button type="button" className="btn sm ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
