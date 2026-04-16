import {
  pgTable,
  text,
  timestamp,
  varchar,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { usersTable } from "./users";

export const mediaUploadsTable = pgTable(
  "media_uploads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    objectPath: text("object_path").notNull(),
    name: varchar("name", { length: 500 }).notNull(),
    label: varchar("label", { length: 500 }),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    uploadedBy: text("uploaded_by").references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("media_uploads_object_path_idx").on(table.objectPath),
    index("media_uploads_created_idx").on(table.createdAt),
  ],
);

export const insertMediaUploadSchema = createInsertSchema(mediaUploadsTable).omit({
  id: true,
  createdAt: true,
});

export const selectMediaUploadSchema = createSelectSchema(mediaUploadsTable);

export type InsertMediaUpload = z.infer<typeof insertMediaUploadSchema>;
export type MediaUpload = typeof mediaUploadsTable.$inferSelect;
