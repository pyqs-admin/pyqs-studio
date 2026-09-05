import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StudioSession } from "@/lib/api/types";

const mocks = vi.hoisted(() => ({
  requireQuestionAccess: vi.fn(),
  details: vi.fn(),
  findRevision: vi.fn(),
  decide: vi.fn(),
  ensureQueue: vi.fn(),
  listQueue: vi.fn(),
}));

vi.mock("@/server/services/questions.service", () => ({ questionsService: { requireQuestionAccess: mocks.requireQuestionAccess } }));
vi.mock("@/server/repositories/questions.repository", () => ({ questionsRepository: { details: mocks.details, findRevision: mocks.findRevision } }));
vi.mock("@/server/repositories/review.repository", () => ({ reviewRepository: { decide: mocks.decide, ensureQueue: mocks.ensureQueue, listQueue: mocks.listQueue } }));

import { reviewService } from "@/server/services/review.service";

const session = (permissions: string[]): StudioSession => ({ profileId: "profile-1", email: "reviewer@example.com", displayName: "Reviewer", roles: ["reviewer"], permissions });

describe("ReviewService", () => {
  beforeEach(() => vi.resetAllMocks());
  it("denies access to a reviewer queue without question.review", async () => {
    await expect(reviewService.queue(session([]))).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });
  it("requires medical.review before approving a medically flagged revision", async () => {
    mocks.requireQuestionAccess.mockResolvedValue({ id: "question-1", status: "UNDER_REVIEW" });
    mocks.details.mockResolvedValue({ revision: { id: "revision-1", requiresMedicalReview: "yes" } });
    await expect(reviewService.approve("question-1", session(["question.review"]))).rejects.toMatchObject({ code: "MEDICAL_REVIEW_REQUIRED" });
    expect(mocks.decide).not.toHaveBeenCalled();
  });
});
