import { useMemo, useState } from "react";
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

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
};

type Step = 1 | 2 | 3 | 4 | 5;

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
    onClose();
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
    setStep((s) => Math.min(5, (s + 1) as Step));
  };
  const prev = () => {
    setError(null);
    setStep((s) => Math.max(1, (s - 1) as Step));
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
      toast(`Project "${created?.name ?? form.name}" created.`, "success");
      onCreated?.(created?.id);
      setForm(INITIAL_FORM);
      setStep(1);
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
          {[1, 2, 3, 4, 5].map((n) => (
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
            {step < 5 ? (
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
