import { Router } from "express";
import {
  db,
  tasksTable,
  taskItemsTable,
  phasesTable,
  insertTaskSchema,
  updateTaskSchema,
  insertTaskItemSchema,
  updateTaskItemSchema,
  selectTaskSchema,
  selectTaskItemSchema,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccess,
  requireProjectAccessViaEntity,
  resolveProjectFromTask,
  resolveProjectFromTaskItem,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

router.get(
  "/projects/:projectId/tasks",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.projectId, req.params.projectId));
    validateAndSendArray(res, selectTaskSchema, tasks);
  },
);

router.get(
  "/tasks/:id",
  requireProjectAccessViaEntity(resolveProjectFromTask, "id"),
  async (req, res) => {
    const [task] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, req.params.id))
      .limit(1);

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    validateAndSend(res, selectTaskSchema, task);
  },
);

router.post(
  "/projects/:projectId/tasks",
  requireRole("owner", "partner", "crew"),
  requireProjectAccess("projectId"),
  async (req, res) => {
    const parsed = insertTaskSchema.safeParse({
      ...req.body,
      projectId: req.params.projectId,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (parsed.data.phaseId) {
      const [phase] = await db
        .select()
        .from(phasesTable)
        .where(
          and(
            eq(phasesTable.id, parsed.data.phaseId),
            eq(phasesTable.projectId, req.params.projectId),
          ),
        )
        .limit(1);
      if (!phase) {
        res.status(400).json({ error: "Phase does not belong to this project" });
        return;
      }
    }

    const [task] = await db.insert(tasksTable).values(parsed.data).returning();
    validateAndSend(res, selectTaskSchema, task, 201);
  },
);

router.patch(
  "/tasks/:id",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromTask, "id"),
  async (req, res) => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [task] = await db
      .update(tasksTable)
      .set(parsed.data)
      .where(eq(tasksTable.id, req.params.id))
      .returning();

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    validateAndSend(res, selectTaskSchema, task);
  },
);

router.delete(
  "/tasks/:id",
  requireRole("owner", "partner"),
  requireProjectAccessViaEntity(resolveProjectFromTask, "id"),
  async (req, res) => {
    const [task] = await db
      .delete(tasksTable)
      .where(eq(tasksTable.id, req.params.id))
      .returning();

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({ message: "Task deleted" });
  },
);

router.get(
  "/tasks/:taskId/items",
  requireProjectAccessViaEntity(resolveProjectFromTask, "taskId"),
  async (req, res) => {
    const items = await db
      .select()
      .from(taskItemsTable)
      .where(eq(taskItemsTable.taskId, req.params.taskId));
    validateAndSendArray(res, selectTaskItemSchema, items);
  },
);

router.post(
  "/tasks/:taskId/items",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromTask, "taskId"),
  async (req, res) => {
    const parsed = insertTaskItemSchema.safeParse({
      ...req.body,
      taskId: req.params.taskId,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [item] = await db
      .insert(taskItemsTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectTaskItemSchema, item, 201);
  },
);

router.patch(
  "/task-items/:id",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromTaskItem, "id"),
  async (req, res) => {
    const parsed = updateTaskItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [item] = await db
      .update(taskItemsTable)
      .set(parsed.data)
      .where(eq(taskItemsTable.id, req.params.id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Task item not found" });
      return;
    }

    validateAndSend(res, selectTaskItemSchema, item);
  },
);

router.delete(
  "/task-items/:id",
  requireRole("owner", "partner"),
  requireProjectAccessViaEntity(resolveProjectFromTaskItem, "id"),
  async (req, res) => {
    const [item] = await db
      .delete(taskItemsTable)
      .where(eq(taskItemsTable.id, req.params.id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Task item not found" });
      return;
    }

    res.json({ message: "Task item deleted" });
  },
);

export default router;
