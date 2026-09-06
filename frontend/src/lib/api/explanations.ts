import { createMediaUploadUrl, getMedia as getMediaAction, registerExternalMedia, registerMedia } from "@/actions/media";
import { getExplanation as getExplanationAction, getReferences as getReferencesAction, replaceExplanation as replaceExplanationAction, replaceReferences as replaceReferencesAction } from "@/actions/explanations";
import { getStudentPreview as getStudentPreviewAction } from "@/actions/publish";
import { getBrowserEnv } from "@/lib/env";
import { callAction } from "./client";

export type ExplanationBlock = { id: string; blockType: "paragraph" | "heading" | "bullet_list" | "numbered_list" | "image" | "table" | "other_options" | "educational_objective" | "references" | "high_yield_callout"; content: unknown; mediaAssetId: string | null; position: number };
export type Reference = { id?: string; sourceTitle: string; sourceUrl: string; citation: string | null; position: number };
export type MediaAsset = { id: string; fileName: string; fileUrl: string; altText: string; caption: string; sourceUrl?: string | null; sourceTitle?: string | null; verificationStatus: "unverified" | "verified" | "rejected"; license: string; attribution: string };

export const getExplanation = (revisionId: string) => callAction<ExplanationBlock[]>(getExplanationAction(revisionId));
export const replaceExplanation = (revisionId: string, blocks: Omit<ExplanationBlock, "id">[]) => callAction<ExplanationBlock[]>(replaceExplanationAction(revisionId, { blocks }));
export const getReferences = (revisionId: string) => callAction<Reference[]>(getReferencesAction(revisionId));
export const replaceReferences = (revisionId: string, references: Reference[]) => callAction<Reference[]>(replaceReferencesAction(revisionId, { references: references.map(({ sourceTitle, sourceUrl, citation, position }) => ({ sourceTitle, sourceUrl, citation: citation || undefined, position })) }));
export const getMedia = () => callAction<MediaAsset[]>(getMediaAction({ limit: 100 }));

export async function uploadMedia(file: File, metadata: { sourceUrl: string; sourceTitle?: string; creator: string; license: string; attribution: string; caption: string; altText: string; annotated: "yes" | "no" }) {
  const upload = await callAction<{ storagePath: string; signedUrl: string; bucket: string; token?: string }>(createMediaUploadUrl({ fileName: file.name, mimeType: file.type, byteSize: file.size }));
  const response = await fetch(upload.signedUrl, { method: "PUT", headers: { "Content-Type": file.type, "x-upsert": "false" }, body: file });
  if (!response.ok) throw new Error("The media file could not be uploaded.");
  const publicPath = upload.storagePath.split("/").map(encodeURIComponent).join("/");
  return callAction<MediaAsset>(registerMedia({ ...metadata, storagePath: upload.storagePath, fileName: file.name, mimeType: file.type, byteSize: file.size, fileUrl: `${getBrowserEnv().NEXT_PUBLIC_STUDIO_SUPABASE_URL}/storage/v1/object/public/${upload.bucket}/${publicPath}`, verificationStatus: "unverified" }));
}

export function registerExternalImage(metadata: { fileUrl: string; sourceUrl: string; sourceTitle?: string; creator?: string; license: string; attribution?: string; caption?: string; altText: string; annotated: "yes" | "no" }) {
  return callAction<MediaAsset>(registerExternalMedia(metadata));
}

export const getStudentPreview = (revisionId: string) => callAction<{ question: { id: string; publicQid: string; questionNumber?: number }; project?: { name: string }; exam?: { name: string; code?: string }; subject?: { name: string }; chapter?: { name: string }; topic?: { name: string }; revision: { stem: string; correctOption: string }; options: { label: string; content: string }[]; explanationBlocks: ExplanationBlock[]; references: Reference[] }>(getStudentPreviewAction(revisionId));
