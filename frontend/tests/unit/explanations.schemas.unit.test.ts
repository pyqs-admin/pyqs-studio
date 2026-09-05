import { describe, expect, it } from "vitest";

import { replaceReferencesSchema, updateBlockSchema } from "@/server/schemas/explanations.schemas";

describe("explanation schemas", () => {
  it("accepts a complete ordered reference list", () => {
    expect(replaceReferencesSchema.parse({ references: [{ sourceTitle: "Harrison", sourceUrl: "https://example.com/harrison", citation: "21st ed.", position: 0 }] })).toMatchObject({ references: [{ position: 0 }] });
  });
  it("rejects duplicate reference positions", () => {
    expect(() => replaceReferencesSchema.parse({ references: [{ sourceTitle: "One", sourceUrl: "https://example.com/1", position: 0 }, { sourceTitle: "Two", sourceUrl: "https://example.com/2", position: 0 }] })).toThrow();
  });
  it("requires at least one changed field when editing a block", () => {
    expect(() => updateBlockSchema.parse({})).toThrow();
  });
});
