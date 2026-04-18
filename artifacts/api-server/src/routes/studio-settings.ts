import { Router } from "express";
import {
  db,
  studioSettingsTable,
  selectStudioSettingsSchema,
  updateStudioSettingsSchema,
  STUDIO_SETTINGS_SINGLETON_ID,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { validateAndSend } from "../middleware/validate-response";
import { getOrCreateStudioSettings } from "../services/studio-settings";

const router = Router();

router.get("/studio-settings", async (_req, res) => {
  const settings = await getOrCreateStudioSettings();
  validateAndSend(res, selectStudioSettingsSchema, settings);
});

router.patch(
  "/studio-settings",
  requireRole("owner"),
  async (req, res) => {
    const parsed = updateStudioSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    // Make sure the singleton row exists before we update it.
    await getOrCreateStudioSettings();

    const [row] = await db
      .update(studioSettingsTable)
      .set(parsed.data)
      .where(eq(studioSettingsTable.id, STUDIO_SETTINGS_SINGLETON_ID))
      .returning();

    validateAndSend(res, selectStudioSettingsSchema, row);
  },
);

export default router;
