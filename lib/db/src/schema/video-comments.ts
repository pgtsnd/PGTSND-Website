import {
  pgTable,
  text,
  timestamp,
  real,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { deliverablesTable } from "./deliverables";
import { deliverableVersionsTable } from "./deliverable-versions";
import { usersTable } from "./users";

export const videoCommentsTable = pgTable(
  "video_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    deliverableId: text("deliverable_id")
      .notNull()
      .references(() => deliverablesTable.id, { onDelete: "cascade" }),
    deliverableVersionId: text("deliverable_version_id").references(
      () => deliverableVersionsTable.id,
      { onDelete: "set null" },
    ),
    versionLabel: text("version_label"),
    authorId: text("author_id")
      .references(() => usersTable.id),
    authorName: text("author_name").notNull(),
    timestampSeconds: real("timestamp_seconds").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => usersTable.id),
    resolvedByName: text("resolved_by_name"),
    resolvedNote: text("resolved_note"),
  },
  (table) => [
    index("video_comments_deliverable_idx").on(table.deliverableId),
    index("video_comments_timestamp_idx").on(table.deliverableId, table.timestampSeconds),
    index("video_comments_version_idx").on(table.deliverableVersionId),
  ],
);

export const videoCommentRepliesTable = pgTable(
  "video_comment_replies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    commentId: text("comment_id")
      .notNull()
      .references(() => videoCommentsTable.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .references(() => usersTable.id),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("video_comment_replies_comment_idx").on(table.commentId),
  ],
);

export const insertVideoCommentSchema = createInsertSchema(videoCommentsTable).omit({
  id: true,
  createdAt: true,
});

export const selectVideoCommentSchema = createSelectSchema(videoCommentsTable);

export const insertVideoCommentReplySchema = createInsertSchema(videoCommentRepliesTable).omit({
  id: true,
  createdAt: true,
});

export const selectVideoCommentReplySchema = createSelectSchema(videoCommentRepliesTable);

export type VideoComment = typeof videoCommentsTable.$inferSelect;
export type InsertVideoComment = z.infer<typeof insertVideoCommentSchema>;
export type VideoCommentReply = typeof videoCommentRepliesTable.$inferSelect;
export type InsertVideoCommentReply = z.infer<typeof insertVideoCommentReplySchema>;
