import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { csrfHeaders } from "../lib/csrf";
import { isSessionExpiredResponse, notifySessionExpired } from "../lib/session-expired";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase();
  const csrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method) ? csrfHeaders() : {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...csrf,
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    const message = err.error || "Request failed";
    const expired = isSessionExpiredResponse(res.status, message);
    if (expired) {
      notifySessionExpired(expired);
    }
    throw new Error(message);
  }

  return res.json();
}

export interface IntegrationStatus {
  stripe: boolean;
  google_drive: boolean;
  slack: boolean;
  docusign: boolean;
}

export interface IntegrationSetting {
  id: string | null;
  type: string;
  enabled: boolean;
  config: Record<string, string>;
  encrypted?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VaultStatus {
  active: boolean;
  totalWithKeys: number;
  encryptedCount: number;
  unencryptedCount: number;
}

export interface InvoiceData {
  id: string;
  projectId: string;
  stripeInvoiceId: string | null;
  stripePaymentIntentId: string | null;
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
  updatedAt: string;
}

export function useIntegrationStatus() {
  const { user } = useAuth();
  return useQuery<IntegrationStatus>({
    queryKey: ["/api/integrations/status"],
    queryFn: () => apiFetch("/integrations/status"),
    enabled: !!user,
    staleTime: 60000,
  });
}

export function useIntegrations() {
  const { user } = useAuth();
  return useQuery<IntegrationSetting[]>({
    queryKey: ["/api/integrations"],
    queryFn: () => apiFetch("/integrations"),
    enabled: !!user,
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, enabled, config }: { type: string; enabled?: boolean; config?: Record<string, string> }) =>
      apiFetch(`/integrations/${type}`, {
        method: "PUT",
        body: JSON.stringify({ enabled, config }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type: string) =>
      apiFetch(`/integrations/${type}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/status"] });
    },
  });
}

export function useProjectInvoices(projectId: string) {
  const { user } = useAuth();
  return useQuery<InvoiceData[]>({
    queryKey: [`/api/projects/${projectId}/invoices`],
    queryFn: () => apiFetch(`/projects/${projectId}/invoices`),
    enabled: !!projectId && !!user,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, ...data }: { projectId: string; description: string; amount: number; dueDate?: string; customerEmail?: string }) =>
      apiFetch(`/projects/${projectId}/invoices`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/invoices`] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) =>
      apiFetch(`/invoices/${invoiceId}/send`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });
}

export interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

export function useDriveFolders(enabled: boolean = true, parentId?: string) {
  const { user } = useAuth();
  const qs = parentId ? `?parentId=${encodeURIComponent(parentId)}` : "";
  return useQuery<DriveFolder[]>({
    queryKey: ["/api/integrations/drive/folders", parentId ?? "root"],
    queryFn: () => apiFetch(`/integrations/drive/folders${qs}`),
    enabled: !!user && enabled,
    staleTime: 30000,
  });
}

export interface SlackChannel {
  id: string;
  name: string;
}

export function useSlackChannels(enabled: boolean = true) {
  const { user } = useAuth();
  return useQuery<SlackChannel[]>({
    queryKey: ["/api/integrations/slack/channels"],
    queryFn: () => apiFetch("/integrations/slack/channels"),
    enabled: !!user && enabled,
    staleTime: 30000,
  });
}

export function useVaultStatus() {
  const { user } = useAuth();
  return useQuery<VaultStatus>({
    queryKey: ["/api/integrations/vault"],
    queryFn: () => apiFetch("/integrations/vault"),
    enabled: !!user,
    staleTime: 30000,
  });
}

export interface VaultRotateResult {
  message: string;
  rowsRotated: number;
  valuesRotated: number;
  valuesSkipped: number;
}

export function useRotateVault() {
  const queryClient = useQueryClient();

  return useMutation<VaultRotateResult, Error, { oldKey: string; newKey: string }>({
    mutationFn: ({ oldKey, newKey }) =>
      apiFetch("/integrations/vault/rotate", {
        method: "POST",
        body: JSON.stringify({ oldKey, newKey }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/vault"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });
}

export function useEncryptExisting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch("/integrations/vault/encrypt-existing", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/vault"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });
}
