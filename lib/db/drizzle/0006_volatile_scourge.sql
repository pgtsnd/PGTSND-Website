CREATE TABLE "media_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"object_path" text NOT NULL,
	"name" varchar(500) NOT NULL,
	"label" varchar(500),
	"folder" varchar(200) DEFAULT 'site' NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_type" varchar(80);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "priority" varchar(20) DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "goals" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "target_audience" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deliverables_plan" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "shoot_location" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "key_contact" varchar(200);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "reference_links" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "recipient_id" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "deliverable_version_id" text;--> statement-breakpoint
ALTER TABLE "media_uploads" ADD CONSTRAINT "media_uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_uploads_object_path_idx" ON "media_uploads" USING btree ("object_path");--> statement-breakpoint
CREATE INDEX "media_uploads_created_idx" ON "media_uploads" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_deliverable_version_id_deliverable_versions_id_fk" FOREIGN KEY ("deliverable_version_id") REFERENCES "public"."deliverable_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_recipient_idx" ON "messages" USING btree ("recipient_id");