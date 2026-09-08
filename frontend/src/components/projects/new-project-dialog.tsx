"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createProject, getTaxonomy } from "@/lib/api/projects";

const schema = z.object({
  name: z.string().trim().min(3, "Enter a project name."),
  examId: z.string().uuid("Select an exam."),
  year: z.coerce.number().int().min(2000).max(2100),
  session: z.string().trim().max(80).optional(),
});
type Values = z.infer<typeof schema>;

export function NewProjectDialog({ variant = "card" }: { variant?: "card" | "button" }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const taxonomy = useQuery({ queryKey: ["taxonomy"], queryFn: getTaxonomy, staleTime: 300_000 });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", examId: "", year: new Date().getFullYear(), session: "" } });
  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      form.reset();
    },
  });

  return (
    <>
      {variant === "card" ? (
        <button type="button" className="pcard new" onClick={() => setOpen(true)}>
          <span className="chip">
            <Plus className="size-[22px]" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span>New project</span>
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" /> New project
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Exam, year and session are entered here once. Every question filed in this project inherits them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 px-5 py-4">
            <Field label="Name" required>
              <Input placeholder="NEET-PG 2026 — Pathology" {...form.register("name")} />
              {form.formState.errors.name && <p className="err">{form.formState.errors.name.message}</p>}
            </Field>
            <Field label="Exam" required>
              <Select {...form.register("examId")}>
                <option value="">Select an exam…</option>
                {taxonomy.data?.exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </Select>
              {form.formState.errors.examId && <p className="err">{form.formState.errors.examId.message}</p>}
            </Field>
            <div className="row">
              <Field label="Year" required className="flex-1">
                <Input type="number" {...form.register("year")} />
              </Field>
              <Field label="Session" className="flex-1">
                <Input placeholder="May / Nov" {...form.register("session")} />
              </Field>
            </div>
            {mutation.isError && <p className="err">The project could not be created. Check your permission and try again.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={form.handleSubmit((values) => mutation.mutate(values))} disabled={mutation.isPending || taxonomy.isLoading}>Create project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
