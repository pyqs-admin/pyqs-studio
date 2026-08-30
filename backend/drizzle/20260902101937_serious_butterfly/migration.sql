CREATE TABLE "studio_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"revision_id" uuid,
	"parent_comment_id" uuid,
	"body" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "studio_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"reviewer_profile_id" uuid NOT NULL,
	"decision" text NOT NULL,
	"comment" text,
	"is_medical_review" text DEFAULT 'no' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_review_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reviewer_profile_id" uuid NOT NULL UNIQUE,
	"name" text DEFAULT 'My review queue' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_review_queue_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"queue_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"reviewer_profile_id" uuid NOT NULL,
	"status" text DEFAULT 'ASSIGNED' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"assigned_by" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD COLUMN "requires_medical_review" text DEFAULT 'no' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD COLUMN "medical_reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD COLUMN "medical_reviewed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "studio_comment_question_created_idx" ON "studio_comment" ("question_id","created_at");--> statement-breakpoint
CREATE INDEX "studio_review_revision_created_idx" ON "studio_review" ("revision_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_review_queue_item_revision_reviewer_unique" ON "studio_review_queue_item" ("revision_id","reviewer_profile_id");--> statement-breakpoint
CREATE INDEX "studio_review_queue_item_reviewer_status_position_idx" ON "studio_review_queue_item" ("reviewer_profile_id","status","position");--> statement-breakpoint
ALTER TABLE "studio_comment" ADD CONSTRAINT "studio_comment_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_comment" ADD CONSTRAINT "studio_comment_revision_id_studio_question_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_comment" ADD CONSTRAINT "studio_comment_created_by_studio_profile_id_fkey" FOREIGN KEY ("created_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_5vOqE8FweDAk_fkey" FOREIGN KEY ("medical_reviewed_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_review" ADD CONSTRAINT "studio_review_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_review" ADD CONSTRAINT "studio_review_revision_id_studio_question_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_review" ADD CONSTRAINT "studio_review_reviewer_profile_id_studio_profile_id_fkey" FOREIGN KEY ("reviewer_profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_review_queue" ADD CONSTRAINT "studio_review_queue_reviewer_profile_id_studio_profile_id_fkey" FOREIGN KEY ("reviewer_profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_review_queue_item" ADD CONSTRAINT "studio_review_queue_item_queue_id_studio_review_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "studio_review_queue"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_review_queue_item" ADD CONSTRAINT "studio_review_queue_item_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_review_queue_item" ADD CONSTRAINT "studio_review_queue_item_FGDLAsGEHvLp_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_review_queue_item" ADD CONSTRAINT "studio_review_queue_item_jkdHsOG2SH3e_fkey" FOREIGN KEY ("reviewer_profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_review_queue_item" ADD CONSTRAINT "studio_review_queue_item_assigned_by_studio_profile_id_fkey" FOREIGN KEY ("assigned_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;