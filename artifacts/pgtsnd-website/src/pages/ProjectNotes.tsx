import { Link, useRoute } from "wouter";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";

interface Note {
  id: string;
  date: string;
  author: string;
  authorRole: "client" | "team";
  content: string;
  tags?: string[];
  pinned?: boolean;
}

const projectNotes: Record<string, { project: string; notes: Note[] }> = {
  "spring-campaign-film": {
    project: "Spring Campaign Film",
    notes: [
      { id: "N-001", date: "Feb 18, 2025", author: "Nicole Baker", authorRole: "client", content: "Please avoid any shots that look 'too industrial.' I want the brand to feel artisanal and personal — like a family operation, not a corporation. Think farmer's market energy, not assembly line.", tags: ["Brand Direction", "Visual Style"], pinned: true },
      { id: "N-002", date: "Feb 22, 2025", author: "Nicole Baker", authorRole: "client", content: "Music should feel organic — acoustic guitar, light percussion. Absolutely no stock music. I want something composed specifically for this piece. Something that feels like the Pacific Northwest.", tags: ["Music", "Audio"] },
      { id: "N-003", date: "Mar 5, 2025", author: "Bri Dwyer", authorRole: "team", content: "Noted on the music direction. I've reached out to a Portland-based composer who does exactly this kind of acoustic work. Will share demos by next week.", tags: ["Music"] },
      { id: "N-004", date: "Mar 12, 2025", author: "Nicole Baker", authorRole: "client", content: "Final delivery must include 16:9 hero cut plus 9:16 and 1:1 social cuts. The 9:16 version is critical — it's going in our Instagram Reels and TikTok.", tags: ["Deliverables", "Format"] },
      { id: "N-005", date: "Mar 20, 2025", author: "Nicole Baker", authorRole: "client", content: "I just sent over the updated logo files (uploaded Apr 8 to the Assets folder). Please make sure the final cut uses the new version with the refined mark — the old one has a thicker stroke on the wave element.", tags: ["Brand Assets", "Logo"] },
      { id: "N-006", date: "Mar 28, 2025", author: "Kandice M.", authorRole: "team", content: "Confirmed — new logo files received and added to the project asset library. All team members have been notified to use the updated version.", tags: ["Brand Assets"] },
      { id: "N-007", date: "Apr 2, 2025", author: "Nicole Baker", authorRole: "client", content: "One more thing — my business partner wants to review the rough cut before we go to fine cut. Can we add a review step? I know it adds time but it's important to her.", tags: ["Process", "Review"] },
      { id: "N-008", date: "Apr 5, 2025", author: "Bri Dwyer", authorRole: "team", content: "Absolutely — we've built an additional review round into the schedule between rough cut and fine cut. Your partner will get the same review link you do. Updated the project timeline.", tags: ["Process", "Schedule"] },
      { id: "N-009", date: "Apr 10, 2025", author: "Nicole Baker", authorRole: "client", content: "Color grading preference: I love desaturated but not flat. Cool shadows, warm highlights. Think early morning coastal light — not sunset Instagram filter. Reference: that Patagonia 'Artifishal' doc had the right mood.", tags: ["Color Grade", "Visual Style"], pinned: true },
    ],
  },
  "product-launch-teaser": {
    project: "Product Launch Teaser",
    notes: [
      { id: "N-101", date: "Mar 28, 2025", author: "Nicole Baker", authorRole: "client", content: "I want this to feel 'premium but rugged.' I keep referencing Apple product videos but with a fishing industry twist. The product IS premium — it should be shot like it. But there's grit underneath.", tags: ["Brand Direction", "Visual Style"], pinned: true },
      { id: "N-102", date: "Mar 30, 2025", author: "Nicole Baker", authorRole: "client", content: "This MUST be delivered by June 2 for the trade show in Portland. That's a hard deadline — the booth is already booked and this is playing on loop at our station.", tags: ["Deadline", "Trade Show"] },
      { id: "N-103", date: "Apr 3, 2025", author: "Sam Reeves", authorRole: "team", content: "For the macro product shots, I'm thinking we shoot on the 100mm with a single key light — very dramatic, very Apple. Black background, product emerging from shadow. I'll put together a lighting test this week.", tags: ["Cinematography", "Lighting"] },
      { id: "N-104", date: "Apr 8, 2025", author: "Nicole Baker", authorRole: "client", content: "Love the lighting test direction. One ask: can we do a version where the product has water droplets on it? Like it just came out of the ocean. Adds that connection to the source.", tags: ["Product Styling"] },
      { id: "N-105", date: "Apr 12, 2025", author: "Nicole Baker", authorRole: "client", content: "Also need a 30-second and 15-second edit in addition to the 60-second master. All formats: 16:9, 9:16, 1:1. The 15-second version is for pre-roll ads.", tags: ["Deliverables", "Format"] },
    ],
  },
};

const slugMap: Record<string, string> = { "1": "spring-campaign-film", "2": "product-launch-teaser" };

export default function ProjectNotes() {
  const { t } = useTheme();
  const [, params] = useRoute("/client-hub/projects/:id/notes");
  const slug = slugMap[params?.id || "1"] || "spring-campaign-film";
  const data = projectNotes[slug];
  if (!data) return null;

  const pinnedNotes = data.notes.filter((n) => n.pinned);
  const timelineNotes = data.notes.filter((n) => !n.pinned);

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "900px" }}>
        <Link href="/client-hub/projects" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to {data.project}
        </Link>

        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "8px" }}>Client Notes & Context</h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary, marginBottom: "36px" }}>
          {data.notes.length} notes · Preferences, feedback, and project context
        </p>

        {pinnedNotes.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" /></svg>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>Pinned</span>
            </div>
            {pinnedNotes.map((note) => (
              <div key={note.id} style={{ padding: "20px 24px", background: t.bgCard, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.text}`, borderRadius: "8px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: note.authorRole === "client" ? t.clientBubble : t.teamBubble, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "10px", color: t.textTertiary }}>
                      {note.author.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <div>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{note.author}</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, marginLeft: "8px" }}>{note.authorRole === "client" ? "Client" : "Team"}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{note.date}</span>
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textSecondary, lineHeight: 1.75 }}>{note.content}</p>
                {note.tags && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
                    {note.tags.map((tag) => (
                      <span key={tag} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "3px 10px", borderRadius: "4px" }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, display: "block", marginBottom: "14px" }}>Timeline</span>
          <div style={{ position: "relative", paddingLeft: "28px" }}>
            <div style={{ position: "absolute", left: "7px", top: "0", bottom: "0", width: "1px", background: t.border }} />
            {timelineNotes.map((note) => (
              <div key={note.id} style={{ position: "relative", marginBottom: "20px" }}>
                <div style={{ position: "absolute", left: "-25px", top: "6px", width: "9px", height: "9px", borderRadius: "50%", background: note.authorRole === "client" ? t.text : t.border, border: note.authorRole === "client" ? "none" : `2px solid ${t.textMuted}` }} />
                <div style={{ padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.borderSubtle}`, borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{note.author}</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: note.authorRole === "client" ? t.textTertiary : t.textMuted, background: t.hoverBg, padding: "2px 8px", borderRadius: "3px" }}>{note.authorRole === "client" ? "Client" : "Team"}</span>
                    </div>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{note.date}</span>
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.7 }}>{note.content}</p>
                  {note.tags && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                      {note.tags.map((tag) => (
                        <span key={tag} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "3px 10px", borderRadius: "4px" }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: `1px solid ${t.border}`, display: "flex", gap: "12px" }}>
          <Link href={`/client-hub/projects/${params?.id || "1"}/shotlist`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            ← Shot List
          </Link>
          <Link href={`/client-hub/projects/${params?.id || "1"}/treatment`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            Treatment →
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
