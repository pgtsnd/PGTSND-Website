import { useState, useRef } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import UploaderBadge from "../components/UploaderBadge";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { AssetsSkeleton, ErrorState, SkeletonCard } from "../components/TeamLoadingStates";
import {
  useDashboardData,
  useProjectDeliverables,
  formatDate,
  timeAgo,
  type Project,
  type Deliverable,
} from "../hooks/useTeamData";

function useAllDeliverables(projects: Project[]) {
  const results = projects.map((p) => useProjectDeliverables(p.id));
  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const refetch = () => results.forEach((r) => r.refetch());
  const deliverables: (Deliverable & { projectName: string })[] = [];
  results.forEach((r, i) => {
    if (r.data) {
      for (const d of r.data) {
        deliverables.push({ ...d, projectName: projects[i].name });
      }
    }
  });
  return { deliverables, isLoading, isError, refetch };
}

export default function TeamAssets() {
  const { t } = useTheme();
  const { isLoading: authLoading } = useTeamAuth();
  const { projects, isLoading: dashLoading, isError: dashError, refetch: refetchDash } = useDashboardData();
  const { userMap } = useTeamAuth();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const activeProjects = projects.filter((p) => p.status !== "archived");
  const { deliverables, isLoading: delLoading, isError: delError, refetch: refetchDel } = useAllDeliverables(activeProjects);

  if (authLoading || dashLoading) {
    return (
      <TeamLayout>
        <AssetsSkeleton />
      </TeamLayout>
    );
  }

  if (dashError) {
    return (
      <TeamLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState message="We couldn't load your asset library. Please check your connection and try again." onRetry={refetchDash} />
        </div>
      </TeamLayout>
    );
  }

  const filteredDeliverables = projectFilter === "all"
    ? deliverables
    : deliverables.filter((d) => d.projectName === projectFilter);

  const projectNames = [...new Set(deliverables.map((d) => d.projectName))];

  const byProject = new Map<string, (Deliverable & { projectName: string })[]>();
  for (const d of filteredDeliverables) {
    const key = d.projectName;
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(d);
  }

  const typeIcon = (type: string) => {
    const s = { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: t.textMuted, strokeWidth: "1.5" };
    if (type === "video") return <svg {...s}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>;
    if (type === "audio") return <svg {...s}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
    if (type === "image") return <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    return <svg {...s}><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>;
  };

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Asset Library</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {deliverables.length} deliverables across {projectNames.length} projects
            </p>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Upload
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} />
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          <button onClick={() => setProjectFilter("all")} style={f({
            fontWeight: projectFilter === "all" ? 600 : 400, fontSize: "12px",
            color: projectFilter === "all" ? t.text : t.textMuted,
            background: projectFilter === "all" ? t.activeNav : "transparent",
            border: `1px solid ${projectFilter === "all" ? t.border : "transparent"}`,
            borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
          })}>All Projects</button>
          {projectNames.map((p) => (
            <button key={p} onClick={() => setProjectFilter(p)} style={f({
              fontWeight: projectFilter === p ? 600 : 400, fontSize: "12px",
              color: projectFilter === p ? t.text : t.textMuted,
              background: projectFilter === p ? t.activeNav : "transparent",
              border: `1px solid ${projectFilter === p ? t.border : "transparent"}`,
              borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
            })}>{p}</button>
          ))}
        </div>

        {delLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <SkeletonCard height="100px" />
            <SkeletonCard height="100px" />
            <SkeletonCard height="100px" />
          </div>
        ) : delError ? (
          <ErrorState message="We couldn't load deliverables for some projects." onRetry={refetchDel} />
        ) : filteredDeliverables.length === 0 ? (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
            <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No deliverables yet</p>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Deliverables will appear here once created in projects.</p>
          </div>
        ) : (
          <>
            {[...byProject.entries()].map(([projectName, dels]) => (
              <div key={projectName} style={{ marginBottom: "28px" }}>
                <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
                  {projectName} ({dels.length})
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  {dels.map((d) => (
                    <div key={d.id} style={{
                      background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                      padding: "18px", cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        {typeIcon(d.type)}
                        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{d.title}</p>
                      </div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                        <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, background: t.hoverBg, padding: "2px 8px", borderRadius: "3px", textTransform: "uppercase" })}>{d.status.replace("_", " ")}</span>
                        {d.version && <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{d.version}</span>}
                        <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{timeAgo(d.updatedAt)}</span>
                      </div>
                      <UploaderBadge
                        name={d.uploadedBy ? userMap.get(d.uploadedBy)?.name ?? null : null}
                        avatarUrl={d.uploadedBy ? userMap.get(d.uploadedBy)?.avatarUrl ?? null : null}
                        size={16}
                        fontSize={10}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>All Deliverables</h2>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              {filteredDeliverables.map((d, i) => (
                <div key={d.id} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 20px",
                  borderBottom: i < filteredDeliverables.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
                }}>
                  <div style={{ display: "flex" }}>{typeIcon(d.type)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={f({ fontWeight: 500, fontSize: "13px", color: t.text })}>{d.title}</p>
                    <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{d.projectName}</p>
                  </div>
                  <UploaderBadge
                    name={d.uploadedBy ? userMap.get(d.uploadedBy)?.name ?? null : null}
                    avatarUrl={d.uploadedBy ? userMap.get(d.uploadedBy)?.avatarUrl ?? null : null}
                    size={16}
                    fontSize={10}
                  />
                  <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, background: t.hoverBg, padding: "2px 8px", borderRadius: "3px", textTransform: "uppercase" })}>{d.status.replace("_", " ")}</span>
                  <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, minWidth: "70px", textAlign: "right" })}>{timeAgo(d.updatedAt)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </TeamLayout>
  );
}
