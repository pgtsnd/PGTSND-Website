import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type UserProfile } from "../lib/api";

export default function ClientAccount() {
  const { t } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "support">("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", title: "" });

  useEffect(() => {
    api
      .getClientProfile()
      .then((data) => {
        setProfile(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          title: data.title || "",
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await api.updateClientProfile(formData);
      setProfile(updated);
      setSaveMessage("Changes saved!");
    } catch (err: unknown) {
      setSaveMessage(`Error: ${err instanceof Error ? err.message : "Failed to save"}`);
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400,
    fontSize: "14px",
    color: t.text,
    background: t.bgInput,
    border: `1px solid ${t.border}`,
    borderRadius: "6px",
    padding: "12px 16px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: t.textTertiary,
    display: "block",
    marginBottom: "8px",
  };

  const tabs = [
    { key: "profile" as const, label: "Profile" },
    { key: "notifications" as const, label: "Notifications" },
    { key: "support" as const, label: "Support" },
  ];

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ padding: "48px 56px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: t.textTertiary }}>Loading...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "48px 56px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: "rgba(255,100,100,0.8)" }}>{error}</p>
        </div>
      </ClientLayout>
    );
  }

  const nameParts = (profile?.name || "").split(" ");
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : (profile?.initials || "??");

  return (
    <ClientLayout>
      <div style={{ padding: "48px 56px" }}>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: "28px", textTransform: "uppercase", letterSpacing: "-0.02em", color: t.text, marginBottom: "40px" }}>
          Account
        </h1>

        <div style={{ display: "flex", gap: "6px", marginBottom: "48px" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: "13px",
                color: activeTab === tab.key ? t.text : t.textTertiary,
                background: activeTab === tab.key ? t.activeNav : "transparent",
                border: `1px solid ${activeTab === tab.key ? t.border : t.borderSubtle}`,
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "48px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: t.activeNav, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "22px", color: t.textTertiary }}>
                {initials}
              </div>
              <div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "2px" }}>
                  {profile?.name || "—"}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary }}>
                  {profile?.organizationName || "—"}
                </p>
              </div>
            </div>

            {saveMessage && (
              <div style={{ padding: "12px 16px", background: saveMessage.startsWith("Error") ? "rgba(255,100,100,0.08)" : "rgba(96,208,96,0.08)", borderRadius: "8px", marginBottom: "24px" }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: saveMessage.startsWith("Error") ? "rgba(255,100,100,0.8)" : "rgba(96,208,96,0.8)" }}>{saveMessage}</p>
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={profile?.email || ""} disabled style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., CEO, Marketing Director"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "40px" }}>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={inputStyle}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "12px 32px", cursor: "pointer", opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {activeTab === "notifications" && (
          <div style={{ maxWidth: "560px" }}>
            {[
              {
                key: "emailNotifyReviews" as const,
                label: "New draft uploaded",
                description: "Get an email when your production team pushes a new cut for review",
              },
              {
                key: "emailNotifyComments" as const,
                label: "Comments & replies",
                description: "Get an email when someone comments or replies on a review",
              },
            ].map((pref) => {
              const checked = profile?.[pref.key] ?? true;
              const onToggle = async () => {
                const next = !checked;
                setProfile((p) => (p ? { ...p, [pref.key]: next } : p));
                try {
                  const updated = await api.updateNotificationPreferences({ [pref.key]: next });
                  setProfile((p) => (p ? { ...p, ...updated } : p));
                } catch {
                  setProfile((p) => (p ? { ...p, [pref.key]: checked } : p));
                }
              };
              return (
                <div key={pref.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: `1px solid ${t.border}` }}>
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" }}>{pref.label}</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>{pref.description}</p>
                  </div>
                  <div
                    role="switch"
                    aria-checked={checked}
                    aria-label={pref.label}
                    onClick={onToggle}
                    style={{ width: "44px", height: "24px", borderRadius: "12px", background: checked ? t.accent : t.border, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: "24px" }}
                  >
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: checked ? t.accentText : t.textMuted, position: "absolute", top: "3px", left: checked ? "23px" : "3px", transition: "left 0.15s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "support" && (
          <div style={{ maxWidth: "560px" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "15px", color: t.textSecondary, lineHeight: 1.7, marginBottom: "40px" }}>
              Need help with your project or account? Send us a message and we'll get back to you within 24 hours.
            </p>
            <div style={{ marginBottom: "24px" }}><label style={labelStyle}>Subject</label><input type="text" placeholder="What do you need help with?" style={inputStyle} /></div>
            <div style={{ marginBottom: "32px" }}><label style={labelStyle}>Message</label><textarea placeholder="Tell us more..." style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }} /></div>
            <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "12px 32px", cursor: "pointer" }}>Send Message</button>

            <div style={{ marginTop: "48px", padding: "24px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "8px" }}>Direct Contact</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary, lineHeight: 1.8 }}>Bri Dwyer — hello@pgtsndproductions.com</p>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
