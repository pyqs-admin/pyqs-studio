import { describe, expect, it } from "vitest";

import { bulkArchiveSchema, bulkAssignSchema, createSavedViewSchema, searchQuerySchema } from "@/server/schemas/operations.schemas";

const id = "1b81a4c9-4c03-4d73-97e2-8f70cce02323";

describe("studio operations schemas", () => {
  it("uses bounded defaults for cross-project search", () => {
    expect(searchQuerySchema.parse({})).toMatchObject({ limit: 30, offset: 0 });
  });
  it("accepts a named question saved view with safe filters", () => {
    expect(createSavedViewSchema.parse({ name: "My drafts", filters: { status: "DRAFT" } })).toMatchObject({ name: "My drafts" });
  });
  it("rejects duplicate IDs in a bulk assignment", () => {
    expect(() => bulkAssignSchema.parse({ questionIds: [id, id], profileId: id, assignmentType: "tutor" })).toThrow();
  });
  it("requires an explicit archive confirmation", () => {
    expect(() => bulkArchiveSchema.parse({ questionIds: [id], confirm: false })).toThrow();
    expect(bulkArchiveSchema.parse({ questionIds: [id], confirm: true }).confirm).toBe(true);
  });
});
