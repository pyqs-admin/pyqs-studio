ALTER TABLE "taxonomy_chapter" ADD COLUMN "aliases" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_chapter" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "taxonomy_chapter" ADD COLUMN "includes" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_chapter" ADD COLUMN "excludes" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_chapter" ADD COLUMN "overlaps" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_chapter" ADD COLUMN "reference_sections" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_chapter" ADD COLUMN "estimated_topics" integer;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "kind" text;--> statement-breakpoint
UPDATE "taxonomy_topic" SET "slug" = "code" WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "taxonomy_topic" SET "kind" = 'concept' WHERE "kind" IS NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ALTER COLUMN "kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "aliases" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "includes" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "excludes" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "related_topics" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxonomy_topic" ADD COLUMN "secondary_subjects" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
