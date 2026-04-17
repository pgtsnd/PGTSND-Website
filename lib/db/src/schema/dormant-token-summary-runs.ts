import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

export const dormantTokenSummaryRunsTable = pgTable(
  "dormant_token_summary_runs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    recipientCount: integer("recipient_count").notNull().default(0),
    tokenCount: integer("token_count").notNull().default(0),
  },
  (table) => [
    index("dormant_token_summary_runs_sent_idx").on(table.sentAt),
  ],
);

export type DormantTokenSummaryRun =
  typeof dormantTokenSummaryRunsTable.$inferSelect;
