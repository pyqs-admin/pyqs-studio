import { z } from "zod";

const id = z.string().uuid();
const text = (max: number) => z.string().trim().min(1).max(max);
const metadata = { sourceUrl: z.string().url().max(2_000), sourceTitle: text(300).optional(), creator: text(300), license: text(120), attribution: text(1_000), caption: text(2_000), altText: text(2_000), annotated: z.enum(["yes", "no"]), verificationStatus: z.enum(["unverified", "verified", "rejected"]) };
export const uploadUrlSchema = z.object({ fileName: text(255), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), byteSize: z.number().int().positive().max(20 * 1024 * 1024) }).strict();
export const registerMediaSchema = z.object({ storagePath: text(700), fileUrl: z.string().url().max(2_000), fileName: text(255), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), byteSize: z.number().int().positive().max(20 * 1024 * 1024), ...metadata }).strict();
export const mediaIdParamsSchema = z.object({ mediaId: id }).strict();
export const updateMediaSchema = z.object({ ...metadata }).partial().refine((value) => Object.keys(value).length > 0);
export const registerExternalMediaSchema = z.object({ fileUrl: z.string().url().max(2_000), sourceUrl: z.string().url().max(2_000), sourceTitle: text(300).optional(), creator: z.string().trim().max(300).optional(), license: text(120), attribution: z.string().trim().max(1_000).optional(), caption: z.string().trim().max(2_000).optional(), altText: text(2_000), annotated: z.enum(["yes", "no"]) }).strict();
export const mediaListQuerySchema = z.object({ q: z.string().trim().min(1).max(200).optional(), verificationStatus: metadata.verificationStatus.optional(), limit: z.coerce.number().int().min(1).max(100).default(30), offset: z.coerce.number().int().min(0).default(0) }).strict();
export type RegisterMedia = z.infer<typeof registerMediaSchema>;
export type UpdateMedia = z.infer<typeof updateMediaSchema>;
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
