import {
  useListProjects,
  useGetProject,
  useListProjectMembers,
  useListOrganizations,
  useListProjectTasks,
  useListProjectDeliverables,
  useListProjectMessages,
  useListProjectContracts,
  useListUsers,
  useCreateMessage,
  useUpdateUser,
} from "@workspace/api-client-react";
import type {
  Project,
  Organization,
  User,
  Task,
  Deliverable,
  Message,
  Contract,
  ProjectMember,
} from "@workspace/api-client-react";
import { useTeamAuth } from "../contexts/TeamAuthContext";

export type { Project, Organization, User, Task, Deliverable, Message, Contract, ProjectMember };

export function useProjects() {
  const { userId } = useTeamAuth();
  return useListProjects({ query: { enabled: !!userId } });
}

export function useProject(id: string) {
  const { userId } = useTeamAuth();
  return useGetProject(id, {
    query: { enabled: !!id && !!userId },
  });
}

export function useProjectMembers(projectId: string) {
  const { userId } = useTeamAuth();
  return useListProjectMembers(projectId, {
    query: { enabled: !!projectId && !!userId },
  });
}

export function useOrganizations() {
  const { userId } = useTeamAuth();
  return useListOrganizations({ query: { enabled: !!userId } });
}

export function useProjectTasks(projectId: string) {
  const { userId } = useTeamAuth();
  return useListProjectTasks(projectId, {
    query: { enabled: !!projectId && !!userId },
  });
}

export function useProjectDeliverables(projectId: string) {
  const { userId } = useTeamAuth();
  return useListProjectDeliverables(projectId, {
    query: { enabled: !!projectId && !!userId },
  });
}

export function useProjectMessages(projectId: string) {
  const { userId } = useTeamAuth();
  return useListProjectMessages(projectId, {
    query: { enabled: !!projectId && !!userId },
  });
}

export function useProjectContracts(projectId: string) {
  const { userId } = useTeamAuth();
  return useListProjectContracts(projectId, {
    query: { enabled: !!projectId && !!userId },
  });
}

export function useUsers() {
  const { userId } = useTeamAuth();
  return useListUsers({ query: { enabled: !!userId } });
}

export function useSendMessage() {
  return useCreateMessage();
}

export function useUpdateProfile() {
  return useUpdateUser();
}

export function useProjectWithDetails(projectId: string) {
  const project = useProject(projectId);
  const members = useProjectMembers(projectId);
  const tasks = useProjectTasks(projectId);
  const deliverables = useProjectDeliverables(projectId);
  const contracts = useProjectContracts(projectId);
  const { userMap } = useTeamAuth();

  const enrichedMembers = (members.data ?? []).map((m: ProjectMember) => {
    const user = userMap.get(m.userId);
    return {
      ...m,
      name: user?.name ?? "Unknown",
      initials: user?.initials ?? "??",
      title: user?.title ?? m.role ?? "",
    };
  });

  return {
    project: project.data,
    members: enrichedMembers,
    tasks: tasks.data ?? [],
    deliverables: deliverables.data ?? [],
    contracts: contracts.data ?? [],
    isLoading: project.isLoading || members.isLoading || tasks.isLoading,
  };
}

export function useDashboardData() {
  const projects = useProjects();
  const orgs = useOrganizations();
  const users = useUsers();
  const { userMap } = useTeamAuth();

  const orgMap = new Map<string, Organization>();
  if (orgs.data) {
    for (const o of orgs.data) {
      orgMap.set(o.id, o);
    }
  }

  const enrichedProjects = (projects.data ?? []).map((p: Project) => ({
    ...p,
    organizationName: p.organizationId ? orgMap.get(p.organizationId)?.name ?? "" : "",
  }));

  return {
    projects: enrichedProjects,
    organizations: orgs.data ?? [],
    users: users.data ?? [],
    orgMap,
    userMap,
    isLoading: projects.isLoading || orgs.isLoading || users.isLoading,
  };
}

export function formatPhase(phase: string): string {
  const map: Record<string, string> = {
    pre_production: "Pre-Production",
    production: "Production",
    post_production: "Post-Production",
    review: "Review",
    delivered: "Delivered",
  };
  return map[phase] ?? phase;
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    lead: "Lead",
    active: "Active",
    in_progress: "Active",
    review: "Review",
    delivered: "Delivered",
    archived: "Archived",
  };
  return map[status] ?? status;
}

export function isActiveStatus(status: string): boolean {
  return status === "active" || status === "in_progress";
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}
