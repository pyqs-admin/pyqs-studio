"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ImagePlus, Upload, X } from "lucide-react";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getMedia, registerExternalImage, uploadMedia, type MediaAsset } from "@/lib/api/explanations";
import { useQuery } from "@tanstack/react-query";

const empty = { sourceUrl: "", creator: "", license: "", attribution: "", caption: "", altText: "", annotated: "no" as "yes" | "no" };
type MediaValues = typeof empty;

export function MediaUploader({ onSelect, label = "Media library" }: { onSelect?: (asset: MediaAsset) => void; label?: string }) {
  const queryClient = useQueryClient();
  const media = useQuery({ queryKey: ["media"], queryFn: getMedia });
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [values, setValues] = useState<MediaValues>(empty);
  const isUrl = Boolean(externalUrl.trim());
  const mutation = useMutation({
    mutationFn: () => {
      const imageUrl = externalUrl.trim();
      if (!file && !imageUrl) throw new Error("Choose an image to upload or paste an image URL.");
      if (!values.sourceUrl || !values.license || !values.altText) throw new Error("Source URL, licence, and alt text are required.");
      if (imageUrl) return registerExternalImage({ fileUrl: imageUrl, sourceUrl: values.sourceUrl || imageUrl, creator: values.creator || undefined, license: values.license, attribution: values.attribution || undefined, caption: values.caption || undefined, altText: values.altText, annotated: values.annotated });
      return uploadMedia(file!, values);
    },
    onSuccess: (asset) => {
      setFile(null);
      setExternalUrl("");
      setValues(empty);
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      onSelect?.(asset);
    },
  });
  const set = (key: keyof MediaValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

  return <>
    <button type="button" className="btn sm" onClick={() => setOpen(true)}><ImagePlus className="size-3.5" aria-hidden="true" /> {label}</button>
    {open && <div className="media-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="media-dialog" role="dialog" aria-modal="true" aria-labelledby="media-dialog-title">
        <div className="media-dialog-head">
          <div><p className="eyebrow">Question media</p><h2 id="media-dialog-title">Choose or upload an image</h2></div>
          <button type="button" className="btn-icon" aria-label="Close media dialog" onClick={() => setOpen(false)}><X className="size-4" /></button>
        </div>
        <div className="media-dialog-body">
          <div>
            <p className="eyebrow">Choose from library</p>
            {media.isLoading ? <div className="h-28 animate-pulse rounded-pq-lg bg-pq-muted-2" /> : media.data?.length ? <div className="media-library-grid">{media.data.map((asset) => <button type="button" className="media-library-item" key={asset.id} onClick={() => { onSelect?.(asset); setOpen(false); }}><img src={asset.fileUrl} alt="" /><span>{asset.fileName}</span>{asset.license === "unverified" && <small>Needs credit</small>}</button>)}</div> : <p className="small">No images have been uploaded yet.</p>}
          </div>
          <div className="media-dialog-divider"><span>or</span></div>
          <div>
            <p className="eyebrow">Upload and register</p>
            <label className="drop"><Upload className="size-5" aria-hidden="true" />{file ? file.name : "Drop a picture here, or click to choose"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); if (event.target.files?.[0]) setExternalUrl(""); }} /></label>
            <input className="inp mt-2" value={externalUrl} onChange={(event) => { setExternalUrl(event.target.value); if (event.target.value) setFile(null); }} placeholder="…or paste a direct image URL (https://…)" />
            <div className="row mt-3"><Field label="Source URL" className="flex-1 basis-52"><Input value={values.sourceUrl} onChange={(event) => set("sourceUrl", event.target.value)} placeholder="https://…" /></Field><Field label="Creator" className="flex-1 basis-40"><Input value={values.creator} onChange={(event) => set("creator", event.target.value)} /></Field></div>
            <div className="row mt-2"><Field label="Licence" className="flex-1 basis-40"><Input value={values.license} onChange={(event) => set("license", event.target.value)} /></Field><Field label="Attribution" className="flex-1 basis-40"><Input value={values.attribution} onChange={(event) => set("attribution", event.target.value)} /></Field></div>
            <div className="row mt-2"><Field label="Caption" className="flex-1 basis-52"><Input value={values.caption} onChange={(event) => set("caption", event.target.value)} /></Field><Field label="Alt text" className="flex-1 basis-52"><Input value={values.altText} onChange={(event) => set("altText", event.target.value)} placeholder="Descriptive alt text" /></Field></div>
            <label className="fsm mt-3"><input type="checkbox" checked={values.annotated === "yes"} onChange={(event) => set("annotated", event.target.checked ? "yes" : "no")} /> Annotated image</label>
            <button type="button" className="btn pri !mt-3" disabled={mutation.isPending || (!file && !isUrl)} onClick={() => mutation.mutate()}>{isUrl ? <ImagePlus className="size-4" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />} {mutation.isPending ? "Registering…" : isUrl ? "Import image URL" : "Upload and register"}</button>
            {mutation.isSuccess && <p className="ok mt-2"><Check className="mr-1 inline size-3.5" />Image registered. Choose it from the library.</p>}
            {mutation.isError && <p className="err mt-2">{mutation.error.message}</p>}
          </div>
        </div>
      </section>
    </div>}
  </>;
}
