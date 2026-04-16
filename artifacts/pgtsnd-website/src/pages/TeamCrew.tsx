import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  type User,
  type Project,
} from "../hooks/useTeamData";
import {
  useCreateUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";

type NewMemberForm = {
  name: string;
  email: string;
  role: "crew" | "partner";
  title: string;
  phone: string;
};

const emptyForm: NewMemberForm = { name: "", email: "", role: "crew", title: "", phone: "" };

export default function TeamCrew() {
  const { t } = useTheme();
  const { isLoading: authLoading, allUsers } = useTeamAuth();
  const { projects, isLoading } = useDashboardData();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<NewMemberForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();
  const createUser = useCreateUser();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const handleAddMember = async () => {
    setFormError("");
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.email.trim()) { setFormError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError("Enter a valid email"); return; }

    try {
      await createUser.mutateAsync({
        data: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          title: form.title.trim() || undefined,
          phone: form.phone.trim() || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setForm(emptyForm);
      setShowAddModal(false);
    } catch (err: any) {
      if (err?.status === 409) {
        setFormError("A user with this email already exists");
      } else if (err?.data?.error) {
        setFormError(err.data.error);
      } else {
        setFormError(err?.message || "Failed to add member");
      }
    }
  };

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading crew...</p>
        </div>
      </TeamLayout>
    );
  }

  const crewMembers = allUsers.filter((u) => u.role !== "client");

  const activeProjectsByUser = new Map<string, string[]>();
  for (const p of projects) {
    if (p.status === "active" || p.status === "in_progress") {
      if (p.clientId) {
        const existing = activeProjectsByUser.get(p.clientId) ?? [];
        existing.push(p.name);
        activeProjectsByUser.set(p.clientId, existing);
      }
    }
  }

  const crewData = crewMembers.map((user) => {
    const userProjects = activeProjectsByUser.get(user.id) ?? [];
    const isOnProject = userProjects.length > 0 || user.role === "owner";
    return {
      ...user,
      initials: user.initials ?? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      status: isOnProject ? "on-project" as const : "available" as const,
      currentProject: userProjects[0] ?? (user.role === "owner" ? "All Projects" : undefined),
      projectCount: projects.length,
    };
  });

  const available = crewData.filter((c) => c.status === "available").length;
  const onProject = crewData.filter((c) => c.status === "on-project").length;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Crew</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {crewData.length} members · {available} available · {onProject} on project
            </p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setFormError(""); setShowAddModal(true); }}
            style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Member
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {crewData.map((member) => (
            <div key={member.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <button
                type="button"
                aria-expanded={expandedMember === member.id}
                onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "20px 24px", cursor: "pointer", width: "100%",
                  background: "transparent", border: "none", textAlign: "left",
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%", background: t.activeNav,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...f({ fontWeight: 700, fontSize: "14px", color: t.textTertiary }),
                  flexShrink: 0,
                }}>{member.initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={f({ fontWeight: 700, fontSize: "15px", color: t.text, marginBottom: "2px" })}>{member.name}</p>
                  <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{member.title ?? member.role}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {member.currentProject && (
                    <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{member.currentProject}</span>
                  )}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 10px", borderRadius: "4px",
                    background: member.status === "available" ? "rgba(255,255,255,0.06)" : t.hoverBg,
                  }}>
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: member.status === "available" ? t.accent : t.textMuted,
                    }} />
                    <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, textTransform: "capitalize" })}>
                      {member.status === "on-project" ? "Busy" : "Available"}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: expandedMember === member.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </button>

              {expandedMember === member.id && (
                <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${t.borderSubtle}`, paddingTop: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Email</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.email}</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Role</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary, textTransform: "capitalize" })}>{member.role}</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Title</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.title ?? "—"}</p>
                    </div>
                  </div>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginTop: "8px" })}>
                    Member since {new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
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
              padding: "32px", width: "440px", maxWidth: "90vw",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>Add Crew Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@pgtsnd.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as "crew" | "partner" })}
                    style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}
                  >
                    <option value="crew">Crew</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="DP, Editor, etc."
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  style={inputStyle}
                />
              </div>
            </div>

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
                onClick={handleAddMember}
                disabled={createUser.isPending}
                style={f({
                  fontWeight: 600, fontSize: "12px", color: t.accentText,
                  background: t.accent, border: "none",
                  borderRadius: "8px", padding: "10px 24px", cursor: "pointer",
                  opacity: createUser.isPending ? 0.6 : 1,
                })}
              >
                {createUser.isPending ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeamLayout>
  );
}
