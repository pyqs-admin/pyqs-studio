import { eq, and, max } from 'drizzle-orm';
import { closeDb, db } from '../../client.js';
import { studioAuditLog, studioProfile, studioProject, studioQuestion, studioQuestionOption, studioQuestionRevision, studioQuestionRevisionType, taxonomyChapter, taxonomyDifficulty, taxonomyExam, taxonomyQuestionType, taxonomySubject, taxonomyTopic } from '../../schema.js';
import { MIGRATION_PROFILE_EMAIL, MIGRATION_PROFILE_ID, questionTypeCodeMap, type MigrationExam } from './config.js';
import { buildPlan, createReport, loadSourceBatches, loadTaxonomy } from './transform.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const examSlug = (process.argv.includes('--exam') ? process.argv[process.argv.indexOf('--exam') + 1] : 'neet-pg') as MigrationExam;
if (!['neet-pg', 'upsc-cms'].includes(examSlug)) throw new Error(`Unsupported exam: ${examSlug}`);
const examLabel = examSlug === 'neet-pg' ? 'NEET PG' : 'UPSC CMS';
const reportPath = resolve(process.cwd(), `migration-reports/${examSlug}.json`);
const code = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const BATCH_SIZE = 50;

async function main() {
  const items = buildPlan(await loadSourceBatches(examSlug), loadTaxonomy(), examSlug);
  const report = createReport(items);
  await db.insert(studioProfile).values({ id: MIGRATION_PROFILE_ID, email: MIGRATION_PROFILE_EMAIL, displayName: 'PYQS NEET PG migration' }).onConflictDoNothing();
  const [exam] = await db.select().from(taxonomyExam).where(eq(taxonomyExam.code, examSlug === 'neet-pg' ? 'neet_pg' : 'upsc_cms'));
  if (!exam) throw new Error(`Studio taxonomy exam ${examSlug} is missing; run db:seed first.`);
  const [difficultyFallback] = await db.select().from(taxonomyDifficulty).where(eq(taxonomyDifficulty.code, 'medium'));
  const typeRows = await db.select().from(taxonomyQuestionType);
  const typeByCode = new Map(typeRows.map((row) => [row.code, row]));
  const subjectRows = await db.select().from(taxonomySubject);
  const subjectByName = new Map(subjectRows.map((row) => [row.name, row]));
  const chapterRows = await db.select().from(taxonomyChapter); const chapterByName = new Map(chapterRows.map((row) => [`${row.subjectId}:${row.name}`, row]));
  const topicRows = await db.select().from(taxonomyTopic); const topicByName = new Map(topicRows.map((row) => [`${row.chapterId}:${row.name}`, row]));
  let inserted = 0; let existing = 0; let questionNumberByProject = new Map<string, number>();
  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    const batch = items.slice(start, start + BATCH_SIZE);
    const batchNumber = Math.floor(start / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    console.log(`[${examLabel}] Batch ${batchNumber}/${totalBatches} starting (${batch.length} questions)`);
    await db.transaction(async (tx) => {
      for (const item of batch) {
    const subject = subjectByName.get(item.studioSubjectName); if (!subject) throw new Error(`Missing Studio subject ${item.studioSubjectName}`);
    const session = item.batch.set ? `Set ${item.batch.set}` : null;
    let [project] = await tx.select().from(studioProject).where(and(eq(studioProject.examId, exam.id), eq(studioProject.year, item.batch.year), session ? eq(studioProject.session, session) : undefined));
    if (!project) { [project] = await tx.insert(studioProject).values({ name: `${examLabel} ${item.batch.year}${session ? ` ${session}` : ''}`, examId: exam.id, year: item.batch.year, session, targetQuestionCount: null, createdBy: MIGRATION_PROFILE_ID }).returning(); }
    if (!project) throw new Error(`Could not create project for ${item.batch.year}/${session ?? 'default'}`);
    const [already] = await tx.select({ id: studioQuestion.id }).from(studioQuestion).where(eq(studioQuestion.publicQid, item.publicQid)); if (already) { existing++; continue; }
    let number = questionNumberByProject.get(project.id); if (number === undefined) { const [row] = await tx.select({ value: max(studioQuestion.questionNumber) }).from(studioQuestion).where(eq(studioQuestion.projectId, project.id)); number = row?.value ?? 0; } number += 1; questionNumberByProject.set(project.id, number);
    const chapter = item.chapterName ? chapterByName.get(`${subject.id}:${item.chapterName}`) : undefined;
    const topic = item.topicName && chapter ? topicByName.get(`${chapter.id}:${item.topicName}`) : undefined;
    const sourceTypes = item.question.questionType ?? []; const mappedTypes = sourceTypes.map((value) => typeByCode.get(questionTypeCodeMap[value] ?? code(value))).filter((value): value is NonNullable<typeof value> => Boolean(value));
    const primaryType = mappedTypes[0] ?? typeByCode.get('single_best_answer'); if (!primaryType) throw new Error(`No question type fallback in Studio taxonomy for ${item.publicQid}`);
    const difficultyRow = await tx.select().from(taxonomyDifficulty).where(eq(taxonomyDifficulty.code, item.question.difficulty[0] ?? 'medium')).then((rows) => rows[0] ?? difficultyFallback); if (!difficultyRow) throw new Error(`No difficulty for ${item.publicQid}`);
    const [question] = await tx.insert(studioQuestion).values({ projectId: project.id, publicQid: item.publicQid, questionNumber: number, createdBy: MIGRATION_PROFILE_ID, status: 'DRAFT' }).returning();
    if (!question) throw new Error(`Could not insert ${item.publicQid}`);
    const [revision] = await tx.insert(studioQuestionRevision).values({ questionId: question.id, revisionNumber: 1, status: 'DRAFT', stem: item.question.description, correctOption: ['A', 'B', 'C', 'D'][item.question.options.findIndex((option) => option.isCorrect)]!, subjectId: subject.id, chapterId: chapter?.id ?? null, topicId: topic?.id ?? null, difficultyId: difficultyRow.id, presentation: sourceTypes.includes('clinical_reasoning') ? 'VIGNETTE' : 'DIRECT', stemMediaAssetIds: [] as string[], createdBy: MIGRATION_PROFILE_ID }).returning();
    if (!revision) throw new Error(`Could not create revision for ${item.publicQid}`);
    await tx.insert(studioQuestionOption).values(item.question.options.map((option, index) => ({ revisionId: revision.id, label: ['A', 'B', 'C', 'D'][index]!, content: option.text, mediaAssetId: null, position: index })));
    await tx.insert(studioQuestionRevisionType).values([...new Set([primaryType.id, ...mappedTypes.slice(1).map((row) => row.id)])].map((questionTypeId) => ({ revisionId: revision.id, questionTypeId })));
    await tx.insert(studioAuditLog).values({ projectId: project.id, questionId: question.id, revisionId: revision.id, actorProfileId: MIGRATION_PROFILE_ID, action: 'question_imported_from_pyqs', metadata: { sourceQuestionId: item.publicQid, sourceTitle: item.question.title, sourcePages: item.question.sourcePages, sourceImages: item.question.questionImages, sourceReferences: item.question.references, sourceHashTags: item.question.hashTags, sourceMicroTopics: item.question.microTopics, sourceDifficulty: item.question.difficulty, sourceQuestionTypes: item.question.questionType ?? [], explanationsOmitted: true } });
    inserted++;
      }
    });
    console.log(`[${examLabel}] Batch ${batchNumber}/${totalBatches} complete — inserted: ${inserted}, existing: ${existing}`);
  }
  report.duplicateCount = report.duplicateCount + existing; report.generatedCount = inserted + existing; await mkdir(resolve(process.cwd(), 'migration-reports'), { recursive: true }); await writeFile(reportPath, JSON.stringify({ ...report, insertedCount: inserted, existingCount: existing }, null, 2) + '\n'); console.log(JSON.stringify({ ...report, insertedCount: inserted, existingCount: existing }, null, 2));
}
void main().finally(closeDb).catch((error) => { console.error(error); process.exitCode = 1; });
