CREATE TYPE "public"."point_transaction_type" AS ENUM('purchase', 'refund', 'post_purchase', 'subscription', 'tip', 'admin_grant');--> statement-breakpoint
CREATE TABLE "point_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"points" integer NOT NULL,
	"price_jpy" integer NOT NULL,
	"stripe_price_id" varchar(128),
	"is_active" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "point_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_id" integer,
	"stripe_payment_intent_id" varchar(128),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_purchased" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_points_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "is_adult" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_adult" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "payment_method" varchar(16);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "points_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "stripe_amount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "stripe_payment_intent_id" varchar(128);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "is_adult" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "payment_method" varchar(16);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" varchar(128);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_point_deduct_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "point_deduct_failed_at" timestamp;--> statement-breakpoint
ALTER TABLE "tips" ADD COLUMN "payment_method" varchar(16);--> statement-breakpoint
ALTER TABLE "tips" ADD COLUMN "points_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tips" ADD COLUMN "stripe_amount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tips" ADD COLUMN "stripe_payment_intent_id" varchar(128);--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;