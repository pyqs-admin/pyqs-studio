CREATE TABLE "studio_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid,
	"question_id" uuid,
	"revision_id" uuid,
	"actor_profile_id" uuid NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"public_qid" text NOT NULL UNIQUE,
	"project_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_question_contributor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"contribution_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_question_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision_id" uuid NOT NULL,
	"label" text NOT NULL,
	"content" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_question_revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"stem" text NOT NULL,
	"correct_option" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"difficulty_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_question_revision_type" (
	"revision_id" uuid,
	"question_type_id" uuid,
	CONSTRAINT "studio_question_revision_type_pkey" PRIMARY KEY("revision_id","question_type_id")
);
--> statement-breakpoint
CREATE INDEX "studio_audit_log_question_created_idx" ON "studio_audit_log" ("question_id","created_at");--> statement-breakpoint
CREATE INDEX "studio_question_project_status_idx" ON "studio_question" ("project_id","status");--> statement-breakpoint
CREATE INDEX "studio_question_option_revision_idx" ON "studio_question_option" ("revision_id","position");--> statement-breakpoint
CREATE INDEX "studio_question_revision_question_idx" ON "studio_question_revision" ("question_id","revision_number");--> statement-breakpoint
ALTER TABLE "studio_audit_log" ADD CONSTRAINT "studio_audit_log_project_id_studio_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "studio_project"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_audit_log" ADD CONSTRAINT "studio_audit_log_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_audit_log" ADD CONSTRAINT "studio_audit_log_revision_id_studio_question_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_audit_log" ADD CONSTRAINT "studio_audit_log_actor_profile_id_studio_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question" ADD CONSTRAINT "studio_question_project_id_studio_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "studio_project"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question" ADD CONSTRAINT "studio_question_created_by_studio_profile_id_fkey" FOREIGN KEY ("created_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_contributor" ADD CONSTRAINT "studio_question_contributor_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_question_contributor" ADD CONSTRAINT "studio_question_contributor_profile_id_studio_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_option" ADD CONSTRAINT "studio_question_option_dZbCdEYAwUzl_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_subject_id_taxonomy_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "taxonomy_subject"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_chapter_id_taxonomy_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "taxonomy_chapter"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_topic_id_taxonomy_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "taxonomy_topic"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_wt6zso0w8onj_fkey" FOREIGN KEY ("difficulty_id") REFERENCES "taxonomy_difficulty"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_created_by_studio_profile_id_fkey" FOREIGN KEY ("created_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_revision_type" ADD CONSTRAINT "studio_question_revision_type_SStjBnRiVlGC_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_question_revision_type" ADD CONSTRAINT "studio_question_revision_type_LcaavZh6h2K6_fkey" FOREIGN KEY ("question_type_id") REFERENCES "taxonomy_question_type"("id") ON DELETE RESTRICT;