ALTER TABLE "users" ADD COLUMN "email_notify_reviews" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_notify_comments" boolean DEFAULT true NOT NULL;