"use server";

import { requireUser } from "@/server/auth/session";
import { authService } from "@/server/services/auth.service";
import { runAction } from "@/server/lib/action-result";
import { taxonomyService } from "@/server/services/taxonomy.service";
import {
  chapterParamsSchema,
  createChapterSchema,
  createSimpleSchema,
  createSubjectSchema,
  createTopicSchema,
  idParamsSchema,
  subjectParamsSchema,
  updateChapterSchema,
  updateSimpleSchema,
  updateSubjectSchema,
  updateTopicSchema,
} from "@/server/schemas/taxonomy.schemas";

export async function getTaxonomy() {
  return runAction(async () => {
    await requireUser();
    return taxonomyService.getTaxonomy();
  });
}

export async function getTaxonomyOptions() {
  return runAction(async () => {
    await requireUser();
    return taxonomyService.getTaxonomyOptions();
  });
}

export async function getSubject(subjectId: string) {
  return runAction(async () => {
    await requireUser();
    const params = subjectParamsSchema.parse({ subjectId });
    return taxonomyService.getSubject(params.subjectId);
  });
}

export async function getChapter(chapterId: string) {
  return runAction(async () => {
    await requireUser();
    const params = chapterParamsSchema.parse({ chapterId });
    return taxonomyService.getChapter(params.chapterId);
  });
}

export async function getTopic(topicId: string) {
  return runAction(async () => {
    await requireUser();
    const params = idParamsSchema.parse({ id: topicId });
    return taxonomyService.getTopic(params.id);
  });
}

export async function listSubjects() {
  return runAction(async () => {
    await requireUser();
    return (await taxonomyService.getTaxonomy()).subjects;
  });
}

export async function listChapters(subjectId: string) {
  return runAction(async () => {
    await requireUser();
    const subject = subjectParamsSchema.parse({ subjectId });
    return (await taxonomyService.getTaxonomy()).chapters.filter((item) => item.subjectId === subject.subjectId);
  });
}

export async function listTopics(chapterId: string) {
  return runAction(async () => {
    await requireUser();
    const chapter = chapterParamsSchema.parse({ chapterId });
    return (await taxonomyService.getTaxonomy()).topics.filter((item) => item.chapterId === chapter.chapterId);
  });
}

export async function listDifficulties() {
  return runAction(async () => {
    await requireUser();
    return (await taxonomyService.getTaxonomy()).difficulties;
  });
}

export async function listExams() {
  return runAction(async () => {
    await requireUser();
    return (await taxonomyService.getTaxonomy()).exams;
  });
}

export async function listQuestionTypes() {
  return runAction(async () => {
    await requireUser();
    return (await taxonomyService.getTaxonomy()).questionTypes;
  });
}

async function requireManage() {
  const session = await requireUser();
  authService.requirePermission(session, "taxonomy.manage");
  return session;
}

export async function createSubject(input: unknown) {
  return runAction(async () => {
    await requireManage();
    return taxonomyService.createSubject(createSubjectSchema.parse(input));
  });
}

export async function updateSubject(id: string, input: unknown) {
  return runAction(async () => {
    await requireManage();
    const params = idParamsSchema.parse({ id });
    return taxonomyService.updateSubject(params.id, updateSubjectSchema.parse(input));
  });
}

export async function createChapter(input: unknown) {
  return runAction(async () => {
    await requireManage();
    return taxonomyService.createChapter(createChapterSchema.parse(input));
  });
}

export async function updateChapter(id: string, input: unknown) {
  return runAction(async () => {
    await requireManage();
    const params = idParamsSchema.parse({ id });
    return taxonomyService.updateChapter(params.id, updateChapterSchema.parse(input));
  });
}

export async function createTopic(input: unknown) {
  return runAction(async () => {
    await requireManage();
    return taxonomyService.createTopic(createTopicSchema.parse(input));
  });
}

export async function updateTopic(id: string, input: unknown) {
  return runAction(async () => {
    await requireManage();
    const params = idParamsSchema.parse({ id });
    return taxonomyService.updateTopic(params.id, updateTopicSchema.parse(input));
  });
}

export async function createDifficulty(input: unknown) {
  return runAction(async () => {
    await requireManage();
    return taxonomyService.createDifficulty(createSimpleSchema.parse(input));
  });
}

export async function updateDifficulty(id: string, input: unknown) {
  return runAction(async () => {
    await requireManage();
    const params = idParamsSchema.parse({ id });
    return taxonomyService.updateDifficulty(params.id, updateSimpleSchema.parse(input));
  });
}

export async function createExam(input: unknown) {
  return runAction(async () => {
    await requireManage();
    return taxonomyService.createExam(createSimpleSchema.parse(input));
  });
}

export async function updateExam(id: string, input: unknown) {
  return runAction(async () => {
    await requireManage();
    const params = idParamsSchema.parse({ id });
    return taxonomyService.updateExam(params.id, updateSimpleSchema.parse(input));
  });
}

export async function createQuestionType(input: unknown) {
  return runAction(async () => {
    await requireManage();
    return taxonomyService.createQuestionType(createSimpleSchema.parse(input));
  });
}

export async function updateQuestionType(id: string, input: unknown) {
  return runAction(async () => {
    await requireManage();
    const params = idParamsSchema.parse({ id });
    return taxonomyService.updateQuestionType(params.id, updateSimpleSchema.parse(input));
  });
}
