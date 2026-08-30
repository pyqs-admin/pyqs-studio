ALTER TABLE "studio_explanation_block" ADD COLUMN "media_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "studio_media_asset" ADD COLUMN "file_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_media_asset" ALTER COLUMN "byte_size" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_explanation_block" ADD CONSTRAINT "studio_explanation_block_wDPscQ8UvkRD_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "studio_media_asset"("id") ON DELETE RESTRICT;