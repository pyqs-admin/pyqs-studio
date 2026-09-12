import "server-only";

import { createHmac } from "node:crypto";

import type { StudioSession } from "@/lib/api/types";
import { AppError } from "@/server/lib/AppError";
import { env } from "@/server/config/env";
import { questionsService } from "@/server/services/questions.service";
import { projectsService } from "@/server/services/projects.service";
import { publishRepository } from "@/server/repositories/publish.repository";

export class PublishService {
  private allow(session: StudioSession) {
    if (!session.permissions.includes("question.publish")) throw new AppError({ statusCode: 403, code: "PERMISSION_DENIED", message: "You do not have permission to publish questions." });
  }

  async preview(revisionId: string, session: StudioSession) {
    const preview = await publishRepository.preview(revisionId);
    if (!preview) throw new AppError({ statusCode: 404, code: "QUESTION_REVISION_NOT_FOUND", message: "Question revision not found." });
    await questionsService.requireQuestionAccess(preview.question.id, session);
    return preview;
  }

  async ready(session: StudioSession) { this.allow(session); return publishRepository.ready(); }

  async publish(questionId: string, session: StudioSession) {
    this.allow(session);
    const question = await questionsService.requireQuestionAccess(questionId, session);
    const preview = await publishRepository.preview((await publishRepository.ready()).find((item) => item.question.id === questionId)?.revision.id ?? "");
    if (!preview || preview.revision.status !== "APPROVED" || question.status !== "APPROVED") throw new AppError({ statusCode: 409, code: "PUBLISH_NOT_READY", message: "An approved revision is required before publishing." });
    const event = await publishRepository.publish(questionId, preview.revision.id, session.profileId, preview);
    await this.deliver(event.id);
    return event;
  }

  async publishProject(projectId: string, session: StudioSession) {
    this.allow(session);
    await projectsService.get(projectId, session);
    const items = (await publishRepository.ready()).filter((item) => item.question.projectId === projectId);
    if (!items.length) throw new AppError({ statusCode: 409, code: "PUBLISH_NOT_READY", message: "No approved questions are ready to publish in this project." });
    const results: Array<{ questionId: string; event?: unknown; error?: { code: string; message: string } }> = [];
    for (const item of items) {
      try {
        results.push({ questionId: item.question.id, event: await this.publish(item.question.id, session) });
      } catch (error) {
        results.push({ questionId: item.question.id, error: error instanceof AppError ? { code: error.code, message: error.message } : { code: "PUBLISH_FAILED", message: "Publish failed." } });
      }
    }
    return results;
  }

  async bulk(ids: string[], session: StudioSession) {
    this.allow(session);
    const results: Array<{ questionId: string; event?: unknown; error?: { code: string; message: string } }> = [];
    for (const id of ids) {
      try {
        results.push({ questionId: id, event: await this.publish(id, session) });
      } catch (error) {
        results.push({ questionId: id, error: error instanceof AppError ? { code: error.code, message: error.message } : { code: "PUBLISH_FAILED", message: "Publish failed." } });
      }
    }
    return results;
  }

  async unpublish(questionId: string, session: StudioSession) {
    this.allow(session);
    const question = await questionsService.requireQuestionAccess(questionId, session);
    if (question.status !== "PUBLISHED" || !question.publishedRevisionId) throw new AppError({ statusCode: 409, code: "UNPUBLISH_NOT_AVAILABLE", message: "Question is not published." });
    const event = await publishRepository.unpublish(questionId, question.publishedRevisionId, session.profileId, { questionId, revisionId: question.publishedRevisionId });
    await this.deliver(event.id);
    return event;
  }

  async retry(eventId: string, session: StudioSession) {
    this.allow(session);
    if (!await publishRepository.event(eventId)) throw new AppError({ statusCode: 404, code: "PUBLISH_EVENT_NOT_FOUND", message: "Publish event not found." });
    return this.deliver(eventId);
  }

  private async deliver(eventId: string) {
    const event = await publishRepository.event(eventId);
    if (!event) throw new AppError({ statusCode: 404, code: "PUBLISH_EVENT_NOT_FOUND", message: "Publish event not found." });
    if (!env.PYQS_PUBLISHING_WEBHOOK_URL || !env.PYQS_PUBLISHING_WEBHOOK_SECRET) return publishRepository.markEvent(eventId, "SKIPPED", "Publishing webhook is not configured.");
    const body = JSON.stringify({ eventId: event.id, eventType: event.eventType, payload: event.payload });
    const signature = createHmac("sha256", env.PYQS_PUBLISHING_WEBHOOK_SECRET).update(body).digest("hex");
    try {
      const response = await fetch(env.PYQS_PUBLISHING_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-pyqs-studio-signature": `sha256=${signature}` },
        body,
      });
      if (!response.ok) return publishRepository.markEvent(eventId, "FAILED", `Webhook returned ${response.status}.`);
      return publishRepository.markEvent(eventId, "DELIVERED");
    } catch (error) {
      return publishRepository.markEvent(eventId, "FAILED", error instanceof Error ? error.message : "Webhook delivery failed.");
    }
  }
}

export const publishService = new PublishService();
