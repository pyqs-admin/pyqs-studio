import { describe, expect, it } from "vitest";

import { createSubjectSchema, createTopicSchema, updateSimpleSchema } from "@/server/schemas/taxonomy.schemas";

describe("taxonomy schemas", () => {
  it("accepts a normalized subject", () => {
    expect(createSubjectSchema.parse({ code: "community_medicine", name: "Community Medicine", sortOrder: 3 })).toEqual({
      code: "community_medicine", name: "Community Medicine", sortOrder: 3,
    });
  });

  it("rejects non-normalized question type codes", () => {
    expect(() => createSubjectSchema.parse({ code: "Clinical Reasoning", name: "Clinical Reasoning" })).toThrow();
  });

  it("requires a chapter parent when creating a topic", () => {
    expect(() => createTopicSchema.parse({ code: "apoptosis", name: "Apoptosis" })).toThrow();
  });

  it("rejects empty taxonomy updates", () => {
    expect(() => updateSimpleSchema.parse({})).toThrow();
  });
});
