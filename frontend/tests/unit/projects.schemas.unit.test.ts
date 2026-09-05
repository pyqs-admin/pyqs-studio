import { describe, expect, it } from "vitest";

import { createMemberBodySchema, createProjectBodySchema } from "@/server/schemas/projects.schemas";

describe("project schemas", () => {
  const examId = "1b81a4c9-4c03-4d73-97e2-8f70cce02323";

  it("accepts a project with the standard MCQ template", () => {
    expect(createProjectBodySchema.parse({ name: "INI-CET November 2026", examId, year: 2026, session: "November" })).toMatchObject({
      name: "INI-CET November 2026", examId, year: 2026, session: "November", templateCode: "standard_4_option_mcq",
    });
  });

  it("accepts only defined project membership roles", () => {
    expect(createMemberBodySchema.parse({ profileId: examId, projectRole: "reviewer" })).toEqual({ profileId: examId, projectRole: "reviewer" });
    expect(() => createMemberBodySchema.parse({ profileId: examId, projectRole: "admin" })).toThrow();
  });
});
