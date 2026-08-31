CREATE TABLE "studio_publish_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"payload" jsonb NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"delivered_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "studio_publish_event_status_created_idx" ON "studio_publish_event" ("status","created_at");--> statement-breakpoint
ALTER TABLE "studio_publish_event" ADD CONSTRAINT "studio_publish_event_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_publish_event" ADD CONSTRAINT "studio_publish_event_T4cgUD1xNFPN_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_publish_event" ADD CONSTRAINT "studio_publish_event_created_by_studio_profile_id_fkey" FOREIGN KEY ("created_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;