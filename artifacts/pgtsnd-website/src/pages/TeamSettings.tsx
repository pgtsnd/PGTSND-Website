import { useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

export default function TeamSettings() {
  const { t } = useTheme();
  const [activeSection, setActiveSection] = useState<"company" | "notifications" | "integrations" | "billing">("company");
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const sections = [
    { key: "company" as const, label: "Company Profile" },
    { key: "notifications" as const, label: "Notifications" },
    { key: "integrations" as const, label: "Integrations" },
    { key: "billing" as const, label: "Billing & Plans" },
  ];

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
            {activeSection === "company" && (
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Company Profile</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>Your company details visible to clients.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[
                    { label: "Company Name", value: "PGTSND Productions", placeholder: "" },
                    { label: "Tagline", value: "Visual storytelling for bold brands", placeholder: "" },
                    { label: "Email", value: "hello@pgtsnd.com", placeholder: "" },
                    { label: "Phone", value: "(503) 555-0100", placeholder: "" },
                    { label: "Website", value: "pgtsndproductions.com", placeholder: "" },
                    { label: "Location", value: "Portland, OR", placeholder: "" },
                  ].map((field) => (
                    <div key={field.label}>
                      <label style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" })}>{field.label}</label>
                      <input
                        defaultValue={field.value}
                        placeholder={field.placeholder}
                        style={f({
                          fontWeight: 400, fontSize: "13px", color: t.text,
                          background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "6px",
                          padding: "10px 14px", width: "100%", outline: "none",
                          boxSizing: "border-box" as const,
                        })}
                      />
                    </div>
                  ))}
                </div>

                <button style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", marginTop: "24px" })}>
                  Save Changes
                </button>
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
                    { label: "Invoice payments", desc: "When a client pays an invoice", default: true },
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
                    { name: "DocuSign", desc: "Send contracts for e-signature", connected: true },
                    { name: "Stripe", desc: "Accept payments and manage invoices", connected: true },
                    { name: "Google Drive", desc: "Sync project files and deliverables", connected: false },
                    { name: "Frame.io", desc: "Video review and collaboration", connected: false },
                    { name: "Slack", desc: "Team notifications and alerts", connected: false },
                    { name: "QuickBooks", desc: "Accounting and financial reporting", connected: false },
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
                        color: integration.connected ? t.textMuted : t.accentText,
                        background: integration.connected ? "transparent" : t.accent,
                        border: integration.connected ? `1px solid ${t.border}` : "none",
                        borderRadius: "6px", padding: "6px 14px", cursor: "pointer",
                      })}>
                        {integration.connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "billing" && (
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Billing & Plans</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>Manage your subscription and payment methods.</p>

                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                      <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "2px" })}>Pro Plan</p>
                      <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Unlimited projects, 100 GB storage, team management</p>
                    </div>
                    <p style={f({ fontWeight: 800, fontSize: "24px", color: t.text })}>$49<span style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>/mo</span></p>
                  </div>
                  <div style={{ height: "4px", background: t.border, borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ height: "100%", width: "32%", background: t.accent, borderRadius: "2px" }} />
                  </div>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>32.4 GB of 100 GB used</p>
                </div>

                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "24px" }}>
                  <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "12px" })}>Payment Method</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "26px", background: t.hoverBg, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={f({ fontWeight: 700, fontSize: "9px", color: t.textTertiary })}>VISA</span>
                      </div>
                      <span style={f({ fontWeight: 400, fontSize: "13px", color: t.textSecondary })}>•••• 4242</span>
                    </div>
                    <button style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer" })}>Update</button>
                  </div>
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
