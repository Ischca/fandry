ALTER TABLE "creators" ADD COLUMN "accent_color" varchar(16);--> statement-breakpoint
ALTER TABLE "creators" DROP COLUMN IF EXISTS "profile_theme";
