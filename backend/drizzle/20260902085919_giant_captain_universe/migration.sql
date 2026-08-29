CREATE TABLE "studio_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_profile" (
	"id" uuid PRIMARY KEY,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_profile_permission" (
	"profile_id" uuid,
	"permission_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_profile_permission_pkey" PRIMARY KEY("profile_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "studio_profile_role" (
	"profile_id" uuid,
	"role_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_profile_role_pkey" PRIMARY KEY("profile_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "studio_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_role_permission" (
	"role_id" uuid,
	"permission_id" uuid,
	CONSTRAINT "studio_role_permission_pkey" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE INDEX "studio_profile_status_idx" ON "studio_profile" ("status");--> statement-breakpoint
CREATE INDEX "studio_profile_permission_permission_id_idx" ON "studio_profile_permission" ("permission_id");--> statement-breakpoint
CREATE INDEX "studio_profile_role_role_id_idx" ON "studio_profile_role" ("role_id");--> statement-breakpoint
CREATE INDEX "studio_role_permission_permission_id_idx" ON "studio_role_permission" ("permission_id");--> statement-breakpoint
ALTER TABLE "studio_profile_permission" ADD CONSTRAINT "studio_profile_permission_profile_id_studio_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_profile_permission" ADD CONSTRAINT "studio_profile_permission_nMNJGFdZLqRL_fkey" FOREIGN KEY ("permission_id") REFERENCES "studio_permission"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_profile_role" ADD CONSTRAINT "studio_profile_role_profile_id_studio_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "studio_profile"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_profile_role" ADD CONSTRAINT "studio_profile_role_role_id_studio_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "studio_role"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "studio_role_permission" ADD CONSTRAINT "studio_role_permission_role_id_studio_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "studio_role"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "studio_role_permission" ADD CONSTRAINT "studio_role_permission_permission_id_studio_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "studio_permission"("id") ON DELETE CASCADE;