ALTER TABLE "deliverables" ADD COLUMN "uploaded_by" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "resolved_by" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "resolved_by_name" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "resolved_note" text;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;