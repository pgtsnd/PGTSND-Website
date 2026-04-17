CREATE TABLE IF NOT EXISTS "dormant_token_summary_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dormant_token_summary_runs_sent_idx" ON "dormant_token_summary_runs" USING btree ("sent_at");
