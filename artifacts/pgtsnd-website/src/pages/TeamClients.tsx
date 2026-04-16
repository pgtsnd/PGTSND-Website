import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { ClientsSkeleton, ErrorState } from "../components/TeamLoadingStates";
import {
  useDashboardData,
  formatStatus,
  formatDate,
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
import { api, type Invoice, type Contract } from "../lib/api";
import { exportTeamInvoicesToCsv, type TeamInvoiceExportRow } from "../lib/exports";

type ClientTab = "overview" | "invoices" | "scope";

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

type NewInvoiceForm = {
  projectId: string;
  description: string;
  amount: string;
  invoiceNumber: string;
  dueDate: string;
};

const emptyInvoiceForm: NewInvoiceForm = {
  projectId: "",
  description: "",
  amount: "",
  invoiceNumber: "",
  dueDate: "",
};

function fmtUsd(amount: number) {
  return amount.toLocaleString();
}

export default function TeamClients() {
  const { t } = useTheme();
  const { isLoading: authLoading, allUsers } = useTeamAuth();
  const { projects, organizations, isLoading, isError, refetch } = useDashboardData();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddClientForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<NewInvoiceForm>(emptyInvoiceForm);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const queryClient = useQueryClient();
  const createOrg = useCreateOrganization();
  const createUser = useCreateUser();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const isSaving = createOrg.isPending || createUser.isPending;

  useEffect(() => {
    if (!invoicesLoaded) {
      api.getAllInvoices().then((inv) => {
        setInvoices(inv);
        setInvoicesLoaded(true);
      }).catch(() => setInvoicesLoaded(true));
    }
  }, [invoicesLoaded]);

  const refreshInvoices = () => {
    api.getAllInvoices().then(setInvoices).catch(() => {});
  };

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
        if (userErr?.status !== 409) throw userErr;
      }

      queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setForm(emptyForm);
      setShowAddModal(false);
      setShowIntegrations(false);
    } catch (err: any) {
      if (err?.status === 409) setFormError("A client with this email already exists");
      else if (err?.data?.error) setFormError(err.data.error);
      else setFormError(err?.message || "Failed to add client");
    }
  };

  const [invoiceError, setInvoiceError] = useState("");

  const handleCreateInvoice = async () => {
    if (!invoiceForm.projectId || !invoiceForm.description.trim() || !invoiceForm.amount) return;
    const amountDollars = parseFloat(invoiceForm.amount);
    if (isNaN(amountDollars) || amountDollars <= 0) { setInvoiceError("Enter a valid amount"); return; }
    setInvoiceSaving(true);
    setInvoiceError("");
    try {
      await api.createInvoice(invoiceForm.projectId, {
        description: invoiceForm.description.trim(),
        amount: Math.round(amountDollars),
        invoiceNumber: invoiceForm.invoiceNumber.trim() || undefined,
        dueDate: invoiceForm.dueDate || undefined,
        status: "draft",
      });
      setInvoiceForm(emptyInvoiceForm);
      setShowNewInvoice(false);
      refreshInvoices();
    } catch (err: any) {
      setInvoiceError(err?.message || "Failed to create invoice");
    } finally {
      setInvoiceSaving(false);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    await api.updateInvoice(invoiceId, { status: "paid" });
    refreshInvoices();
  };

  const handleSendInvoice = async (invoiceId: string) => {
    await api.updateInvoice(invoiceId, { status: "sent" });
    refreshInvoices();
  };

  const handleVoidInvoice = async (invoiceId: string) => {
    await api.updateInvoice(invoiceId, { status: "void" });
    refreshInvoices();
  };

  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [linkLoadingId, setLinkLoadingId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const allStatuses: Invoice["status"][] = ["draft", "sent", "paid", "overdue", "void"];
  const [exportFilters, setExportFilters] = useState<{
    statuses: Invoice["status"][];
    clientId: string;
    fromDate: string;
    toDate: string;
  }>({ statuses: [...allStatuses], clientId: "", fromDate: "", toDate: "" });

  const handleCopyPaymentLink = async (invoiceId: string) => {
    setLinkLoadingId(invoiceId);
    setLinkError(null);
    try {
      const baseUrl = `${window.location.origin}/client/billing`;
      const successUrl = `${baseUrl}?payment=success`;
      const cancelUrl = `${baseUrl}?payment=canceled`;
      const result = await api.createCheckoutSession(invoiceId, successUrl, cancelUrl);
      try {
        await navigator.clipboard.writeText(result.url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = result.url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedInvoiceId(invoiceId);
      setTimeout(() => setCopiedInvoiceId((cur) => (cur === invoiceId ? null : cur)), 2000);
    } catch (err: any) {
      setLinkError(err?.message || "Failed to create payment link");
      setTimeout(() => setLinkError(null), 4000);
    } finally {
      setLinkLoadingId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <ClientsSkeleton />
      </TeamLayout>
    );
  }

  if (isError) {
    return (
      <TeamLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState message="We couldn't load your client list. Please check your connection and try again." onRetry={refetch} />
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
    const orgInvoices = invoices.filter((inv) => orgProjects.some((p) => p.id === inv.projectId));
    const totalPaid = orgInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
    const totalOutstanding = orgInvoices.filter((inv) => inv.status === "sent" || inv.status === "draft").reduce((sum, inv) => sum + inv.amount, 0);
    const hasActive = activeCount > 0;

    return {
      id: org.id,
      name: org.contactName ?? org.name,
      company: org.name,
      email: org.contactEmail ?? "",
      phone: org.phone ?? "",
      website: (org as any).website ?? "",
      notes: (org as any).notes ?? "",
      projectCount: orgProjects.length,
      activeProjects: activeCount,
      totalBudget,
      totalPaid,
      totalOutstanding,
      status: hasActive ? "active" : "completed",
      avatar: (org.contactName ?? org.name).split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      projects: orgProjects,
      invoices: orgInvoices,
      driveFolderId: (org as any).driveFolderId,
      slackChannelId: (org as any).slackChannelId,
    };
  });

  const totalRevenue = clientData.reduce((sum, c) => sum + c.totalBudget, 0);
  const totalCollected = clientData.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalOutstanding = clientData.reduce((sum, c) => sum + c.totalOutstanding, 0);

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

  const statusColor = (s: string) => {
    if (s === "paid") return "rgba(80,200,120,0.9)";
    if (s === "sent") return "rgba(120,180,255,0.9)";
    if (s === "overdue") return "rgba(255,100,80,0.9)";
    if (s === "void") return "rgba(160,160,160,0.6)";
    return "rgba(255,200,60,0.9)";
  };

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Clients</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {clientData.length} clients · {clientData.filter(c => c.status === "active").length} active
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                setExportFilters({ statuses: [...allStatuses], clientId: "", fromDate: "", toDate: "" });
                setShowExportModal(true);
              }}
              disabled={invoices.length === 0}
              style={f({ fontWeight: 600, fontSize: "12px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "10px 18px", cursor: invoices.length === 0 ? "not-allowed" : "pointer", opacity: invoices.length === 0 ? 0.5 : 1, display: "flex", alignItems: "center", gap: "8px" })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export CSV
            </button>
            <button
              onClick={() => { setForm(emptyForm); setFormError(""); setShowIntegrations(false); setShowAddModal(true); }}
              style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add Client
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px", marginBottom: "32px" }}>
          {[
            { label: "Total Scope", value: `$${totalRevenue.toLocaleString()}`, sub: `${projects.length} projects` },
            { label: "Collected", value: `$${totalCollected.toLocaleString()}`, sub: "Paid invoices", accent: "rgba(80,200,120,0.9)" },
            { label: "Outstanding", value: `$${totalOutstanding.toLocaleString()}`, sub: "Unpaid invoices", accent: totalOutstanding > 0 ? "rgba(255,200,60,0.9)" : undefined },
            { label: "Active Clients", value: `${clientData.filter(c => c.status === "active").length}`, sub: `of ${clientData.length} total` },
          ].map((stat) => (
            <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px" }}>
              <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" })}>{stat.label}</p>
              <p style={f({ fontWeight: 800, fontSize: "22px", color: (stat as any).accent ?? t.text, marginBottom: "4px" })}>{stat.value}</p>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {clientData.map((client) => {
            const isExpanded = expandedClient === client.id;
            return (
              <div key={client.id} style={{ background: t.bgCard, border: `1px solid ${isExpanded ? t.accent : t.border}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s" }}>
                <div
                  onClick={() => {
                    if (isExpanded) { setExpandedClient(null); }
                    else { setExpandedClient(client.id); setClientTab("overview"); setShowNewInvoice(false); setInvoiceForm(emptyInvoiceForm); setInvoiceError(""); }
                  }}
                  style={{ display: "flex", alignItems: "center", padding: "20px 24px", cursor: "pointer", gap: "16px" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%", background: t.activeNav,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...f({ fontWeight: 700, fontSize: "12px", color: t.textTertiary }),
                    flexShrink: 0,
                  }}>{client.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={f({ fontWeight: 700, fontSize: "15px", color: t.text, margin: 0 })}>{client.company}</p>
                    <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, margin: 0 })}>{client.name} · {client.email}</p>
                  </div>
                  <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={f({ fontWeight: 700, fontSize: "14px", color: t.text, margin: 0 })}>${client.totalBudget.toLocaleString()}</p>
                      <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Scope</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={f({ fontWeight: 700, fontSize: "14px", color: "rgba(80,200,120,0.9)", margin: 0 })}>${client.totalPaid.toLocaleString()}</p>
                      <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Paid</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={f({ fontWeight: 700, fontSize: "14px", color: client.totalOutstanding > 0 ? "rgba(255,200,60,0.9)" : t.textMuted, margin: 0 })}>${client.totalOutstanding.toLocaleString()}</p>
                      <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Due</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={f({
                        fontWeight: 500, fontSize: "10px",
                        color: client.status === "active" ? t.accent : t.textMuted,
                        background: client.status === "active" ? "rgba(255,255,255,0.06)" : "transparent",
                        padding: "3px 10px", borderRadius: "4px",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      })}>
                        {client.activeProjects} active
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", borderBottom: `1px solid ${t.borderSubtle}`, padding: "0 24px" }}>
                      {(["overview", "scope", "invoices"] as ClientTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setClientTab(tab)}
                          style={f({
                            fontWeight: 600, fontSize: "11px",
                            color: clientTab === tab ? t.text : t.textMuted,
                            background: "none", border: "none", borderBottom: clientTab === tab ? `2px solid ${t.accent}` : "2px solid transparent",
                            padding: "12px 16px", cursor: "pointer",
                            textTransform: "uppercase", letterSpacing: "0.06em",
                          })}
                        >
                          {tab === "overview" ? "Overview" : tab === "scope" ? "Projects & Scope" : "Invoices"}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding: "24px" }}>
                      {clientTab === "overview" && (
                        <ClientOverview client={client} t={t} f={f} />
                      )}
                      {clientTab === "scope" && (
                        <ClientScope client={client} t={t} f={f} />
                      )}
                      {clientTab === "invoices" && (
                        <ClientInvoices
                          client={client}
                          t={t}
                          f={f}
                          statusColor={statusColor}
                          showNewInvoice={showNewInvoice}
                          setShowNewInvoice={setShowNewInvoice}
                          invoiceForm={invoiceForm}
                          setInvoiceForm={setInvoiceForm}
                          invoiceSaving={invoiceSaving}
                          invoiceError={invoiceError}
                          handleCreateInvoice={handleCreateInvoice}
                          handleMarkPaid={handleMarkPaid}
                          handleSendInvoice={handleSendInvoice}
                          handleVoidInvoice={handleVoidInvoice}
                          handleCopyPaymentLink={handleCopyPaymentLink}
                          copiedInvoiceId={copiedInvoiceId}
                          linkLoadingId={linkLoadingId}
                          linkError={linkError}
                          inputStyle={inputStyle}
                          labelStyle={labelStyle}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showExportModal && (
        <ExportInvoicesModal
          t={t}
          f={f}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          clients={clientData}
          filters={exportFilters}
          setFilters={setExportFilters}
          allStatuses={allStatuses}
          onClose={() => setShowExportModal(false)}
          onExport={() => {
            const rows: TeamInvoiceExportRow[] = [];
            const fromTs = exportFilters.fromDate ? new Date(exportFilters.fromDate).getTime() : null;
            const toTs = exportFilters.toDate ? new Date(exportFilters.toDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
            for (const client of clientData) {
              if (exportFilters.clientId && client.id !== exportFilters.clientId) continue;
              for (const inv of client.invoices as Invoice[]) {
                if (!exportFilters.statuses.includes(inv.status)) continue;
                const created = new Date(inv.createdAt).getTime();
                if (fromTs !== null && created < fromTs) continue;
                if (toTs !== null && created > toTs) continue;
                const projectName = client.projects.find((p: Project) => p.id === inv.projectId)?.name ?? "";
                rows.push({ invoice: inv, clientName: client.company, projectName });
              }
            }
            const stamp = new Date().toISOString().slice(0, 10);
            exportTeamInvoicesToCsv(rows, `invoices-${stamp}.csv`);
            setShowExportModal(false);
          }}
        />
      )}

      {showAddModal && (
        <AddClientModal
          t={t}
          f={f}
          form={form}
          setForm={setForm}
          formError={formError}
          isSaving={isSaving}
          showIntegrations={showIntegrations}
          setShowIntegrations={setShowIntegrations}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddClient}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      )}
    </TeamLayout>
  );
}

function ClientOverview({ client, t, f }: { client: any; t: any; f: any }) {
  const paidPct = client.totalBudget > 0 ? Math.round((client.totalPaid / client.totalBudget) * 100) : 0;
  const sentInvoices = client.invoices.filter((inv: Invoice) => inv.status === "sent");
  const overdueInvoices = client.invoices.filter((inv: Invoice) => inv.status === "overdue");

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div>
          <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" })}>Contact Details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span style={f({ fontWeight: 500, fontSize: "13px", color: t.text })}>{client.name}</span>
            </div>
            {client.email && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                <span style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                <span style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{client.phone}</span>
              </div>
            )}
          </div>
          {client.notes && (
            <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: `1px solid ${t.borderSubtle}` }}>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, lineHeight: 1.6 })}>{client.notes}</p>
            </div>
          )}
        </div>

        <div>
          <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" })}>Financial Summary</p>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted })}>Collected</span>
              <span style={f({ fontWeight: 700, fontSize: "11px", color: t.text })}>${client.totalPaid.toLocaleString()} / ${client.totalBudget.toLocaleString()}</span>
            </div>
            <div style={{ height: "6px", background: t.borderSubtle, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${paidPct}%`, height: "100%", background: "rgba(80,200,120,0.8)", borderRadius: "3px", transition: "width 0.3s" }} />
            </div>
            <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginTop: "4px" })}>{paidPct}% collected</p>
          </div>

          {sentInvoices.length > 0 && (
            <div style={{ padding: "8px 10px", background: "rgba(120,180,255,0.05)", borderRadius: "6px", marginBottom: "6px" }}>
              <p style={f({ fontWeight: 500, fontSize: "11px", color: "rgba(120,180,255,0.9)" })}>
                {sentInvoices.length} invoice{sentInvoices.length > 1 ? "s" : ""} pending ({
                  "$" + fmtUsd(sentInvoices.reduce((s: number, i: Invoice) => s + i.amount, 0))
                })
              </p>
            </div>
          )}
          {overdueInvoices.length > 0 && (
            <div style={{ padding: "8px 10px", background: "rgba(255,80,80,0.05)", borderRadius: "6px" }}>
              <p style={f({ fontWeight: 500, fontSize: "11px", color: "rgba(255,100,80,0.9)" })}>
                {overdueInvoices.length} overdue ({
                  "$" + fmtUsd(overdueInvoices.reduce((s: number, i: Invoice) => s + i.amount, 0))
                })
              </p>
            </div>
          )}
        </div>
      </div>

      <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" })}>Active Projects</p>
      {client.projects.length === 0 ? (
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>No projects yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {client.projects.map((proj: Project) => (
            <Link key={proj.id} href={`/team/projects/${proj.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.02)",
                border: `1px solid ${t.borderSubtle}`, cursor: "pointer",
              }}>
                <div style={{ flex: 1 }}>
                  <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, margin: 0 })}>{proj.name}</p>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, margin: 0 })}>{formatStatus(proj.status)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>{proj.progress}%</span>
                  <div style={{ width: "60px", height: "4px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${proj.progress}%`, height: "100%", background: proj.progress === 100 ? t.accent : "rgba(120,180,255,0.7)", borderRadius: "2px" }} />
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientScope({ client, t, f }: { client: any; t: any; f: any }) {
  return (
    <div>
      {client.projects.length === 0 ? (
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>No projects yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {client.projects.map((proj: Project) => {
            const projInvoices = client.invoices.filter((inv: Invoice) => inv.projectId === proj.id);
            const paid = projInvoices.filter((i: Invoice) => i.status === "paid").reduce((s: number, i: Invoice) => s + i.amount, 0);
            const outstanding = projInvoices.filter((i: Invoice) => i.status !== "paid" && i.status !== "void").reduce((s: number, i: Invoice) => s + i.amount, 0);
            const budget = proj.budget ?? 0;
            const collectedPct = budget > 0 ? Math.round((paid / budget) * 100) : 0;

            return (
              <div key={proj.id} style={{ border: `1px solid ${t.borderSubtle}`, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "14px", color: t.text, margin: 0 })}>{proj.name}</p>
                    <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, margin: 0 })}>
                      {formatStatus(proj.status)} · {proj.dueDate ? `Due ${formatDate(proj.dueDate)}` : "No due date"}
                    </p>
                  </div>
                  <Link href={`/team/projects/${proj.id}`} style={{ textDecoration: "none" }}>
                    <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted, border: `1px solid ${t.borderSubtle}`, borderRadius: "4px", padding: "4px 10px", cursor: "pointer" })}>
                      Open
                    </span>
                  </Link>
                </div>

                <div style={{ padding: "0 20px 16px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, margin: 0 })}>${budget.toLocaleString()}</p>
                      <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Budget</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 700, fontSize: "16px", color: "rgba(80,200,120,0.9)", margin: 0 })}>${paid.toLocaleString()}</p>
                      <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Paid</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 700, fontSize: "16px", color: outstanding > 0 ? "rgba(255,200,60,0.9)" : t.textMuted, margin: 0 })}>${outstanding.toLocaleString()}</p>
                      <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Outstanding</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, margin: 0 })}>{proj.progress}%</p>
                      <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 })}>Complete</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ flex: 1, height: "6px", background: t.borderSubtle, borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${collectedPct}%`, height: "100%", background: "rgba(80,200,120,0.8)", borderRadius: "3px", transition: "width 0.3s" }} />
                    </div>
                    <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted })}>{collectedPct}% collected</span>
                  </div>

                  {projInvoices.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" })}>Invoice History</p>
                      {projInvoices.sort((a: Invoice, b: Invoice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((inv: Invoice) => (
                        <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${t.borderSubtle}` }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={f({
                              fontWeight: 600, fontSize: "8px",
                              color: inv.status === "paid" ? "rgba(80,200,120,0.9)" : inv.status === "sent" ? "rgba(120,180,255,0.9)" : inv.status === "overdue" ? "rgba(255,100,80,0.9)" : "rgba(255,200,60,0.9)",
                              textTransform: "uppercase", letterSpacing: "0.04em",
                              background: inv.status === "paid" ? "rgba(80,200,120,0.08)" : inv.status === "sent" ? "rgba(120,180,255,0.08)" : inv.status === "overdue" ? "rgba(255,80,80,0.08)" : "rgba(255,200,60,0.08)",
                              padding: "2px 6px", borderRadius: "3px",
                            })}>
                              {inv.status}
                            </span>
                            <span style={f({ fontWeight: 400, fontSize: "11px", color: t.text })}>{inv.description}</span>
                          </div>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            {inv.invoiceNumber && <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{inv.invoiceNumber}</span>}
                            <span style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>${fmtUsd(inv.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClientInvoices({ client, t, f, statusColor, showNewInvoice, setShowNewInvoice, invoiceForm, setInvoiceForm, invoiceSaving, invoiceError, handleCreateInvoice, handleMarkPaid, handleSendInvoice, handleVoidInvoice, handleCopyPaymentLink, copiedInvoiceId, linkLoadingId, linkError, inputStyle, labelStyle }: any) {
  const allInvoices = (client.invoices as Invoice[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const paidInvoices = allInvoices.filter((i) => i.status === "paid");
  const pendingInvoices = allInvoices.filter((i) => i.status === "sent" || i.status === "draft");
  const overdueInvoices = allInvoices.filter((i) => i.status === "overdue");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <div>
            <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, margin: 0 })}>{allInvoices.length}</p>
            <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", margin: 0 })}>Total</p>
          </div>
          <div>
            <p style={f({ fontWeight: 700, fontSize: "16px", color: "rgba(80,200,120,0.9)", margin: 0 })}>{paidInvoices.length}</p>
            <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", margin: 0 })}>Paid</p>
          </div>
          <div>
            <p style={f({ fontWeight: 700, fontSize: "16px", color: "rgba(120,180,255,0.9)", margin: 0 })}>{pendingInvoices.length}</p>
            <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", margin: 0 })}>Pending</p>
          </div>
          {overdueInvoices.length > 0 && (
            <div>
              <p style={f({ fontWeight: 700, fontSize: "16px", color: "rgba(255,100,80,0.9)", margin: 0 })}>{overdueInvoices.length}</p>
              <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", margin: 0 })}>Overdue</p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setInvoiceForm({ ...invoiceForm, projectId: client.projects[0]?.id || "" });
            setShowNewInvoice(true);
          }}
          style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" })}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Invoice
        </button>
      </div>

      {showNewInvoice && (
        <div style={{ padding: "20px", marginBottom: "16px", border: `1px solid ${t.border}`, borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
          <p style={f({ fontWeight: 700, fontSize: "13px", color: t.text, marginBottom: "16px" })}>Create Invoice</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Project</label>
              <select
                value={invoiceForm.projectId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Select project</option>
                {client.projects.map((p: Project) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Invoice Number</label>
              <input
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                placeholder="INV-2026-XXX"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Description</label>
            <input
              value={invoiceForm.description}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
              placeholder="50% deposit, milestone payment, etc."
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Amount ($)</label>
              <input
                type="number"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowNewInvoice(false)}
              style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={invoiceSaving || !invoiceForm.projectId || !invoiceForm.description || !invoiceForm.amount}
              style={f({
                fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent,
                border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer",
                opacity: invoiceSaving || !invoiceForm.projectId || !invoiceForm.description || !invoiceForm.amount ? 0.5 : 1,
              })}
            >
              {invoiceSaving ? "Creating..." : "Create Draft"}
            </button>
          </div>
          {invoiceError && (
            <p style={f({ fontWeight: 500, fontSize: "11px", color: "#ff4444", marginTop: "8px" })}>{invoiceError}</p>
          )}
        </div>
      )}

      {linkError && (
        <div style={{ marginBottom: "12px", padding: "8px 12px", background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: "6px" }}>
          <p style={f({ fontWeight: 500, fontSize: "11px", color: "rgba(255,100,80,0.95)" })}>{linkError}</p>
        </div>
      )}

      {allInvoices.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center" }}>
          <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textMuted })}>No invoices yet</p>
        </div>
      ) : (
        <div style={{ border: `1px solid ${t.borderSubtle}`, borderRadius: "8px", overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "100px 1fr 100px 100px 120px 220px",
            padding: "8px 14px", borderBottom: `1px solid ${t.borderSubtle}`,
          }}>
            {["Status", "Description", "Number", "Amount", "Due", "Actions"].map((h) => (
              <p key={h} style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 })}>{h}</p>
            ))}
          </div>
          {allInvoices.map((inv) => {
            const projName = client.projects.find((p: Project) => p.id === inv.projectId)?.name ?? "";
            return (
              <div key={inv.id} style={{
                display: "grid", gridTemplateColumns: "100px 1fr 100px 100px 120px 220px",
                padding: "10px 14px", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center",
              }}>
                <div>
                  <span style={f({
                    fontWeight: 600, fontSize: "9px",
                    color: statusColor(inv.status),
                    textTransform: "uppercase", letterSpacing: "0.04em",
                    background: statusColor(inv.status).replace("0.9", "0.1").replace("0.6", "0.08"),
                    padding: "3px 8px", borderRadius: "3px",
                  })}>
                    {inv.status}
                  </span>
                </div>
                <div>
                  <p style={f({ fontWeight: 500, fontSize: "12px", color: t.text, margin: 0 })}>{inv.description}</p>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, margin: 0 })}>{projName}</p>
                </div>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, margin: 0 })}>{inv.invoiceNumber ?? "-"}</p>
                <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text, margin: 0 })}>${fmtUsd(inv.amount)}</p>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, margin: 0 })}>
                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                </p>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {inv.status === "draft" && (
                    <button
                      onClick={() => handleSendInvoice(inv.id)}
                      style={f({ fontWeight: 500, fontSize: "9px", color: "rgba(120,180,255,0.9)", background: "rgba(120,180,255,0.08)", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" })}
                    >
                      Send
                    </button>
                  )}
                  {(inv.status === "sent" || inv.status === "overdue") && (
                    <>
                      <button
                        onClick={() => handleCopyPaymentLink(inv.id)}
                        disabled={linkLoadingId === inv.id}
                        title="Create a Stripe Checkout link and copy it to the clipboard"
                        style={f({
                          fontWeight: 500, fontSize: "9px",
                          color: copiedInvoiceId === inv.id ? "rgba(80,200,120,0.95)" : "rgba(180,140,255,0.95)",
                          background: copiedInvoiceId === inv.id ? "rgba(80,200,120,0.08)" : "rgba(180,140,255,0.08)",
                          border: "none", borderRadius: "4px", padding: "4px 8px",
                          cursor: linkLoadingId === inv.id ? "wait" : "pointer",
                          opacity: linkLoadingId === inv.id ? 0.7 : 1,
                          display: "flex", alignItems: "center", gap: "4px",
                        })}
                      >
                        {linkLoadingId === inv.id
                          ? "Creating..."
                          : copiedInvoiceId === inv.id
                            ? "Copied!"
                            : "Copy Payment Link"}
                      </button>
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        style={f({ fontWeight: 500, fontSize: "9px", color: "rgba(80,200,120,0.9)", background: "rgba(80,200,120,0.08)", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" })}
                      >
                        Mark Paid
                      </button>
                    </>
                  )}
                  {inv.status !== "void" && inv.status !== "paid" && (
                    <button
                      onClick={() => handleVoidInvoice(inv.id)}
                      style={f({ fontWeight: 500, fontSize: "9px", color: t.textMuted, background: "transparent", border: `1px solid ${t.borderSubtle}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer" })}
                    >
                      Void
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddClientModal({ t, f, form, setForm, formError, isSaving, showIntegrations, setShowIntegrations, onClose, onSubmit, inputStyle, labelStyle }: any) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e: any) => e.stopPropagation()}
        style={{
          background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px",
          padding: "32px", width: "500px", maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>Add Client</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" })}>Company</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Company Name *</label>
            <input value={form.companyName} onChange={(e: any) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Productions" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={(e: any) => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" style={inputStyle} />
          </div>
        </div>

        <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" })}>Primary Contact</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input value={form.contactName} onChange={(e: any) => setForm({ ...form, contactName: e.target.value })} placeholder="Jane Smith" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email Address *</label>
            <input type="email" value={form.contactEmail} onChange={(e: any) => setForm({ ...form, contactEmail: e.target.value })} placeholder="jane@acme.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" value={form.contactPhone} onChange={(e: any) => setForm({ ...form, contactPhone: e.target.value })} placeholder="(555) 123-4567" style={inputStyle} />
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
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: "4px" })}>Pre-link integrations so projects for this client auto-connect.</p>
            <div>
              <label style={labelStyle}>Google Drive Folder ID</label>
              <input value={form.driveFolderId} onChange={(e: any) => setForm({ ...form, driveFolderId: e.target.value })} placeholder="Paste folder ID from Drive URL" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slack Channel</label>
              <input value={form.slackChannelId} onChange={(e: any) => setForm({ ...form, slackChannelId: e.target.value })} placeholder="#client-name or channel ID" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this client..." rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
            </div>
          </div>
        )}

        {formError && (
          <p style={f({ fontWeight: 500, fontSize: "12px", color: "#ff4444", marginTop: "12px" })}>{formError}</p>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={f({ fontWeight: 600, fontSize: "12px", color: t.textSecondary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer" })}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving}
            style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", opacity: isSaving ? 0.6 : 1 })}
          >
            {isSaving ? "Adding..." : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportInvoicesModal({ t, f, inputStyle, labelStyle, clients, filters, setFilters, allStatuses, onClose, onExport }: any) {
  const matchingCount = (() => {
    const fromTs = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
    const toTs = filters.toDate ? new Date(filters.toDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    let n = 0;
    for (const client of clients) {
      if (filters.clientId && client.id !== filters.clientId) continue;
      for (const inv of client.invoices as Invoice[]) {
        if (!filters.statuses.includes(inv.status)) continue;
        const created = new Date(inv.createdAt).getTime();
        if (fromTs !== null && created < fromTs) continue;
        if (toTs !== null && created > toTs) continue;
        n++;
      }
    }
    return n;
  })();

  const toggleStatus = (s: Invoice["status"]) => {
    const has = filters.statuses.includes(s);
    setFilters({ ...filters, statuses: has ? filters.statuses.filter((x: string) => x !== s) : [...filters.statuses, s] });
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e: any) => e.stopPropagation()}
        style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "32px", width: "480px", maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h2 style={f({ fontWeight: 800, fontSize: "20px", color: t.text })}>Export Invoices</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>
          Download a CSV of invoices across all clients. Use the filters below to narrow what's included.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Client</label>
          <select
            value={filters.clientId}
            onChange={(e: any) => setFilters({ ...filters, clientId: e.target.value })}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">All clients</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {allStatuses.map((s: Invoice["status"]) => {
              const active = filters.statuses.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  style={f({
                    fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em",
                    color: active ? t.accentText : t.textMuted,
                    background: active ? t.accent : "transparent",
                    border: `1px solid ${active ? t.accent : t.border}`,
                    borderRadius: "6px", padding: "6px 12px", cursor: "pointer",
                  })}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>From (created)</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e: any) => setFilters({ ...filters, fromDate: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>To (created)</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e: any) => setFilters({ ...filters, toDate: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ padding: "12px 16px", background: t.hoverBg, borderRadius: "8px", marginBottom: "20px" }}>
          <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textTertiary })}>
            {matchingCount} invoice{matchingCount === 1 ? "" : "s"} will be exported
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={f({ fontWeight: 600, fontSize: "12px", color: t.textSecondary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer" })}
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            disabled={matchingCount === 0 || filters.statuses.length === 0}
            style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "8px", padding: "10px 24px", cursor: matchingCount === 0 ? "not-allowed" : "pointer", opacity: matchingCount === 0 || filters.statuses.length === 0 ? 0.5 : 1 })}
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
