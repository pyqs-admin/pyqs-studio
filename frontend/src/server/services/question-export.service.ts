import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { BorderStyle, Document, HeadingLevel, ImageRun, PageBreak, Packer, Paragraph, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType } from "docx";
import { imageSize } from "image-size";
import sharp from "sharp";

import type { StudioSession } from "@/lib/api/types";
import { env } from "@/server/config/env";
import { studioSupabaseAdmin } from "@/server/db/supabase";
import { AppError } from "@/server/lib/AppError";
import { mediaRepository } from "@/server/repositories/media.repository";
import { questionsRepository } from "@/server/repositories/questions.repository";
import { taxonomyRepository } from "@/server/repositories/taxonomy.repository";
import { questionsService } from "@/server/services/questions.service";
import { projectsService } from "@/server/services/projects.service";

type ExportOptions = {
  projectId: string;
  subjectId?: string;
  questionIds?: string[];
  includeImages: boolean;
  includeExplanations: boolean;
  title?: string;
};

type MediaData = { buffer: Buffer; mimeType: string; fileName: string };
type ImageResolver = (url: string) => Promise<MediaData | null>;

const PAGE_SIZE = 100;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const BODY_SPACING = { before: 0, after: 100 };
const QUESTION_SPACING = { before: 240, after: 140 };
const SECTION_SPACING = { before: 220, after: 120 };
const ANSWER_SPACING = { before: 140, after: 180 };
const BLANK_SPACING = { before: 0, after: 120 };

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  if (value && typeof value === "object") return Object.values(value).map(textValue).filter(Boolean).join("\n");
  return value == null ? "" : String(value);
}

function safeFileName(value: string) {
  return value.trim().replaceAll(/[^a-zA-Z0-9._-]+/g, "-").replaceAll(/^-+|-+$/g, "").slice(0, 120) || "questions";
}

function withoutOptionLabel(label: string, value: string) {
  return value.replace(new RegExp(`^\\s*${label}\\s*[).:\\-]\\s*`, "i"), "").trim();
}

function imageType(mimeType: string): "jpg" | "png" | "gif" | "bmp" | null {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/bmp") return "bmp";
  return null;
}

function imageParagraph(media: MediaData, caption?: string): Paragraph[] {
  const type = imageType(media.mimeType);
  if (!type) return [new Paragraph({ children: [new TextRun(`[Image omitted: ${media.fileName}; DOCX supports JPEG/PNG/GIF/BMP]`)] })];
  let width = 560;
  let height = 360;
  try {
    const dimensions = imageSize(media.buffer);
    if (dimensions.width && dimensions.height) {
      const scale = Math.min(560 / dimensions.width, 360 / dimensions.height, 1);
      width = Math.max(1, Math.round(dimensions.width * scale));
      height = Math.max(1, Math.round(dimensions.height * scale));
    }
  } catch {
    // Keep a safe fallback size for older or malformed image metadata.
  }
  const paragraphs = [new Paragraph({ children: [new ImageRun({ data: media.buffer, type, transformation: { width, height } })] })];
  if (caption) paragraphs.push(new Paragraph({ children: [new TextRun({ text: caption, italics: true, color: "666666" })] }));
  return paragraphs;
}

function imageRun(media: MediaData) {
  const type = imageType(media.mimeType);
  if (!type) return null;
  let width = 560;
  let height = 360;
  try {
    const dimensions = imageSize(media.buffer);
    if (dimensions.width && dimensions.height) {
      const scale = Math.min(560 / dimensions.width, 360 / dimensions.height, 1);
      width = Math.max(1, Math.round(dimensions.width * scale));
      height = Math.max(1, Math.round(dimensions.height * scale));
    }
  } catch {
    // Keep a safe fallback size for images without readable metadata.
  }
  return new ImageRun({ data: media.buffer, type, transformation: { width, height } });
}

function textParagraph(value: unknown, options?: { bold?: boolean; italic?: boolean; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] }) {
  const text = textValue(value).trim();
  if (!text) return null;
  return new Paragraph({ heading: options?.heading, spacing: BODY_SPACING, children: [new TextRun({ text, bold: options?.bold, italics: options?.italic })] });
}

function blankParagraph() {
  return new Paragraph({ text: "", spacing: BLANK_SPACING });
}

function tableRows(value: unknown): string[][] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as { headers?: unknown; rows?: unknown };
    const headers = Array.isArray(record.headers) ? [record.headers.map(String)] : [];
    const rows = Array.isArray(record.rows) ? record.rows.map((row) => Array.isArray(row) ? row.map(String) : [String(row)]) : [];
    return [...headers, ...rows];
  }
  return textValue(value).split("\n").filter((line) => line.includes("|")).map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim())).filter((row) => !row.every((cell) => /^[-: ]+$/.test(cell)));
}

async function richTextParagraphs(value: unknown, resolveImage: ImageResolver): Promise<Paragraph[]> {
  const text = textValue(value);
  const pattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  const paragraphs: Paragraph[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const before = text.slice(cursor, match.index).trim();
    if (before) paragraphs.push(new Paragraph({ spacing: BODY_SPACING, text: before }));
    const media = await resolveImage(match[2]!);
    if (media) paragraphs.push(...imageParagraph(media, match[1]));
    else paragraphs.push(new Paragraph({ spacing: BODY_SPACING, text: `[Image unavailable: ${match[1] || match[2]}]` }));
    cursor = match.index + match[0].length;
  }
  const after = text.slice(cursor).trim();
  if (after) paragraphs.push(new Paragraph({ spacing: BODY_SPACING, text: after }));
  return paragraphs;
}

async function docxTable(value: unknown, resolveImage: ImageResolver) {
  const rows = tableRows(value);
  if (rows.length < 2) return null;
  const columns = Math.max(...rows.map((row) => row.length));
  const cellRows = await Promise.all(rows.map(async (row, rowIndex) => Promise.all(Array.from({ length: columns }, async (_, columnIndex) => {
    const children = await richTextParagraphs(row[columnIndex] ?? "", resolveImage);
    return new TableCell({ verticalAlign: VerticalAlign.CENTER, shading: rowIndex === 0 ? { fill: "F2F2F2" } : undefined, children: children.length ? children : [new Paragraph({ text: "" })] });
  }))));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "808080" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "808080" }, left: { style: BorderStyle.SINGLE, size: 4, color: "808080" }, right: { style: BorderStyle.SINGLE, size: 4, color: "808080" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" } },
    rows: cellRows.map((row) => new TableRow({ children: row })),
  });
}

export class QuestionExportService {
  async createDocx(options: ExportOptions, session: StudioSession) {
    const project = await projectsService.get(options.projectId, session);
    const subject = options.subjectId ? await taxonomyRepository.findSubject(options.subjectId) : null;
    if (options.subjectId && !subject) throw new AppError({ statusCode: 404, code: "SUBJECT_NOT_FOUND", message: "Subject not found." });

    const rows: Array<{ question: Awaited<ReturnType<typeof questionsRepository.exportDetails>>; subjectName: string }> = [];
    if (options.questionIds?.length) {
      for (const questionId of options.questionIds) {
        const details = await questionsRepository.exportDetails(questionId);
        if (!details || details.question.projectId !== options.projectId) continue;
        if (options.subjectId && details.revision.subjectId !== options.subjectId) continue;
        await questionsService.requireQuestionAccess(questionId, session);
        rows.push({ question: details, subjectName: subject?.name ?? (await taxonomyRepository.findSubject(details.revision.subjectId))?.name ?? "Subject" });
      }
    } else {
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await questionsService.list({ projectId: options.projectId, subjectId: options.subjectId, limit: PAGE_SIZE, offset }, session);
        for (const row of page) {
          const details = await questionsRepository.exportDetails(row.question.id);
          if (details) rows.push({ question: details, subjectName: subject?.name ?? (await taxonomyRepository.findSubject(details.revision.subjectId))?.name ?? "Subject" });
        }
        if (page.length < PAGE_SIZE) break;
      }
    }

    rows.sort((left, right) => (left.question?.question.questionNumber ?? 0) - (right.question?.question.questionNumber ?? 0));
    const mediaCache = new Map<string, MediaData | null>();
    const children: Array<Paragraph | Table> = [];
    const documentTitle = options.title?.trim() || (subject ? subject.name : project.project.name);
    children.push(new Paragraph({ text: documentTitle, heading: HeadingLevel.TITLE }));
    if (subject) children.push(new Paragraph({ children: [new PageBreak()] }));

    for (const [index, item] of rows.entries()) {
      const details = item.question;
      if (!details) continue;
      const { question, revision, options: answerOptions } = details;
      if (index > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
      const questionText = `Q ${question.questionNumber || index + 1}. ${revision.stem}`;
      if (/!\[[^\]]*\]\(https?:\/\//.test(revision.stem)) children.push(...await richTextParagraphs(questionText, (url) => this.getRemoteMedia(url, mediaCache)));
      else children.push(new Paragraph({ spacing: QUESTION_SPACING, children: [new TextRun({ text: questionText, bold: true })] }));

      if (options.includeImages) {
        for (const mediaId of Array.isArray(revision.stemMediaAssetIds) ? revision.stemMediaAssetIds.filter((value): value is string => typeof value === "string") : []) {
          const media = await this.getMedia(mediaId, mediaCache);
        if (media) children.push(...imageParagraph(media));
        }
      }

      for (const answerOption of answerOptions) {
        const optionText = `${answerOption.label}) ${withoutOptionLabel(answerOption.label, answerOption.content)}`;
        if (/!\[[^\]]*\]\(https?:\/\//.test(answerOption.content)) children.push(...await richTextParagraphs(optionText, (url) => this.getRemoteMedia(url, mediaCache)));
        else {
          const optionParagraph = textParagraph(optionText);
          if (optionParagraph) children.push(optionParagraph);
        }
        if (options.includeImages && answerOption.mediaAssetId) {
          const media = await this.getMedia(answerOption.mediaAssetId, mediaCache);
          if (media) children.push(...imageParagraph(media));
        }
      }
      const answerOption = answerOptions.find((option) => option.label === revision.correctOption);
      const answerText = answerOption ? withoutOptionLabel(answerOption.label, answerOption.content) : revision.correctOption;
      children.push(new Paragraph({ spacing: ANSWER_SPACING, children: [new TextRun({ text: "Answer:", bold: true }), new TextRun(` ${revision.correctOption}) ${answerText}`)] }));
      children.push(blankParagraph());

      const [chapter, topic, difficulty, questionType] = await Promise.all([
        revision.chapterId ? taxonomyRepository.findChapter(revision.chapterId) : Promise.resolve(null),
        revision.topicId ? taxonomyRepository.findTopic(revision.topicId) : Promise.resolve(null),
        taxonomyRepository.findDifficulty(revision.difficultyId),
        details.questionTypes[0] ? taxonomyRepository.findQuestionType(details.questionTypes[0].questionTypeId) : Promise.resolve(null),
      ]);

      const explanationBlocks = details.explanationBlocks.filter((block) => !["other_options", "educational_objective", "references"].includes(block.blockType));
      const otherOptionBlocks = details.explanationBlocks.filter((block) => block.blockType === "other_options");
      const objectiveBlocks = details.explanationBlocks.filter((block) => block.blockType === "educational_objective");
      const referenceBlocks = details.explanationBlocks.filter((block) => block.blockType === "references");

      // Keep the document schema stable for RAG ingestion: every section
      // header is emitted, even when its content has not been authored yet.
      children.push(new Paragraph({ spacing: SECTION_SPACING, children: [new TextRun({ text: "Explanation:", bold: true })] }));
      if (options.includeExplanations) {
        for (const block of explanationBlocks) {
          if (block.blockType === "image" && options.includeImages && block.mediaAssetId) {
            const media = await this.getMedia(block.mediaAssetId, mediaCache);
            if (media) children.push(...imageParagraph(media, textValue(block.content)));
            continue;
          }
          if (block.blockType === "table") {
            const table = await docxTable(block.content, (url) => this.getRemoteMedia(url, mediaCache));
            if (table) children.push(table);
            else children.push(blankParagraph());
            continue;
          }
          if (block.blockType === "bullet_list" || block.blockType === "numbered_list") {
            const values = Array.isArray(block.content) ? block.content.map(textValue) : textValue(block.content).split("\n").filter(Boolean);
            for (const [valueIndex, value] of values.entries()) children.push(...await richTextParagraphs(block.blockType === "numbered_list" ? `${valueIndex + 1}. ${value}` : `• ${value}`, (url) => this.getRemoteMedia(url, mediaCache)));
            continue;
          }
          const content = textValue(block.content).trim();
          if (!content) continue;
          if (block.blockType === "heading") children.push(new Paragraph({ spacing: SECTION_SPACING, children: [new TextRun({ text: content, bold: true })] }));
          else if (block.blockType === "high_yield_callout") children.push(new Paragraph({ spacing: SECTION_SPACING, children: [new TextRun({ text: "Key Concept:", bold: true }), new TextRun(` ${content}`)] }));
          else children.push(...await richTextParagraphs(content, (url) => this.getRemoteMedia(url, mediaCache)));
          children.push(blankParagraph());
        }
      }

      if (options.includeExplanations) {
        for (const block of otherOptionBlocks) {
          if (!Array.isArray(block.content)) continue;
          for (const option of block.content) {
            if (!option || typeof option !== "object") continue;
            const value = option as { option?: string; title?: string; explanation?: string };
            const optionLabel = String(value.option ?? "");
            children.push(...await richTextParagraphs(`Option ${optionLabel}. ${withoutOptionLabel(optionLabel, `${value.title ?? ""}${value.explanation ? ` ${value.explanation}` : ""}`)}`, (url) => this.getRemoteMedia(url, mediaCache)));
          }
        }
      }

      children.push(new Paragraph({ spacing: SECTION_SPACING, children: [new TextRun({ text: "Educational Objective:", bold: true })] }));
      if (options.includeExplanations) {
        for (const block of objectiveBlocks) {
          const content = textValue(block.content).trim();
          if (content) children.push(...await richTextParagraphs(content, (url) => this.getRemoteMedia(url, mediaCache)));
        }
      }

      children.push(new Paragraph({ spacing: SECTION_SPACING, children: [new TextRun({ text: "References:", bold: true })] }));
      if (options.includeExplanations) {
        for (const block of referenceBlocks) {
          const content = textValue(block.content).trim();
          if (content) children.push(...await richTextParagraphs(content, (url) => this.getRemoteMedia(url, mediaCache)));
        }
        for (const reference of details.references) children.push(new Paragraph({ spacing: BODY_SPACING, text: `${reference.sourceTitle}${reference.citation ? ` — ${reference.citation}` : ""} (${reference.sourceUrl})` }));
      }

      for (const [label, value] of [["Chapter:", chapter?.name ?? ""], ["Topic (pyt):", topic?.name ?? ""], ["Difficulty:", difficulty?.name ?? ""], ["Question Type:", questionType?.name ?? ""]] as const) {
        children.push(new Paragraph({ spacing: BODY_SPACING, children: [new TextRun({ text: label, bold: true }), new TextRun(` ${value}`)] }));
      }
    }

    const buffer = await Packer.toBuffer(new Document({
      styles: {
        default: {
          document: {
            run: { font: "Arial", size: 22 },
            paragraph: { keepNext: false, keepLines: false },
          },
        },
      },
      // docx expects page dimensions and margins in twentieths of a point (twips),
      // not EMUs. These match the reference NEET PG documents: A4, 1-inch margins.
      sections: [{ properties: { page: { size: { width: 11909, height: 16834 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
    }));
    const fileName = `${safeFileName(documentTitle)}.docx`;
    return { buffer, fileName, mimeType: DOCX_MIME };
  }

  private async getMedia(id: string, cache: Map<string, MediaData | null>) {
    if (cache.has(id)) return cache.get(id) ?? null;
    const asset = await mediaRepository.find(id);
    if (!asset) { cache.set(id, null); return null; }
    try {
      let buffer: Buffer;
      if (asset.storagePath.startsWith("external:")) {
        const response = await fetch(asset.fileUrl);
        if (!response.ok) throw new Error(`Could not fetch ${asset.fileName}`);
        buffer = Buffer.from(await response.arrayBuffer());
      } else {
        const downloaded = await studioSupabaseAdmin.storage.from(env.STUDIO_MEDIA_BUCKET).download(asset.storagePath);
        if (downloaded.error || !downloaded.data) throw downloaded.error ?? new Error("Media download failed");
        buffer = Buffer.from(await downloaded.data.arrayBuffer());
      }
      let mimeType = asset.mimeType;
      if (mimeType === "image/webp") {
        buffer = await sharp(buffer).png().toBuffer();
        mimeType = "image/png";
      }
      const result = { buffer, mimeType, fileName: asset.fileName };
      cache.set(id, result);
      return result;
    } catch {
      cache.set(id, null);
      return null;
    }
  }

  private async getRemoteMedia(url: string, cache: Map<string, MediaData | null>) {
    const key = `url:${url}`;
    if (cache.has(key)) return cache.get(key) ?? null;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Invalid image URL");
      const addresses = isIP(parsed.hostname) ? [parsed.hostname] : (await lookup(parsed.hostname, { all: true })).map((entry) => entry.address);
      if (!addresses.length || addresses.some((address) => this.isPrivateIp(address))) throw new Error("Private image host");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      let response: Response;
      try {
        response = await fetch(parsed, { signal: controller.signal, headers: { Accept: "image/jpeg,image/png,image/webp,image/gif,image/bmp" } });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok || !response.body) throw new Error("Image fetch failed");
      const mimeType = response.headers.get("content-type")?.split(";", 1)[0]?.toLowerCase() ?? "";
      if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]).has(mimeType)) throw new Error("Unsupported image type");
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > 10 * 1024 * 1024) throw new Error("Image too large");
      const reader = response.body.getReader();
      const chunks: Buffer[] = [];
      let total = 0;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          total += chunk.value.byteLength;
          if (total > 10 * 1024 * 1024) throw new Error("Image too large");
          chunks.push(Buffer.from(chunk.value));
        }
      } finally {
        reader.releaseLock();
      }
      let buffer = Buffer.concat(chunks);
      let normalizedMimeType = mimeType;
      if (normalizedMimeType === "image/webp") {
        buffer = await sharp(buffer).png().toBuffer();
        normalizedMimeType = "image/png";
      }
      const media = { buffer, mimeType: normalizedMimeType, fileName: parsed.pathname.split("/").pop() || "embedded-image" };
      cache.set(key, media);
      return media;
    } catch {
      cache.set(key, null);
      return null;
    }
  }

  private isPrivateIp(address: string) {
    if (address.includes(":")) {
      const normalized = address.toLowerCase();
      return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.");
    }
    const octets = address.split(".").map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
}

export const questionExportService = new QuestionExportService();
