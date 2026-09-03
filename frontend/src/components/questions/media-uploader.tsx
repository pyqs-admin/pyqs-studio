"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { uploadMedia } from "@/lib/api/explanations";

const empty = { sourceUrl: "", creator: "", license: "", attribution: "", caption: "", altText: "", annotated: "no" as "yes" | "no" };
type MediaValues = typeof empty;

export function MediaUploader() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [values, setValues] = useState<MediaValues>(empty);
  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Choose an image to upload.");
      return uploadMedia(file, values);
    },
    onSuccess: () => {
      setFile(null);
      setValues(empty);
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
  const set = (key: keyof MediaValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <Card title="Media">
      <label className="drop">
        <Upload className="size-5" aria-hidden="true" />
        {file ? file.name : "Drop a picture here, or click to choose"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="row mt-3">
        <Field label="Source URL" className="flex-1 basis-52">
          <Input value={values.sourceUrl} onChange={(event) => set("sourceUrl", event.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Creator" className="flex-1 basis-40">
          <Input value={values.creator} onChange={(event) => set("creator", event.target.value)} />
        </Field>
      </div>
      <div className="row mt-2">
        <Field label="Licence" className="flex-1 basis-40">
          <Input value={values.license} onChange={(event) => set("license", event.target.value)} />
        </Field>
        <Field label="Attribution" className="flex-1 basis-40">
          <Input value={values.attribution} onChange={(event) => set("attribution", event.target.value)} />
        </Field>
      </div>
      <div className="row mt-2">
        <Field label="Caption" className="flex-1 basis-52">
          <Input value={values.caption} onChange={(event) => set("caption", event.target.value)} />
        </Field>
      </div>
      <div className="f mt-2">
        <label>Alt text</label>
        <Input value={values.altText} onChange={(event) => set("altText", event.target.value)} placeholder="Descriptive alt text" />
      </div>
      <label className="fsm mt-3">
        <input type="checkbox" checked={values.annotated === "yes"} onChange={(event) => set("annotated", event.target.checked ? "yes" : "no")} /> Annotated image
      </label>
      <button type="button" className="btn w-full justify-center !mt-3" disabled={mutation.isPending || !file} onClick={() => mutation.mutate()}>
        <Upload className="size-4" aria-hidden="true" /> {mutation.isPending ? "Uploading…" : "Upload and register"}
      </button>
      {mutation.isError && <p className="err mt-2">{mutation.error.message}</p>}
    </Card>
  );
}
