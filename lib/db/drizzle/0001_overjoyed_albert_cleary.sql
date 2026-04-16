CREATE TABLE "phases" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "day_rate" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "half_day_rate" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hourly_rate" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rate_notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "w9_on_file" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tax_classification" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ein" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "state" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "zip" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_relation" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "equipment" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "specialties" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "portfolio" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "availability" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "phase_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phases_project_idx" ON "phases" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_checkout_session_idx" ON "invoices" USING btree ("stripe_checkout_session_id");