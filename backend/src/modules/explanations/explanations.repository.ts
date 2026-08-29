import { asc, eq } from 'drizzle-orm';
import { db } from '../../database/client.js';
import { studioAuditLog, studioExplanationBlock } from '../../database/schema.js';
import type { ReplaceBlocks } from './explanations.schemas.js';
export class ExplanationsRepository {
  list(revisionId: string) { return db.select().from(studioExplanationBlock).where(eq(studioExplanationBlock.revisionId, revisionId)).orderBy(asc(studioExplanationBlock.position)); }
  async replace(revisionId: string, questionId: string, input: ReplaceBlocks, profileId: string) { return db.transaction(async (tx) => { await tx.delete(studioExplanationBlock).where(eq(studioExplanationBlock.revisionId, revisionId)); const rows = input.blocks.length ? await tx.insert(studioExplanationBlock).values(input.blocks.map((block) => ({ ...block, revisionId, createdBy: profileId }))).returning() : []; await tx.insert(studioAuditLog).values({ questionId, revisionId, actorProfileId: profileId, action: 'explanation_blocks_saved', metadata: { blockCount: rows.length } }); return rows; }); }
}
export const explanationsRepository = new ExplanationsRepository();
