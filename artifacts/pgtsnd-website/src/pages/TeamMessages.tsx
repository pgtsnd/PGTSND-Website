import { useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

interface Thread {
  id: number;
  name: string;
  type: "client" | "team";
  avatar: string;
  project?: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: { from: string; text: string; time: string; isMe: boolean }[];
}

const threads: Thread[] = [
  {
    id: 1, name: "Nicole Baker", type: "client", avatar: "NB", project: "Spring Campaign Film",
    lastMessage: "Let me know when you've reviewed the latest cut — I have some thoughts on the interview section",
    time: "2h ago", unread: 2,
    messages: [
      { from: "Nicole Baker", text: "Hey! Just watched through Rough Cut v1. Really love the opening sequence. The pacing of the interview section feels a bit slow though — can we tighten that up?", time: "Yesterday 2:15 PM", isMe: false },
      { from: "Bri Dwyer", text: "Thanks for the feedback! Agreed on the interview pacing. Jamie's already working on a tighter edit. We'll have v2 to you by end of day.", time: "Yesterday 3:40 PM", isMe: true },
      { from: "Nicole Baker", text: "Perfect. Also — can we add the new brand colors to the lower thirds? We updated our palette last week.", time: "Yesterday 4:02 PM", isMe: false },
      { from: "Bri Dwyer", text: "Absolutely. Send over the updated brand guide and we'll incorporate it into v2.", time: "Yesterday 4:15 PM", isMe: true },
      { from: "Nicole Baker", text: "Let me know when you've reviewed the latest cut — I have some thoughts on the interview section", time: "2h ago", isMe: false },
    ],
  },
  {
    id: 2, name: "Jamie Lin", type: "team", avatar: "JL", project: "Spring Campaign Film",
    lastMessage: "Rough Cut v2 exported and sent to review. Sound design 80% complete.",
    time: "12m ago", unread: 0,
    messages: [
      { from: "Jamie Lin", text: "Working on the interview tightening now. Should have it done by 3.", time: "Today 10:15 AM", isMe: false },
      { from: "Bri Dwyer", text: "Great. Nicole also wants updated brand colors on the lower thirds — new palette coming over.", time: "Today 10:30 AM", isMe: true },
      { from: "Jamie Lin", text: "Rough Cut v2 exported and sent to review. Sound design 80% complete.", time: "12m ago", isMe: false },
    ],
  },
  {
    id: 3, name: "Alex Torres", type: "team", avatar: "AT", project: "Spring Campaign Film",
    lastMessage: "Started color pass on scenes 1-3. Leaning cooler on shadows per Nicole's notes.",
    time: "Yesterday", unread: 0,
    messages: [
      { from: "Alex Torres", text: "Started color pass on scenes 1-3. Leaning cooler on shadows per Nicole's notes.", time: "Yesterday 11:00 AM", isMe: false },
      { from: "Bri Dwyer", text: "Looks good. Keep the skin tones warm though — don't want it feeling clinical.", time: "Yesterday 11:20 AM", isMe: true },
    ],
  },
  {
    id: 4, name: "Sam Reeves", type: "team", avatar: "SR", project: "Product Launch Teaser",
    lastMessage: "Lighting test done — looks great. Ready for product macro session tomorrow.",
    time: "3h ago", unread: 1,
    messages: [
      { from: "Sam Reeves", text: "Lighting test done — looks great. Ready for product macro session tomorrow.", time: "3h ago", isMe: false },
    ],
  },
  {
    id: 5, name: "Nicole Baker", type: "client", avatar: "NB", project: "Product Launch Teaser",
    lastMessage: "Can we add water droplets on the product? Like it just came from the ocean.",
    time: "Yesterday", unread: 0,
    messages: [
      { from: "Nicole Baker", text: "Can we add water droplets on the product? Like it just came from the ocean.", time: "Yesterday 5:30 PM", isMe: false },
      { from: "Bri Dwyer", text: "Love that idea. We'll set up a water misting rig for tomorrow's shoot.", time: "Yesterday 5:45 PM", isMe: true },
    ],
  },
  {
    id: 6, name: "Kandice M.", type: "team", avatar: "KM",
    lastMessage: "SOW sent to Nicole for Product Launch Teaser. Following up on amendment for Spring Campaign.",
    time: "Yesterday", unread: 0,
    messages: [
      { from: "Kandice M.", text: "SOW sent to Nicole for Product Launch Teaser. Following up on amendment for Spring Campaign.", time: "Yesterday 9:00 AM", isMe: false },
      { from: "Bri Dwyer", text: "Thanks Kandice. Let me know if she hasn't signed by Friday — I'll follow up directly.", time: "Yesterday 9:15 AM", isMe: true },
    ],
  },
];

export default function TeamMessages() {
  const { t } = useTheme();
  const [selectedThread, setSelectedThread] = useState<number>(1);
  const [newMessage, setNewMessage] = useState("");
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const activeThread = threads.find((th) => th.id === selectedThread)!;

  return (
    <TeamLayout>
      <div style={{ display: "flex", height: "calc(100vh - 0px)" }}>
        <div style={{ width: "340px", borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${t.border}` }}>
            <h1 style={f({ fontWeight: 800, fontSize: "20px", color: t.text, marginBottom: "4px" })}>Messages</h1>
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{threads.filter((th) => th.unread > 0).length} unread conversations</p>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThread(thread.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "14px 20px", cursor: "pointer", width: "100%",
                  background: selectedThread === thread.id ? t.activeNav : "transparent",
                  borderLeft: selectedThread === thread.id ? `2px solid ${t.accent}` : "2px solid transparent",
                  borderTop: "none", borderRight: "none", borderBottom: `1px solid ${t.borderSubtle}`,
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: thread.type === "client" ? t.accent : t.activeNav,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...f({ fontWeight: 700, fontSize: "11px", color: thread.type === "client" ? t.accentText : t.textTertiary }),
                  flexShrink: 0,
                }}>{thread.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <p style={f({ fontWeight: thread.unread > 0 ? 700 : 500, fontSize: "13px", color: t.text })}>{thread.name}</p>
                    <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{thread.time}</span>
                  </div>
                  {thread.project && <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginBottom: "4px" })}>{thread.project}</p>}
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{thread.lastMessage}</p>
                </div>
                {thread.unread > 0 && (
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%", background: t.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...f({ fontWeight: 700, fontSize: "9px", color: t.accentText }),
                    flexShrink: 0, marginTop: "2px",
                  }}>{thread.unread}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: activeThread.type === "client" ? t.accent : t.activeNav,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...f({ fontWeight: 700, fontSize: "11px", color: activeThread.type === "client" ? t.accentText : t.textTertiary }),
              }}>{activeThread.avatar}</div>
              <div>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text })}>{activeThread.name}</p>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                  {activeThread.type === "client" ? "Client" : "Team"}{activeThread.project ? ` · ${activeThread.project}` : ""}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer" })}>
                View Project
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {activeThread.messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.isMe ? "flex-end" : "flex-start", marginBottom: "16px" }}>
                <div style={{
                  maxWidth: "65%", padding: "12px 16px",
                  background: msg.isMe ? t.accent : t.bgCard,
                  border: msg.isMe ? "none" : `1px solid ${t.border}`,
                  borderRadius: msg.isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "16px" }}>
                    <span style={f({ fontWeight: 600, fontSize: "11px", color: msg.isMe ? t.accentText : t.text })}>{msg.from}</span>
                    <span style={f({ fontWeight: 400, fontSize: "10px", color: msg.isMe ? "rgba(255,255,255,0.6)" : t.textMuted })}>{msg.time}</span>
                  </div>
                  <p style={f({ fontWeight: 400, fontSize: "13px", color: msg.isMe ? t.accentText : t.textSecondary, lineHeight: 1.5 })}>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 28px", borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                aria-label="Type a message"
                style={f({
                  fontWeight: 400, fontSize: "13px", color: t.text,
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px",
                  padding: "12px 16px", flex: 1, outline: "none",
                })}
              />
              <button style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "8px", padding: "12px 20px", cursor: "pointer" })}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </TeamLayout>
  );
}
