CREATE TABLE IF NOT EXISTS "studio_settings" (
        "id" text PRIMARY KEY NOT NULL,
        "dormant_token_threshold_days" integer DEFAULT 90 NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "studio_settings" ("id", "dormant_token_threshold_days")
VALUES ('singleton', 90)
ON CONFLICT ("id") DO NOTHING;
