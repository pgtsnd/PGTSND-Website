import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { useToast } from "../components/Toast";
import {
  useListAccessTokens,
  useCreateAccessToken,
  useRevokeAccessToken,
  getListAccessTokensQueryKey,
  type AccessToken,
} from "@workspace/api-client-react";

type Mode = "existing" | "new";
type RoleOpt = "client" | "crew" | "partner";

export default function TeamAccess() {
  const { t } = useTheme();
  const { allUsers, currentUser } = useTeamAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isOwner = currentUser?.role === "owner" || currentUser?.role === "partner";

  const tokensQuery = useListAccessTokens(
    isOwner ? undefined : { query: { enabled: false, queryKey: ["access-tokens"] } },
  );
  const createToken = useCreateAccessToken();
  const revokeToken = useRevokeAccessToken();

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<Mode>("existing");
  const [userId, setUserId] = useState("");
  const [label, setLabel] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<RoleOpt>("client");
  const [formError, setFormError] = useState("");
  const [issued, setIssued] = useState<{ token: string; record: AccessToken } | null>(null);
  const [copied, setCopied] = useState(false);

  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const tokens = tokensQuery.data ?? [];
  const sortedUsers = [...allUsers].sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email),
  );

  const resetForm = () => {
    setMode("existing");
    setUserId("");
    setLabel("");
    setNewName("");
    setNewEmail("");
    setNewRole("client");
    setFormError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setIssued(null);
    setCopied(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!label.trim()) {
      setFormError("Label is required");
      return;
    }
    try {
      if (mode === "existing") {
        if (!userId) {
          setFormError("Pick a user");
          return;
        }
        const res = await createToken.mutateAsync({ data: { label: label.trim(), userId } });
        setIssued(res);
      } else {
        if (!newName.trim() || !newEmail.trim()) {
          setFormError("Name and email are required");
          return;
        }
        const res = await createToken.mutateAsync({
          data: {
            label: label.trim(),
            newUser: {
              name: newName.trim(),
              email: newEmail.trim().toLowerCase(),
              role: newRole,
            },
          },
        });
        setIssued(res);
      }
      await queryClient.invalidateQueries({ queryKey: getListAccessTokensQueryKey() });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create token");
    }
  };

  const handleRevoke = async (token: AccessToken) => {
    if (token.status !== "active") return;
    if (!window.confirm(`Revoke "${token.label}" for ${token.userEmail}? This cuts off access immediately.`)) return;
    try {
      await revokeToken.mutateAsync({ id: token.id });
      await queryClient.invalidateQueries({ queryKey: getListAccessTokensQueryKey() });
      toast("Access token revoked", "success");
    } catch {
      toast("Failed to revoke token", "error");
    }
  };

  const copyToken = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("Copy failed — please select and copy manually", "error");
    }
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <TeamLayout>
      <div style={{ padding: "32px 40px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", gap: "24px", flexWrap: "wrap" }}>
          <div>
            <p style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", color: t.textTertiary, marginBottom: "10px" })}>
              Owner Tools
            </p>
            <h1 style={f({ fontWeight: 900, fontSize: "32px", textTransform: "uppercase", letterSpacing: "-0.01em", color: t.text, marginBottom: "8px" })}>
              Access Tokens
            </h1>
            <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textSecondary, lineHeight: 1.6, maxWidth: "680px" })}>
              Generate one-time access tokens for clients and crew. Hand the email + token off
              in person, by phone, or in a secure channel. Tokens are shown once and can be
              revoked instantly.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setIssued(null); setShowModal(true); }}
            style={f({
              fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em",
              color: t.bg, background: t.text, border: "none",
              padding: "12px 22px", cursor: "pointer", borderRadius: "4px",
            })}
          >
            New Token
          </button>
        </div>

        {tokensQuery.isLoading ? (
          <p style={f({ color: t.textSecondary, fontSize: "14px" })}>Loading tokens…</p>
        ) : tokens.length === 0 ? (
          <div style={{ padding: "48px", border: `1px dashed ${t.border}`, borderRadius: "8px", textAlign: "center" }}>
            <p style={f({ color: t.textSecondary, fontSize: "14px" })}>
              No access tokens yet. Click "New Token" to create the first one.
            </p>
          </div>
        ) : (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.bgSidebar, borderBottom: `1px solid ${t.border}` }}>
                  {["User", "Label", "Status", "Created", "Last Used", ""].map((h) => (
                    <th
                      key={h}
                      style={f({
                        textAlign: "left", padding: "14px 16px", fontWeight: 700, fontSize: "10px",
                        textTransform: "uppercase", letterSpacing: "0.12em", color: t.textTertiary,
                      })}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokens.map((tk) => (
                  <tr key={tk.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={f({ fontSize: "13px", color: t.text, fontWeight: 600 })}>
                        {tk.userName || tk.userEmail}
                      </div>
                      <div style={f({ fontSize: "11px", color: t.textTertiary, marginTop: "2px" })}>
                        {tk.userEmail} · {tk.userRole}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", ...f({ fontSize: "13px", color: t.text }) }}>{tk.label}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={f({
                          fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                          padding: "4px 10px", borderRadius: "100px",
                          color: tk.status === "active" ? "#1a1a1a" : t.textSecondary,
                          background: tk.status === "active" ? "#60d060" : t.hoverBg,
                        })}
                      >
                        {tk.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", ...f({ fontSize: "12px", color: t.textSecondary }) }}>{formatDate(tk.createdAt)}</td>
                    <td style={{ padding: "14px 16px", ...f({ fontSize: "12px", color: t.textSecondary }) }}>{formatDate(tk.lastUsedAt)}</td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {tk.status === "active" && (
                        <button
                          onClick={() => handleRevoke(tk)}
                          disabled={revokeToken.isPending}
                          style={f({
                            fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em",
                            color: t.text, background: "transparent",
                            border: `1px solid ${t.border}`, padding: "6px 12px",
                            cursor: "pointer", borderRadius: "4px",
                          })}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.bgCard, color: t.text, border: `1px solid ${t.border}`,
              borderRadius: "8px", padding: "28px", maxWidth: "520px", width: "100%",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            {issued ? (
              <>
                <h2 style={f({ fontWeight: 900, fontSize: "20px", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "8px" })}>
                  Token Created
                </h2>
                <p style={f({ fontSize: "13px", color: t.textSecondary, marginBottom: "20px", lineHeight: 1.6 })}>
                  Copy this token now. It will not be shown again. Send it to{" "}
                  <strong>{issued.record.userEmail}</strong> through a secure channel.
                </p>
                <div
                  style={{
                    padding: "16px", border: `1px solid ${t.border}`, borderRadius: "6px",
                    background: t.bg, marginBottom: "16px",
                    ...f({ fontSize: "16px", fontWeight: 600, letterSpacing: "0.05em", wordBreak: "break-all" }),
                  }}
                >
                  {issued.token}
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    onClick={copyToken}
                    style={f({
                      fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em",
                      color: t.bg, background: t.text, border: "none",
                      padding: "10px 20px", cursor: "pointer", borderRadius: "4px",
                    })}
                  >
                    {copied ? "Copied" : "Copy Token"}
                  </button>
                  <button
                    onClick={closeModal}
                    style={f({
                      fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em",
                      color: t.text, background: "transparent", border: `1px solid ${t.border}`,
                      padding: "10px 20px", cursor: "pointer", borderRadius: "4px",
                    })}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={f({ fontWeight: 900, fontSize: "20px", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "20px" })}>
                  New Access Token
                </h2>

                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  {(["existing", "new"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      style={f({
                        flex: 1, fontWeight: 600, fontSize: "11px",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        padding: "10px", cursor: "pointer", borderRadius: "4px",
                        background: mode === m ? t.text : "transparent",
                        color: mode === m ? t.bg : t.text,
                        border: `1px solid ${mode === m ? t.text : t.border}`,
                      })}
                    >
                      {m === "existing" ? "Existing User" : "New User"}
                    </button>
                  ))}
                </div>

                {mode === "existing" ? (
                  <Field label="User" t={t} f={f}>
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      style={inputCss(t)}
                    >
                      <option value="">Select a user…</option>
                      {sortedUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {(u.name || u.email)} — {u.role}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <>
                    <Field label="Full Name" t={t} f={f}>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={inputCss(t)}
                      />
                    </Field>
                    <Field label="Email" t={t} f={f}>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        style={inputCss(t)}
                      />
                    </Field>
                    <Field label="Role" t={t} f={f}>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as RoleOpt)}
                        style={inputCss(t)}
                      >
                        <option value="client">Client</option>
                        <option value="crew">Crew</option>
                        <option value="partner">Partner</option>
                      </select>
                    </Field>
                  </>
                )}

                <Field label="Token Label" t={t} f={f}>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Onboarding token — Mar 2026"
                    style={inputCss(t)}
                  />
                </Field>

                {formError && (
                  <p style={f({ fontSize: "13px", color: "#ff6b6b", marginTop: "-4px", marginBottom: "16px" })}>{formError}</p>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={f({
                      fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em",
                      color: t.text, background: "transparent", border: `1px solid ${t.border}`,
                      padding: "10px 20px", cursor: "pointer", borderRadius: "4px",
                    })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createToken.isPending}
                    style={f({
                      fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em",
                      color: t.bg, background: t.text, border: "none",
                      padding: "10px 20px", cursor: "pointer", borderRadius: "4px",
                      opacity: createToken.isPending ? 0.6 : 1,
                    })}
                  >
                    {createToken.isPending ? "Creating…" : "Generate Token"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </TeamLayout>
  );
}

function Field({
  label,
  t,
  f,
  children,
}: {
  label: string;
  t: ReturnType<typeof useTheme>["t"];
  f: (s: object) => React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={f({
          display: "block", fontSize: "10px", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.12em",
          color: t.textTertiary, marginBottom: "6px",
        })}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function inputCss(t: ReturnType<typeof useTheme>["t"]): React.CSSProperties {
  return {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400,
    fontSize: "14px",
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${t.border}`,
    borderRadius: "4px",
    background: t.bg,
    color: t.text,
    outline: "none",
  };
}
