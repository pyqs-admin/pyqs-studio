CREATE TABLE "studio_question_secondary_topic" (
	"revision_id" uuid,
	"topic_id" uuid,
	"role" text DEFAULT 'DISEASE' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "studio_question_secondary_topic_pkey" PRIMARY KEY("revision_id","topic_id")
);
--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD COLUMN "question_type_2_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD COLUMN "presentation" text;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD COLUMN "difficulty_rationale" text;--> statement-breakpoint
CREATE INDEX "studio_question_secondary_topic_revision_idx" ON "studio_question_secondary_topic" ("revision_id","position");--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD CONSTRAINT "studio_question_revision_tiyMGpW6MOEG_fkey" FOREIGN KEY ("question_type_2_id") REFERENCES "taxonomy_question_type"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_secondary_topic" ADD CONSTRAINT "studio_question_secondary_topic_6Uq9fB6lFRbK_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_question_secondary_topic" ADD CONSTRAINT "studio_question_secondary_topic_topic_id_taxonomy_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "taxonomy_topic"("id") ON DELETE RESTRICT;
