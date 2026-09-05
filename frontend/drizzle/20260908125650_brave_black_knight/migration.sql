ALTER TABLE "studio_question" ADD COLUMN "question_number" integer;--> statement-breakpoint
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "project_id" ORDER BY "created_at", "id")::integer AS "number"
  FROM "studio_question"
)
UPDATE "studio_question" AS question
SET "question_number" = ranked."number"
FROM ranked
WHERE question."id" = ranked."id";--> statement-breakpoint
ALTER TABLE "studio_question" ALTER COLUMN "question_number" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "studio_question_project_number_unique" ON "studio_question" ("project_id","question_number");
