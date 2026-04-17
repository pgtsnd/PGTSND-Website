ALTER TABLE "video_comments" ADD COLUMN "deliverable_version_id" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "version_label" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_deliverable_version_id_deliverable_versions_id_fk" FOREIGN KEY ("deliverable_version_id") REFERENCES "public"."deliverable_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_comments_version_idx" ON "video_comments" USING btree ("deliverable_version_id");
