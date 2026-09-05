import "server-only";

import crypto from "node:crypto";

import type { StudioSession } from "@/lib/api/types";
import { AppError } from "@/server/lib/AppError";
import { env } from "@/server/config/env";
import { studioSupabaseAdmin } from "@/server/db/supabase";
import type { MediaListQuery, RegisterMedia, UpdateMedia } from "@/server/schemas/media.schemas";
import { mediaRepository } from "@/server/repositories/media.repository";

export class MediaService {
  private require(session: StudioSession, permission: string) {
    if (!session.permissions.includes(permission)) throw new AppError({ statusCode: 403, code: "PERMISSION_DENIED", message: "You do not have permission to manage media." });
  }

  async uploadUrl(input: { fileName: string; mimeType: string }, session: StudioSession) {
    this.require(session, "media.upload");
    const safeName = input.fileName.replaceAll(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${session.profileId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const { data, error } = await studioSupabaseAdmin.storage.from(env.STUDIO_MEDIA_BUCKET).createSignedUploadUrl(storagePath);
    if (error || !data) throw new AppError({ statusCode: 502, code: "MEDIA_UPLOAD_URL_FAILED", message: "Could not create an upload URL." });
    return { storagePath, token: data.token, signedUrl: data.signedUrl, bucket: env.STUDIO_MEDIA_BUCKET };
  }

  async register(input: RegisterMedia, session: StudioSession) {
    this.require(session, "media.upload");
    if (!input.storagePath.startsWith(`${session.profileId}/`)) throw new AppError({ statusCode: 403, code: "MEDIA_PATH_DENIED", message: "Media must be registered from the uploader path." });
    return mediaRepository.create(input, session.profileId);
  }

  async list(query: MediaListQuery, session: StudioSession) { this.require(session, "media.view"); return mediaRepository.list(query); }

  async get(id: string, session: StudioSession) { this.require(session, "media.view"); const item = await mediaRepository.find(id); if (!item) throw new AppError({ statusCode: 404, code: "MEDIA_NOT_FOUND", message: "Media asset not found." }); return item; }

  async update(id: string, input: UpdateMedia, session: StudioSession) { this.require(session, "media.edit"); const item = await mediaRepository.update(id, input); if (!item) throw new AppError({ statusCode: 404, code: "MEDIA_NOT_FOUND", message: "Media asset not found." }); return item; }

  async remove(id: string, session: StudioSession) {
    this.require(session, "media.delete");
    const existing = await mediaRepository.find(id);
    if (!existing) throw new AppError({ statusCode: 404, code: "MEDIA_NOT_FOUND", message: "Media asset not found." });
    if (await mediaRepository.referenceCount(id)) throw new AppError({ statusCode: 409, code: "MEDIA_IN_USE", message: "Referenced media cannot be deleted." });
    const { error } = await studioSupabaseAdmin.storage.from(env.STUDIO_MEDIA_BUCKET).remove([existing.storagePath]);
    if (error) throw new AppError({ statusCode: 502, code: "MEDIA_DELETE_FAILED", message: "Could not delete media from storage." });
    await mediaRepository.remove(id);
  }
}

export const mediaService = new MediaService();
