import { csrfHeaders } from "./csrf";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  phase: string;
  progress: number;
  dueDate: string | null;
  startDate: string | null;
  budget: number | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  calculatedProgress: number;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PendingReview {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  fileUrl: string | null;
  version: string | null;
  submittedAt: string | null;
  createdAt: string;
  projectName: string;
  reminderCount: number;
  lastReminderDay: number | null;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  senderName: string;
  senderInitials?: string;
  senderRole?: string;
  projectName?: string;
  isTeam?: boolean;
}

export interface DashboardData {
  projects: Project[];
  pendingReviews: PendingReview[];
  recentMessages: Message[];
}

export interface Conversation {
  projectId: string;
  projectName: string;
  messages: Message[];
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  slackBridged?: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

export interface DriveFolderGroup {
  projectId: string;
  projectName: string;
  files: DriveFile[];
}

export interface Deliverable {
  id: string;
  projectId: string;
  taskId: string | null;
  title: string;
  description: string | null;
  type: string;
  status: string;
  fileUrl: string | null;
  version: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  projectName: string;
}

export interface Review {
  id: string;
  deliverableId: string;
  reviewerId: string;
  status: string;
  comment: string | null;
  createdAt: string;
}

export interface DeliverableVersion {
  id: string;
  deliverableId: string;
  version: string;
  fileUrl: string;
  uploadedById: string | null;
  createdAt: string;
}

export interface Contract {
  id: string;
  projectId: string;
  title: string;
  type: string | null;
  status: string;
  amount: number | null;
  sentAt: string | null;
  signedAt: string | null;
  documentUrl: string | null;
  docusignEnvelopeId: string | null;
  docusignSigningUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  projectName: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string | null;
  description: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  dueDate: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  stripeHostedUrl: string | null;
  stripePdfUrl: string | null;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  role: string;
  name: string;
  initials: string | null;
  title: string | null;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  progress: number | null;
  sortOrder: number | null;
  assigneeName: string | null;
  assigneeInitials: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  title: string | null;
  initials: string | null;
  organizationName: string | null;
  emailNotifyReviews?: boolean;
  emailNotifyComments?: boolean;
}

export interface NotificationPreferences {
  emailNotifyReviews?: boolean;
  emailNotifyComments?: boolean;
}

export interface VideoCommentReplyData {
  id: string;
  commentId: string;
  authorId: string | null;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface VideoCommentWithReplies {
  id: string;
  deliverableId: string;
  authorId: string | null;
  authorName: string;
  timestampSeconds: number;
  content: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedNote: string | null;
  replies: VideoCommentReplyData[];
}

export interface ReviewLinkData {
  id: string;
  deliverableId: string;
  token: string;
  createdBy: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface PublicReviewData {
  deliverable: Deliverable;
  comments: VideoCommentWithReplies[];
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();
  const csrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method) ? csrfHeaders() : {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...csrf,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(
      typeof body === "object" && body !== null && "error" in body
        ? String(body.error)
        : `API error ${res.status}`,
      res.status,
    );
  }

  return res.json();
}

export const api = {
  getClientDashboard: () => apiFetch<DashboardData>("/client/dashboard"),

  getClientProfile: () => apiFetch<UserProfile>("/client/profile"),

  updateClientProfile: (data: Record<string, string>) =>
    apiFetch<UserProfile>("/client/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateNotificationPreferences: (data: NotificationPreferences) =>
    apiFetch<UserProfile>("/users/me/notifications", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getProjects: () => apiFetch<Project[]>("/projects"),

  getProjectTasks: (projectId: string) =>
    apiFetch<TaskSummary[]>(`/client/projects/${projectId}/tasks`),

  getProjectTeam: (projectId: string) =>
    apiFetch<TeamMember[]>(`/client/projects/${projectId}/team`),

  getProjectDeliverables: (projectId: string) =>
    apiFetch<Deliverable[]>(`/projects/${projectId}/deliverables`),

  getClientDeliverables: () => apiFetch<Deliverable[]>("/client/deliverables"),

  getClientDriveFiles: () =>
    apiFetch<DriveFolderGroup[]>("/client/drive-files"),

  getClientDriveDownloadUrl: (fileId: string) =>
    apiFetch<{ url: string }>(`/client/drive-files/${fileId}/download`),

  approveDeliverable: (id: string, comment?: string) =>
    apiFetch<Review>(`/client/deliverables/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  requestRevision: (id: string, comment: string) =>
    apiFetch<Review>(`/client/deliverables/${id}/request-revision`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  getDeliverableReviews: (deliverableId: string) =>
    apiFetch<Review[]>(`/deliverables/${deliverableId}/reviews`),

  getDeliverableVersions: (deliverableId: string) =>
    apiFetch<DeliverableVersion[]>(`/deliverables/${deliverableId}/versions`),

  getClientMessages: () => apiFetch<Conversation[]>("/client/messages"),

  sendClientMessage: (projectId: string, content: string) =>
    apiFetch<Message>("/client/messages", {
      method: "POST",
      body: JSON.stringify({ projectId, content }),
    }),

  getClientContracts: () => apiFetch<Contract[]>("/client/contracts"),

  getClientInvoices: () => apiFetch<Invoice[]>("/client/invoices"),

  getAllInvoices: () => apiFetch<Invoice[]>("/invoices"),

  getProjectInvoices: (projectId: string) =>
    apiFetch<Invoice[]>(`/projects/${projectId}/invoices`),

  createInvoice: (projectId: string, data: { description: string; amount: number; invoiceNumber?: string; status?: string; dueDate?: string }) =>
    apiFetch<Invoice>(`/projects/${projectId}/invoices`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateInvoice: (id: string, data: Partial<Pick<Invoice, "status" | "description" | "amount" | "dueDate" | "invoiceNumber">>) =>
    apiFetch<Invoice>(`/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteInvoice: (id: string) =>
    apiFetch<{ message: string }>(`/invoices/${id}`, { method: "DELETE" }),

  sendInvoice: (id: string) =>
    apiFetch<Invoice>(`/invoices/${id}/send`, { method: "POST" }),

  createCheckoutSession: (id: string, successUrl: string, cancelUrl: string) =>
    apiFetch<{ url: string }>(`/invoices/${id}/checkout`, {
      method: "POST",
      body: JSON.stringify({ successUrl, cancelUrl }),
    }),

  getPaymentDetails: (id: string) =>
    apiFetch<{
      paymentIntentId: string | null;
      amount: number;
      currency: string;
      status: string;
      paymentMethod: string | null;
      receiptUrl: string | null;
      paidAt: string | null;
    }>(`/invoices/${id}/payment`),

  getDocuSignSigningUrl: (contractId: string) =>
    apiFetch<{ url: string }>(`/integrations/docusign/signing-url/${contractId}`),

  getProjectMessages: (projectId: string) =>
    apiFetch<Message[]>(`/projects/${projectId}/messages`),

  getVideoComments: (deliverableId: string) =>
    apiFetch<VideoCommentWithReplies[]>(`/deliverables/${deliverableId}/comments`),

  addVideoComment: (deliverableId: string, timestampSeconds: number, content: string) =>
    apiFetch<VideoCommentWithReplies>(`/deliverables/${deliverableId}/comments`, {
      method: "POST",
      body: JSON.stringify({ timestampSeconds, content }),
    }),

  resolveVideoComment: (commentId: string, resolved: boolean, note?: string) =>
    apiFetch<Omit<VideoCommentWithReplies, "replies">>(`/comments/${commentId}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolved, note }),
    }),

  addVideoCommentReply: (commentId: string, content: string) =>
    apiFetch<VideoCommentReplyData>(`/comments/${commentId}/replies`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  createReviewLink: (deliverableId: string, expiresInDays?: number) =>
    apiFetch<ReviewLinkData>(`/deliverables/${deliverableId}/review-links`, {
      method: "POST",
      body: JSON.stringify({ expiresInDays }),
    }),

  getReviewLinks: (deliverableId: string) =>
    apiFetch<ReviewLinkData[]>(`/deliverables/${deliverableId}/review-links`),

  getPublicReview: (token: string) =>
    apiFetch<PublicReviewData>(`/public/review/${token}`),

  addPublicComment: (token: string, timestampSeconds: number, content: string, authorName: string) =>
    apiFetch<VideoCommentWithReplies>(`/public/review/${token}/comments`, {
      method: "POST",
      body: JSON.stringify({ timestampSeconds, content, authorName }),
    }),

  addPublicCommentReply: (token: string, commentId: string, content: string, authorName: string) =>
    apiFetch<VideoCommentReplyData>(`/public/review/${token}/comments/${commentId}/replies`, {
      method: "POST",
      body: JSON.stringify({ content, authorName }),
    }),

  submitForReview: (deliverableId: string) =>
    apiFetch<Deliverable>(`/deliverables/${deliverableId}/submit-for-review`, {
      method: "POST",
    }),

  getProjectPhases: (projectId: string) =>
    apiFetch<Phase[]>(`/projects/${projectId}/phases`),

  createPhase: (projectId: string, data: { name: string; description?: string; startDate?: string; endDate?: string; sortOrder?: number }) =>
    apiFetch<Phase>(`/projects/${projectId}/phases`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePhase: (id: string, data: { name?: string; description?: string; sortOrder?: number }) =>
    apiFetch<Phase>(`/phases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePhase: (id: string) =>
    apiFetch<{ message: string }>(`/phases/${id}`, { method: "DELETE" }),

  createTask: (projectId: string, data: { title: string; description?: string; phaseId?: string; status?: string; sortOrder?: number }) =>
    apiFetch<any>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteTask: (id: string) =>
    apiFetch<{ message: string }>(`/tasks/${id}`, { method: "DELETE" }),

  createTaskItem: (taskId: string, data: { title: string; sortOrder?: number }) =>
    apiFetch<any>(`/tasks/${taskId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteTaskItem: (id: string) =>
    apiFetch<{ message: string }>(`/task-items/${id}`, { method: "DELETE" }),
};
