import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { SourceBatch, SourceQuestion, SourceSubject } from './types.js';
import { questionTypeCodeMap, sourceBatches, subjectNameMap, publicQid, type MigrationExam, upscSourceBatches } from './config.js';

const here = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(here, '../../../../../../../', 'pyqs/BACKEND/drizzle/seed/questions-data');
const taxonomyRoot = resolve(here, '../../../../../../', 'pyqs-content-studio/taxonomy/subjects');
const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

type Taxonomy = { subject: { code: string; name: string }; chapters: Array<{ code: string; name: string; aliases?: string[]; topics: Array<{ code: string; name: string; aliases?: string[] }> }> };
export type TaxonomyIndex = { subjects: Map<string, Taxonomy>; chapters: Map<string, { idCode: string; name: string; subject: string }>; topics: Map<string, { idCode: string; name: string; chapterCode: string; subject: string }>; };

export type MigrationItem = {
  batch: SourceBatch; subject: SourceSubject; question: SourceQuestion; index: number; publicQid: string;
  studioSubjectName: string; chapterName: string | null; topicName: string | null;
  sourceChapterMatch: 'matched' | 'unmatched' | 'ambiguous'; sourceTopicMatch: 'matched' | 'unmatched' | 'ambiguous';
};

export type MigrationReport = {
  sourceCount: number; generatedCount: number; skippedCount: number; duplicateCount: number;
  matchedSubjects: Record<string, number>; matchedChapters: number; matchedTopics: number;
  withoutChapter: number; withoutTopic: number; ambiguousChapters: string[]; ambiguousTopics: string[];
  unmappedQuestionTypes: string[]; explanationsOmitted: true; duplicatePolicy: string;
};

export async function loadSourceBatches(exam: MigrationExam = 'neet-pg'): Promise<SourceBatch[]> {
  const loaded: SourceBatch[] = [];
  for (const batch of exam === 'neet-pg' ? sourceBatches : upscSourceBatches) {
    const suffix = `${exam === 'upsc-cms' ? 'upsc-cms/' : ''}${batch.set ? `${batch.year}/set-${batch.set}` : `${batch.year}`}`;
    const module = await import(pathToFileURL(resolve(sourceRoot, suffix, 'index.ts')).href);
    loaded.push({ ...batch, subjects: module.subjectSeeds as SourceSubject[] });
  }
  return loaded;
}

export function loadTaxonomy(): TaxonomyIndex {
  const subjects = new Map<string, Taxonomy>();
  const chapters = new Map<string, { idCode: string; name: string; subject: string }>();
  const topics = new Map<string, { idCode: string; name: string; chapterCode: string; subject: string }>();
  for (const file of readdirSync(taxonomyRoot).filter((name) => name.endsWith('.json')).sort()) {
    const item = JSON.parse(readFileSync(resolve(taxonomyRoot, file), 'utf8')) as Taxonomy;
    subjects.set(item.subject.name, item);
    for (const chapter of item.chapters) {
      chapters.set(`${item.subject.name}:${chapter.code}`, { idCode: chapter.code, name: chapter.name, subject: item.subject.name });
      for (const topic of chapter.topics) topics.set(`${item.subject.name}:${topic.code}`, { idCode: topic.code, name: topic.name, chapterCode: chapter.code, subject: item.subject.name });
    }
  }
  return { subjects, chapters, topics };
}

function matchChapter(taxonomy: Taxonomy, value: string | undefined) {
  if (!value) return { status: 'unmatched' as const, item: null };
  const matches = taxonomy.chapters.filter((item) => [item.name, ...(item.aliases ?? [])].some((name) => normalize(name) === normalize(value)));
  return matches.length === 1 ? { status: 'matched' as const, item: matches[0]! } : { status: matches.length ? 'ambiguous' as const : 'unmatched' as const, item: null };
}

function matchTopic(taxonomy: Taxonomy, question: SourceQuestion) {
  const values = question.microTopics ?? [];
  const matches = taxonomy.chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ topic, chapter }))).filter(({ topic }) => values.some((value) => [topic.name, ...(topic.aliases ?? [])].some((name) => normalize(name) === normalize(value))));
  return matches.length === 1 ? { status: 'matched' as const, item: matches[0]! } : { status: matches.length ? 'ambiguous' as const : 'unmatched' as const, item: null };
}

export function buildPlan(batches: SourceBatch[], taxonomy: TaxonomyIndex, exam: MigrationExam = 'neet-pg') {
  const items: MigrationItem[] = [];
  for (const batch of batches) for (const subject of batch.subjects) {
    const studioSubjectName = subjectNameMap[subject.subjectName];
    if (!studioSubjectName || !taxonomy.subjects.has(studioSubjectName)) throw new Error(`No Studio subject mapping for ${subject.subjectName}`);
    const subjectTaxonomy = taxonomy.subjects.get(studioSubjectName)!;
    subject.questions.forEach((question, index) => {
      const chapter = matchChapter(subjectTaxonomy, question.chapter);
      const topic = matchTopic(subjectTaxonomy, question);
      items.push({ batch, subject, question, index, studioSubjectName, publicQid: publicQid(exam, batch.year, batch.set, subject.subjectName, index), chapterName: chapter.item?.name ?? null, topicName: topic.item?.topic.name ?? null, sourceChapterMatch: chapter.status, sourceTopicMatch: topic.status });
    });
  }
  return items;
}

export function createReport(items: MigrationItem[]): MigrationReport {
  const unique = <T>(values: T[]) => [...new Set(values)];
  const report: MigrationReport = { sourceCount: items.length, generatedCount: items.length, skippedCount: 0, duplicateCount: items.length - new Set(items.map((item) => item.publicQid)).size, matchedSubjects: {}, matchedChapters: 0, matchedTopics: 0, withoutChapter: 0, withoutTopic: 0, ambiguousChapters: [], ambiguousTopics: [], unmappedQuestionTypes: [], explanationsOmitted: true, duplicatePolicy: 'publicQid is deterministic per source year/set/subject/ordinal; legitimate repeated content is retained.' };
  for (const item of items) { report.matchedSubjects[item.studioSubjectName] = (report.matchedSubjects[item.studioSubjectName] ?? 0) + 1; if (item.sourceChapterMatch === 'matched') report.matchedChapters++; else if (item.sourceChapterMatch === 'ambiguous') report.ambiguousChapters.push(`${item.publicQid}:${item.question.chapter}`); if (item.sourceTopicMatch === 'matched') report.matchedTopics++; else if (item.sourceTopicMatch === 'ambiguous') report.ambiguousTopics.push(`${item.publicQid}:${item.question.microTopics.join('|')}`); if (!item.chapterName) report.withoutChapter++; if (!item.topicName) report.withoutTopic++; for (const type of item.question.questionType ?? []) { const normalizedType = type.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); if (!questionTypeCodeMap[type] && !questionTypeCodeMap[normalizedType] && !['single_best_answer', 'clinical'].includes(type)) report.unmappedQuestionTypes.push(type); } }
  report.ambiguousChapters = unique(report.ambiguousChapters); report.ambiguousTopics = unique(report.ambiguousTopics);
  report.unmappedQuestionTypes = unique(report.unmappedQuestionTypes);
  return report;
}

export { questionTypeCodeMap };
