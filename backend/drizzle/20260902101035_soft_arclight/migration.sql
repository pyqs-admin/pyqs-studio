CREATE TABLE "studio_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision_id" uuid NOT NULL,
	"source_title" text NOT NULL,
	"source_url" text NOT NULL,
	"citation" text,
	"position" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "studio_question_contributor_question_profile_type_unique" ON "studio_question_contributor" ("question_id","profile_id","contribution_type");--> statement-breakpoint
CREATE INDEX "studio_reference_revision_position_idx" ON "studio_reference" ("revision_id","position");--> statement-breakpoint
ALTER TABLE "studio_reference" ADD CONSTRAINT "studio_reference_revision_id_studio_question_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_reference" ADD CONSTRAINT "studio_reference_created_by_studio_profile_id_fkey" FOREIGN KEY ("created_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;