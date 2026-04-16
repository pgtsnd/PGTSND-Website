import { Router } from "express";
import {
  db,
  projectsTable,
  projectMembersTable,
  insertProjectSchema,
  updateProjectSchema,
  insertProjectMemberSchema,
  selectProjectSchema,
  selectProjectMemberSchema,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { requireProjectAccess } from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

function stripForClient<T extends { internalNotes?: unknown }>(p: T): T {
  return { ...p, internalNotes: null } as T;
}

router.get("/projects", async (req, res) => {
  const user = req.user!;

  if (user.role === "owner" || user.role === "partner") {
    const projects = await db.select().from(projectsTable);
    validateAndSendArray(res, selectProjectSchema, projects);
    return;
  }

  if (user.role === "crew") {
    const memberRows = await db
      .select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, user.id));

    const projectIds = memberRows.map((r) => r.projectId);
    if (projectIds.length === 0) {
      res.json([]);
      return;
    }

    const projects = await db
      .select()
      .from(projectsTable)
      .where(inArray(projectsTable.id, projectIds));
    validateAndSendArray(res, selectProjectSchema, projects);
    return;
  }

  if (user.role === "client") {
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.clientId, user.id));
    validateAndSendArray(res, selectProjectSchema, projects.map(stripForClient));
    return;
  }

  res.json([]);
});

router.get(
  "/projects/:id",
  requireProjectAccess("id"),
  async (req, res) => {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, req.params.id))
      .limit(1);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const out = req.user?.role === "client" ? stripForClient(project) : project;
    validateAndSend(res, selectProjectSchema, out);
  },
);

router.post(
  "/projects",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [project] = await db
      .insert(projectsTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectProjectSchema, project, 201);
  },
);

router.patch(
  "/projects/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [project] = await db
      .update(projectsTable)
      .set(parsed.data)
      .where(eq(projectsTable.id, req.params.id))
      .returning();

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    validateAndSend(res, selectProjectSchema, project);
  },
);

router.delete(
  "/projects/:id",
  requireRole("owner"),
  async (req, res) => {
    const [project] = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, req.params.id))
      .returning();

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json({ message: "Project deleted" });
  },
);

router.get(
  "/projects/:id/members",
  requireProjectAccess("id"),
  async (req, res) => {
    const members = await db
      .select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.projectId, req.params.id));
    validateAndSendArray(res, selectProjectMemberSchema, members);
  },
);

router.post(
  "/projects/:id/members",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = insertProjectMemberSchema.safeParse({
      ...req.body,
      projectId: req.params.id,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [member] = await db
      .insert(projectMembersTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectProjectMemberSchema, member, 201);
  },
);

router.delete(
  "/projects/:projectId/members/:userId",
  requireRole("owner", "partner"),
  async (req, res) => {
    const [member] = await db
      .delete(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.projectId, req.params.projectId),
          eq(projectMembersTable.userId, req.params.userId),
        ),
      )
      .returning();

    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    res.json({ message: "Member removed" });
  },
);

export default router;
