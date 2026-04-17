ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notify_dormant_tokens" boolean DEFAULT true NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dormant_tokens_snooze_until" timestamp;
