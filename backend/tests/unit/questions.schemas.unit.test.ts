import { describe, expect, it } from 'vitest';
import { createQuestionSchema } from '../../src/modules/questions/questions.schemas.js';
describe('question authoring schema', () => {
  const id = '1b81a4c9-4c03-4d73-97e2-8f70cce02323';
  const valid = { stem: 'Which is correct?', correctOption: 'A', chapterId: id, topicId: id, difficultyId: id, questionTypeIds: [id], options: ['A', 'B', 'C', 'D'].map((label) => ({ label, content: `Option ${label}` })) };
  it('accepts a complete four-option MCQ', () => expect(createQuestionSchema.parse(valid)).toMatchObject({ correctOption: 'A' }));
  it('rejects repeated option labels', () => expect(() => createQuestionSchema.parse({ ...valid, options: [{ label: 'A', content: '1' }, { label: 'A', content: '2' }, { label: 'C', content: '3' }, { label: 'D', content: '4' }] })).toThrow());
});
