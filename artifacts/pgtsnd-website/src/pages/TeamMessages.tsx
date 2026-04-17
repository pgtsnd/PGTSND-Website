import { useState, useEffect, useRef, useMemo } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { MessagesSkeleton, ErrorState, SkeletonCard } from "../components/TeamLoadingStates";
import { useToast } from "../components/Toast";
import {
  useProjects,
  useProjectMessages,
  useSendMessage,
  useDmContacts,
  useDmConversations,
  useDmThread,
  useSendDirectMessage,
  useMarkDmRead,
  useUnreadSummary,
  useRecentClientActivity,
  timeAgo,
  type Project,
  type Message,
  type RecentClientMessage,
} from "../hooks/useTeamData";
import {
  getListDmConversationsQueryKey,
  getGetDmThreadQueryKey,
  getGetUnreadSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useIntegrationStatus, useSlackChannels } from "../hooks/useIntegrations";
import ProjectMuteToggle from "../components/ProjectMuteToggle";
import { api } from "../lib/api";

type Mode = "groups" | "dms";

type DmContact = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

type DmConversation = {
  partnerId: string;
  partnerName: string;
  partnerRole?: string | null;
  partnerAvatarUrl?: string | null;
  lastMessageContent: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  unreadCount: number;
};

export default function TeamMessages() {
  const { t } = useTheme();
  const { currentUser, userMap, isLoading: authLoading } = useTeamAuth();
  const { data: projects, isLoading: projLoading, isError: projError, refetch: refetchProjects } = useProjects();
  const { data: contacts } = useDmContacts();
  const { data: conversations } = useDmConversations();
  const { data: unread } = useUnreadSummary();
  const { data: recentClientMessages } = useRecentClientActivity();

  const [mode, setMode] = useState<Mode>("groups");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedDmUserId, setSelectedDmUserId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [mutedProjectIds, setMutedProjectIds] = useState<Set<string>>(new Set());
  const mutedProjectIdsRef = useRef(mutedProjectIds);
  mutedProjectIdsRef.current = mutedProjectIds;

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenClientMessageIdsRef = useRef<Set<string>>(new Set());
  const notificationBaselineLoadedRef = useRef<boolean>(false);
  const { toast } = useToast();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const activeProjects = (projects ?? []).filter((p: Project) => p.status !== "archived");

  useEffect(() => {
    if (mode === "groups" && !selectedProjectId && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [mode, activeProjects, selectedProjectId]);

  useEffect(() => {
    if (mode === "dms" && !selectedDmUserId && conversations && conversations.length > 0) {
      setSelectedDmUserId((conversations[0] as DmConversation).partnerId);
    }
  }, [mode, conversations, selectedDmUserId]);

  const { data: groupMessages, isLoading: gmLoading, isError: gmError, refetch: refetchGm } =
    useProjectMessages(selectedProjectId);
  const { data: dmMessages, isLoading: dmLoading, isError: dmError, refetch: refetchDm } =
    useDmThread(selectedDmUserId);

  const sendGroupMutation = useSendMessage();
  const sendDmMutation = useSendDirectMessage();
  const markDmReadMutation = useMarkDmRead();

  const msgsLoading = mode === "groups" ? gmLoading : dmLoading;
  const msgsError = mode === "groups" ? gmError : dmError;
  const refetchMsgs = mode === "groups" ? refetchGm : refetchDm;
  const messages: Message[] = (mode === "groups" ? groupMessages : dmMessages) ?? [];

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  useEffect(() => {
    let cancelled = false;
    api
      .getProjectMutes()
      .then((res) => {
        if (cancelled) return;
        setMutedProjectIds(new Set(res.projectIds));
      })
      .catch(() => {
        // If the preload fails, ProjectMuteToggle will still update state
        // for the selected project on its own load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // Ignore — user can enable later via browser settings
      });
    }
  }, []);

  // Surface desktop notifications for new client messages across every project
  // the team member can access (not just the currently selected one). The
  // recent-client-activity endpoint batches this into a single poll regardless
  // of how many projects exist.
  useEffect(() => {
    if (!recentClientMessages) return;

    const isFirstLoad = !notificationBaselineLoadedRef.current;
    const seen = seenClientMessageIdsRef.current;
    const nextSeen = new Set<string>();
    const incoming: RecentClientMessage[] = [];

    for (const msg of recentClientMessages) {
      nextSeen.add(msg.id);
      if (!isFirstLoad && !seen.has(msg.id)) {
        incoming.push(msg);
      }
    }

    seenClientMessageIdsRef.current = nextSeen;
    notificationBaselineLoadedRef.current = true;

    if (isFirstLoad) return;
    if (
      typeof window === "undefined" ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }
    if (document.visibilityState === "visible" && document.hasFocus()) return;

    for (const msg of incoming) {
      const projectId = msg.projectId;
      if (mutedProjectIdsRef.current.has(projectId)) continue;
      try {
        const notification = new Notification(
          `New message from ${msg.senderName ?? "client"}`,
          {
            body: `${msg.projectName}: ${msg.content}`,
            tag: `pgtsnd-team-msg-${projectId}`,
          },
        );
        notification.onclick = () => {
          window.focus();
          setMode("groups");
          setSelectedProjectId(projectId);
          notification.close();
        };
      } catch {
        // Ignore notification errors (some browsers throw on unsupported configs)
      }
    }
  }, [recentClientMessages]);

  // mark DMs read when opening
  useEffect(() => {
    if (mode === "dms" && selectedDmUserId) {
      markDmReadMutation.mutate(
        { userId: selectedDmUserId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDmConversationsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetUnreadSummaryQueryKey() });
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedDmUserId]);

  const selectedProject = activeProjects.find((p: Project) => p.id === selectedProjectId);
  const selectedSlackChannelId = selectedProject?.slackChannelId ?? null;
  const { data: integrationStatus } = useIntegrationStatus();
  const slackConnected = !!integrationStatus?.slack;
  const {
    data: slackChannels,
    isLoading: slackChannelsLoading,
  } = useSlackChannels(slackConnected && !!selectedSlackChannelId);
  const linkedChannel = selectedSlackChannelId
    ? (slackChannels || []).find((c) => c.id === selectedSlackChannelId)
    : null;
  const linkedChannelName = linkedChannel?.name ?? null;
  const channelResolutionPending =
    !!selectedSlackChannelId && !linkedChannel && (slackChannelsLoading || !slackChannels);
  const dmConvList = (conversations ?? []) as DmConversation[];
  const dmContactList = (contacts ?? []) as DmContact[];
  const selectedDmPartner =
    dmConvList.find((c) => c.partnerId === selectedDmUserId) ??
    (() => {
      const c = dmContactList.find((x) => x.id === selectedDmUserId);
      return c
        ? {
            partnerId: c.id,
            partnerName: c.name,
            partnerRole: c.role,
            partnerAvatarUrl: c.avatarUrl ?? null,
            lastMessageContent: "",
            lastMessageAt: "",
            lastMessageFromMe: false,
            unreadCount: 0,
          }
        : null;
    })();

  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (mode === "groups") {
      if (!selectedProjectId) return;
      sendGroupMutation.mutate(
        { projectId: selectedProjectId, data: { content: newMessage.trim() } },
        {
          onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/messages`] });
            queryClient.invalidateQueries({ queryKey: getGetUnreadSummaryQueryKey() });
            toast("Message sent", "success");
          },
          onError: () => toast("Failed to send message", "error"),
        },
      );
    } else {
      if (!selectedDmUserId) return;
      sendDmMutation.mutate(
        { userId: selectedDmUserId, data: { content: newMessage.trim() } },
        {
          onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: getGetDmThreadQueryKey(selectedDmUserId) });
            queryClient.invalidateQueries({ queryKey: getListDmConversationsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetUnreadSummaryQueryKey() });
            toast("Message sent", "success");
          },
          onError: (err) => {
            const msg = err instanceof Error ? err.message : "Failed to send message";
            toast(msg, "error");
          },
        },
      );
    }
  };

  const handleComposeSelect = (id: string) => {
    if (mode === "groups") setSelectedProjectId(id);
    else setSelectedDmUserId(id);
    setShowCompose(false);
    setComposeSearch("");
  };

  if (authLoading || projLoading) {
    return (
      <TeamLayout>
        <MessagesSkeleton />
      </TeamLayout>
    );
  }

  if (projError) {
    return (
      <TeamLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState message="We couldn't load your conversations. Please check your connection and try again." onRetry={refetchProjects} />
        </div>
      </TeamLayout>
    );
  }

  const filteredSidebarGroups = searchFilter
    ? activeProjects.filter((p: Project) => p.name.toLowerCase().includes(searchFilter.toLowerCase()))
    : activeProjects;

  const filteredSidebarDms = searchFilter
    ? dmConvList.filter((c) => c.partnerName.toLowerCase().includes(searchFilter.toLowerCase()))
    : dmConvList;

  const composeList =
    mode === "groups"
      ? activeProjects.filter((p: Project) =>
          composeSearch ? p.name.toLowerCase().includes(composeSearch.toLowerCase()) : true,
        )
      : dmContactList.filter((c) =>
          composeSearch
            ? c.name.toLowerCase().includes(composeSearch.toLowerCase()) ||
              c.email.toLowerCase().includes(composeSearch.toLowerCase())
            : true,
        );

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  const headerTitle =
    mode === "groups" ? selectedProject?.name ?? "Select a project" : selectedDmPartner?.partnerName ?? "Select a person";
  const headerSub =
    mode === "groups"
      ? "Project conversation · visible to client"
      : selectedDmPartner
      ? `Direct message · ${selectedDmPartner.partnerRole ?? ""}`
      : "";

  const placeholder =
    mode === "groups"
      ? selectedProject
        ? `Message ${selectedProject.name}...`
        : "Select a project..."
      : selectedDmPartner
      ? `Message ${selectedDmPartner.partnerName}...`
      : "Select a person...";

  const sendDisabled =
    !newMessage.trim() ||
    (mode === "groups" ? !selectedProjectId : !selectedDmUserId) ||
    sendGroupMutation.isPending ||
    sendDmMutation.isPending;

  return (
    <TeamLayout>
      <div style={{ display: "flex", height: "calc(100vh - 0px)" }}>
        <div style={{ width: "340px", borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h1 style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>Messages</h1>
              <button
                onClick={() => setShowCompose(true)}
                style={f({
                  fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent,
                  border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "5px",
                })}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                New
              </button>
            </div>

            <ModeToggle
              mode={mode}
              onChange={setMode}
              groupsUnread={unread?.projectGroups ?? 0}
              dmsUnread={unread?.directMessages ?? 0}
            />

            <input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={mode === "groups" ? "Search projects..." : "Search people..."}
              style={f({
                fontWeight: 400, fontSize: "12px", color: t.text,
                background: t.bgCard, border: `1px solid ${t.borderSubtle}`, borderRadius: "6px",
                padding: "8px 12px", width: "100%", outline: "none", boxSizing: "border-box" as const,
                marginTop: "12px",
              })}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {mode === "groups" ? (
              filteredSidebarGroups.length === 0 ? (
                <EmptyText label="No projects found" />
              ) : (
                filteredSidebarGroups.map((project: Project) => (
                  <SidebarRow
                    key={project.id}
                    active={selectedProjectId === project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    initials={initials(project.name)}
                    title={project.name}
                    subtitle={project.phase.replace("_", "-")}
                  />
                ))
              )
            ) : filteredSidebarDms.length === 0 ? (
              <EmptyText
                label={
                  dmContactList.length === 0
                    ? currentUser?.role === "crew"
                      ? "You can DM owners, partners, and other crew. Click New to start a conversation."
                      : "No direct messages yet. Click New to start one."
                    : "No conversations match your search"
                }
              />
            ) : (
              filteredSidebarDms.map((c) => (
                <SidebarRow
                  key={c.partnerId}
                  active={selectedDmUserId === c.partnerId}
                  onClick={() => setSelectedDmUserId(c.partnerId)}
                  initials={initials(c.partnerName)}
                  title={c.partnerName}
                  subtitle={
                    c.lastMessageFromMe
                      ? `You: ${c.lastMessageContent}`
                      : c.lastMessageContent
                  }
                  badge={c.unreadCount > 0 ? c.unreadCount : undefined}
                  trailing={c.lastMessageAt ? timeAgo(c.lastMessageAt) : undefined}
                />
              ))
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text })}>{headerTitle}</p>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{headerSub}</p>
              {mode === "groups" && selectedProject && (
                <p style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" })}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
                    <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
                  </svg>
                  {linkedChannelName ? (
                    <>Linked to Slack channel: <span style={{ color: t.textSecondary, fontWeight: 600 }}>#{linkedChannelName}</span></>
                  ) : selectedSlackChannelId && channelResolutionPending ? (
                    "Resolving linked Slack channel…"
                  ) : selectedSlackChannelId ? (
                    <>Linked to a Slack channel you don't have access to ·{" "}
                      <Link
                        href={`/team/projects/${selectedProject.id}`}
                        style={f({ color: t.textSecondary, fontWeight: 600, textDecoration: "underline" })}
                      >
                        Change in project settings
                      </Link>
                    </>
                  ) : (
                    <>No channel linked ·{" "}
                      <Link
                        href={`/team/projects/${selectedProject.id}`}
                        style={f({ color: t.textSecondary, fontWeight: 600, textDecoration: "underline" })}
                      >
                        Link one in project settings
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
            {mode === "groups" && selectedProjectId && (
              <ProjectMuteToggle
                key={selectedProjectId}
                projectId={selectedProjectId}
                onChange={(isMuted) =>
                  setMutedProjectIds((prev) => {
                    const next = new Set(prev);
                    if (isMuted) next.add(selectedProjectId);
                    else next.delete(selectedProjectId);
                    return next;
                  })
                }
              />
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {msgsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", justifyContent: "flex-end", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <SkeletonCard height="52px" />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: "40%" }}><SkeletonCard height="48px" /></div>
                </div>
              </div>
            ) : msgsError ? (
              <div style={{ padding: "40px 0" }}>
                <ErrorState message="Couldn't load this conversation." onRetry={refetchMsgs} />
              </div>
            ) : sortedMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No messages yet</p>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Start the conversation.</p>
              </div>
            ) : (
              sortedMessages.map((msg: Message) => {
                const sender = userMap.get(msg.senderId);
                const isMe = msg.senderId === currentUser?.id;
                const senderName = msg.senderName ?? sender?.name ?? "Unknown";
                const senderInitials =
                  msg.senderInitials ??
                  (sender?.name
                    ? initials(sender.name)
                    : initials(senderName));
                const avatarUrl = msg.senderAvatarUrl ?? null;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "16px", gap: "10px", alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={senderName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          const sib = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
                          if (sib) sib.style.display = "flex";
                        }}
                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : null}
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: t.bgCard, border: `1px solid ${t.border}`, display: avatarUrl ? "none" : "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "10px", color: t.textSecondary, flexShrink: 0 }}>
                      {senderInitials || "??"}
                    </div>
                    <div style={{
                      maxWidth: "65%", padding: "12px 16px",
                      background: isMe ? t.accent : t.bgCard,
                      border: isMe ? "none" : `1px solid ${t.border}`,
                      borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "16px" }}>
                        <span style={f({ fontWeight: 600, fontSize: "11px", color: isMe ? t.accentText : t.text })}>
                          {senderName}
                        </span>
                        <span style={f({ fontWeight: 400, fontSize: "10px", color: isMe ? "rgba(255,255,255,0.6)" : t.textMuted })}>
                          {timeAgo(msg.createdAt)}
                        </span>
                      </div>
                      <p style={f({ fontWeight: 400, fontSize: "13px", color: isMe ? t.accentText : t.textSecondary, lineHeight: 1.5 })}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "16px 28px", borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={placeholder}
                disabled={mode === "groups" ? !selectedProjectId : !selectedDmUserId}
                aria-label="Type a message"
                style={f({
                  fontWeight: 400, fontSize: "13px", color: t.text,
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px",
                  padding: "12px 16px", flex: 1, outline: "none",
                  opacity: (mode === "groups" ? selectedProjectId : selectedDmUserId) ? 1 : 0.5,
                })}
              />
              <button
                onClick={handleSend}
                disabled={sendDisabled}
                style={f({
                  fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent,
                  border: "none", borderRadius: "8px", padding: "12px 20px", cursor: "pointer",
                  opacity: sendDisabled ? 0.5 : 1,
                })}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCompose && (
        <div
          onClick={() => setShowCompose(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px",
              padding: "28px", width: "420px", maxWidth: "90vw", maxHeight: "70vh",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={f({ fontWeight: 800, fontSize: "18px", color: t.text })}>
                {mode === "groups" ? "New Group Message" : "New Direct Message"}
              </h2>
              <button onClick={() => setShowCompose(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "14px" })}>
              {mode === "groups"
                ? "Choose a project to start or continue its group conversation."
                : currentUser?.role === "crew"
                ? "Crew can DM owners, partners, and other crew. Client communication happens in the project group thread."
                : "Choose a person to message directly."}
            </p>

            <input
              value={composeSearch}
              onChange={(e) => setComposeSearch(e.target.value)}
              placeholder={mode === "groups" ? "Search projects..." : "Search people..."}
              autoFocus
              style={f({
                fontWeight: 400, fontSize: "13px", color: t.text,
                background: t.bg, border: `1px solid ${t.border}`, borderRadius: "8px",
                padding: "10px 14px", width: "100%", outline: "none",
                boxSizing: "border-box" as const, marginBottom: "12px",
              })}
            />

            <div style={{ flex: 1, overflowY: "auto", maxHeight: "320px" }}>
              {composeList.length === 0 ? (
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, textAlign: "center", padding: "20px 0" })}>
                  {mode === "groups" ? "No projects match" : "No contacts match"}
                </p>
              ) : (
                composeList.map((item) => {
                  const isProject = mode === "groups";
                  const id = isProject ? (item as Project).id : (item as DmContact).id;
                  const title = isProject ? (item as Project).name : (item as DmContact).name;
                  const subtitle = isProject
                    ? (item as Project).phase.replace("_", "-")
                    : `${(item as DmContact).role} · ${(item as DmContact).email}`;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleComposeSelect(id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "12px 14px", cursor: "pointer", width: "100%",
                        background: "transparent", border: "none", borderBottom: `1px solid ${t.borderSubtle}`,
                        textAlign: "left", borderRadius: "0",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: t.activeNav,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        ...f({ fontWeight: 700, fontSize: "10px", color: t.textTertiary }),
                        flexShrink: 0,
                      }}>{initials(title)}</div>
                      <div style={{ flex: 1 }}>
                        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{title}</p>
                        <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: isProject ? "capitalize" : "none" })}>{subtitle}</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </TeamLayout>
  );
}

function ModeToggle({
  mode,
  onChange,
  groupsUnread,
  dmsUnread,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  groupsUnread: number;
  dmsUnread: number;
}) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const Btn = ({ id, label, count }: { id: Mode; label: string; count: number }) => {
    const active = mode === id;
    return (
      <button
        onClick={() => onChange(id)}
        data-testid={`messages-toggle-${id}`}
        style={f({
          flex: 1,
          background: active ? t.bgCard : "transparent",
          color: active ? t.text : t.textMuted,
          border: "none",
          borderRadius: "6px",
          padding: "8px 10px",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "11px",
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: active ? "0 1px 2px rgba(0,0,0,0.25)" : "none",
        })}
      >
        <span>{label}</span>
        {count > 0 && (
          <span style={f({
            background: t.accent, color: t.accentText, fontWeight: 800,
            fontSize: "10px", padding: "2px 7px", borderRadius: "999px",
            minWidth: "18px", textAlign: "center" as const,
          })}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    );
  };
  return (
    <div style={{
      display: "flex", gap: "4px", padding: "3px",
      background: t.bg, border: `1px solid ${t.borderSubtle}`,
      borderRadius: "8px",
    }}>
      <Btn id="groups" label="Project Groups" count={groupsUnread} />
      <Btn id="dms" label="DMs" count={dmsUnread} />
    </div>
  );
}

function SidebarRow({
  active,
  onClick,
  initials: ini,
  title,
  subtitle,
  badge,
  trailing,
}: {
  active: boolean;
  onClick: () => void;
  initials: string;
  title: string;
  subtitle: string;
  badge?: number;
  trailing?: string;
}) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "14px 20px", cursor: "pointer", width: "100%",
        background: active ? t.activeNav : "transparent",
        borderLeft: active ? `2px solid ${t.accent}` : "2px solid transparent",
        borderTop: "none", borderRight: "none", borderBottom: `1px solid ${t.borderSubtle}`,
        textAlign: "left",
      }}
    >
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: t.activeNav,
        display: "flex", alignItems: "center", justifyContent: "center",
        ...f({ fontWeight: 700, fontSize: "11px", color: t.textTertiary }),
        flexShrink: 0,
      }}>{ini}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const })}>{title}</p>
          {trailing && (
            <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted, flexShrink: 0 })}>{trailing}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "2px" }}>
          <p style={f({
            fontWeight: badge ? 600 : 400, fontSize: "11px",
            color: badge ? t.text : t.textMuted,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
            textTransform: "capitalize" as const,
          })}>{subtitle || "—"}</p>
          {badge ? (
            <span style={f({
              background: t.accent, color: t.accentText, fontWeight: 800,
              fontSize: "9px", padding: "2px 7px", borderRadius: "999px",
              minWidth: "18px", textAlign: "center" as const, flexShrink: 0,
            })}>
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function EmptyText({ label }: { label: string }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, lineHeight: 1.5 })}>{label}</p>
    </div>
  );
}
