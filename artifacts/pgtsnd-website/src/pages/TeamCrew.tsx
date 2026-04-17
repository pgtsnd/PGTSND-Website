import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import TeamLayout from "../components/TeamLayout";
import MemberAccessActions from "../components/MemberAccessActions";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { CrewSkeleton, ErrorState } from "../components/TeamLoadingStates";
import {
  useDashboardData,
  type User,
  type Project,
} from "../hooks/useTeamData";
import {
  useCreateUser,
  getListUsersQueryKey,
  listProjectMembers,
} from "@workspace/api-client-react";

type CrewTab = "profile" | "rates" | "tax";

type NewMemberForm = {
  name: string;
  email: string;
  role: "crew" | "partner";
  title: string;
  phone: string;
  dayRate: string;
  halfDayRate: string;
  hourlyRate: string;
  rateNotes: string;
  w9OnFile: boolean;
  taxClassification: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  equipment: string;
  specialties: string;
  portfolio: string;
  availability: string;
  paymentMethod: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  notes: string;
};

const emptyForm: NewMemberForm = {
  name: "", email: "", role: "crew", title: "", phone: "",
  dayRate: "", halfDayRate: "", hourlyRate: "", rateNotes: "",
  w9OnFile: false, taxClassification: "1099",
  address: "", city: "", state: "", zip: "",
  equipment: "", specialties: "", portfolio: "", availability: "",
  paymentMethod: "direct_deposit",
  emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
  notes: "",
};

export default function TeamCrew() {
  const { t } = useTheme();
  const { isLoading: authLoading, allUsers } = useTeamAuth();
  const { projects, isLoading, isError, refetch } = useDashboardData();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [crewTab, setCrewTab] = useState<CrewTab>("profile");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [form, setForm] = useState<NewMemberForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [membersByUser, setMembersByUser] = useState<Map<string, string[]>>(new Map());
  const [membersLoaded, setMembersLoaded] = useState(false);
  const queryClient = useQueryClient();
  const createUser = useCreateUser();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const activeProjects = projects.filter((p: Project) => p.status === "active" || p.status === "in_progress");

  useEffect(() => {
    if (membersLoaded || activeProjects.length === 0) return;
    const load = async () => {
      const map = new Map<string, string[]>();
      await Promise.all(activeProjects.map(async (p: Project) => {
        try {
          const members = await listProjectMembers(p.id);
          for (const m of members) {
            const existing = map.get(m.userId) ?? [];
            existing.push(p.name);
            map.set(m.userId, existing);
          }
        } catch {}
      }));
      setMembersByUser(map);
      setMembersLoaded(true);
    };
    load();
  }, [activeProjects.length, membersLoaded]);

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
          dayRate: form.dayRate ? parseInt(form.dayRate) : undefined,
          halfDayRate: form.halfDayRate ? parseInt(form.halfDayRate) : undefined,
          hourlyRate: form.hourlyRate ? parseInt(form.hourlyRate) : undefined,
          rateNotes: form.rateNotes.trim() || undefined,
          w9OnFile: form.w9OnFile,
          taxClassification: form.taxClassification || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          zip: form.zip.trim() || undefined,
          equipment: form.equipment.trim() || undefined,
          specialties: form.specialties.trim() || undefined,
          portfolio: form.portfolio.trim() || undefined,
          availability: form.availability.trim() || undefined,
          paymentMethod: form.paymentMethod || undefined,
          emergencyContactName: form.emergencyContactName.trim() || undefined,
          emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
          emergencyContactRelation: form.emergencyContactRelation.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setForm(emptyForm);
      setShowAddModal(false);
      setModalStep(1);
    } catch (err: any) {
      if (err?.status === 409) setFormError("A user with this email already exists");
      else if (err?.data?.error) setFormError(err.data.error);
      else setFormError(err?.message || "Failed to add member");
    }
  };

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <CrewSkeleton />
      </TeamLayout>
    );
  }

  if (isError) {
    return (
      <TeamLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState message="We couldn't load the crew list. Please check your connection and try again." onRetry={refetch} />
        </div>
      </TeamLayout>
    );
  }

  const crewMembers = allUsers.filter((u) => u.role !== "client");

  const crewData = crewMembers.map((user: any) => {
    const userProjects = membersByUser.get(user.id) ?? [];
    const isOnProject = userProjects.length > 0 || user.role === "owner";
    return {
      ...user,
      initials: user.initials ?? (user.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      status: isOnProject ? "on-project" as const : "available" as const,
      currentProject: userProjects[0] ?? (user.role === "owner" ? "All Projects" : undefined),
      projectCount: projects.length,
    };
  });

  const available = crewData.filter((c) => c.status === "available").length;
  const onProject = crewData.filter((c) => c.status === "on-project").length;
  const w9Missing = crewData.filter((c: any) => c.role !== "owner" && !c.w9OnFile).length;

  const inputStyle = f({
    fontWeight: 400, fontSize: "13px", color: t.text, background: t.bg,
    border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 14px",
    width: "100%", outline: "none", boxSizing: "border-box" as const,
  });
  const labelStyle = f({
    fontWeight: 600, fontSize: "10px", color: t.textMuted,
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
    marginBottom: "6px", display: "block" as const,
  });
  const sectionLabel = f({
    fontWeight: 600, fontSize: "10px", color: t.textMuted,
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
    marginBottom: "12px",
  });
  const detailLabel = f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" });
  const detailVal = f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary });

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Crew</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {crewData.length} members · {available} available · {onProject} on project
            </p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setFormError(""); setModalStep(1); setShowAddModal(true); }}
            style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Member
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px", marginBottom: "28px" }}>
          {[
            { label: "Total Crew", value: `${crewData.length}`, sub: "Active members" },
            { label: "Available", value: `${available}`, sub: "Ready to book", accent: "rgba(80,200,120,0.9)" },
            { label: "On Project", value: `${onProject}`, sub: "Currently assigned" },
            { label: "W-9 Missing", value: `${w9Missing}`, sub: w9Missing > 0 ? "Need to collect" : "All on file", accent: w9Missing > 0 ? "rgba(255,200,60,0.9)" : undefined },
          ].map((stat) => (
            <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px" }}>
              <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" })}>{stat.label}</p>
              <p style={f({ fontWeight: 800, fontSize: "22px", color: (stat as any).accent ?? t.text, marginBottom: "4px" })}>{stat.value}</p>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {crewData.map((member: any) => {
            const isExpanded = expandedMember === member.id;
            return (
              <div key={member.id} style={{ background: t.bgCard, border: `1px solid ${isExpanded ? t.accent : t.border}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s" }}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => { if (isExpanded) setExpandedMember(null); else { setExpandedMember(member.id); setCrewTab("profile"); } }}
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
                    {member.dayRate && (
                      <div style={{ textAlign: "right" }}>
                        <p style={f({ fontWeight: 700, fontSize: "14px", color: t.text, margin: 0 })}>${member.dayRate.toLocaleString()}</p>
                        <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Day Rate</p>
                      </div>
                    )}
                    {member.w9OnFile !== undefined && member.role !== "owner" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {member.w9OnFile ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(80,200,120,0.9)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.9)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        )}
                        <span style={f({ fontWeight: 500, fontSize: "9px", color: member.w9OnFile ? "rgba(80,200,120,0.9)" : "rgba(255,200,60,0.9)", textTransform: "uppercase", letterSpacing: "0.04em" })}>
                          W-9
                        </span>
                      </div>
                    )}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", borderBottom: `1px solid ${t.borderSubtle}`, padding: "0 24px" }}>
                      {(["profile", "rates", "tax"] as CrewTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setCrewTab(tab)}
                          style={f({
                            fontWeight: 600, fontSize: "11px",
                            color: crewTab === tab ? t.text : t.textMuted,
                            background: "none", border: "none",
                            borderBottom: crewTab === tab ? `2px solid ${t.accent}` : "2px solid transparent",
                            padding: "12px 16px", cursor: "pointer",
                            textTransform: "uppercase", letterSpacing: "0.06em",
                          })}
                        >
                          {tab === "profile" ? "Profile & Gear" : tab === "rates" ? "Rates & Pay" : "Tax & Address"}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding: "24px" }}>
                      {crewTab === "profile" && (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                            <div>
                              <p style={sectionLabel}>Contact</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                  <span style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{member.email}</span>
                                </div>
                                {member.phone && (
                                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    <span style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{member.phone}</span>
                                  </div>
                                )}
                                {member.portfolio && (
                                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    <span style={f({ fontWeight: 400, fontSize: "12px", color: t.accent })}>{member.portfolio}</span>
                                  </div>
                                )}
                              </div>

                              {member.availability && (
                                <div style={{ marginTop: "16px" }}>
                                  <p style={detailLabel}>Availability</p>
                                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textSecondary, lineHeight: 1.6 })}>{member.availability}</p>
                                </div>
                              )}

                              {member.specialties && (
                                <div style={{ marginTop: "16px" }}>
                                  <p style={detailLabel}>Specialties</p>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                                    {member.specialties.split(",").map((s: string, i: number) => (
                                      <span key={i} style={f({
                                        fontWeight: 500, fontSize: "10px", color: t.textTertiary,
                                        background: "rgba(255,255,255,0.04)", border: `1px solid ${t.borderSubtle}`,
                                        borderRadius: "4px", padding: "4px 8px",
                                      })}>{s.trim()}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              {member.equipment && (
                                <div>
                                  <p style={sectionLabel}>Equipment / Gear</p>
                                  <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: `1px solid ${t.borderSubtle}` }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                      {member.equipment.split(",").map((item: string, i: number) => (
                                        <div key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                                          <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, flexShrink: 0 })}>-</span>
                                          <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textSecondary, lineHeight: 1.4 })}>{item.trim()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {member.emergencyContactName && (
                                <div style={{ marginTop: "16px" }}>
                                  <p style={sectionLabel}>Emergency Contact</p>
                                  <div style={{ padding: "10px 14px", background: "rgba(255,80,80,0.03)", borderRadius: "8px", border: `1px solid rgba(255,80,80,0.08)` }}>
                                    <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text, marginBottom: "2px" })}>{member.emergencyContactName}</p>
                                    {member.emergencyContactRelation && (
                                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginBottom: "4px" })}>{member.emergencyContactRelation}</p>
                                    )}
                                    {member.emergencyContactPhone && (
                                      <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textSecondary })}>{member.emergencyContactPhone}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {member.notes && (
                                <div style={{ marginTop: "16px" }}>
                                  <p style={detailLabel}>Notes</p>
                                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textSecondary, lineHeight: 1.6 })}>{member.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginTop: "8px" })}>
                            Member since {new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </p>
                          <MemberAccessActions
                            userId={member.id}
                            userName={member.name}
                            userEmail={member.email}
                            userRole={member.role}
                          />
                        </div>
                      )}

                      {crewTab === "rates" && (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: `1px solid ${t.borderSubtle}` }}>
                              <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" })}>Day Rate</p>
                              <p style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>{member.dayRate ? `$${member.dayRate.toLocaleString()}` : "--"}</p>
                            </div>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: `1px solid ${t.borderSubtle}` }}>
                              <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" })}>Half-Day Rate</p>
                              <p style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>{member.halfDayRate ? `$${member.halfDayRate.toLocaleString()}` : "--"}</p>
                            </div>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: `1px solid ${t.borderSubtle}` }}>
                              <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" })}>Hourly Rate</p>
                              <p style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>{member.hourlyRate ? `$${member.hourlyRate.toLocaleString()}/hr` : "--"}</p>
                            </div>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: `1px solid ${t.borderSubtle}` }}>
                              <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" })}>Payment Method</p>
                              <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, textTransform: "capitalize" })}>
                                {member.paymentMethod === "direct_deposit" ? "Direct Deposit" : member.paymentMethod === "check" ? "Check" : member.paymentMethod ?? "--"}
                              </p>
                            </div>
                          </div>
                          {member.rateNotes && (
                            <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: `1px solid ${t.borderSubtle}` }}>
                              <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" })}>Rate Notes</p>
                              <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textSecondary, lineHeight: 1.6 })}>{member.rateNotes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {crewTab === "tax" && (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                              <p style={sectionLabel}>Tax & Compliance</p>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                  <p style={detailLabel}>W-9 Status</p>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {member.w9OnFile ? (
                                      <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(80,200,120,0.9)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                        <span style={f({ fontWeight: 600, fontSize: "12px", color: "rgba(80,200,120,0.9)" })}>On File</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.9)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                        <span style={f({ fontWeight: 600, fontSize: "12px", color: "rgba(255,200,60,0.9)" })}>Missing</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p style={detailLabel}>Tax Classification</p>
                                  <p style={detailVal}>{member.taxClassification === "1099" ? "1099 Contractor" : member.taxClassification === "w2" ? "W-2 Employee" : member.taxClassification ?? "--"}</p>
                                </div>
                              </div>
                              {member.ein && (
                                <div>
                                  <p style={detailLabel}>EIN</p>
                                  <p style={detailVal}>{member.ein}</p>
                                </div>
                              )}
                            </div>

                            <div>
                              <p style={sectionLabel}>Mailing Address</p>
                              {member.address ? (
                                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: `1px solid ${t.borderSubtle}` }}>
                                  <p style={f({ fontWeight: 500, fontSize: "12px", color: t.text, marginBottom: "2px" })}>{member.address}</p>
                                  <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                                    {[member.city, member.state].filter(Boolean).join(", ")}{member.zip ? ` ${member.zip}` : ""}
                                  </p>
                                </div>
                              ) : (
                                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>No address on file</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
              padding: "32px", width: "560px", maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>Add Crew Member</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {[1, 2, 3].map((step) => (
                <button key={step} onClick={() => setModalStep(step)} style={f({
                  fontWeight: 600, fontSize: "10px",
                  color: modalStep === step ? t.text : t.textMuted,
                  background: modalStep === step ? "rgba(255,255,255,0.06)" : "transparent",
                  border: `1px solid ${modalStep === step ? t.accent : t.borderSubtle}`,
                  borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                })}>
                  {step === 1 ? "1. Basics" : step === 2 ? "2. Rates & Pay" : "3. Details"}
                </button>
              ))}
            </div>

            {modalStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@email.com" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "crew" | "partner" })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="crew">Crew</option>
                      <option value="partner">Partner</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="DP, Editor, etc." style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Portfolio / Website</label>
                  <input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} placeholder="https://portfolio.com" style={inputStyle} />
                </div>
              </div>
            )}

            {modalStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" })}>Rates</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Day Rate ($)</label>
                    <input type="number" value={form.dayRate} onChange={(e) => setForm({ ...form, dayRate: e.target.value })} placeholder="1200" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Half-Day ($)</label>
                    <input type="number" value={form.halfDayRate} onChange={(e) => setForm({ ...form, halfDayRate: e.target.value })} placeholder="700" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Hourly ($)</label>
                    <input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="150" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Rate Notes</label>
                  <textarea value={form.rateNotes} onChange={(e) => setForm({ ...form, rateNotes: e.target.value })} placeholder="Overtime policy, travel fees, rush rates, etc." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>

                <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "8px", marginBottom: "4px" })}>Payment & Tax</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Payment Method</label>
                    <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="direct_deposit">Direct Deposit</option>
                      <option value="check">Check</option>
                      <option value="venmo">Venmo</option>
                      <option value="zelle">Zelle</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Classification</label>
                    <select value={form.taxClassification} onChange={(e) => setForm({ ...form, taxClassification: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="1099">1099 Contractor</option>
                      <option value="w2">W-2 Employee</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    checked={form.w9OnFile}
                    onChange={(e) => setForm({ ...form, w9OnFile: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: t.accent, cursor: "pointer" }}
                  />
                  <span style={f({ fontWeight: 500, fontSize: "12px", color: t.text })}>W-9 form on file</span>
                </div>
              </div>
            )}

            {modalStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" })}>Mailing Address</p>
                <div>
                  <label style={labelStyle}>Street Address</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="1234 Main St, Apt 5" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Portland" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="OR" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ZIP</label>
                    <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} placeholder="97201" style={inputStyle} />
                  </div>
                </div>

                <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "8px", marginBottom: "4px" })}>Equipment & Skills</p>
                <div>
                  <label style={labelStyle}>Equipment / Gear (comma-separated)</label>
                  <textarea value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="RED Komodo, DJI RS3, Aputure 600d, etc." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Specialties (comma-separated)</label>
                  <input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Narrative, commercial, drone, etc." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Availability</label>
                  <textarea value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Schedule, lead time, travel range..." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>

                <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "8px", marginBottom: "4px" })}>Emergency Contact</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} placeholder="Contact name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input type="tel" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} placeholder="(555) 000-0000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Relation</label>
                    <input value={form.emergencyContactRelation} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} placeholder="Spouse, parent..." style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>
              </div>
            )}

            {formError && (
              <p style={f({ fontWeight: 500, fontSize: "12px", color: "#ff4444", marginTop: "12px" })}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
              {modalStep > 1 && (
                <button
                  onClick={() => setModalStep(modalStep - 1)}
                  style={f({ fontWeight: 600, fontSize: "12px", color: t.textSecondary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer" })}
                >
                  Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setShowAddModal(false)}
                style={f({ fontWeight: 600, fontSize: "12px", color: t.textSecondary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer" })}
              >
                Cancel
              </button>
              {modalStep < 3 ? (
                <button
                  onClick={() => setModalStep(modalStep + 1)}
                  style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "8px", padding: "10px 24px", cursor: "pointer" })}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleAddMember}
                  disabled={createUser.isPending}
                  style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", opacity: createUser.isPending ? 0.6 : 1 })}
                >
                  {createUser.isPending ? "Adding..." : "Add Member"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </TeamLayout>
  );
}
