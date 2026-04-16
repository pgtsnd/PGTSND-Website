import { useState, useEffect, useRef } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useProjects,
  useProjectMessages,
  useSendMessage,
  timeAgo,
  type Project,
  type Message,
} from "../hooks/useTeamData";
import { useQueryClient } from "@tanstack/react-query";

export default function TeamMessages() {
  const { t } = useTheme();
  const { currentUser, userMap, isLoading: authLoading } = useTeamAuth();
  const { data: projects, isLoading: projLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const activeProjects = (projects ?? []).filter((p: Project) => p.status !== "archived");

  useEffect(() => {
    if (!selectedProjectId && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [activeProjects, selectedProjectId]);

  const { data: messages, isLoading: msgsLoading } = useProjectMessages(selectedProjectId);
  const sendMessageMutation = useSendMessage();

  const sortedMessages = [...(messages ?? [])].sort(
    (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedProjectId) return;
    sendMessageMutation.mutate(
      { projectId: selectedProjectId, data: { content: newMessage.trim() } },
      {
        onSuccess: () => {
          setNewMessage("");
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/messages`] });
        },
      },
    );
  };

  const handleComposeSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowCompose(false);
    setComposeSearch("");
  };

  if (authLoading || projLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading messages...</p>
        </div>
      </TeamLayout>
    );
  }

  const selectedProject = activeProjects.find((p: Project) => p.id === selectedProjectId);

  const filteredSidebar = searchFilter
    ? activeProjects.filter((p: Project) => p.name.toLowerCase().includes(searchFilter.toLowerCase()))
    : activeProjects;

  const filteredCompose = composeSearch
    ? activeProjects.filter((p: Project) => p.name.toLowerCase().includes(composeSearch.toLowerCase()))
    : activeProjects;

  return (
    <TeamLayout>
      <div style={{ display: "flex", height: "calc(100vh - 0px)" }}>
        <div style={{ width: "340px", borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
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
            <input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              style={f({
                fontWeight: 400, fontSize: "12px", color: t.text,
                background: t.bgCard, border: `1px solid ${t.borderSubtle}`, borderRadius: "6px",
                padding: "8px 12px", width: "100%", outline: "none", boxSizing: "border-box" as const,
              })}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredSidebar.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>No conversations found</p>
              </div>
            ) : (
              filteredSidebar.map((project: Project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "14px 20px", cursor: "pointer", width: "100%",
                    background: selectedProjectId === project.id ? t.activeNav : "transparent",
                    borderLeft: selectedProjectId === project.id ? `2px solid ${t.accent}` : "2px solid transparent",
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
                  }}>{project.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={f({ fontWeight: 500, fontSize: "13px", color: t.text })}>{project.name}</p>
                    <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "capitalize" })}>{project.phase.replace("_", "-")}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text })}>
                {selectedProject?.name ?? "Select a project"}
              </p>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                Project conversation
              </p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {msgsLoading ? (
              <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textMuted })}>Loading messages...</p>
            ) : sortedMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No messages yet</p>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Start the conversation for this project.</p>
              </div>
            ) : (
              sortedMessages.map((msg: Message) => {
                const sender = userMap.get(msg.senderId);
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "16px" }}>
                    <div style={{
                      maxWidth: "65%", padding: "12px 16px",
                      background: isMe ? t.accent : t.bgCard,
                      border: isMe ? "none" : `1px solid ${t.border}`,
                      borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "16px" }}>
                        <span style={f({ fontWeight: 600, fontSize: "11px", color: isMe ? t.accentText : t.text })}>
                          {sender?.name ?? "Unknown"}
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
                placeholder={selectedProject ? `Message ${selectedProject.name}...` : "Select a conversation..."}
                disabled={!selectedProjectId}
                aria-label="Type a message"
                style={f({
                  fontWeight: 400, fontSize: "13px", color: t.text,
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px",
                  padding: "12px 16px", flex: 1, outline: "none",
                  opacity: selectedProjectId ? 1 : 0.5,
                })}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                style={f({
                  fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent,
                  border: "none", borderRadius: "8px", padding: "12px 20px", cursor: "pointer",
                  opacity: !newMessage.trim() ? 0.5 : 1,
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
              <h2 style={f({ fontWeight: 800, fontSize: "18px", color: t.text })}>New Message</h2>
              <button
                onClick={() => setShowCompose(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "14px" })}>
              Choose a project to start or continue a conversation.
            </p>

            <input
              value={composeSearch}
              onChange={(e) => setComposeSearch(e.target.value)}
              placeholder="Search projects..."
              autoFocus
              style={f({
                fontWeight: 400, fontSize: "13px", color: t.text,
                background: t.bg, border: `1px solid ${t.border}`, borderRadius: "8px",
                padding: "10px 14px", width: "100%", outline: "none",
                boxSizing: "border-box" as const, marginBottom: "12px",
              })}
            />

            <div style={{ flex: 1, overflowY: "auto", maxHeight: "320px" }}>
              {filteredCompose.length === 0 ? (
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, textAlign: "center", padding: "20px 0" })}>
                  No projects match your search
                </p>
              ) : (
                filteredCompose.map((project: Project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleComposeSelect(project.id)}
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
                    }}>{project.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{project.name}</p>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "capitalize" })}>{project.phase.replace("_", "-")}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </TeamLayout>
  );
}
