import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudioSession } from '../../src/modules/auth/auth.types.js';

const mocks = vi.hoisted(() => ({
  requireQuestionAccess: vi.fn(),
  details: vi.fn(),
  findRevision: vi.fn(),
  decide: vi.fn(),
  ensureQueue: vi.fn(),
  listQueue: vi.fn(),
}));

vi.mock('../../src/modules/questions/questions.service.js', () => ({ questionsService: { requireQuestionAccess: mocks.requireQuestionAccess } }));
vi.mock('../../src/modules/questions/questions.repository.js', () => ({ questionsRepository: { details: mocks.details, findRevision: mocks.findRevision } }));
vi.mock('../../src/modules/review/review.repository.js', () => ({ reviewRepository: { decide: mocks.decide, ensureQueue: mocks.ensureQueue, listQueue: mocks.listQueue } }));

import { reviewService } from '../../src/modules/review/review.service.js';

const session = (permissions: string[]): StudioSession => ({ profileId: 'profile-1', email: 'reviewer@example.com', displayName: 'Reviewer', roles: ['reviewer'], permissions });

describe('ReviewService', () => {
  beforeEach(() => vi.resetAllMocks());
  it('denies access to a reviewer queue without question.review', async () => {
    await expect(reviewService.queue(session([]))).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });
  it('requires medical.review before approving a medically flagged revision', async () => {
    mocks.requireQuestionAccess.mockResolvedValue({ id: 'question-1', status: 'UNDER_REVIEW' });
    mocks.details.mockResolvedValue({ revision: { id: 'revision-1', requiresMedicalReview: 'yes' } });
    await expect(reviewService.approve('question-1', session(['question.review']))).rejects.toMatchObject({ code: 'MEDICAL_REVIEW_REQUIRED' });
    expect(mocks.decide).not.toHaveBeenCalled();
  });
});
