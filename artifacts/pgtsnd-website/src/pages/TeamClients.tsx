import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  formatStatus,
  type Project,
  type Organization,
  type User,
} from "../hooks/useTeamData";
import {
  useCreateOrganization,
  useCreateUser,
  getListOrganizationsQueryKey,
  getListUsersQueryKey,
} from "@workspace/api-client-react";

type AddClientForm = {
  companyName: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  driveFolderId: string;
  slackChannelId: string;
};

const emptyForm: AddClientForm = {
  companyName: "",
  website: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
  driveFolderId: "",
  slackChannelId: "",
};

export default function TeamClients() {
  const { t } = useTheme();
  const { isLoading: authLoading, userMap, allUsers } = useTeamAuth();
  const { projects, organizations, isLoading } = useDashboardData();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddClientForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [showIntegrations, setShowIntegrations] = useState(false);
  const queryClient = useQueryClient();
  const createOrg = useCreateOrganization();
  const createUser = useCreateUser();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const isSaving = createOrg.isPending || createUser.isPending;

  const handleAddClient = async () => {
    setFormError("");
    if (!form.companyName.trim()) { setFormError("Company name is required"); return; }
    if (!form.contactName.trim()) { setFormError("Contact name is required"); return; }
    if (!form.contactEmail.trim()) { setFormError("Contact email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) { setFormError("Enter a valid email"); return; }

    try {
      await createOrg.mutateAsync({
        data: {
          name: form.companyName.trim(),
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim().toLowerCase(),
          phone: form.contactPhone.trim() || undefined,
          website: form.website.trim() || undefined,
          notes: form.notes.trim() || undefined,
          driveFolderId: form.driveFolderId.trim() || undefined,
          slackChannelId: form.slackChannelId.trim() || undefined,
        },
      });

      try {
        await createUser.mutateAsync({
          data: {
            name: form.contactName.trim(),
            email: form.contactEmail.trim().toLowerCase(),
            role: "client",
            phone: form.contactPhone.trim() || undefined,
          },
        });
      } catch (userErr: any) {
        if (userErr?.status !== 409) {
          throw userErr;
        }
      }

      queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setForm(emptyForm);
      setShowAddModal(false);
      setShowIntegrations(false);
    } catch (err: any) {
      if (err?.status === 409) {
        setFormError("A client with this email already exists");
      } else if (err?.data?.error) {
        setFormError(err.data.error);
      } else {
        setFormError(err?.message || "Failed to add client");
      }
    }
  };

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading clients...</p>
        </div>
      </TeamLayout>
    );
  }

  const clientUsers = allUsers.filter((u) => u.role === "client");

  const clientData = organizations.map((org: Organization) => {
    const orgProjects = projects.filter((p: Project) => p.organizationId === org.id);
    const clientUser = clientUsers.find((u: User) => u.id === orgProjects[0]?.clientId);
    const activeCount = orgProjects.filter((p: Project) => p.status === "active" || p.status === "in_progress").length;
    const totalBudget = orgProjects.reduce((sum: number, p: Project) => sum + (p.budget ?? 0), 0);
    const hasActive = activeCount > 0;

    return {
      id: org.id,
      name: org.contactName ?? org.name,
      company: org.name,
      email: org.contactEmail ?? "",
      phone: org.phone ?? "",
      projectCount: orgProjects.length,
      activeProjects: activeCount,
      totalRevenue: totalBudget,
      status: hasActive ? "active" : "completed",
      avatar: (org.contactName ?? org.name).split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      projects: orgProjects,
      driveFolderId: (org as any).driveFolderId,
      slackChannelId: (org as any).slackChannelId,
      stripeCustomerId: (org as any).stripeCustomerId,
    };
  });

  const totalRevenue = clientData.reduce((sum, c) => sum + c.totalRevenue, 0);

  const inputStyle = f({
    fontWeight: 400,
    fontSize: "13px",
    color: t.text,
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: "8px",
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box" as const,
  });

  const labelStyle = f({
    fontWeight: 600,
    fontSize: "10px",
    color: t.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "6px",
    display: "block" as const,
  });

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Clients</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {clientData.length} clients · ${totalRevenue.toLocaleString()} total revenue
            </p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setFormError(""); setShowIntegrations(false); setShowAddModal(true); }}
            style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Client
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {clientData.map((client) => (
            <div key={client.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%", background: t.activeNav,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...f({ fontWeight: 700, fontSize: "14px", color: t.textTertiary }),
                    flexShrink: 0,
                  }}>{client.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "2px" })}>{client.name}</p>
                    <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textTertiary, marginBottom: "2px" })}>{client.company}</p>
                    {client.email && <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{client.email}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {client.driveFolderId && (
                      <span title="Drive folder linked"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></span>
                    )}
                    {client.slackChannelId && (
                      <span title="Slack channel linked"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M14.5 2a2.5 2.5 0 0 0 0 5h2.5v2.5a2.5 2.5 0 0 0 5 0V2h-7.5z" /></svg></span>
                    )}
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: client.status === "active" ? t.accent : t.textMuted,
                    }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>{client.projectCount}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Projects</p>
                  </div>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>{client.activeProjects}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Active</p>
                  </div>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>${client.totalRevenue.toLocaleString()}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Revenue</p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-expanded={expandedClient === client.id}
                  onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                  style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" })}
                >
                  {expandedClient === client.id ? "Hide" : "View"} projects
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedClient === client.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </div>

              {expandedClient === client.id && (
                <div style={{ borderTop: `1px solid ${t.border}`, padding: "16px 24px" }}>
                  {client.projects.length === 0 ? (
                    <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>No projects yet</p>
                  ) : (
                    client.projects.map((proj: Project) => (
                      <Link key={proj.id} href={`/team/projects/${proj.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", cursor: "pointer" }}>
                          <p style={f({ fontWeight: 500, fontSize: "13px", color: t.text })}>{proj.name}</p>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px",
              padding: "32px", width: "500px", maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>Add Client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" })}>Company</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Acme Productions"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://example.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" })}>Primary Contact</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Jane Smith"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="jane@acme.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIntegrations(!showIntegrations)}
              style={f({
                fontWeight: 500, fontSize: "11px", color: t.textTertiary,
                background: "none", border: "none", cursor: "pointer",
                padding: 0, display: "flex", alignItems: "center", gap: "6px",
                marginBottom: showIntegrations ? "14px" : "0",
              })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showIntegrations ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
              Integrations (optional)
            </button>

            {showIntegrations && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: `1px solid ${t.borderSubtle}` }}>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: "4px" })}>
                  Pre-link integrations so projects for this client auto-connect.
                </p>
                <div>
                  <label style={labelStyle}>Google Drive Folder ID</label>
                  <input
                    value={form.driveFolderId}
                    onChange={(e) => setForm({ ...form, driveFolderId: e.target.value })}
                    placeholder="Paste folder ID from Drive URL"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Slack Channel</label>
                  <input
                    value={form.slackChannelId}
                    onChange={(e) => setForm({ ...form, slackChannelId: e.target.value })}
                    placeholder="#client-name or channel ID"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any notes about this client..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" as const }}
                  />
                </div>
              </div>
            )}

            {formError && (
              <p style={f({ fontWeight: 500, fontSize: "12px", color: "#ff4444", marginTop: "12px" })}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={f({
                  fontWeight: 600, fontSize: "12px", color: t.textSecondary,
                  background: "transparent", border: `1px solid ${t.border}`,
                  borderRadius: "8px", padding: "10px 20px", cursor: "pointer",
                })}
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={isSaving}
                style={f({
                  fontWeight: 600, fontSize: "12px", color: t.accentText,
                  background: t.accent, border: "none",
                  borderRadius: "8px", padding: "10px 24px", cursor: "pointer",
                  opacity: isSaving ? 0.6 : 1,
                })}
              >
                {isSaving ? "Adding..." : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeamLayout>
  );
}
