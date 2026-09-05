"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { mediaService } from "@/server/services/media.service";
import {
  mediaIdParamsSchema,
  mediaListQuerySchema,
  registerMediaSchema,
  updateMediaSchema,
  uploadUrlSchema,
} from "@/server/schemas/media.schemas";

export async function createMediaUploadUrl(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return mediaService.uploadUrl(uploadUrlSchema.parse(input), session);
  });
}

export async function registerMedia(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return mediaService.register(registerMediaSchema.parse(input), session);
  });
}

export async function getMedia(query: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return mediaService.list(mediaListQuerySchema.parse(query ?? {}), session);
  });
}

export async function getMediaAsset(mediaId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = mediaIdParamsSchema.parse({ mediaId });
    return mediaService.get(params.mediaId, session);
  });
}

export async function updateMediaAsset(mediaId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = mediaIdParamsSchema.parse({ mediaId });
    return mediaService.update(params.mediaId, updateMediaSchema.parse(input), session);
  });
}

export async function deleteMediaAsset(mediaId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = mediaIdParamsSchema.parse({ mediaId });
    await mediaService.remove(params.mediaId, session);
  });
}
