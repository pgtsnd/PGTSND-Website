ALTER TABLE "video_comments" ADD COLUMN "reopened_at" timestamp;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "reopened_by" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "reopened_by_name" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "previous_resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "previous_resolved_by_name" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "previous_resolved_note" text;--> statement-breakpoint
ALTER TABLE "scheduled_invoice_exports" ADD COLUMN "recipients" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_reopened_by_users_id_fk" FOREIGN KEY ("reopened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;