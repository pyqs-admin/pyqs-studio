"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type Project, updateProject } from "@/lib/api/projects";

export function ProjectActions({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [session, setSession] = useState(project.session ?? "");
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: { name?: string; session?: string | null; status?: "active" | "archived" }) => updateProject(project.id, body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["projects"] });
      client.invalidateQueries({ queryKey: ["projects", project.id] });
      setOpen(false);
    },
  });
  const archive = () => {
    if (window.confirm(`Archive ${project.name}? It will remain in the audit history but be removed from active work.`)) mutation.mutate({ status: "archived" });
  };

  return (
    <>
      <button type="button" className="btn sm" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" aria-hidden="true" /> Settings
      </button>
      {project.status === "active" && (
        <button type="button" className="btn sm" onClick={archive} disabled={mutation.isPending}>
          <Archive className="size-3.5" aria-hidden="true" /> Archive
        </button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Project settings"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <span className="grow" />
            <button
              type="button"
              className="btn pri"
              onClick={() => mutation.mutate({ name, session: session || null })}
              disabled={mutation.isPending}
            >
              Save
            </button>
          </>
        }
      >
        <p className="hint">Exam and year remain fixed project context.</p>
        <Field label="Name" className="mb-2.5">
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Session">
          <Input value={session} onChange={(event) => setSession(event.target.value)} />
        </Field>
        {mutation.isError && <p className="err mt-2">Changes could not be saved. Please try again.</p>}
      </Dialog>
    </>
  );
}
