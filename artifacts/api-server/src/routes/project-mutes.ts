import { Router } from "express";
import {
  db,
  projectNotificationMutesTable,
  projectsTable,
} from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import {
  requireProjectAccess,
  checkProjectAccess,
} from "../middleware/project-access";

const router = Router();

router.get("/users/me/project-mutes", async (req, res) => {
  const rows = await db
    .select({
      projectId: projectNotificationMutesTable.projectId,
      name: projectsTable.name,
      status: projectsTable.status,
    })
    .from(projectNotificationMutesTable)
    .leftJoin(
      projectsTable,
      eq(projectsTable.id, projectNotificationMutesTable.projectId),
    )
    .where(eq(projectNotificationMutesTable.userId, req.user!.id));

  res.json({
    projectIds: rows.map((r) => r.projectId),
    mutes: rows.map((r) => ({
      id: r.projectId,
      name: r.name,
      status: r.status,
    })),
  });
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

function parseProjectIds(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null;
  const ids = (body as { projectIds?: unknown }).projectIds;
  if (!Array.isArray(ids)) return null;
  if (!ids.every((id) => typeof id === "string" && id.length > 0)) return null;
  return Array.from(new Set(ids as string[]));
}

router.put("/users/me/project-mutes", async (req, res) => {
  const user = req.user!;
  const projectIds = parseProjectIds(req.body);
  if (!projectIds) {
    res.status(400).json({ error: "projectIds must be an array of strings" });
    return;
  }
  if (projectIds.length === 0) {
    res.json({ projectIds: [], muted: true });
    return;
  }

  const accessChecks = await Promise.all(
    projectIds.map((id) => checkProjectAccess(user.id, user.role, id)),
  );
  if (accessChecks.some((ok) => !ok)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await db
    .insert(projectNotificationMutesTable)
    .values(projectIds.map((projectId) => ({ userId: user.id, projectId })))
    .onConflictDoNothing({
      target: [
        projectNotificationMutesTable.userId,
        projectNotificationMutesTable.projectId,
      ],
    });
  res.json({ projectIds, muted: true });
});

router.delete("/users/me/project-mutes", async (req, res) => {
  const user = req.user!;
  const projectIds = parseProjectIds(req.body);
  if (!projectIds) {
    res.status(400).json({ error: "projectIds must be an array of strings" });
    return;
  }
  if (projectIds.length === 0) {
    res.json({ projectIds: [], muted: false });
    return;
  }

  await db
    .delete(projectNotificationMutesTable)
    .where(
      and(
        eq(projectNotificationMutesTable.userId, user.id),
        inArray(projectNotificationMutesTable.projectId, projectIds),
      ),
    );
  res.json({ projectIds, muted: false });
});

export default router;
