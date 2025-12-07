ALTER TABLE "creators" ADD COLUMN "creator_title" varchar(64);--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "skill_tags" text;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "creator_status" varchar(32);--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "status_message" varchar(100);