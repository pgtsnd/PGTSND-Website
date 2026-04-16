import { useState, useEffect } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { useUpdateProfile } from "../hooks/useTeamData";
import { useQueryClient } from "@tanstack/react-query";

export default function TeamSettings() {
  const { t } = useTheme();
  const { currentUser, isLoading: authLoading } = useTeamAuth();
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "integrations">("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(false);
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name ?? "");
      setEmail(currentUser.email ?? "");
      setTitle(currentUser.title ?? "");
    }
  }, [currentUser]);

  const handleSave = () => {
    if (!currentUser) return;
    updateProfile.mutate(
      { id: currentUser.id, data: { name, title } },
      {
        onSuccess: () => {
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  const sections = [
    { key: "profile" as const, label: "My Profile" },
    { key: "notifications" as const, label: "Notifications" },
    { key: "integrations" as const, label: "Integrations" },
  ];

  if (authLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading settings...</p>
        </div>
      </TeamLayout>
    );
  }

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1000px" }}>
        <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "28px" })}>Settings</h1>

        <div style={{ display: "flex", gap: "32px" }}>
          <div style={{ width: "200px", flexShrink: 0 }}>
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                style={f({
                  fontWeight: activeSection === section.key ? 600 : 400,
                  fontSize: "13px",
                  color: activeSection === section.key ? t.text : t.textMuted,
                  background: activeSection === section.key ? t.activeNav : "transparent",
                  border: "none", borderRadius: "6px", padding: "10px 14px",
                  cursor: "pointer", display: "block", width: "100%", textAlign: "left",
                  marginBottom: "4px",
                })}
              >{section.label}</button>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {activeSection === "profile" && (
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>My Profile</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>Update your personal details.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" })}>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} style={f({ fontWeight: 400, fontSize: "13px", color: t.text, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box" as const })} />
                  </div>
                  <div>
                    <label style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" })}>Email</label>
                    <input value={email} disabled style={f({ fontWeight: 400, fontSize: "13px", color: t.textMuted, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box" as const, opacity: 0.6 })} />
                  </div>
                  <div>
                    <label style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" })}>Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Director, Editor, Producer" style={f({ fontWeight: 400, fontSize: "13px", color: t.text, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box" as const })} />
                  </div>
                  <div>
                    <label style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" })}>Role</label>
                    <input value={currentUser?.role ?? ""} disabled style={f({ fontWeight: 400, fontSize: "13px", color: t.textMuted, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box" as const, opacity: 0.6, textTransform: "capitalize" })} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px" }}>
                  <button
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    style={f({
                      fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent,
                      border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer",
                      opacity: updateProfile.isPending ? 0.7 : 1,
                    })}
                  >
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </button>
                  {saved && <span style={f({ fontWeight: 500, fontSize: "12px", color: t.accent })}>Saved!</span>}
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Notifications</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>Control what you get notified about.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { label: "Client messages", desc: "When a client sends you a message", default: true },
                    { label: "Review submissions", desc: "When a client submits feedback on a cut", default: true },
                    { label: "Contract signatures", desc: "When a client signs a contract", default: true },
                    { label: "Team activity", desc: "When team members upload files or complete tasks", default: false },
                    { label: "Schedule changes", desc: "When project dates or milestones change", default: true },
                  ].map((notif) => (
                    <div key={notif.label} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px",
                    }}>
                      <div>
                        <p style={f({ fontWeight: 500, fontSize: "13px", color: t.text, marginBottom: "2px" })}>{notif.label}</p>
                        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{notif.desc}</p>
                      </div>
                      <ToggleSwitch defaultOn={notif.default} t={t} label={notif.label} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "integrations" && (
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Integrations</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>Connect your tools.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { name: "DocuSign", desc: "Send contracts for e-signature", connected: false },
                    { name: "Stripe", desc: "Accept payments and manage invoices", connected: false },
                    { name: "Google Drive", desc: "Sync project files and deliverables", connected: false },
                    { name: "Frame.io", desc: "Video review and collaboration", connected: false },
                    { name: "Slack", desc: "Team notifications and alerts", connected: false },
                  ].map((integration) => (
                    <div key={integration.name} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px",
                    }}>
                      <div>
                        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "2px" })}>{integration.name}</p>
                        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{integration.desc}</p>
                      </div>
                      <button style={f({
                        fontWeight: 500, fontSize: "11px",
                        color: t.textMuted,
                        background: "transparent",
                        border: `1px solid ${t.border}`,
                        borderRadius: "6px", padding: "6px 14px", cursor: "pointer",
                      })}>
                        Coming Soon
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeamLayout>
  );
}

function ToggleSwitch({ defaultOn, t, label }: { defaultOn: boolean; t: any; label: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      style={{
        width: "40px", height: "22px", borderRadius: "11px", padding: "2px",
        background: on ? t.accent : t.border,
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s",
      }}
    >
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%",
        background: on ? t.accentText : t.textMuted,
        transform: on ? "translateX(18px)" : "translateX(0)",
        transition: "transform 0.2s",
      }} />
    </button>
  );
}
