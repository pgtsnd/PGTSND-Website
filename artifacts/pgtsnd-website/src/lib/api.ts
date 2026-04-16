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
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

  getProjects: () => apiFetch<Project[]>("/projects"),

  getProjectTasks: (projectId: string) =>
    apiFetch<TaskSummary[]>(`/client/projects/${projectId}/tasks`),

  getProjectTeam: (projectId: string) =>
    apiFetch<TeamMember[]>(`/client/projects/${projectId}/team`),

  getProjectDeliverables: (projectId: string) =>
    apiFetch<Deliverable[]>(`/projects/${projectId}/deliverables`),

  getClientDeliverables: () => apiFetch<Deliverable[]>("/client/deliverables"),

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

  getClientMessages: () => apiFetch<Conversation[]>("/client/messages"),

  sendClientMessage: (projectId: string, content: string) =>
    apiFetch<Message>("/client/messages", {
      method: "POST",
      body: JSON.stringify({ projectId, content }),
    }),

  getClientContracts: () => apiFetch<Contract[]>("/client/contracts"),

  getClientInvoices: () => apiFetch<Invoice[]>("/client/invoices"),

  getProjectInvoices: (projectId: string) =>
    apiFetch<Invoice[]>(`/projects/${projectId}/invoices`),

  getDocuSignSigningUrl: (contractId: string) =>
    apiFetch<{ url: string }>(`/integrations/docusign/signing-url/${contractId}`),

  getProjectMessages: (projectId: string) =>
    apiFetch<Message[]>(`/projects/${projectId}/messages`),
};
