import { useState, useEffect, useRef } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Conversation, type Message } from "../lib/api";

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function ClientMessages() {
  const { t } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    api
      .getClientMessages()
      .then((data) => {
        setConversations(data);
        if (!activeConvo && data.length > 0) {
          setActiveConvo(data[0]);
        } else if (activeConvo) {
          const updated = data.find((c) => c.projectId === activeConvo.projectId);
          if (updated) setActiveConvo(updated);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo?.messages?.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvo || activeConvo.projectId === "general") return;
    setSending(true);
    try {
      await api.sendClientMessage(activeConvo.projectId, newMessage.trim());
      setNewMessage("");
      loadMessages();
    } catch {
      // silently fail send
    }
    setSending(false);
  };

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: t.textTertiary }}>Loading...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: "rgba(255,100,100,0.8)" }}>{error}</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ display: "flex", height: "calc(100vh)" }}>
        <div style={{ width: "320px", borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", background: t.bgSidebar }}>
          <div style={{ padding: "24px 20px 16px" }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "18px", color: t.text, marginBottom: "16px" }}>
              Messages
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.map((convo) => (
              <div
                key={convo.projectId}
                onClick={() => setActiveConvo(convo)}
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  background: activeConvo?.projectId === convo.projectId ? t.hoverBg : "transparent",
                  borderLeft: activeConvo?.projectId === convo.projectId ? `2px solid ${t.accent}` : "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text }}>{convo.projectName}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {convo.unreadCount > 0 && (
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: t.badgeBg, color: t.badgeText, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {convo.unreadCount}
                      </span>
                    )}
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                      {convo.lastMessageTime ? timeAgo(convo.lastMessageTime) : ""}
                    </span>
                  </div>
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {convo.lastMessage || "No messages yet"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {activeConvo ? (
            <>
              <div style={{ padding: "20px 32px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "4px" }}>{activeConvo.projectName}</h3>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
                {activeConvo.messages?.length === 0 && (
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted, textAlign: "center", padding: "40px 0" }}>
                    No messages yet. Start the conversation!
                  </p>
                )}
                {activeConvo.messages?.map((msg, i) => (
                  <div key={msg.id || i} style={{ display: "flex", gap: "12px", marginBottom: "24px", flexDirection: msg.isTeam ? "row" : "row-reverse" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: msg.isTeam ? t.teamBubble : t.clientBubble, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", color: t.textSecondary, flexShrink: 0 }}>
                      {msg.senderInitials || "??"}
                    </div>
                    <div style={{ maxWidth: "65%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexDirection: msg.isTeam ? "row" : "row-reverse" }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.text }}>{msg.senderName}</span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: msg.isTeam ? "rgba(120,180,255,0.7)" : t.textMuted, background: msg.isTeam ? "rgba(120,180,255,0.08)" : t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>
                          {msg.senderRole === "client" ? "Client" : msg.senderRole === "owner" ? "Director" : msg.senderRole || "Team"}
                        </span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: t.textMuted }}>{timeAgo(msg.createdAt)}</span>
                      </div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textSecondary, lineHeight: 1.65, background: msg.isTeam ? t.teamBubble : t.clientBubble, padding: "14px 18px", borderRadius: msg.isTeam ? "2px 12px 12px 12px" : "12px 2px 12px 12px" }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {activeConvo.projectId !== "general" && (
                <div style={{ padding: "16px 32px 24px", borderTop: `1px solid ${t.border}` }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Type a message..."
                        style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.text, background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "14px 18px", width: "100%", minHeight: "48px", maxHeight: "120px", resize: "none", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      style={{ width: "44px", height: "44px", borderRadius: "10px", background: t.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: sending || !newMessage.trim() ? 0.5 : 1 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textMuted }}>
                Select a conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
