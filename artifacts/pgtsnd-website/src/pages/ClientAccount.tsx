import { useState } from "react";
import ClientLayout from "../components/ClientLayout";

export default function ClientAccount() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "support">("profile");

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400,
    fontSize: "14px",
    color: "#ffffff",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
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
    color: "rgba(255,255,255,0.45)",
    display: "block",
    marginBottom: "8px",
  };

  const tabs = [
    { key: "profile" as const, label: "Profile" },
    { key: "notifications" as const, label: "Notifications" },
    { key: "support" as const, label: "Support" },
  ];

  return (
    <ClientLayout>
      <div style={{ padding: "48px 56px" }}>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "28px",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#ffffff",
            marginBottom: "40px",
          }}
        >
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
                color: activeTab === tab.key ? "#ffffff" : "rgba(255,255,255,0.45)",
                background: activeTab === tab.key ? "rgba(255,255,255,0.08)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === tab.key ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
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
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                NB
              </div>
              <div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "18px", color: "#ffffff", marginBottom: "2px" }}>
                  Nicole Baker
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                  Net Your Problem
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input type="text" defaultValue="Nicole" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input type="text" defaultValue="Baker" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Email</label>
              <input type="email" defaultValue="nicole@netyourproblem.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Company</label>
              <input type="text" defaultValue="Net Your Problem" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "40px" }}>
              <label style={labelStyle}>Phone</label>
              <input type="tel" defaultValue="(206) 555-0142" style={inputStyle} />
            </div>
            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#000000",
                background: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "12px 32px",
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        )}

        {activeTab === "notifications" && (
          <div style={{ maxWidth: "560px" }}>
            {[
              { label: "New draft uploaded", description: "Get notified when your production team uploads a new draft for review", checked: true },
              { label: "Comments & replies", description: "Get notified when someone replies to your comments", checked: true },
              { label: "Invoice & payment updates", description: "Receive notifications about new invoices and payment confirmations", checked: true },
              { label: "Project milestones", description: "Get updates when your project moves to a new phase", checked: false },
              { label: "Marketing & offerings", description: "Hear about new services and seasonal offerings from PGTSND", checked: false },
            ].map((pref) => (
              <div
                key={pref.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: "#ffffff", marginBottom: "4px" }}>
                    {pref.label}
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                    {pref.description}
                  </p>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    background: pref.checked ? "#ffffff" : "rgba(255,255,255,0.12)",
                    position: "relative",
                    cursor: "pointer",
                    flexShrink: 0,
                    marginLeft: "24px",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: pref.checked ? "#000000" : "rgba(255,255,255,0.3)",
                      position: "absolute",
                      top: "3px",
                      left: pref.checked ? "23px" : "3px",
                      transition: "left 0.15s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "support" && (
          <div style={{ maxWidth: "560px" }}>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "15px",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.7,
                marginBottom: "40px",
              }}
            >
              Need help with your project or account? Send us a message and we'll get back to you within 24 hours.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Subject</label>
              <input type="text" placeholder="What do you need help with?" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Message</label>
              <textarea
                placeholder="Tell us more..."
                style={{
                  ...inputStyle,
                  minHeight: "140px",
                  resize: "vertical",
                }}
              />
            </div>
            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#000000",
                background: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "12px 32px",
                cursor: "pointer",
              }}
            >
              Send Message
            </button>

            <div style={{ marginTop: "48px", padding: "24px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff", marginBottom: "8px" }}>
                Direct Contact
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                Bri Dwyer — hello@pgtsndproductions.com
              </p>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
