CREATE TABLE "invoice_export_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"scheduled_export_id" text,
	"filename" text NOT NULL,
	"csv" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_invoice_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"filters" jsonb NOT NULL,
	"created_by_id" text,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deliverables" ADD COLUMN "file_size" bigint;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_link_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_link_sent_to" varchar(255);--> statement-breakpoint
ALTER TABLE "invoice_export_runs" ADD CONSTRAINT "invoice_export_runs_scheduled_export_id_scheduled_invoice_exports_id_fk" FOREIGN KEY ("scheduled_export_id") REFERENCES "public"."scheduled_invoice_exports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_invoice_exports" ADD CONSTRAINT "scheduled_invoice_exports_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_export_runs_created_idx" ON "invoice_export_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scheduled_invoice_exports_enabled_idx" ON "scheduled_invoice_exports" USING btree ("enabled");