import { Router } from "express";
import {
  db,
  projectNotificationMutesTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireProjectAccess } from "../middleware/project-access";

const router = Router();

router.get("/users/me/project-mutes", async (req, res) => {
  const rows = await db
    .select({ projectId: projectNotificationMutesTable.projectId })
    .from(projectNotificationMutesTable)
    .where(eq(projectNotificationMutesTable.userId, req.user!.id));
  res.json({ projectIds: rows.map((r) => r.projectId) });
});

router.put(
  "/users/me/project-mutes/:projectId",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const userId = req.user!.id;
    const { projectId } = req.params;
    await db
      .insert(projectNotificationMutesTable)
      .values({ userId, projectId })
      .onConflictDoNothing({
        target: [
          projectNotificationMutesTable.userId,
          projectNotificationMutesTable.projectId,
        ],
      });
    res.json({ projectId, muted: true });
  },
);

router.delete(
  "/users/me/project-mutes/:projectId",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const userId = req.user!.id;
    const { projectId } = req.params;
    await db
      .delete(projectNotificationMutesTable)
      .where(
        and(
          eq(projectNotificationMutesTable.userId, userId),
          eq(projectNotificationMutesTable.projectId, projectId),
        ),
      );
    res.json({ projectId, muted: false });
  },
);

export default router;
