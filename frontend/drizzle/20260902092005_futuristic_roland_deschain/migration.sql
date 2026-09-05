CREATE TABLE "studio_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"exam_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"session" text,
	"status" text DEFAULT 'active' NOT NULL,
	"template_code" text DEFAULT 'standard_4_option_mcq' NOT NULL,
	"target_question_count" integer,
	"deadline" timestamp with time zone,
	"project_lead_profile_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_project_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"project_role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"added_by" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_exam" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "studio_project_exam_year_session_idx" ON "studio_project" ("exam_id","year","session");--> statement-breakpoint
CREATE INDEX "studio_project_status_idx" ON "studio_project" ("status");--> statement-breakpoint
CREATE INDEX "studio_project_created_by_idx" ON "studio_project" ("created_by");--> statement-breakpoint
CREATE INDEX "studio_project_member_project_status_idx" ON "studio_project_member" ("project_id","status");--> statement-breakpoint
CREATE INDEX "studio_project_member_profile_status_idx" ON "studio_project_member" ("profile_id","status");--> statement-breakpoint
CREATE INDEX "taxonomy_exam_status_sort_idx" ON "taxonomy_exam" ("status","sort_order");--> statement-breakpoint
ALTER TABLE "studio_project" ADD CONSTRAINT "studio_project_exam_id_taxonomy_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "taxonomy_exam"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_project" ADD CONSTRAINT "studio_project_project_lead_profile_id_studio_profile_id_fkey" FOREIGN KEY ("project_lead_profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_project" ADD CONSTRAINT "studio_project_created_by_studio_profile_id_fkey" FOREIGN KEY ("created_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_project_member" ADD CONSTRAINT "studio_project_member_project_id_studio_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "studio_project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_project_member" ADD CONSTRAINT "studio_project_member_profile_id_studio_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_project_member" ADD CONSTRAINT "studio_project_member_added_by_studio_profile_id_fkey" FOREIGN KEY ("added_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;