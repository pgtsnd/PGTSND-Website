import {
  db,
  studioSettingsTable,
  STUDIO_SETTINGS_SINGLETON_ID,
  DEFAULT_DORMANT_TOKEN_THRESHOLD_DAYS,
  type StudioSettings,
} from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getOrCreateStudioSettings(): Promise<StudioSettings> {
  const [existing] = await db
    .select()
    .from(studioSettingsTable)
    .where(eq(studioSettingsTable.id, STUDIO_SETTINGS_SINGLETON_ID))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(studioSettingsTable)
    .values({
      id: STUDIO_SETTINGS_SINGLETON_ID,
      dormantTokenThresholdDays: DEFAULT_DORMANT_TOKEN_THRESHOLD_DAYS,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Lost the race — re-read.
  const [row] = await db
    .select()
    .from(studioSettingsTable)
    .where(eq(studioSettingsTable.id, STUDIO_SETTINGS_SINGLETON_ID))
    .limit(1);
  return row!;
}

export async function getDormantTokenThresholdDays(): Promise<number> {
  const settings = await getOrCreateStudioSettings();
  return settings.dormantTokenThresholdDays;
}
