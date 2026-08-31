CREATE TABLE "studio_question_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"question_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"assignment_type" text NOT NULL,
	"assigned_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_saved_view" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"resource" text DEFAULT 'questions' NOT NULL,
	"filters" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "studio_question_assignment_question_type_unique" ON "studio_question_assignment" ("question_id","assignment_type");--> statement-breakpoint
CREATE INDEX "studio_question_assignment_profile_type_idx" ON "studio_question_assignment" ("profile_id","assignment_type");--> statement-breakpoint
CREATE UNIQUE INDEX "studio_saved_view_profile_resource_name_unique" ON "studio_saved_view" ("profile_id","resource","name");--> statement-breakpoint
CREATE INDEX "studio_saved_view_profile_resource_updated_idx" ON "studio_saved_view" ("profile_id","resource","updated_at");--> statement-breakpoint
ALTER TABLE "studio_question_assignment" ADD CONSTRAINT "studio_question_assignment_question_id_studio_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "studio_question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_question_assignment" ADD CONSTRAINT "studio_question_assignment_profile_id_studio_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_question_assignment" ADD CONSTRAINT "studio_question_assignment_assigned_by_studio_profile_id_fkey" FOREIGN KEY ("assigned_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_saved_view" ADD CONSTRAINT "studio_saved_view_profile_id_studio_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "studio_profile"("id") ON DELETE CASCADE;