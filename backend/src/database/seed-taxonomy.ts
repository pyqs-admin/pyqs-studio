import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closeDb, db } from './client.js';
import { taxonomyChapter, taxonomySubject, taxonomyTopic } from './schema.js';

type TaxonomySubjectFile = {
  subject: { code: string; name: string };
  chapters: Array<{
    code: string;
    name: string;
    aliases?: string[];
    scope?: string;
    includes?: string[];
    excludes?: string[];
    overlaps?: string[];
    reference_sections?: string[];
    est_topics?: number;
    topics: Array<{
      code: string;
      name: string;
      slug: string;
      kind: string;
      aliases?: string[];
      scope?: string;
      includes?: string[];
      excludes?: string[];
      related_topics?: string[];
      secondary_subjects?: string[];
      status?: 'active' | 'archived';
    }>;
  }>;
};

const taxonomyDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../../pyqs-content-studio/taxonomy/subjects');
const arrayValue = (value: string[] | undefined) => value ?? [];

async function readTaxonomyFiles(): Promise<TaxonomySubjectFile[]> {
  const files = (await readdir(taxonomyDirectory)).filter((file) => file.endsWith('.json')).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(resolve(taxonomyDirectory, file), 'utf8')) as TaxonomySubjectFile));
}

export async function seedTaxonomy(): Promise<void> {
  const files = await readTaxonomyFiles();
  const subjectCodes = new Set(files.map((file) => file.subject.code));
  const seenTopicCodes = new Set<string>();
  const totalTopics = files.reduce((count, file) => count + file.chapters.reduce((chapterCount, chapter) => chapterCount + chapter.topics.length, 0), 0);

  console.log(`Seeding taxonomy: ${files.length} subjects, ${totalTopics} topics.`);

  for (const [subjectIndex, file] of files.entries()) {
    console.log(`[${subjectIndex + 1}/${files.length}] ${file.subject.code}: ${file.subject.name}`);
    const [subject] = await db.insert(taxonomySubject).values({
      code: file.subject.code,
      name: file.subject.name,
      sortOrder: subjectIndex + 1,
    }).onConflictDoUpdate({
      target: taxonomySubject.code,
      set: { name: file.subject.name, status: 'active', sortOrder: subjectIndex + 1 },
    }).returning();
    if (!subject) throw new Error(`Could not seed subject: ${file.subject.code}`);

    for (const [chapterIndex, chapter] of file.chapters.entries()) {
      const [chapterRow] = await db.insert(taxonomyChapter).values({
        subjectId: subject.id,
        code: chapter.code,
        name: chapter.name,
        aliases: arrayValue(chapter.aliases),
        scope: chapter.scope ?? null,
        includes: arrayValue(chapter.includes),
        excludes: arrayValue(chapter.excludes),
        overlaps: arrayValue(chapter.overlaps),
        referenceSections: arrayValue(chapter.reference_sections),
        estimatedTopics: chapter.est_topics ?? null,
        sortOrder: chapterIndex + 1,
      }).onConflictDoUpdate({
        target: taxonomyChapter.code,
        set: {
          subjectId: subject.id,
          name: chapter.name,
          aliases: arrayValue(chapter.aliases),
          scope: chapter.scope ?? null,
          includes: arrayValue(chapter.includes),
          excludes: arrayValue(chapter.excludes),
          overlaps: arrayValue(chapter.overlaps),
          referenceSections: arrayValue(chapter.reference_sections),
          estimatedTopics: chapter.est_topics ?? null,
          status: 'active',
          sortOrder: chapterIndex + 1,
        },
      }).returning();
      if (!chapterRow) throw new Error(`Could not seed chapter: ${chapter.code}`);

      for (const [topicIndex, topic] of chapter.topics.entries()) {
        if (seenTopicCodes.has(topic.code)) throw new Error(`Duplicate taxonomy topic code: ${topic.code}`);
        if (topic.secondary_subjects?.some((code) => !subjectCodes.has(code))) {
          throw new Error(`Unknown secondary subject in ${topic.code}`);
        }
        seenTopicCodes.add(topic.code);

        await db.insert(taxonomyTopic).values({
          chapterId: chapterRow.id,
          code: topic.code,
          name: topic.name,
          slug: topic.slug,
          kind: topic.kind,
          aliases: arrayValue(topic.aliases),
          scope: topic.scope ?? null,
          includes: arrayValue(topic.includes),
          excludes: arrayValue(topic.excludes),
          relatedTopics: arrayValue(topic.related_topics),
          secondarySubjects: arrayValue(topic.secondary_subjects),
          status: topic.status ?? 'active',
          sortOrder: topicIndex + 1,
        }).onConflictDoUpdate({
          target: taxonomyTopic.code,
          set: {
            chapterId: chapterRow.id,
            name: topic.name,
            slug: topic.slug,
            kind: topic.kind,
            aliases: arrayValue(topic.aliases),
            scope: topic.scope ?? null,
            includes: arrayValue(topic.includes),
            excludes: arrayValue(topic.excludes),
            relatedTopics: arrayValue(topic.related_topics),
            secondarySubjects: arrayValue(topic.secondary_subjects),
            status: topic.status ?? 'active',
            sortOrder: topicIndex + 1,
          },
        });

        if (seenTopicCodes.size % 100 === 0 || seenTopicCodes.size === totalTopics) {
          const percentage = Math.round((seenTopicCodes.size / totalTopics) * 100);
          console.log(`  Topics: ${seenTopicCodes.size}/${totalTopics} (${percentage}%)`);
        }
      }
    }
  }

  console.log(`Taxonomy seed completed: ${files.length} subject files, ${seenTopicCodes.size} topics.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void seedTaxonomy().finally(closeDb).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
