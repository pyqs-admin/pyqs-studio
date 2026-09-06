import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/server/db/client";
import { studioExplanationBlock, studioMediaAsset } from "@/server/db/schema";
import type { MediaListQuery, RegisterExternalMedia, RegisterMedia, UpdateMedia } from "@/server/schemas/media.schemas";

export class MediaRepository {
  async create(input: RegisterMedia, uploadedBy: string) { const [item] = await db.insert(studioMediaAsset).values({ ...input, uploadedBy }).returning(); return item!; }
  async createExternal(input: RegisterExternalMedia, uploadedBy: string, storagePath: string, fileName: string) { const [item] = await db.insert(studioMediaAsset).values({ ...input, storagePath, fileName, mimeType: "external", byteSize: 0, verificationStatus: "unverified", uploadedBy }).returning(); return item!; }
  async find(id: string) { const [item] = await db.select().from(studioMediaAsset).where(eq(studioMediaAsset.id, id)); return item ?? null; }
  list(query: MediaListQuery) { const conditions = [query.verificationStatus ? eq(studioMediaAsset.verificationStatus, query.verificationStatus) : undefined, query.q ? or(ilike(studioMediaAsset.fileName, `%${query.q}%`), ilike(studioMediaAsset.caption, `%${query.q}%`)) : undefined].filter((v): v is NonNullable<typeof v> => v !== undefined); return db.select().from(studioMediaAsset).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(studioMediaAsset.createdAt)).limit(query.limit).offset(query.offset); }
  async update(id: string, input: UpdateMedia) { const [item] = await db.update(studioMediaAsset).set(input).where(eq(studioMediaAsset.id, id)).returning(); return item ?? null; }
  async referenceCount(id: string) { const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(studioExplanationBlock).where(eq(studioExplanationBlock.mediaAssetId, id)); return row?.count ?? 0; }
  async remove(id: string) { const [item] = await db.delete(studioMediaAsset).where(eq(studioMediaAsset.id, id)).returning(); return item ?? null; }
}

export const mediaRepository = new MediaRepository();
