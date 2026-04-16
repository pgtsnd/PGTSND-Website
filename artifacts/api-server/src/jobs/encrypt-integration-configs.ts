import { db, integrationSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { encryptConfig, isVaultReady, isEncryptedValue } from "../services/vault";
import { logger } from "../lib/logger";

export async function migratePlaintextIntegrationConfigs(): Promise<void> {
  if (!isVaultReady()) {
    logger.warn("VAULT_MASTER_KEY not configured; skipping integration config encryption migration");
    return;
  }

  try {
    const settings = await db.select().from(integrationSettingsTable);
    let migrated = 0;

    for (const s of settings) {
      if (!s.config || Object.keys(s.config).length === 0) continue;

      const values = Object.values(s.config);
      const allEncrypted = values.every(isEncryptedValue);
      if (allEncrypted) continue;

      const encrypted: Record<string, string> = {};
      for (const [key, rawValue] of Object.entries(s.config)) {
        const value = String(rawValue);
        if (isEncryptedValue(value)) {
          encrypted[key] = value;
        } else {
          encrypted[key] = encryptConfig({ [key]: value })[key];
        }
      }

      await db
        .update(integrationSettingsTable)
        .set({ config: encrypted })
        .where(eq(integrationSettingsTable.id, s.id));
      migrated++;
    }

    if (migrated > 0) {
      logger.info({ migrated }, "Encrypted plaintext integration configs at startup");
    }
  } catch (err) {
    logger.error({ err }, "Failed to migrate plaintext integration configs");
  }
}
