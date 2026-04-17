import { useMemo, useRef, useState } from "react";
import {
  useCreateProject,
  useCreateOrganization,
  useListOrganizations,
  useListUsers,
  getListProjectsQueryKey,
  getListOrganizationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "./ThemeContext";
import { useToast } from "./Toast";
import { csrfHeaders } from "../lib/csrf";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const FILE_KIND_OPTIONS = [
  "Kickoff recording",
  "Brief / scope doc",
  "Reference",
  "Contract",
  "Other",
] as const;

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

type PendingFile = {
  id: string;
  file: File;
  kind: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

function inferContentType(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const PROJECT_TYPES = [
  "Brand film",
  "Commercial / advertisement",
  "Documentary",
  "Event coverage",
  "Music video",
  "Product launch",
  "Social media content",
  "Training / internal",
  "Other",
] as const;

const STATUS_OPTIONS = [
  { value: "lead", label: "Lead - not started" },
  { value: "active", label: "Active - kicked off" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "In review" },
  { value: "delivered", label: "Delivered" },
  { value: "archived", label: "Archived" },
] as const;

const PHASE_OPTIONS = [
  { value: "pre_production", label: "Pre-production" },
  { value: "production", label: "Production" },
  { value: "post_production", label: "Post-production" },
  { value: "review", label: "Review" },
  { value: "delivered", label: "Delivered" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

type FormState = {
  // Step 1 - Basics
  name: string;
  projectType: string;
  organizationMode: "existing" | "new";
  organizationId: string;
  newOrgName: string;
  clientId: string;
  priority: string;
  // Step 2 - Scope
  description: string;
  scope: string;
  goals: string;
  targetAudience: string;
  // Step 3 - Deliverables & logistics
  deliverablesPlan: string;
  shootLocation: string;
  status: string;
  phase: string;
  // Step 4 - Timeline & budget
  startDate: string;
  dueDate: string;
  budget: string;
  // Step 5 - People & notes
  keyContact: string;
  referenceLinks: string;
  internalNotes: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  projectType: "",
  organizationMode: "existing",
  organizationId: "",
  newOrgName: "",
  clientId: "",
  priority: "normal",
  description: "",
  scope: "",
  goals: "",
  targetAudience: "",
  deliverablesPlan: "",
  shootLocation: "",
  status: "lead",
  phase: "pre_production",
  startDate: "",
  dueDate: "",
  budget: "",
  keyContact: "",
  referenceLinks: "",
  internalNotes: "",
};

export default function NewProjectWizard({ open, onClose, onCreated }: Props) {
  const { t } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: orgs } = useListOrganizations({ query: { enabled: open } });
  const { data: users } = useListUsers({ query: { enabled: open } });

  const createOrg = useCreateOrganization();
  const createProject = useCreateProject();

  const clients = useMemo(
    () => (users || []).filter((u: any) => u.role === "client"),
    [users],
  );

  if (!open) return null;

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const inputStyle = f({
    width: "100%",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 500,
    background: t.bgInput,
    color: t.text,
    border: `1px solid ${t.border}`,
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box" as const,
  });
  const labelStyle = f({
    display: "block",
    fontWeight: 600,
    fontSize: "11px",
    color: t.textSecondary,
    marginBottom: "6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  });
  const sectionLabelStyle = f({
    fontWeight: 700,
    fontSize: "11px",
    color: t.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "14px",
  });

  const close = () => {
    if (submitting) return;
    setForm(INITIAL_FORM);
    setStep(1);
    setError(null);
    setPendingFiles([]);
    onClose();
  };

  const addFiles = (incoming: FileList | File[]) => {
    const list: PendingFile[] = [];
    const skipped: string[] = [];
    const arr = Array.from(incoming);
    for (const file of arr) {
      if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
        skipped.push(`${file.name} (size out of range)`);
        continue;
      }
      list.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        kind: "Other",
        status: "pending",
        progress: 0,
      });
    }
    if (skipped.length) {
      toast(`Skipped: ${skipped.join(", ")}`, "error");
    }
    if (list.length) {
      setPendingFiles((prev) => [...prev, ...list]);
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePendingKind = (id: string, kind: string) => {
    setPendingFiles((prev) => prev.map((p) => (p.id === id ? { ...p, kind } : p)));
  };

  const uploadOneFile = async (
    item: PendingFile,
    folder: string,
  ): Promise<boolean> => {
    setPendingFiles((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, status: "uploading", progress: 5, error: undefined } : p,
      ),
    );
    const contentType = inferContentType(item.file);
    try {
      const reqRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ name: item.file.name, size: item.file.size, contentType }),
      });
      if (!reqRes.ok) {
        const data = await reqRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start upload");
      }
      const { uploadURL, objectPath } = (await reqRes.json()) as {
        uploadURL: string;
        objectPath: string;
      };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 10 + Math.round((e.loaded / e.total) * 85);
            setPendingFiles((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, progress: pct } : p)),
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(item.file);
      });

      const regRes = await fetch("/api/storage/media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          objectPath,
          name: item.file.name,
          contentType,
          sizeBytes: item.file.size,
          folder,
          label: item.kind && item.kind !== "Other" ? item.kind : undefined,
        }),
      });
      if (!regRes.ok) throw new Error("Failed to register upload");

      setPendingFiles((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "done", progress: 100 } : p)),
      );
      return true;
    } catch (e: any) {
      const msg = e?.message || "Upload failed";
      setPendingFiles((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "error", error: msg } : p,
        ),
      );
      return false;
    }
  };

  const validateStep = (s: Step): string | null => {
    if (s === 1) {
      if (!form.name.trim()) return "Project name is required.";
      if (form.organizationMode === "new" && !form.newOrgName.trim())
        return "New organization name is required.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(6, s + 1) as Step);
  };
  const prev = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1) as Step);
  };

  const submit = async () => {
    const err = validateStep(1);
    if (err) {
      setError(err);
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let organizationId: string | undefined =
        form.organizationMode === "existing" ? form.organizationId || undefined : undefined;

      if (form.organizationMode === "new") {
        const newOrg = (await createOrg.mutateAsync({
          data: { name: form.newOrgName.trim() },
        } as any)) as any;
        organizationId = newOrg?.id;
        await queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey() });
      }

      const toIso = (date: string) => (date ? new Date(date).toISOString() : undefined);
      const budgetNum = form.budget.trim() ? parseInt(form.budget.replace(/[^\d]/g, ""), 10) : undefined;

      const payload: any = {
        name: form.name.trim(),
        priority: form.priority,
        status: form.status,
        phase: form.phase,
      };
      if (organizationId) payload.organizationId = organizationId;
      if (form.clientId) payload.clientId = form.clientId;
      if (form.projectType) payload.projectType = form.projectType;
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.scope.trim()) payload.scope = form.scope.trim();
      if (form.goals.trim()) payload.goals = form.goals.trim();
      if (form.targetAudience.trim()) payload.targetAudience = form.targetAudience.trim();
      if (form.deliverablesPlan.trim()) payload.deliverablesPlan = form.deliverablesPlan.trim();
      if (form.shootLocation.trim()) payload.shootLocation = form.shootLocation.trim();
      if (toIso(form.startDate)) payload.startDate = toIso(form.startDate);
      if (toIso(form.dueDate)) payload.dueDate = toIso(form.dueDate);
      if (Number.isFinite(budgetNum)) payload.budget = budgetNum;
      if (form.keyContact.trim()) payload.keyContact = form.keyContact.trim();
      if (form.referenceLinks.trim()) payload.referenceLinks = form.referenceLinks.trim();
      if (form.internalNotes.trim()) payload.internalNotes = form.internalNotes.trim();

      const created = (await createProject.mutateAsync({ data: payload } as any)) as any;
      await queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });

      const filesToUpload = pendingFiles.filter((p) => p.status !== "done");
      if (filesToUpload.length && created?.id) {
        const folder = `project-${created.id}`;
        let okCount = 0;
        for (const item of filesToUpload) {
          // eslint-disable-next-line no-await-in-loop
          const ok = await uploadOneFile(item, folder);
          if (ok) okCount += 1;
        }
        if (okCount === filesToUpload.length) {
          toast(
            `Project "${created?.name ?? form.name}" created with ${okCount} file${okCount === 1 ? "" : "s"}.`,
            "success",
          );
        } else if (okCount > 0) {
          toast(
            `Project created. ${okCount} of ${filesToUpload.length} files uploaded — see remaining errors below.`,
            "info",
          );
          setError(`${filesToUpload.length - okCount} file(s) failed to upload. The project was still created.`);
          setSubmitting(false);
          return;
        } else {
          toast(`Project created, but uploads failed.`, "info");
          setError("All file uploads failed. The project was still created.");
          setSubmitting(false);
          return;
        }
      } else {
        toast(`Project "${created?.name ?? form.name}" created.`, "success");
      }

      onCreated?.(created?.id);
      setForm(INITIAL_FORM);
      setStep(1);
      setPendingFiles([]);
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to create project.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles: Record<Step, { label: string; sub: string }> = {
    1: { label: "Basics", sub: "What is this project and who is it for?" },
    2: { label: "Scope", sub: "Describe the work, goals, and audience." },
    3: { label: "Deliverables & status", sub: "What is being produced, and where does it stand?" },
    4: { label: "Timeline & budget", sub: "When and how much?" },
    5: { label: "Notes & contacts", sub: "Anything else worth tracking." },
    6: { label: "Files", sub: "Attach kickoff recordings, briefs, references — optional." },
  };

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(6px)",
        padding: "32px",
      }}
      data-testid="new-project-wizard"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: "16px",
          width: "720px",
          maxWidth: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>
              New project — {stepTitles[step].label}
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textTertiary, marginTop: "4px" })}>
              Step {step} of 5 · {stepTitles[step].sub}
            </p>
          </div>
          <button
            onClick={close}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}
            data-testid="wizard-close-btn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "4px", padding: "12px 28px 0" }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: "3px",
                background: n <= step ? t.accent : t.border,
                borderRadius: "2px",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <p style={sectionLabelStyle}>Project</p>
              <div>
                <label style={labelStyle}>Project name *</label>
                <input
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Northwest Sablefish — Brand Film"
                  style={inputStyle}
                  autoFocus
                  data-testid="wizard-name-input"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>Project type</label>
                  <select
                    value={form.projectType}
                    onChange={(e) => update({ projectType: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select type…</option>
                    {PROJECT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => update({ priority: e.target.value })}
                    style={inputStyle}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p style={{ ...sectionLabelStyle, marginTop: "10px" }}>Client</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                {(["existing", "new"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update({ organizationMode: mode })}
                    style={f({
                      flex: 1,
                      padding: "10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: form.organizationMode === mode ? t.accent : "transparent",
                      color: form.organizationMode === mode ? t.accentText : t.textSecondary,
                      border: `1px solid ${form.organizationMode === mode ? t.accent : t.border}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                    })}
                  >
                    {mode === "existing" ? "Existing organization" : "Create new"}
                  </button>
                ))}
              </div>
              {form.organizationMode === "existing" ? (
                <div>
                  <label style={labelStyle}>Organization</label>
                  <select
                    value={form.organizationId}
                    onChange={(e) => update({ organizationId: e.target.value })}
                    style={inputStyle}
                    data-testid="wizard-org-select"
                  >
                    <option value="">No organization (internal project)</option>
                    {(orgs || []).map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>New organization name *</label>
                  <input
                    value={form.newOrgName}
                    onChange={(e) => update({ newOrgName: e.target.value })}
                    placeholder="Acme Studios"
                    style={inputStyle}
                  />
                </div>
              )}
              <div>
                <label style={labelStyle}>Primary client contact</label>
                <select
                  value={form.clientId}
                  onChange={(e) => update({ clientId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">No specific contact</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName || c.lastName
                        ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
                        : c.email}
                      {c.email ? ` · ${c.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={labelStyle}>Short description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="One-paragraph summary of the project."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>
              <div>
                <label style={labelStyle}>Scope of work</label>
                <textarea
                  value={form.scope}
                  onChange={(e) => update({ scope: e.target.value })}
                  placeholder="What is included? What is explicitly out of scope?"
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>
              <div>
                <label style={labelStyle}>Goals & success criteria</label>
                <textarea
                  value={form.goals}
                  onChange={(e) => update({ goals: e.target.value })}
                  placeholder="What does success look like? Conversions? Brand awareness? Internal use?"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>
              <div>
                <label style={labelStyle}>Target audience</label>
                <textarea
                  value={form.targetAudience}
                  onChange={(e) => update({ targetAudience: e.target.value })}
                  placeholder="Who is this for? Demographics, channels, context."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={labelStyle}>Planned deliverables</label>
                <textarea
                  value={form.deliverablesPlan}
                  onChange={(e) => update({ deliverablesPlan: e.target.value })}
                  placeholder={
                    "List what will be produced. One per line is fine. Examples:\n- 90s hero film, 16:9, color graded\n- Three 15s social cuts, 9:16\n- Behind-the-scenes photo set"
                  }
                  rows={6}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary, marginTop: "6px" })}>
                  You can add formal deliverables with review/approval workflows from the project page later.
                </p>
              </div>
              <div>
                <label style={labelStyle}>Shoot location(s)</label>
                <input
                  value={form.shootLocation}
                  onChange={(e) => update({ shootLocation: e.target.value })}
                  placeholder="Seattle, WA · client HQ · on-water"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => update({ status: e.target.value })}
                    style={inputStyle}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Phase</label>
                  <select
                    value={form.phase}
                    onChange={(e) => update({ phase: e.target.value })}
                    style={inputStyle}
                  >
                    {PHASE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => update({ startDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Due date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => update({ dueDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Budget (USD)</label>
                <input
                  value={form.budget}
                  onChange={(e) => update({ budget: e.target.value })}
                  placeholder="25000"
                  style={inputStyle}
                  inputMode="numeric"
                />
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary, marginTop: "6px" })}>
                  Whole dollars. Used for budget tracking on the project page.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={labelStyle}>Key contact (free text)</label>
                <input
                  value={form.keyContact}
                  onChange={(e) => update({ keyContact: e.target.value })}
                  placeholder="Jane Smith — VP Marketing — jane@acme.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Reference links</label>
                <textarea
                  value={form.referenceLinks}
                  onChange={(e) => update({ referenceLinks: e.target.value })}
                  placeholder={"Mood boards, brand guides, prior work. One URL per line."}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>
              <div>
                <label style={labelStyle}>Internal notes (team-only)</label>
                <textarea
                  value={form.internalNotes}
                  onChange={(e) => update({ internalNotes: e.target.value })}
                  placeholder="Anything the crew should know. Not visible to the client."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>

              <div
                style={{
                  marginTop: "8px",
                  padding: "16px",
                  background: t.bgElevated,
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                }}
              >
                <p style={f({ fontWeight: 700, fontSize: "12px", color: t.text, marginBottom: "8px" })}>
                  Ready to create
                </p>
                <ul
                  style={f({
                    fontWeight: 400,
                    fontSize: "12px",
                    color: t.textSecondary,
                    margin: 0,
                    paddingLeft: "18px",
                    lineHeight: 1.7,
                  })}
                >
                  <li>
                    <strong>{form.name || "(unnamed)"}</strong>
                    {form.projectType ? ` — ${form.projectType}` : ""}
                  </li>
                  <li>
                    Status: {form.status} · Phase: {form.phase} · Priority: {form.priority}
                  </li>
                  <li>
                    Client:{" "}
                    {form.organizationMode === "new"
                      ? `(new) ${form.newOrgName || "(unnamed org)"}`
                      : (orgs || []).find((o: any) => o.id === form.organizationId)?.name ||
                        "No organization"}
                  </li>
                  <li>
                    Timeline:{" "}
                    {form.startDate || "—"} → {form.dueDate || "—"} · Budget: {form.budget ? `$${form.budget}` : "—"}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.6 })}>
                Drop in a kickoff meeting recording, the signed brief, mood-board PDFs, or any reference
                files you want stored alongside this project. Everything attaches to the project after it's
                created and shows up under Uploads. Up to 2 GB per file.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? t.accent : t.border}`,
                  borderRadius: "12px",
                  padding: "32px 20px",
                  textAlign: "center" as const,
                  background: dragOver ? `${t.accent}10` : t.bgElevated,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                data-testid="wizard-files-dropzone"
              >
                <p style={f({ fontWeight: 700, fontSize: "13px", color: t.text, marginBottom: "6px" })}>
                  Drop files here or click to browse
                </p>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary })}>
                  Videos, images, PDFs, audio — anything you want attached to the project.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                  data-testid="wizard-files-input"
                />
              </div>

              {pendingFiles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={f({ fontWeight: 700, fontSize: "11px", color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.08em" })}>
                    {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"} ready to attach
                  </p>
                  {pendingFiles.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        background: t.bgElevated,
                        border: `1px solid ${p.status === "error" ? "#ff6b6b55" : t.border}`,
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const })}>
                          {p.file.name}
                        </p>
                        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary, marginTop: "2px" })}>
                          {formatFileSize(p.file.size)}
                          {p.status === "uploading" && ` · uploading ${p.progress}%`}
                          {p.status === "done" && ` · uploaded`}
                          {p.status === "error" && ` · ${p.error || "upload failed"}`}
                        </p>
                        {p.status === "uploading" && (
                          <div style={{ height: "3px", background: t.border, borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                            <div style={{ width: `${p.progress}%`, height: "100%", background: t.accent, transition: "width 0.2s" }} />
                          </div>
                        )}
                      </div>
                      <select
                        value={p.kind}
                        onChange={(e) => updatePendingKind(p.id, e.target.value)}
                        disabled={p.status === "uploading" || p.status === "done"}
                        style={{
                          ...inputStyle,
                          width: "auto",
                          padding: "6px 8px",
                          fontSize: "11px",
                        }}
                      >
                        {FILE_KIND_OPTIONS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                      {p.status !== "uploading" && p.status !== "done" && (
                        <button
                          type="button"
                          onClick={() => removePendingFile(p.id)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", color: t.textTertiary }}
                          aria-label="Remove file"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary })}>
                Files upload after you click Create project. You can always add more later from the project page.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1 }}>
            {error && (
              <p style={f({ fontWeight: 500, fontSize: "12px", color: "#ff6b6b" })}>{error}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {step > 1 && (
              <button
                onClick={prev}
                disabled={submitting}
                style={f({
                  fontWeight: 600,
                  fontSize: "12px",
                  color: t.textSecondary,
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  padding: "10px 18px",
                  cursor: "pointer",
                })}
                data-testid="wizard-back-btn"
              >
                Back
              </button>
            )}
            {step < 6 ? (
              <button
                onClick={next}
                style={f({
                  fontWeight: 600,
                  fontSize: "12px",
                  color: t.accentText,
                  background: t.accent,
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 22px",
                  cursor: "pointer",
                })}
                data-testid="wizard-next-btn"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                style={f({
                  fontWeight: 700,
                  fontSize: "12px",
                  color: t.accentText,
                  background: t.accent,
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  cursor: submitting ? "wait" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                })}
                data-testid="wizard-submit-btn"
              >
                {submitting ? "Creating…" : "Create project"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
