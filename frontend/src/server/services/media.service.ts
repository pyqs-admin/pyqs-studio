import "server-only";

import crypto from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type { StudioSession } from "@/lib/api/types";
import { AppError } from "@/server/lib/AppError";
import { env } from "@/server/config/env";
import { studioSupabaseAdmin } from "@/server/db/supabase";
import type { MediaListQuery, RegisterExternalMedia, RegisterMedia, UpdateMedia } from "@/server/schemas/media.schemas";
import { mediaRepository } from "@/server/repositories/media.repository";

export class MediaService {
  private static readonly MAX_EXTERNAL_BYTES = 10 * 1024 * 1024;
  private static readonly MAX_EXTERNAL_REDIRECTS = 3;
  private static readonly FETCH_TIMEOUT_MS = 12_000;
  private static readonly IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    return this.withSignedUrl(await mediaRepository.create(input, session.profileId));
  }

  async registerExternal(input: RegisterExternalMedia, session: StudioSession) {
    this.require(session, "media.upload");
    const downloaded = await this.downloadExternalImage(input.fileUrl);
    const storagePath = `${session.profileId}/${Date.now()}-${crypto.randomUUID()}-${downloaded.fileName}`;
    const { error } = await studioSupabaseAdmin.storage.from(env.STUDIO_MEDIA_BUCKET).upload(storagePath, downloaded.body, { contentType: downloaded.mimeType, upsert: false });
    if (error) throw new AppError({ statusCode: 502, code: "MEDIA_IMPORT_FAILED", message: "Could not store the remote image in Studio storage." });
    const publicPath = storagePath.split("/").map(encodeURIComponent).join("/");
    return this.withSignedUrl(await mediaRepository.create({ ...input, creator: input.creator ?? "External source", attribution: input.attribution ?? input.sourceTitle ?? "External image", caption: input.caption ?? "", storagePath, fileName: downloaded.fileName, mimeType: downloaded.mimeType, byteSize: downloaded.body.byteLength, fileUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${env.STUDIO_MEDIA_BUCKET}/${publicPath}`, verificationStatus: "unverified" }, session.profileId));
  }

  private async downloadExternalImage(initialUrl: string): Promise<{ body: Buffer; mimeType: "image/jpeg" | "image/png" | "image/webp"; fileName: string }> {
    let url = initialUrl;
    for (let redirect = 0; redirect <= MediaService.MAX_EXTERNAL_REDIRECTS; redirect += 1) {
      const parsed = this.safeExternalUrl(url);
      await this.assertPublicHost(parsed);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MediaService.FETCH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(parsed, { signal: controller.signal, redirect: "manual", headers: { Accept: "image/jpeg,image/png,image/webp" } });
      } catch {
        throw new AppError({ statusCode: 400, code: "MEDIA_URL_UNREACHABLE", message: "The image URL could not be fetched." });
      } finally {
        clearTimeout(timeout);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirect === MediaService.MAX_EXTERNAL_REDIRECTS) throw new AppError({ statusCode: 400, code: "MEDIA_REDIRECT_LIMIT", message: "The image URL has too many redirects." });
        url = new URL(location, parsed).toString();
        continue;
      }
      if (!response.ok) throw new AppError({ statusCode: 400, code: "MEDIA_URL_UNREACHABLE", message: "The image URL returned an error." });
      const mimeType = response.headers.get("content-type")?.split(";", 1)[0]?.toLowerCase();
      if (!MediaService.IMAGE_TYPES.has(mimeType ?? "")) throw new AppError({ statusCode: 400, code: "MEDIA_TYPE_NOT_ALLOWED", message: "Only JPEG, PNG, and WebP images are allowed." });
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > MediaService.MAX_EXTERNAL_BYTES) throw new AppError({ statusCode: 413, code: "MEDIA_TOO_LARGE", message: "The image must be 10 MB or smaller." });
      if (!response.body) throw new AppError({ statusCode: 400, code: "MEDIA_EMPTY", message: "The image response was empty." });
      const reader = response.body.getReader();
      const chunks: Buffer[] = []; let total = 0;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          total += chunk.value.byteLength;
          if (total > MediaService.MAX_EXTERNAL_BYTES) throw new AppError({ statusCode: 413, code: "MEDIA_TOO_LARGE", message: "The image must be 10 MB or smaller." });
          chunks.push(Buffer.from(chunk.value));
        }
      } finally { reader.releaseLock(); }
      const body = Buffer.concat(chunks);
      if (!this.matchesImageSignature(body, mimeType!)) throw new AppError({ statusCode: 400, code: "MEDIA_CONTENT_INVALID", message: "The URL did not return a valid JPEG, PNG, or WebP image." });
      const pathname = new URL(url).pathname.split("/").pop() || "external-image";
      const fileName = pathname.replaceAll(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180) || "external-image";
      return { body, mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp", fileName };
    }
    throw new AppError({ statusCode: 400, code: "MEDIA_REDIRECT_LIMIT", message: "The image URL has too many redirects." });
  }

  private safeExternalUrl(value: string): string {
    let parsed: URL;
    try { parsed = new URL(value); } catch { throw new AppError({ statusCode: 400, code: "INVALID_MEDIA_URL", message: "Enter a valid image URL." }); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new AppError({ statusCode: 400, code: "INVALID_MEDIA_URL", message: "Image URL must be a public HTTP or HTTPS URL." });
    return parsed.toString();
  }

  private async assertPublicHost(value: string): Promise<void> {
    const hostname = new URL(value).hostname;
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) throw new AppError({ statusCode: 400, code: "PRIVATE_MEDIA_HOST", message: "Private and local image hosts are not allowed." });
    let addresses: string[];
    try { addresses = isIP(hostname) ? [hostname] : (await lookup(hostname, { all: true })).map((entry) => entry.address); } catch { throw new AppError({ statusCode: 400, code: "MEDIA_HOST_UNREACHABLE", message: "The image host could not be resolved." }); }
    if (!addresses.length || addresses.some((address) => this.isPrivateIp(address))) throw new AppError({ statusCode: 400, code: "PRIVATE_MEDIA_HOST", message: "Private and local image hosts are not allowed." });
  }

  private matchesImageSignature(body: Buffer, mimeType: string): boolean {
    if (mimeType === "image/jpeg") return body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
    if (mimeType === "image/png") return body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    return body.length >= 12 && body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP";
  }

  private isPrivateIp(address: string): boolean {
    if (address.includes(":")) {
      const normalized = address.toLowerCase();
      return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.");
    }
    const octets = address.split(".").map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }

  async list(query: MediaListQuery, session: StudioSession) { this.require(session, "media.view"); const assets = await mediaRepository.list(query); return Promise.all(assets.map((asset) => this.withSignedUrl(asset))); }

  async get(id: string, session: StudioSession) { this.require(session, "media.view"); const item = await mediaRepository.find(id); if (!item) throw new AppError({ statusCode: 404, code: "MEDIA_NOT_FOUND", message: "Media asset not found." }); return this.withSignedUrl(item); }

  async update(id: string, input: UpdateMedia, session: StudioSession) { this.require(session, "media.edit"); const item = await mediaRepository.update(id, input); if (!item) throw new AppError({ statusCode: 404, code: "MEDIA_NOT_FOUND", message: "Media asset not found." }); return item; }

  private async withSignedUrl<T extends { storagePath: string; fileUrl: string }>(asset: T): Promise<T> {
    if (asset.storagePath.startsWith("external:")) return asset;
    const { data, error } = await studioSupabaseAdmin.storage.from(env.STUDIO_MEDIA_BUCKET).createSignedUrl(asset.storagePath, 3600);
    if (error || !data?.signedUrl) throw new AppError({ statusCode: 502, code: "MEDIA_URL_FAILED", message: "Could not create a temporary image URL." });
    return { ...asset, fileUrl: data.signedUrl };
  }

  async remove(id: string, session: StudioSession) {
    this.require(session, "media.delete");
    const existing = await mediaRepository.find(id);
    if (!existing) throw new AppError({ statusCode: 404, code: "MEDIA_NOT_FOUND", message: "Media asset not found." });
    if (await mediaRepository.referenceCount(id)) throw new AppError({ statusCode: 409, code: "MEDIA_IN_USE", message: "Referenced media cannot be deleted." });
    if (!existing.storagePath.startsWith("external:")) {
      const { error } = await studioSupabaseAdmin.storage.from(env.STUDIO_MEDIA_BUCKET).remove([existing.storagePath]);
      if (error) throw new AppError({ statusCode: 502, code: "MEDIA_DELETE_FAILED", message: "Could not delete media from storage." });
    }
    await mediaRepository.remove(id);
  }
}

export const mediaService = new MediaService();
