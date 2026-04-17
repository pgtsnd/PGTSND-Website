import { useState, useEffect } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { SettingsSkeleton, ErrorState } from "../components/TeamLoadingStates";
import { useToast } from "../components/Toast";
import { useUpdateProfile } from "../hooks/useTeamData";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateMyNotificationPreferences } from "@workspace/api-client-react";
import {
  useIntegrations,
  useUpdateIntegration,
  useDisconnectIntegration,
  useVaultStatus,
  useEncryptExisting,
  useRotateVault,
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
  const updateNotificationPrefs = useUpdateMyNotificationPreferences();
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
          toast("Profile updated", "success");
          setTimeout(() => setSaved(false), 2000);
        },
        onError: () => {
          toast("Failed to update profile", "error");
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
        <SettingsSkeleton />
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
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>Control which emails you receive.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    {
                      key: "emailNotifyReviews" as const,
                      label: "Review submissions",
                      desc: "When a client leaves feedback through a shared review link",
                    },
                    {
                      key: "emailNotifyComments" as const,
                      label: "Comments & replies",
                      desc: "When someone comments or replies on a video review",
                    },
                  ].map((notif) => {
                    const checked = currentUser?.[notif.key] ?? true;
                    const onToggle = () => {
                      const next = !checked;
                      updateNotificationPrefs.mutate(
                        { data: { [notif.key]: next } },
                        {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
                            toast("Notification preferences updated", "success");
                          },
                          onError: () => {
                            toast("Failed to update preferences", "error");
                          },
                        },
                      );
                    };
                    return (
                      <div key={notif.key} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px",
                      }}>
                        <div>
                          <p style={f({ fontWeight: 500, fontSize: "13px", color: t.text, marginBottom: "2px" })}>{notif.label}</p>
                          <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{notif.desc}</p>
                        </div>
                        <div
                          role="switch"
                          aria-checked={checked}
                          aria-label={notif.label}
                          onClick={onToggle}
                          style={{
                            width: "40px",
                            height: "22px",
                            borderRadius: "11px",
                            background: checked ? t.accent : t.border,
                            position: "relative",
                            cursor: updateNotificationPrefs.isPending ? "wait" : "pointer",
                            opacity: updateNotificationPrefs.isPending ? 0.6 : 1,
                            flexShrink: 0,
                          }}
                        >
                          <div style={{
                            width: "16px", height: "16px", borderRadius: "50%",
                            background: checked ? t.accentText : t.textMuted,
                            position: "absolute", top: "3px", left: checked ? "21px" : "3px",
                            transition: "left 0.15s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
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
  const { toast } = useToast();
  const { currentUser } = useTeamAuth();
  const { data: integrations, isLoading, isError, refetch } = useIntegrations();
  const { data: vault } = useVaultStatus();
  const updateMutation = useUpdateIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const encryptExisting = useEncryptExisting();
  const isOwner = currentUser?.role === "owner";
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
          toast(`${integrationMeta[type]?.label ?? type} connected`, "success");
        },
        onError: () => {
          toast(`Failed to update ${integrationMeta[type]?.label ?? type}`, "error");
        },
      },
    );
  };

  const handleDisconnect = (type: string) => {
    disconnectMutation.mutate(type, {
      onSuccess: () => {
        setExpandedType(null);
        toast(`${integrationMeta[type]?.label ?? type} disconnected`, "info");
      },
      onError: () => {
        toast(`Failed to disconnect ${integrationMeta[type]?.label ?? type}`, "error");
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

  if (isError) {
    return (
      <div>
        <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Integrations</h2>
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>Connect external services to power billing, file storage, messaging, and contracts.</p>
        <ErrorState message="Couldn't load integrations. Please try again." onRetry={refetch} />
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

      {vault?.active && isOwner && (
        <VaultRotationCard t={t} f={f} />
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

function VaultRotationCard({ t, f }: { t: any; f: (s: object) => object }) {
  const rotate = useRotateVault();
  const [open, setOpen] = useState(false);
  const [oldKey, setOldKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [confirmKey, setConfirmKey] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [result, setResult] = useState<{ rowsRotated: number; valuesRotated: number; valuesSkipped: number } | null>(null);

  const reset = () => {
    setOldKey("");
    setNewKey("");
    setConfirmKey("");
    setLocalError(null);
  };

  const handleRotate = () => {
    setLocalError(null);
    if (!oldKey || !newKey) {
      setLocalError("Both the current and new master keys are required.");
      return;
    }
    if (oldKey === newKey) {
      setLocalError("The new key must be different from the current key.");
      return;
    }
    if (newKey !== confirmKey) {
      setLocalError("The new key and confirmation do not match.");
      return;
    }
    rotate.mutate(
      { oldKey, newKey },
      {
        onSuccess: (data) => {
          setResult({
            rowsRotated: data.rowsRotated,
            valuesRotated: data.valuesRotated,
            valuesSkipped: data.valuesSkipped,
          });
          reset();
        },
      },
    );
  };

  const inputStyle = f({
    fontWeight: 400, fontSize: "13px", color: t.text,
    background: t.bgCard, border: `1px solid ${t.border}`,
    borderRadius: "6px", padding: "10px 14px", width: "100%",
    outline: "none", boxSizing: "border-box" as const,
  });
  const labelStyle = f({
    fontWeight: 500, fontSize: "11px", color: t.textMuted,
    textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: "6px",
  });

  const errorMessage = localError ?? (rotate.isError ? rotate.error.message : null);

  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderRadius: "8px",
      marginBottom: "20px",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", cursor: "pointer",
        }}
      >
        <div>
          <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text, marginBottom: "2px" })}>
            Rotate Master Key
          </p>
          <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
            Re-encrypt every stored secret under a new VAULT_MASTER_KEY in a single transaction.
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${t.border}` }}>
          <div style={{
            background: "rgba(255,180,60,0.05)",
            border: "1px solid rgba(255,180,60,0.15)",
            borderRadius: "6px",
            padding: "10px 14px",
            margin: "14px 0",
          }}>
            <p style={f({ fontWeight: 600, fontSize: "11px", color: t.text, marginBottom: "4px" })}>
              Important
            </p>
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, lineHeight: 1.5 })}>
              The current key must match the server's active VAULT_MASTER_KEY. After a successful rotation,
              update the VAULT_MASTER_KEY environment variable to the new value and restart the API server,
              or stored secrets will become unreadable.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Current Master Key</label>
              <input
                type="password"
                autoComplete="off"
                value={oldKey}
                onChange={(e) => setOldKey(e.target.value)}
                placeholder="Active VAULT_MASTER_KEY"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>New Master Key</label>
              <input
                type="password"
                autoComplete="off"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. output of openssl rand -base64 48"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Master Key</label>
              <input
                type="password"
                autoComplete="off"
                value={confirmKey}
                onChange={(e) => setConfirmKey(e.target.value)}
                placeholder="Re-enter the new key"
                style={inputStyle}
              />
            </div>
          </div>

          {errorMessage && (
            <div style={{
              marginTop: "12px",
              padding: "10px 14px",
              background: "rgba(255,120,120,0.06)",
              border: "1px solid rgba(255,120,120,0.2)",
              borderRadius: "6px",
            }}>
              <p style={f({ fontWeight: 500, fontSize: "12px", color: "rgba(255,120,120,0.95)" })}>
                {errorMessage}
              </p>
            </div>
          )}

          {result && !rotate.isPending && !errorMessage && (
            <div style={{
              marginTop: "12px",
              padding: "10px 14px",
              background: "rgba(96,208,96,0.06)",
              border: "1px solid rgba(96,208,96,0.2)",
              borderRadius: "6px",
            }}>
              <p style={f({ fontWeight: 600, fontSize: "12px", color: "rgba(96,208,96,0.95)", marginBottom: "4px" })}>
                Rotation complete
              </p>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, lineHeight: 1.5 })}>
                Re-encrypted {result.valuesRotated} value{result.valuesRotated === 1 ? "" : "s"} across{" "}
                {result.rowsRotated} integration{result.rowsRotated === 1 ? "" : "s"}.{" "}
                {result.valuesSkipped > 0 && `${result.valuesSkipped} plaintext value${result.valuesSkipped === 1 ? "" : "s"} were left unchanged. `}
                Now update VAULT_MASTER_KEY to the new value and restart the API server.
              </p>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px" }}>
            <button
              onClick={handleRotate}
              disabled={rotate.isPending}
              style={f({
                fontWeight: 600, fontSize: "12px", color: t.accentText,
                background: t.accent, border: "none", borderRadius: "6px",
                padding: "10px 20px", cursor: rotate.isPending ? "wait" : "pointer",
                opacity: rotate.isPending ? 0.7 : 1,
              })}
            >
              {rotate.isPending ? "Rotating..." : "Rotate Key"}
            </button>
            <button
              onClick={() => { reset(); setResult(null); rotate.reset(); }}
              disabled={rotate.isPending}
              style={f({
                fontWeight: 500, fontSize: "11px", color: t.textMuted,
                background: "transparent", border: `1px solid ${t.border}`,
                borderRadius: "6px", padding: "10px 16px", cursor: "pointer",
              })}
            >
              Clear
            </button>
          </div>
        </div>
      )}
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
