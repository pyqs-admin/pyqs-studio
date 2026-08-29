CREATE TABLE "studio_explanation_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision_id" uuid NOT NULL,
	"block_type" text NOT NULL,
	"content" jsonb NOT NULL,
	"position" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_media_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"storage_path" text NOT NULL UNIQUE,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer,
	"source_url" text,
	"creator" text,
	"license" text DEFAULT 'unverified' NOT NULL,
	"attribution" text,
	"caption" text,
	"alt_text" text,
	"annotated" text DEFAULT 'no' NOT NULL,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_question" ADD COLUMN "published_revision_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_question_revision" ADD COLUMN "status" text DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_question" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint
CREATE INDEX "studio_explanation_block_revision_position_idx" ON "studio_explanation_block" ("revision_id","position");--> statement-breakpoint
CREATE INDEX "studio_media_asset_verification_idx" ON "studio_media_asset" ("verification_status");--> statement-breakpoint
ALTER TABLE "studio_explanation_block" ADD CONSTRAINT "studio_explanation_block_2f0xm1XERTni_fkey" FOREIGN KEY ("revision_id") REFERENCES "studio_question_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_explanation_block" ADD CONSTRAINT "studio_explanation_block_created_by_studio_profile_id_fkey" FOREIGN KEY ("created_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_media_asset" ADD CONSTRAINT "studio_media_asset_uploaded_by_studio_profile_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;