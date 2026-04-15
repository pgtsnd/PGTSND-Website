import { useState } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";

const conversations = [
  {
    id: 1,
    name: "Spring Campaign",
    participants: ["Bri Dwyer", "Kandice M.", "Nicole Baker"],
    lastMessage: "Bri: Let me know when you've reviewed the latest cut — a few notes on color grading whenever you're ready.",
    time: "2 min ago",
    unread: 2,
    messages: [
      { author: "Bri Dwyer", initials: "BD", role: "Director", text: "Hey Nicole! We wrapped filming yesterday — the team crushed it. Marcus got some incredible aerial shots of the warehouse.", time: "Yesterday, 3:15 PM", isTeam: true },
      { author: "Nicole Baker", initials: "NB", role: "Client", text: "That's amazing! Can't wait to see everything. When do you think we'll have a first cut?", time: "Yesterday, 4:02 PM", isTeam: false },
      { author: "Kandice M.", initials: "KM", role: "Project Manager", text: "We're targeting Friday for the first rough cut. I'll send you a review link as soon as it's uploaded.", time: "Yesterday, 4:30 PM", isTeam: true },
      { author: "Nicole Baker", initials: "NB", role: "Client", text: "Perfect. Also — I mentioned this on our last call but wanted to document it here: we need the final to include our updated logo. I'll upload the files to the assets folder today.", time: "Yesterday, 5:12 PM", isTeam: false },
      { author: "Bri Dwyer", initials: "BD", role: "Director", text: "Got it, thanks for flagging. We'll swap it in during post. Jamie already has the intro template ready to go.", time: "Today, 9:45 AM", isTeam: true },
      { author: "Bri Dwyer", initials: "BD", role: "Director", text: "Let me know when you've reviewed the latest cut — a few notes on color grading whenever you're ready.", time: "2 min ago", isTeam: true },
    ],
  },
  {
    id: 2,
    name: "Product Launch Teaser",
    participants: ["Bri Dwyer", "Sam Reeves", "Nicole Baker"],
    lastMessage: "Nicole: Can we schedule the shoot for next Thursday?",
    time: "1 hour ago",
    unread: 0,
    messages: [
      { author: "Bri Dwyer", initials: "BD", role: "Director", text: "Nicole, for the product launch teaser — we're thinking a 60-second cut with fast pacing. Sam has some ideas for the opening shot.", time: "Today, 8:00 AM", isTeam: true },
      { author: "Sam Reeves", initials: "SR", role: "Cinematographer", text: "Yeah, I'd love to do a macro lens reveal of the product, then pull back wide. Really dramatic.", time: "Today, 8:15 AM", isTeam: true },
      { author: "Nicole Baker", initials: "NB", role: "Client", text: "Can we schedule the shoot for next Thursday?", time: "1 hour ago", isTeam: false },
    ],
  },
  {
    id: 3,
    name: "General",
    participants: ["Bri Dwyer", "Nicole Baker"],
    lastMessage: "Nicole: Thanks for the invoice breakdown!",
    time: "2 days ago",
    unread: 0,
    messages: [
      { author: "Nicole Baker", initials: "NB", role: "Client", text: "Thanks for the invoice breakdown!", time: "2 days ago", isTeam: false },
    ],
  },
];

export default function ClientMessages() {
  const { t } = useTheme();
  const [activeConvo, setActiveConvo] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");

  return (
    <ClientLayout>
      <div style={{ display: "flex", height: "calc(100vh)" }}>
        <div style={{ width: "320px", borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", background: t.bgSidebar }}>
          <div style={{ padding: "24px 20px 16px" }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "18px", color: t.text, marginBottom: "16px" }}>
              Messages
            </h2>
            <input
              placeholder="Search conversations..."
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.text, background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.map((convo) => (
              <div
                key={convo.id}
                onClick={() => setActiveConvo(convo)}
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  background: activeConvo.id === convo.id ? t.hoverBg : "transparent",
                  borderLeft: activeConvo.id === convo.id ? `2px solid ${t.accent}` : "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text }}>{convo.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {convo.unread > 0 && (
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: t.badgeBg, color: t.badgeText, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {convo.unread}
                      </span>
                    )}
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{convo.time}</span>
                  </div>
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {convo.lastMessage}
                </p>
                <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                  {convo.participants.map((p) => (
                    <span key={p} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>
                      {p.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 32px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "4px" }}>{activeConvo.name}</h3>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>{activeConvo.participants.join(", ")}</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["View Project", "Files"].map((label) => (
                <button key={label} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 16px", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
            {activeConvo.messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "24px", flexDirection: msg.isTeam ? "row" : "row-reverse" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: msg.isTeam ? t.teamBubble : t.clientBubble, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", color: t.textSecondary, flexShrink: 0 }}>
                  {msg.initials}
                </div>
                <div style={{ maxWidth: "65%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexDirection: msg.isTeam ? "row" : "row-reverse" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.text }}>{msg.author}</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: msg.isTeam ? "rgba(120,180,255,0.7)" : t.textMuted, background: msg.isTeam ? "rgba(120,180,255,0.08)" : t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>
                      {msg.role}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: t.textMuted }}>{msg.time}</span>
                  </div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textSecondary, lineHeight: 1.65, background: msg.isTeam ? t.teamBubble : t.clientBubble, padding: "14px 18px", borderRadius: msg.isTeam ? "2px 12px 12px 12px" : "12px 2px 12px 12px" }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 32px 24px", borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.text, background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "14px 18px", width: "100%", minHeight: "48px", maxHeight: "120px", resize: "none", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{ width: "44px", height: "44px", borderRadius: "10px", background: t.hoverBg, border: `1px solid ${t.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.textTertiary }} title="Attach file">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button style={{ width: "44px", height: "44px", borderRadius: "10px", background: t.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
