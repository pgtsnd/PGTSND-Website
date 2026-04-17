import { Router } from "express";
import {
  db,
  messagesTable,
  selectMessageSchema,
  usersTable,
  projectsTable,
  projectMembersTable,
} from "@workspace/db";
import { and, desc, eq, isNull, or, inArray, sql } from "drizzle-orm";
import { validateAndSendArray, validateAndSend } from "../middleware/validate-response";

const router = Router();

type Role = "owner" | "partner" | "crew" | "client";

function canDM(senderRole: Role, recipientRole: Role): boolean {
  if (senderRole === "owner" || senderRole === "partner") return true;
  if (senderRole === "crew") {
    return recipientRole === "owner" || recipientRole === "partner" || recipientRole === "crew";
  }
  if (senderRole === "client") {
    return recipientRole === "owner" || recipientRole === "partner";
  }
  return false;
}

router.get("/dm/contacts", async (req, res) => {
  const me = req.user!;
  const allUsers = await db.select().from(usersTable);
  const contacts = allUsers
    .filter((u) => u.id !== me.id && canDM(me.role as Role, u.role as Role))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
    }));
  res.json(contacts);
});

router.get("/dm/conversations", async (req, res) => {
  const me = req.user!;
  const rows = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        isNull(messagesTable.projectId),
        or(eq(messagesTable.senderId, me.id), eq(messagesTable.recipientId, me.id)),
      ),
    )
    .orderBy(desc(messagesTable.createdAt));

  const map = new Map<
    string,
    { partnerId: string; lastMessage: typeof rows[number]; unreadCount: number }
  >();
  for (const m of rows) {
    const partnerId = m.senderId === me.id ? m.recipientId! : m.senderId;
    const entry = map.get(partnerId);
    if (!entry) {
      map.set(partnerId, {
        partnerId,
        lastMessage: m,
        unreadCount: m.recipientId === me.id && !m.read ? 1 : 0,
      });
    } else if (m.recipientId === me.id && !m.read) {
      entry.unreadCount += 1;
    }
  }

  const partnerIds = Array.from(map.keys());
  const users = partnerIds.length
    ? await db.select().from(usersTable).where(inArray(usersTable.id, partnerIds))
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = Array.from(map.values()).map((c) => ({
    partnerId: c.partnerId,
    partnerName: userMap.get(c.partnerId)?.name ?? "Unknown",
    partnerRole: userMap.get(c.partnerId)?.role ?? null,
    partnerAvatarUrl: userMap.get(c.partnerId)?.avatarUrl ?? null,
    lastMessageContent: c.lastMessage.content,
    lastMessageAt: c.lastMessage.createdAt,
    lastMessageFromMe: c.lastMessage.senderId === me.id,
    unreadCount: c.unreadCount,
  }));
  result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  res.json(result);
});

router.get("/dm/threads/:userId", async (req, res) => {
  const me = req.user!;
  const otherId = req.params.userId;
  const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId));
  if (!other) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (!canDM(me.role as Role, other.role as Role)) {
    res.status(403).json({ error: "Direct messages with this user are not allowed for your role" });
    return;
  }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        isNull(messagesTable.projectId),
        or(
          and(eq(messagesTable.senderId, me.id), eq(messagesTable.recipientId, otherId)),
          and(eq(messagesTable.senderId, otherId), eq(messagesTable.recipientId, me.id)),
        ),
      ),
    )
    .orderBy(messagesTable.createdAt);
  validateAndSendArray(res, selectMessageSchema, messages);
});

router.post("/dm/threads/:userId", async (req, res) => {
  const me = req.user!;
  const otherId = req.params.userId;
  const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId));
  if (!other) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (!canDM(me.role as Role, other.role as Role)) {
    res.status(403).json({ error: "Direct messages with this user are not allowed for your role" });
    return;
  }
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) {
    res.status(400).json({ error: "Validation failed", details: "content is required" });
    return;
  }
  const [message] = await db
    .insert(messagesTable)
    .values({
      senderId: me.id,
      recipientId: otherId,
      content,
      projectId: null,
    })
    .returning();
  validateAndSend(res, selectMessageSchema, message, 201);
});

router.patch("/dm/threads/:userId/read", async (req, res) => {
  const me = req.user!;
  const otherId = req.params.userId;
  await db
    .update(messagesTable)
    .set({ read: true })
    .where(
      and(
        isNull(messagesTable.projectId),
        eq(messagesTable.recipientId, me.id),
        eq(messagesTable.senderId, otherId),
        eq(messagesTable.read, false),
      ),
    );
  res.json({ ok: true });
});

router.get("/messages/unread-summary", async (req, res) => {
  const me = req.user!;
  // Direct messages addressed to me, unread
  const [dmRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messagesTable)
    .where(
      and(
        isNull(messagesTable.projectId),
        eq(messagesTable.recipientId, me.id),
        eq(messagesTable.read, false),
      ),
    );

  // Project group messages: not authored by me, unread, in projects I have access to.
  // Access rules: owner/partner -> all projects; crew -> via project_members;
  // client -> projects.client_id = me.id.
  let accessibleProjectIds: string[] | null = null;
  if (me.role === "owner" || me.role === "partner") {
    accessibleProjectIds = null; // all projects
  } else if (me.role === "crew") {
    const rows = await db
      .select({ id: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, me.id));
    accessibleProjectIds = rows.map((r) => r.id);
  } else {
    const rows = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.clientId, me.id));
    accessibleProjectIds = rows.map((r) => r.id);
  }

  let pgCount = 0;
  if (accessibleProjectIds === null) {
    const [pgRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(messagesTable)
      .where(
        and(
          sql`${messagesTable.projectId} is not null`,
          sql`${messagesTable.senderId} <> ${me.id}`,
          eq(messagesTable.read, false),
        ),
      );
    pgCount = pgRow?.n ?? 0;
  } else if (accessibleProjectIds.length > 0) {
    const [pgRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(messagesTable)
      .where(
        and(
          inArray(messagesTable.projectId, accessibleProjectIds),
          sql`${messagesTable.senderId} <> ${me.id}`,
          eq(messagesTable.read, false),
        ),
      );
    pgCount = pgRow?.n ?? 0;
  }

  res.json({
    projectGroups: pgCount,
    directMessages: dmRow?.n ?? 0,
  });
});

export default router;
