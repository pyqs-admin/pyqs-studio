import { describe, expect, it } from 'vitest';
import { addCommentSchema, assignQueueSchema, requestChangesSchema } from '../../src/modules/review/review.schemas.js';

describe('review schemas', () => {
  const id = '1b81a4c9-4c03-4d73-97e2-8f70cce02323';
  it('accepts an explicit reviewer assignment', () => {
    expect(assignQueueSchema.parse({ questionId: id, revisionId: id, reviewerProfileId: id })).toMatchObject({ reviewerProfileId: id });
  });
  it('requires an explanation when requesting changes', () => {
    expect(() => requestChangesSchema.parse({ comment: '   ' })).toThrow();
  });
  it('rejects comments without a message', () => {
    expect(() => addCommentSchema.parse({ body: '' })).toThrow();
  });
});
