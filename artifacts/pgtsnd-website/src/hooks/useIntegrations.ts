import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
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
  createdAt: string | null;
  updatedAt: string | null;
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
