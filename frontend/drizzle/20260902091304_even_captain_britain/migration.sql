CREATE TABLE "taxonomy_chapter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subject_id" uuid NOT NULL,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_difficulty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_question_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_subject" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_topic" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"chapter_id" uuid NOT NULL,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "taxonomy_chapter_subject_status_sort_idx" ON "taxonomy_chapter" ("subject_id","status","sort_order");--> statement-breakpoint
CREATE INDEX "taxonomy_difficulty_status_sort_idx" ON "taxonomy_difficulty" ("status","sort_order");--> statement-breakpoint
CREATE INDEX "taxonomy_question_type_status_sort_idx" ON "taxonomy_question_type" ("status","sort_order");--> statement-breakpoint
CREATE INDEX "taxonomy_subject_status_sort_idx" ON "taxonomy_subject" ("status","sort_order");--> statement-breakpoint
CREATE INDEX "taxonomy_topic_chapter_status_sort_idx" ON "taxonomy_topic" ("chapter_id","status","sort_order");--> statement-breakpoint
ALTER TABLE "taxonomy_chapter" ADD CONSTRAINT "taxonomy_chapter_subject_id_taxonomy_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "taxonomy_subject"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD CONSTRAINT "taxonomy_topic_chapter_id_taxonomy_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "taxonomy_chapter"("id") ON DELETE RESTRICT;