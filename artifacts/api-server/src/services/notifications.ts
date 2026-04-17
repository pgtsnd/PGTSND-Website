import {
  db,
  deliverablesTable,
  projectsTable,
  projectMembersTable,
  projectNotificationMutesTable,
  usersTable,
  videoCommentsTable,
  videoCommentRepliesTable,
} from "@workspace/db";
import { and, eq, ne, inArray, isNotNull } from "drizzle-orm";
import { logger } from "../lib/logger";
import { sendEmail, getAppBaseUrl } from "./email";
import {
  renderReviewReadyEmail,
  renderNewCommentEmail,
  renderPublicCommentEmail,
  renderCommentResolvedEmail,
} from "./email-templates";

async function filterOutProjectMutes(
  projectId: string,
  userIds: string[],
): Promise<string[]> {
  if (userIds.length === 0) return userIds;
  const mutes = await db
    .select({ userId: projectNotificationMutesTable.userId })
    .from(projectNotificationMutesTable)
    .where(
      and(
        eq(projectNotificationMutesTable.projectId, projectId),
        inArray(projectNotificationMutesTable.userId, userIds),
      ),
    );
  const muted = new Set(mutes.map((m) => m.userId));
  return userIds.filter((id) => !muted.has(id));
}

interface MinimalUser {
  id: string;
  email: string;
  name: string | null;
  emailNotifyReviews: boolean;
  emailNotifyComments: boolean;
}

async function loadUsersByIds(userIds: string[]): Promise<MinimalUser[]> {
  if (userIds.length === 0) return [];
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      emailNotifyReviews: usersTable.emailNotifyReviews,
      emailNotifyComments: usersTable.emailNotifyComments,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));
  return users;
}

async function loadDeliverableContext(deliverableId: string) {
  const [deliverable] = await db
    .select()
    .from(deliverablesTable)
    .where(eq(deliverablesTable.id, deliverableId))
    .limit(1);
  if (!deliverable) return null;

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, deliverable.projectId))
    .limit(1);
  if (!project) return null;

  return { deliverable, project };
}

function clientReviewLink(deliverableId: string): string {
  return `${getAppBaseUrl()}/client-hub/review?deliverableId=${encodeURIComponent(deliverableId)}`;
}

function teamReviewLink(projectId: string, deliverableId: string): string {
  return `${getAppBaseUrl()}/team/projects/${projectId}?tab=review&deliverableId=${encodeURIComponent(deliverableId)}`;
}

/**
 * Sent when a deliverable is submitted for client review.
 * Notifies the project's client (and any client-role project members).
 */
export async function notifyDeliverableSubmittedForReview(
  deliverableId: string,
): Promise<void> {
  try {
    const ctx = await loadDeliverableContext(deliverableId);
    if (!ctx) return;
    const { deliverable, project } = ctx;

    const recipientIds = new Set<string>();
    if (project.clientId) recipientIds.add(project.clientId);

    const memberRows = await db
      .select({ userId: projectMembersTable.userId, role: usersTable.role })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(
        and(
          eq(projectMembersTable.projectId, project.id),
          eq(usersTable.role, "client"),
        ),
      );
    for (const m of memberRows) recipientIds.add(m.userId);

    if (recipientIds.size === 0) {
      logger.info(
        { deliverableId, projectId: project.id },
        "No client recipients for review notification",
      );
      return;
    }

    const filteredIds = await filterOutProjectMutes(project.id, [
      ...recipientIds,
    ]);
    if (filteredIds.length === 0) return;
    const recipients = await loadUsersByIds(filteredIds);
    const link = clientReviewLink(deliverable.id);

    await Promise.all(
      recipients
        .filter((u) => u.emailNotifyReviews && u.email)
        .map((u) =>
          sendEmail({
            to: u.email,
            subject: `New cut ready for review: ${deliverable.title}`,
            text:
              `Hi ${u.name ?? "there"},\n\n` +
              `A new cut for "${project.name}" is ready for your review.\n\n` +
              `Title: ${deliverable.title}\n` +
              `Open the review page: ${link}\n\n` +
              `— PGTSND Productions`,
            html: renderReviewReadyEmail({
              recipientName: u.name,
              projectName: project.name,
              deliverableTitle: deliverable.title,
              link,
            }),
          }),
        ),
    );
  } catch (err) {
    logger.error({ err, deliverableId }, "notifyDeliverableSubmittedForReview failed");
  }
}

async function collectCommentRecipientIds(
  deliverableId: string,
  excludeAuthorId: string | null,
): Promise<string[]> {
  const ids = new Set<string>();

  const comments = await db
    .select({ authorId: videoCommentsTable.authorId })
    .from(videoCommentsTable)
    .where(
      and(
        eq(videoCommentsTable.deliverableId, deliverableId),
        isNotNull(videoCommentsTable.authorId),
      ),
    );
  for (const c of comments) {
    if (c.authorId) ids.add(c.authorId);
  }

  // Include reply authors too
  const replyAuthors = await db
    .select({ authorId: videoCommentRepliesTable.authorId })
    .from(videoCommentRepliesTable)
    .innerJoin(
      videoCommentsTable,
      eq(videoCommentsTable.id, videoCommentRepliesTable.commentId),
    )
    .where(
      and(
        eq(videoCommentsTable.deliverableId, deliverableId),
        isNotNull(videoCommentRepliesTable.authorId),
      ),
    );
  for (const r of replyAuthors) {
    if (r.authorId) ids.add(r.authorId);
  }

  if (excludeAuthorId) ids.delete(excludeAuthorId);
  return [...ids];
}

/**
 * Sent when a comment or reply is added on a deliverable (internal review).
 * Notifies all prior commenters/repliers and the project team (excluding the actor).
 */
export async function notifyNewVideoComment(opts: {
  deliverableId: string;
  actorUserId: string | null;
  actorName: string;
  content: string;
  timestampSeconds?: number;
  isReply?: boolean;
}): Promise<void> {
  try {
    const ctx = await loadDeliverableContext(opts.deliverableId);
    if (!ctx) return;
    const { deliverable, project } = ctx;

    const recipientIds = new Set<string>(
      await collectCommentRecipientIds(opts.deliverableId, opts.actorUserId),
    );

    const teamMembers = await db
      .select({ userId: projectMembersTable.userId, role: usersTable.role })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(eq(projectMembersTable.projectId, project.id));
    for (const m of teamMembers) {
      if (m.userId !== opts.actorUserId) recipientIds.add(m.userId);
    }

    if (recipientIds.size === 0) return;

    const filteredIds = await filterOutProjectMutes(project.id, [
      ...recipientIds,
    ]);
    if (filteredIds.length === 0) return;
    const recipients = await loadUsersByIds(filteredIds);
    const link = teamReviewLink(project.id, deliverable.id);
    const tsLabel =
      opts.timestampSeconds !== undefined && !opts.isReply
        ? ` at ${formatTimestamp(opts.timestampSeconds)}`
        : "";
    const kind = opts.isReply ? "reply" : "comment";

    await Promise.all(
      recipients
        .filter((u) => u.emailNotifyComments && u.email)
        .map((u) =>
          sendEmail({
            to: u.email,
            subject: `New ${kind} on "${deliverable.title}"`,
            text:
              `${opts.actorName} left a ${kind}${tsLabel} on "${deliverable.title}" (${project.name}):\n\n` +
              `"${opts.content}"\n\n` +
              `View the conversation: ${link}\n\n` +
              `— PGTSND Productions`,
            html: renderNewCommentEmail({
              actorName: opts.actorName,
              projectName: project.name,
              deliverableTitle: deliverable.title,
              content: opts.content,
              timestampLabel:
                opts.timestampSeconds !== undefined && !opts.isReply
                  ? formatTimestamp(opts.timestampSeconds)
                  : null,
              isReply: Boolean(opts.isReply),
              link,
            }),
          }),
        ),
    );
  } catch (err) {
    logger.error(
      { err, deliverableId: opts.deliverableId },
      "notifyNewVideoComment failed",
    );
  }
}

/**
 * Sent when a comment/reply is added via a public shared review link.
 * Notifies the team (project members + deliverable author equivalents).
 */
export async function notifyPublicReviewComment(opts: {
  deliverableId: string;
  authorName: string;
  content: string;
  timestampSeconds?: number;
  isReply?: boolean;
}): Promise<void> {
  try {
    const ctx = await loadDeliverableContext(opts.deliverableId);
    if (!ctx) return;
    const { deliverable, project } = ctx;

    const recipientIds = new Set<string>();
    const teamMembers = await db
      .select({ userId: projectMembersTable.userId, role: usersTable.role })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(
        and(
          eq(projectMembersTable.projectId, project.id),
          ne(usersTable.role, "client"),
        ),
      );
    for (const m of teamMembers) recipientIds.add(m.userId);

    // Also include any owner/partner/crew who previously commented internally
    const internalAuthors = await collectCommentRecipientIds(
      opts.deliverableId,
      null,
    );
    if (internalAuthors.length > 0) {
      const authorRows = await db
        .select({ id: usersTable.id, role: usersTable.role })
        .from(usersTable)
        .where(inArray(usersTable.id, internalAuthors));
      for (const a of authorRows) {
        if (a.role !== "client") recipientIds.add(a.id);
      }
    }

    if (recipientIds.size === 0) return;

    const filteredIds = await filterOutProjectMutes(project.id, [
      ...recipientIds,
    ]);
    if (filteredIds.length === 0) return;
    const recipients = await loadUsersByIds(filteredIds);
    const link = teamReviewLink(project.id, deliverable.id);
    const tsLabel =
      opts.timestampSeconds !== undefined && !opts.isReply
        ? ` at ${formatTimestamp(opts.timestampSeconds)}`
        : "";
    const kind = opts.isReply ? "reply" : "comment";

    await Promise.all(
      recipients
        .filter((u) => u.emailNotifyComments && u.email)
        .map((u) =>
          sendEmail({
            to: u.email,
            subject: `Public ${kind} on "${deliverable.title}"`,
            text:
              `${opts.authorName} (via shared review link) left a ${kind}${tsLabel} on "${deliverable.title}" (${project.name}):\n\n` +
              `"${opts.content}"\n\n` +
              `View the review: ${link}\n\n` +
              `— PGTSND Productions`,
            html: renderPublicCommentEmail({
              authorName: opts.authorName,
              projectName: project.name,
              deliverableTitle: deliverable.title,
              content: opts.content,
              timestampLabel:
                opts.timestampSeconds !== undefined && !opts.isReply
                  ? formatTimestamp(opts.timestampSeconds)
                  : null,
              isReply: Boolean(opts.isReply),
              link,
            }),
          }),
        ),
    );
  } catch (err) {
    logger.error(
      { err, deliverableId: opts.deliverableId },
      "notifyPublicReviewComment failed",
    );
  }
}

/**
 * Sent when a client approves a deliverable.
 * Notifies the project's team members (owner/partner/crew) — i.e. non-client
 * project members — respecting their `emailNotifyReviews` preference.
 */
export async function notifyDeliverableApproved(opts: {
  deliverableId: string;
  approverUserId: string | null;
  approverName: string;
  comment?: string | null;
}): Promise<void> {
  try {
    const ctx = await loadDeliverableContext(opts.deliverableId);
    if (!ctx) return;
    const { deliverable, project } = ctx;

    const recipientIds = new Set<string>();
    const teamMembers = await db
      .select({ userId: projectMembersTable.userId, role: usersTable.role })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(
        and(
          eq(projectMembersTable.projectId, project.id),
          ne(usersTable.role, "client"),
        ),
      );
    for (const m of teamMembers) {
      if (m.userId !== opts.approverUserId) recipientIds.add(m.userId);
    }

    if (recipientIds.size === 0) {
      logger.info(
        { deliverableId: opts.deliverableId, projectId: project.id },
        "No team recipients for approval notification",
      );
      return;
    }

    const filteredIds = await filterOutProjectMutes(project.id, [
      ...recipientIds,
    ]);
    if (filteredIds.length === 0) return;
    const recipients = await loadUsersByIds(filteredIds);
    const link = teamReviewLink(project.id, deliverable.id);
    const trimmedComment = opts.comment?.trim();

    await Promise.all(
      recipients
        .filter((u) => u.emailNotifyReviews && u.email)
        .map((u) =>
          sendEmail({
            to: u.email,
            subject: `Approved: "${deliverable.title}" (${project.name})`,
            text:
              `Hi ${u.name ?? "there"},\n\n` +
              `${opts.approverName} approved "${deliverable.title}" on ${project.name}.\n\n` +
              (trimmedComment ? `Comment:\n"${trimmedComment}"\n\n` : "") +
              `View the deliverable: ${link}\n\n` +
              `— PGTSND Productions`,
          }),
        ),
    );
  } catch (err) {
    logger.error(
      { err, deliverableId: opts.deliverableId },
      "notifyDeliverableApproved failed",
    );
  }
}

/**
 * Sent when a client requests revisions on a deliverable.
 * Notifies the project's team members (owner/partner/crew) — i.e. non-client
 * project members — respecting their `emailNotifyReviews` preference.
 */
export async function notifyDeliverableRevisionRequested(opts: {
  deliverableId: string;
  requesterUserId: string | null;
  requesterName: string;
  comment: string;
}): Promise<void> {
  try {
    const ctx = await loadDeliverableContext(opts.deliverableId);
    if (!ctx) return;
    const { deliverable, project } = ctx;

    const recipientIds = new Set<string>();
    const teamMembers = await db
      .select({ userId: projectMembersTable.userId, role: usersTable.role })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(
        and(
          eq(projectMembersTable.projectId, project.id),
          ne(usersTable.role, "client"),
        ),
      );
    for (const m of teamMembers) {
      if (m.userId !== opts.requesterUserId) recipientIds.add(m.userId);
    }

    if (recipientIds.size === 0) {
      logger.info(
        { deliverableId: opts.deliverableId, projectId: project.id },
        "No team recipients for revision-request notification",
      );
      return;
    }

    const filteredIds = await filterOutProjectMutes(project.id, [
      ...recipientIds,
    ]);
    if (filteredIds.length === 0) return;
    const recipients = await loadUsersByIds(filteredIds);
    const link = teamReviewLink(project.id, deliverable.id);
    const trimmedComment = opts.comment.trim();

    await Promise.all(
      recipients
        .filter((u) => u.emailNotifyReviews && u.email)
        .map((u) =>
          sendEmail({
            to: u.email,
            subject: `Revisions requested: "${deliverable.title}" (${project.name})`,
            text:
              `Hi ${u.name ?? "there"},\n\n` +
              `${opts.requesterName} requested revisions on "${deliverable.title}" for ${project.name}.\n\n` +
              `Revision notes:\n"${trimmedComment}"\n\n` +
              `View the deliverable: ${link}\n\n` +
              `— PGTSND Productions`,
          }),
        ),
    );
  } catch (err) {
    logger.error(
      { err, deliverableId: opts.deliverableId },
      "notifyDeliverableRevisionRequested failed",
    );
  }
}

/**
 * Sent when a team member resolves a video review comment.
 * Notifies the original comment author with the resolution note (if any) and
 * a deep link back to the review. Anonymous public reviewers (no authorId)
 * are gracefully skipped.
 */
export async function notifyVideoCommentResolved(opts: {
  commentId: string;
  resolverUserId: string | null;
  resolverName: string;
  resolutionNote: string | null;
}): Promise<void> {
  try {
    const [comment] = await db
      .select()
      .from(videoCommentsTable)
      .where(eq(videoCommentsTable.id, opts.commentId))
      .limit(1);
    if (!comment) return;

    // Anonymous/public reviewers without an account are gracefully skipped.
    if (!comment.authorId) return;

    // Don't notify the resolver if they happen to be the original author.
    if (comment.authorId === opts.resolverUserId) return;

    const ctx = await loadDeliverableContext(comment.deliverableId);
    if (!ctx) return;
    const { deliverable, project } = ctx;

    const [author] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        emailNotifyComments: usersTable.emailNotifyComments,
      })
      .from(usersTable)
      .where(eq(usersTable.id, comment.authorId))
      .limit(1);

    if (!author || !author.email) return;
    if (!author.emailNotifyComments) return;

    // Respect per-project mute setting (consistent with other notifications).
    const allowed = await filterOutProjectMutes(project.id, [author.id]);
    if (allowed.length === 0) return;

    const link =
      author.role === "client"
        ? clientReviewLink(deliverable.id)
        : teamReviewLink(project.id, deliverable.id);

    const tsLabel = formatTimestamp(comment.timestampSeconds);

    await sendEmail({
      to: author.email,
      subject: `Resolved: your comment on "${deliverable.title}"`,
      text:
        `Hi ${author.name ?? "there"},\n\n` +
        `${opts.resolverName} marked your comment at ${tsLabel} on "${deliverable.title}" (${project.name}) as resolved.\n\n` +
        `Your comment:\n"${comment.content}"\n\n` +
        (opts.resolutionNote ? `Resolution note:\n"${opts.resolutionNote}"\n\n` : "") +
        `View the review: ${link}\n\n` +
        `— PGTSND Productions`,
      html: renderCommentResolvedEmail({
        recipientName: author.name,
        resolverName: opts.resolverName,
        projectName: project.name,
        deliverableTitle: deliverable.title,
        originalComment: comment.content,
        timestampLabel: tsLabel,
        resolutionNote: opts.resolutionNote,
        link,
      }),
    });
  } catch (err) {
    logger.error(
      { err, commentId: opts.commentId },
      "notifyVideoCommentResolved failed",
    );
  }
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
