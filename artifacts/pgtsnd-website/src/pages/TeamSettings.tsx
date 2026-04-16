import { useState, useEffect } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { useUpdateProfile } from "../hooks/useTeamData";
import { useQueryClient } from "@tanstack/react-query";
import {
  useIntegrations,
  useUpdateIntegration,
  useDisconnectIntegration,
  useVaultStatus,
  useEncryptExisting,
  type IntegrationSetting,
} from "../hooks/useIntegrations";

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
              <IntegrationsPanel t={t} f={f} />
            )}
          </div>
        </div>
      </div>
    </TeamLayout>
  );
}

const integrationMeta: Record<string, { label: string; desc: string; fields: { key: string; label: string; placeholder: string; sensitive?: boolean }[] }> = {
  stripe: {
    label: "Stripe",
    desc: "Accept payments and manage invoices",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "sk_live_...", sensitive: true },
      { key: "publishableKey", label: "Publishable Key", placeholder: "pk_live_..." },
      { key: "webhookSecret", label: "Webhook Secret", placeholder: "whsec_...", sensitive: true },
    ],
  },
  google_drive: {
    label: "Google Drive",
    desc: "Sync project files and deliverables",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "ya29...", sensitive: true },
      { key: "clientId", label: "Client ID", placeholder: "xxxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "Client Secret", placeholder: "GOCSPX-...", sensitive: true },
    ],
  },
  slack: {
    label: "Slack",
    desc: "Team notifications and client messaging",
    fields: [
      { key: "botToken", label: "Bot Token", placeholder: "xoxb-...", sensitive: true },
      { key: "defaultChannelId", label: "Default Channel ID", placeholder: "C01234567" },
    ],
  },
  docusign: {
    label: "DocuSign",
    desc: "Send contracts for e-signature",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "eyJ0...", sensitive: true },
      { key: "accountId", label: "Account ID", placeholder: "xxxxxxxx-xxxx-..." },
      { key: "basePath", label: "Base Path", placeholder: "https://demo.docusign.net/restapi" },
    ],
  },
};

function IntegrationsPanel({ t, f }: { t: any; f: (s: object) => object }) {
  const { data: integrations, isLoading } = useIntegrations();
  const { data: vault } = useVaultStatus();
  const updateMutation = useUpdateIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const encryptExisting = useEncryptExisting();
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const types = ["stripe", "google_drive", "slack", "docusign"] as const;

  const getIntegration = (type: string): IntegrationSetting | undefined =>
    integrations?.find((i) => i.type === type);

  const handleFieldChange = (type: string, key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: { ...(prev[type] || {}), [key]: value },
    }));
  };

  const handleSave = (type: string) => {
    const config = formData[type] || {};
    updateMutation.mutate(
      { type, enabled: true, config },
      {
        onSuccess: () => {
          setSaveMsg(type);
          setTimeout(() => setSaveMsg(null), 2000);
          setFormData((prev) => ({ ...prev, [type]: {} }));
        },
      },
    );
  };

  const handleDisconnect = (type: string) => {
    disconnectMutation.mutate(type, {
      onSuccess: () => {
        setExpandedType(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Integrations</h2>
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Integrations</h2>
      <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "16px" })}>Connect external services to power billing, file storage, messaging, and contracts.</p>

      {vault && (
        <div style={{
          background: vault.active ? "rgba(96,208,96,0.05)" : "rgba(255,180,60,0.05)",
          border: `1px solid ${vault.active ? "rgba(96,208,96,0.15)" : "rgba(255,180,60,0.15)"}`,
          borderRadius: "8px", padding: "14px 18px", marginBottom: "20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={vault.active ? "rgba(96,208,96,0.8)" : "rgba(255,180,60,0.8)"} strokeWidth="2">
              {vault.active ? (
                <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
              ) : (
                <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>
              )}
            </svg>
            <div>
              <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>
                {vault.active ? "Vault Encryption Active" : "Vault Not Configured"}
              </p>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                {vault.active
                  ? `AES-256-GCM  --  ${vault.encryptedCount} encrypted, ${vault.unencryptedCount} pending`
                  : "API keys are stored as plain text. Set VAULT_MASTER_KEY to enable encryption."}
              </p>
            </div>
          </div>
          {vault.active && vault.unencryptedCount > 0 && (
            <button
              onClick={() => encryptExisting.mutate()}
              disabled={encryptExisting.isPending}
              style={f({
                fontWeight: 600, fontSize: "11px", color: t.accentText,
                background: t.accent, border: "none", borderRadius: "5px",
                padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap" as const,
                opacity: encryptExisting.isPending ? 0.7 : 1,
              })}
            >
              {encryptExisting.isPending ? "Encrypting..." : "Encrypt All"}
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {types.map((type) => {
          const meta = integrationMeta[type];
          const integration = getIntegration(type);
          const isConnected = integration?.enabled ?? false;
          const isEncrypted = integration?.encrypted ?? false;
          const isExpanded = expandedType === type;

          return (
            <div key={type} style={{
              background: t.bgCard,
              border: `1px solid ${isConnected ? "rgba(96,208,96,0.2)" : t.border}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <div
                onClick={() => setExpandedType(isExpanded ? null : type)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                    <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{meta.label}</p>
                    {isConnected && (
                      <span style={f({
                        fontWeight: 600, fontSize: "9px", textTransform: "uppercase",
                        color: "rgba(96,208,96,0.8)", background: "rgba(96,208,96,0.08)",
                        padding: "2px 8px", borderRadius: "3px", letterSpacing: "0.05em",
                      })}>Connected</span>
                    )}
                    {isConnected && isEncrypted && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(96,208,96,0.6)" strokeWidth="2" title="Encrypted at rest">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    )}
                  </div>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{meta.desc}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {isExpanded && (
                <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${t.border}` }}>
                  <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    {meta.fields.map((field) => {
                      const currentValue = formData[type]?.[field.key] ?? "";
                      const savedValue = integration?.config?.[field.key] ?? "";
                      return (
                        <div key={field.key}>
                          <label style={f({
                            fontWeight: 500, fontSize: "11px", color: t.textMuted,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            display: "block", marginBottom: "6px",
                          })}>{field.label}</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={field.sensitive ? "password" : "text"}
                              value={currentValue}
                              onChange={(e) => handleFieldChange(type, field.key, e.target.value)}
                              placeholder={savedValue || field.placeholder}
                              style={f({
                                fontWeight: 400, fontSize: "13px", color: t.text,
                                background: t.bgCard, border: `1px solid ${t.border}`,
                                borderRadius: "6px", padding: "10px 14px", width: "100%",
                                outline: "none", boxSizing: "border-box" as const,
                                paddingRight: field.sensitive && savedValue ? "36px" : "14px",
                              })}
                            />
                            {field.sensitive && savedValue && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isEncrypted ? "rgba(96,208,96,0.5)" : "rgba(255,180,60,0.5)"} strokeWidth="2" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px" }}>
                    <button
                      onClick={() => handleSave(type)}
                      disabled={updateMutation.isPending}
                      style={f({
                        fontWeight: 600, fontSize: "12px", color: t.accentText,
                        background: t.accent, border: "none", borderRadius: "6px",
                        padding: "10px 20px", cursor: "pointer",
                        opacity: updateMutation.isPending ? 0.7 : 1,
                      })}
                    >
                      {updateMutation.isPending ? "Saving..." : isConnected ? "Update" : "Connect"}
                    </button>
                    {isConnected && (
                      <button
                        onClick={() => handleDisconnect(type)}
                        disabled={disconnectMutation.isPending}
                        style={f({
                          fontWeight: 500, fontSize: "11px", color: "rgba(255,120,120,0.8)",
                          background: "transparent", border: `1px solid rgba(255,120,120,0.2)`,
                          borderRadius: "6px", padding: "10px 16px", cursor: "pointer",
                        })}
                      >
                        Disconnect
                      </button>
                    )}
                    {saveMsg === type && (
                      <span style={f({ fontWeight: 500, fontSize: "12px", color: "rgba(96,208,96,0.8)" })}>Saved!</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
