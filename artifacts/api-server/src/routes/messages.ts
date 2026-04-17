import { Router } from "express";
import {
  db,
  messagesTable,
  projectsTable,
  projectMembersTable,
  usersTable,
  insertMessageSchema,
  selectMessageSchema,
  enrichedMessageSchema,
} from "@workspace/db";
import { and, desc, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccess,
  requireProjectAccessViaEntity,
  resolveProjectFromMessage,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";
import * as slackService from "../services/slack";

const router = Router();

router.get(
  "/projects/:projectId/messages",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const projectId = req.params.projectId;

    const dbMessages = await db
      .select({
        id: messagesTable.id,
        projectId: messagesTable.projectId,
        recipientId: messagesTable.recipientId,
        senderId: messagesTable.senderId,
        content: messagesTable.content,
        read: messagesTable.read,
        createdAt: messagesTable.createdAt,
        senderName: usersTable.name,
        senderInitials: usersTable.initials,
        senderRole: usersTable.role,
      })
      .from(messagesTable)
      .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(eq(messagesTable.projectId, projectId));

    const enrichedDb = dbMessages.map((m) => ({
      ...m,
      senderAvatarUrl: null as string | null,
      isTeam: m.senderRole !== "client",
    }));

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .limit(1);

    if (
      project?.slackChannelId &&
      (await slackService.isSlackConnected())
    ) {
      const slackHistory = await slackService.getChannelHistory(
        project.slackChannelId,
        50,
      );
      const uniqueUserIds = Array.from(
        new Set(slackHistory.map((m) => m.user).filter((u): u is string => !!u)),
      );
      const userInfos = await Promise.all(
        uniqueUserIds.map((uid) => slackService.getUserInfo(uid)),
      );
      const userInfoMap = new Map<
        string,
        { name: string; initials: string; imageUrl?: string }
      >();
      uniqueUserIds.forEach((uid, idx) => {
        const info = userInfos[idx];
        if (info)
          userInfoMap.set(uid, {
            name: info.name,
            initials: info.initials,
            imageUrl: info.imageUrl,
          });
      });

      const slackMsgs = slackHistory.map((m) => {
        const info = m.user ? userInfoMap.get(m.user) : undefined;
        return {
          id: `slack-${m.ts}`,
          projectId,
          recipientId: null,
          senderId: m.user || "slack",
          content: m.text,
          read: true,
          createdAt: new Date(parseFloat(m.ts) * 1000),
          senderName: info?.name ?? "Slack",
          senderInitials: info?.initials ?? "SL",
          senderRole: "owner",
          senderAvatarUrl: info?.imageUrl ?? null,
          isTeam: true,
        };
      });

      const merged = [...enrichedDb, ...slackMsgs].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      validateAndSendArray(res, enrichedMessageSchema, merged);
      return;
    }

    validateAndSendArray(res, enrichedMessageSchema, enrichedDb);
  },
);

router.get(
  "/messages/:id",
  requireProjectAccessViaEntity(resolveProjectFromMessage, "id"),
  async (req, res) => {
    const [message] = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, req.params.id));

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    validateAndSend(res, selectMessageSchema, message);
  },
);

router.post(
  "/projects/:projectId/messages",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const parsed = insertMessageSchema.safeParse({
      content: req.body?.content,
      projectId: req.params.projectId,
      senderId: req.user!.id,
      recipientId: null,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [message] = await db
      .insert(messagesTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectMessageSchema, message, 201);
  },
);

router.patch(
  "/messages/:id/read",
  requireProjectAccessViaEntity(resolveProjectFromMessage, "id"),
  async (req, res) => {
    const [updated] = await db
      .update(messagesTable)
      .set({ read: true })
      .where(eq(messagesTable.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    validateAndSend(res, selectMessageSchema, updated);
  },
);

router.delete(
  "/messages/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const [message] = await db
      .delete(messagesTable)
      .where(eq(messagesTable.id, req.params.id))
      .returning();

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.json({ message: "Message deleted" });
  },
);

router.get("/messages/recent-client-activity", async (req, res) => {
  const me = req.user!;

  // Clients don't get team-side notifications.
  if (me.role === "client") {
    res.json([]);
    return;
  }

  // Determine accessible projects. Owners/partners see every project.
  // Crew see only projects they're a member of.
  let restrictToProjectIds: string[] | null = null;
  if (me.role === "crew") {
    const memberships = await db
      .select({ id: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, me.id));
    restrictToProjectIds = memberships.map((m) => m.id);
    if (restrictToProjectIds.length === 0) {
      res.json([]);
      return;
    }
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const conditions = [
    isNotNull(messagesTable.projectId),
    eq(usersTable.role, "client"),
    gt(messagesTable.createdAt, cutoff),
  ];
  if (restrictToProjectIds) {
    conditions.push(inArray(messagesTable.projectId, restrictToProjectIds));
  }

  const rows = await db
    .select({
      id: messagesTable.id,
      projectId: messagesTable.projectId,
      projectName: projectsTable.name,
      senderId: messagesTable.senderId,
      senderName: usersTable.name,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .innerJoin(projectsTable, eq(messagesTable.projectId, projectsTable.id))
    .where(and(...conditions))
    .orderBy(desc(messagesTable.createdAt))
    .limit(50);

  res.json(rows);
});

export default router;
