import { Request, Response, NextFunction } from "express";
import {
  db,
  projectsTable,
  projectMembersTable,
  deliverablesTable,
  tasksTable,
  taskItemsTable,
  reviewsTable,
  messagesTable,
  contractsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function checkProjectAccess(
  userId: string,
  role: string,
  projectId: string,
): Promise<boolean> {
  if (role === "owner" || role === "partner") {
    return true;
  }

  if (role === "crew") {
    const [membership] = await db
      .select()
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.projectId, projectId),
          eq(projectMembersTable.userId, userId),
        ),
      )
      .limit(1);
    return !!membership;
  }

  if (role === "client") {
    const [project] = await db
      .select({ clientId: projectsTable.clientId })
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .limit(1);
    return !!project && project.clientId === userId;
  }

  return false;
}

export function requireProjectAccess(
  projectIdParam: string = "projectId",
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    const projectId = req.params[projectIdParam];

    if (!projectId) {
      res.status(400).json({ error: "Project ID required" });
      return;
    }

    const hasAccess = await checkProjectAccess(user.id, user.role, projectId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    next();
  };
}

export async function resolveProjectFromDeliverable(
  deliverableId: string,
): Promise<string | null> {
  const [deliverable] = await db
    .select({ projectId: deliverablesTable.projectId })
    .from(deliverablesTable)
    .where(eq(deliverablesTable.id, deliverableId))
    .limit(1);
  return deliverable?.projectId ?? null;
}

export async function resolveProjectFromTask(
  taskId: string,
): Promise<string | null> {
  const [task] = await db
    .select({ projectId: tasksTable.projectId })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);
  return task?.projectId ?? null;
}

export async function resolveProjectFromReview(
  reviewId: string,
): Promise<string | null> {
  const [review] = await db
    .select({ deliverableId: reviewsTable.deliverableId })
    .from(reviewsTable)
    .where(eq(reviewsTable.id, reviewId))
    .limit(1);
  if (!review) return null;
  return resolveProjectFromDeliverable(review.deliverableId);
}

export async function resolveProjectFromTaskItem(
  taskItemId: string,
): Promise<string | null> {
  const [item] = await db
    .select({ taskId: taskItemsTable.taskId })
    .from(taskItemsTable)
    .where(eq(taskItemsTable.id, taskItemId))
    .limit(1);
  if (!item) return null;
  return resolveProjectFromTask(item.taskId);
}

export async function resolveProjectFromMessage(
  messageId: string,
): Promise<string | null> {
  const [message] = await db
    .select({ projectId: messagesTable.projectId })
    .from(messagesTable)
    .where(eq(messagesTable.id, messageId))
    .limit(1);
  return message?.projectId ?? null;
}

export async function resolveProjectFromContract(
  contractId: string,
): Promise<string | null> {
  const [contract] = await db
    .select({ projectId: contractsTable.projectId })
    .from(contractsTable)
    .where(eq(contractsTable.id, contractId))
    .limit(1);
  return contract?.projectId ?? null;
}

export function requireProjectAccessViaEntity(
  resolver: (id: string) => Promise<string | null>,
  paramName: string = "id",
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    const entityId = req.params[paramName];

    if (!entityId) {
      res.status(400).json({ error: "Entity ID required" });
      return;
    }

    const projectId = await resolver(entityId);
    if (!projectId) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    const hasAccess = await checkProjectAccess(user.id, user.role, projectId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    next();
  };
}
