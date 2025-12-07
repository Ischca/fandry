ALTER TABLE "creators" ADD COLUMN "profile_links" text;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "profile_theme" text;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "header_style" varchar(16) DEFAULT 'compact';--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "show_stats" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "show_posts" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "featured_post_ids" text;