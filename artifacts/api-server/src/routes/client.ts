import { Router } from "express";
import {
  db,
  projectsTable,
  tasksTable,
  deliverablesTable,
  reviewsTable,
  messagesTable,
  contractsTable,
  usersTable,
  projectMembersTable,
  reviewRemindersTable,
} from "@workspace/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireRole } from "../middleware/auth";

const router = Router();

router.get(
  "/client/dashboard",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.clientId, userId));

    if (projects.length === 0) {
      res.json({
        projects: [],
        pendingReviews: [],
        recentMessages: [],
      });
      return;
    }

    const projectIds = projects.map((p) => p.id);

    const deliverables = await db
      .select()
      .from(deliverablesTable)
      .where(
        and(
          inArray(deliverablesTable.projectId, projectIds),
          inArray(deliverablesTable.status, ["in_review", "pending"]),
        ),
      );

    const pendingReviews = [];
    for (const d of deliverables) {
      const reminders = await db
        .select()
        .from(reviewRemindersTable)
        .where(eq(reviewRemindersTable.deliverableId, d.id));

      const project = projects.find((p) => p.id === d.projectId);
      pendingReviews.push({
        ...d,
        projectName: project?.name ?? "",
        reminderCount: reminders.length,
        lastReminderDay: reminders.length > 0
          ? Math.max(...reminders.map((r) => r.reminderDay))
          : null,
      });
    }

    const messages = await db
      .select({
        id: messagesTable.id,
        projectId: messagesTable.projectId,
        senderId: messagesTable.senderId,
        content: messagesTable.content,
        read: messagesTable.read,
        createdAt: messagesTable.createdAt,
        senderName: usersTable.name,
      })
      .from(messagesTable)
      .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(inArray(messagesTable.projectId, projectIds))
      .orderBy(desc(messagesTable.createdAt))
      .limit(10);

    const recentMessages = messages.map((m) => {
      const project = projects.find((p) => p.id === m.projectId);
      return {
        ...m,
        projectName: project?.name ?? "",
      };
    });

    const projectsWithProgress = [];
    for (const project of projects) {
      const tasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.projectId, project.id));

      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((t) => t.status === "done").length;
      const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
      const calculatedProgress = totalTasks > 0
        ? Math.round(((doneTasks + inProgressTasks * 0.5) / totalTasks) * 100)
        : project.progress;

      projectsWithProgress.push({
        ...project,
        calculatedProgress,
        totalTasks,
        doneTasks,
        inProgressTasks,
      });
    }

    res.json({
      projects: projectsWithProgress,
      pendingReviews,
      recentMessages,
    });
  },
);

router.get(
  "/client/projects/:projectId/tasks",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;
    const projectId = req.params.projectId;

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, projectId),
          eq(projectsTable.clientId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const tasks = await db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        status: tasksTable.status,
        progress: tasksTable.progress,
        sortOrder: tasksTable.sortOrder,
        assigneeName: usersTable.name,
        assigneeInitials: usersTable.initials,
      })
      .from(tasksTable)
      .leftJoin(usersTable, eq(tasksTable.assigneeId, usersTable.id))
      .where(eq(tasksTable.projectId, projectId))
      .orderBy(tasksTable.sortOrder);

    res.json(tasks);
  },
);

router.get(
  "/client/projects/:projectId/team",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;
    const projectId = req.params.projectId;

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, projectId),
          eq(projectsTable.clientId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const members = await db
      .select({
        userId: projectMembersTable.userId,
        role: projectMembersTable.role,
        name: usersTable.name,
        initials: usersTable.initials,
        title: usersTable.title,
      })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
      .where(eq(projectMembersTable.projectId, projectId));

    res.json(members);
  },
);

router.get(
  "/client/messages",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.clientId, userId));

    if (projects.length === 0) {
      res.json([]);
      return;
    }

    const projectIds = projects.map((p) => p.id);

    const messages = await db
      .select({
        id: messagesTable.id,
        projectId: messagesTable.projectId,
        senderId: messagesTable.senderId,
        content: messagesTable.content,
        read: messagesTable.read,
        createdAt: messagesTable.createdAt,
        senderName: usersTable.name,
        senderInitials: usersTable.initials,
        senderRole: usersTable.role,
      })
      .from(messagesTable)
      .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(inArray(messagesTable.projectId, projectIds))
      .orderBy(messagesTable.createdAt);

    const conversations = projects
      .filter((p) => ["active", "in_progress", "review"].includes(p.status))
      .map((project) => {
        const projectMessages = messages
          .filter((m) => m.projectId === project.id)
          .map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName,
            senderInitials: m.senderInitials,
            senderRole: m.senderRole,
            content: m.content,
            read: m.read,
            createdAt: m.createdAt,
            isTeam: m.senderRole !== "client",
          }));

        const unreadCount = projectMessages.filter(
          (m) => !m.read && m.isTeam,
        ).length;

        const lastMsg = projectMessages[projectMessages.length - 1];

        return {
          projectId: project.id,
          projectName: project.name,
          messages: projectMessages,
          unreadCount,
          lastMessage: lastMsg
            ? `${lastMsg.senderName}: ${lastMsg.content}`
            : "",
          lastMessageTime: lastMsg?.createdAt ?? project.createdAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime(),
      );

    const generalConvo = {
      projectId: "general",
      projectName: "General",
      messages: [] as typeof messages,
      unreadCount: 0,
      lastMessage: "",
      lastMessageTime: new Date(),
    };

    res.json([...conversations, generalConvo]);
  },
);

router.post(
  "/client/messages",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;
    const { projectId, content } = req.body;

    if (!projectId || !content) {
      res.status(400).json({ error: "projectId and content are required" });
      return;
    }

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, projectId),
          eq(projectsTable.clientId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [message] = await db
      .insert(messagesTable)
      .values({
        projectId,
        senderId: userId,
        content,
      })
      .returning();

    res.status(201).json(message);
  },
);

router.post(
  "/client/deliverables/:id/approve",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;
    const deliverableId = req.params.id;
    const { comment } = req.body;

    const [deliverable] = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, deliverableId))
      .limit(1);

    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, deliverable.projectId),
          eq(projectsTable.clientId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [review] = await db
      .insert(reviewsTable)
      .values({
        deliverableId,
        reviewerId: userId,
        status: "approved",
        comment: comment || null,
      })
      .returning();

    await db
      .update(deliverablesTable)
      .set({ status: "approved" })
      .where(eq(deliverablesTable.id, deliverableId));

    res.json(review);
  },
);

router.post(
  "/client/deliverables/:id/request-revision",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;
    const deliverableId = req.params.id;
    const { comment } = req.body;

    if (!comment) {
      res.status(400).json({ error: "Comment is required for revision requests" });
      return;
    }

    const [deliverable] = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, deliverableId))
      .limit(1);

    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, deliverable.projectId),
          eq(projectsTable.clientId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [review] = await db
      .insert(reviewsTable)
      .values({
        deliverableId,
        reviewerId: userId,
        status: "revision_requested",
        comment,
      })
      .returning();

    await db
      .update(deliverablesTable)
      .set({ status: "revision_requested" })
      .where(eq(deliverablesTable.id, deliverableId));

    res.json(review);
  },
);

router.get(
  "/client/contracts",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.clientId, userId));

    if (projects.length === 0) {
      res.json([]);
      return;
    }

    const projectIds = projects.map((p) => p.id);

    const contracts = await db
      .select()
      .from(contractsTable)
      .where(inArray(contractsTable.projectId, projectIds))
      .orderBy(desc(contractsTable.createdAt));

    const contractsWithProject = contracts.map((c) => {
      const project = projects.find((p) => p.id === c.projectId);
      return {
        ...c,
        projectName: project?.name ?? "General",
      };
    });

    res.json(contractsWithProject);
  },
);

router.get(
  "/client/deliverables",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.clientId, userId));

    if (projects.length === 0) {
      res.json([]);
      return;
    }

    const projectIds = projects.map((p) => p.id);

    const deliverables = await db
      .select()
      .from(deliverablesTable)
      .where(inArray(deliverablesTable.projectId, projectIds))
      .orderBy(desc(deliverablesTable.createdAt));

    const deliverablesWithProject = deliverables.map((d) => {
      const project = projects.find((p) => p.id === d.projectId);
      return {
        ...d,
        projectName: project?.name ?? "",
      };
    });

    res.json(deliverablesWithProject);
  },
);

router.patch(
  "/client/profile",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;
    const { name, phone, title } = req.body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (title !== undefined) updateData.title = title;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  },
);

router.get(
  "/client/profile",
  requireRole("client"),
  async (req, res) => {
    const userId = req.user!.id;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.clientId, userId));

    let organizationName = null;
    if (projects.length > 0 && projects[0].organizationId) {
      const { organizationsTable } = await import("@workspace/db");
      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, projects[0].organizationId))
        .limit(1);
      organizationName = org?.name ?? null;
    }

    res.json({
      ...user,
      organizationName,
    });
  },
);

export default router;
