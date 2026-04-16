CREATE TABLE "project_notification_mutes" (
"user_id" text NOT NULL,
"project_id" text NOT NULL,
"created_at" timestamp DEFAULT now() NOT NULL,
CONSTRAINT "project_notification_mutes_user_id_project_id_pk" PRIMARY KEY("user_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "project_notification_mutes" ADD CONSTRAINT "project_notification_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_notification_mutes" ADD CONSTRAINT "project_notification_mutes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
