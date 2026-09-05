import { describe, expect, it } from "vitest";

import { registerMediaSchema, uploadUrlSchema } from "@/server/schemas/media.schemas";

describe("media schemas", () => {
  const metadata = { sourceUrl: "https://example.com/source", creator: "Author", license: "CC-BY-4.0", attribution: "Author / CC-BY-4.0", caption: "Figure", altText: "Accessible description", annotated: "no", verificationStatus: "verified" };
  it("accepts a supported image upload request", () => expect(uploadUrlSchema.parse({ fileName: "figure.png", mimeType: "image/png", byteSize: 1024 })).toMatchObject({ mimeType: "image/png" }));
  it("requires complete licensing metadata when registering media", () => expect(registerMediaSchema.parse({ storagePath: "user/figure.png", fileUrl: "https://example.com/figure.png", fileName: "figure.png", mimeType: "image/png", byteSize: 1024, ...metadata })).toMatchObject({ verificationStatus: "verified" }));
  it("rejects unsupported upload types", () => expect(() => uploadUrlSchema.parse({ fileName: "file.pdf", mimeType: "application/pdf", byteSize: 1024 })).toThrow());
});
