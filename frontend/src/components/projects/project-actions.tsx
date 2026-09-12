"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project settings</DialogTitle>
            <DialogDescription>Exam and year remain fixed project context.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 px-5 py-4">
            <Field label="Name">
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Session">
              <Input value={session} onChange={(event) => setSession(event.target.value)} />
            </Field>
            {mutation.isError && <p className="err">Changes could not be saved. Please try again.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => mutation.mutate({ name, session: session || null })} disabled={mutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
