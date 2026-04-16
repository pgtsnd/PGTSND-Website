import { Router } from "express";
import {
  db,
  projectsTable,
  tasksTable,
  deliverablesTable,
  reviewsTable,
  messagesTable,
  contractsTable,
  invoicesTable,
  usersTable,
  projectMembersTable,
  reviewRemindersTable,
} from "@workspace/db";
import { eq, and, inArray, desc, type SQL } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import * as driveService from "../services/google-drive";
import * as slackService from "../services/slack";
import { notifyDeliverableApproved } from "../services/notifications";

const router = Router();

function projectAccessFilter(projectId: string, userId: string, role: string): SQL | undefined {
  if (role === "owner" || role === "partner") {
    return eq(projectsTable.id, projectId);
  }
  return and(eq(projectsTable.id, projectId), eq(projectsTable.clientId, userId));
}

function userProjectsFilter(userId: string, role: string): SQL | undefined {
  if (role === "owner" || role === "partner") {
    return undefined;
  }
  return eq(projectsTable.clientId, userId);
}

router.get(
  "/client/dashboard",
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const filter = userProjectsFilter(userId, userRole);

    const projects = filter
      ? await db.select().from(projectsTable).where(filter)
      : await db.select().from(projectsTable);

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
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;
    const projectId = req.params.projectId;

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(projectAccessFilter(projectId, userId, req.user!.role))
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
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;
    const projectId = req.params.projectId;

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(projectAccessFilter(projectId, userId, req.user!.role))
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
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(userProjectsFilter(userId, req.user!.role));

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

    const slackEnabled = await slackService.isSlackConnected();
    const activeProjects = projects.filter((p) =>
      ["active", "in_progress", "review"].includes(p.status),
    );

    const conversations = await Promise.all(
      activeProjects.map(async (project) => {
        const dbMessages = messages
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

        let projectMessages = dbMessages;
        let slackBridged = false;

        if (slackEnabled && project.slackChannelId) {
          slackBridged = true;
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
          const userInfoMap = new Map<string, { name: string; initials: string }>();
          uniqueUserIds.forEach((uid, idx) => {
            const info = userInfos[idx];
            if (info) userInfoMap.set(uid, { name: info.name, initials: info.initials });
          });

          const slackMsgs = slackHistory.map((m) => {
            const info = m.user ? userInfoMap.get(m.user) : undefined;
            return {
              id: `slack-${m.ts}`,
              senderId: m.user || "slack",
              senderName: info?.name ?? "Slack",
              senderInitials: info?.initials ?? "SL",
              senderRole: "owner",
              content: m.text,
              read: true,
              createdAt: new Date(parseFloat(m.ts) * 1000),
              isTeam: true,
            };
          });
          projectMessages = slackMsgs.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime(),
          );
        }

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
          slackBridged,
        };
      }),
    );

    conversations.sort(
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
  requireRole("client", "owner", "partner"),
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
      .where(projectAccessFilter(projectId, userId, req.user!.role))
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

    if (project.slackChannelId && (await slackService.isSlackConnected())) {
      const [sender] = await db
        .select({ name: usersTable.name, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      const prefix = sender ? `*${sender.name}* (${sender.role}): ` : "";
      await slackService
        .sendMessage(project.slackChannelId, `${prefix}${content}`)
        .catch((err) => console.error("Slack mirror failed:", err));
    }

    res.status(201).json(message);
  },
);

router.get(
  "/client/drive-files",
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;

    if (!(await driveService.isDriveConnected())) {
      res.json([]);
      return;
    }

    const projects = await db
      .select()
      .from(projectsTable)
      .where(userProjectsFilter(userId, req.user!.role));

    const projectsWithFolders = projects.filter((p) => !!p.driveFolderId);
    if (projectsWithFolders.length === 0) {
      res.json([]);
      return;
    }

    const results = await Promise.all(
      projectsWithFolders.map(async (project) => {
        const files = await driveService.listFiles(project.driveFolderId!);
        return {
          projectId: project.id,
          projectName: project.name,
          files,
        };
      }),
    );

    res.json(results.filter((r) => r.files.length > 0));
  },
);

router.get(
  "/client/drive-files/:fileId/download",
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;

    if (!(await driveService.isDriveConnected())) {
      res.status(404).json({ error: "Drive not connected" });
      return;
    }

    const file = await driveService.getFileMetadata(req.params.fileId);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const userProjects = await db
      .select()
      .from(projectsTable)
      .where(userProjectsFilter(userId, req.user!.role));

    const allowedFolderIds = new Set(
      userProjects.map((p) => p.driveFolderId).filter((v): v is string => !!v),
    );
    const fileParents = file.parents ?? [];
    const allowed = fileParents.some((p) => allowedFolderIds.has(p));

    if (!allowed) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const url = await driveService.getDownloadUrl(req.params.fileId);
    if (!url) {
      res.status(404).json({ error: "Download URL not available" });
      return;
    }
    res.json({ url });
  },
);

router.post(
  "/client/deliverables/:id/approve",
  requireRole("client", "owner", "partner"),
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
      .where(projectAccessFilter(deliverable.projectId, userId, req.user!.role))
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

    void notifyDeliverableApproved({
      deliverableId,
      approverUserId: userId,
      approverName: req.user!.name ?? "The client",
      comment: comment || null,
    });

    res.json(review);
  },
);

router.post(
  "/client/deliverables/:id/request-revision",
  requireRole("client", "owner", "partner"),
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
      .where(projectAccessFilter(deliverable.projectId, userId, req.user!.role))
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
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(userProjectsFilter(userId, req.user!.role));

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
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(userProjectsFilter(userId, req.user!.role));

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
  requireRole("client", "owner", "partner"),
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
  requireRole("client", "owner", "partner"),
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
      .where(userProjectsFilter(userId, req.user!.role));

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

router.get(
  "/client/invoices",
  requireRole("client", "owner", "partner"),
  async (req, res) => {
    const userId = req.user!.id;

    const projects = await db
      .select()
      .from(projectsTable)
      .where(userProjectsFilter(userId, req.user!.role));

    if (projects.length === 0) {
      res.json([]);
      return;
    }

    const projectIds = projects.map((p) => p.id);

    const invoices = await db
      .select()
      .from(invoicesTable)
      .where(inArray(invoicesTable.projectId, projectIds))
      .orderBy(desc(invoicesTable.createdAt));

    res.json(invoices);
  },
);

export default router;
