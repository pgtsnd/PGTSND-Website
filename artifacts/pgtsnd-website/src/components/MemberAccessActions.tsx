import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "./ThemeContext";
import { useToast } from "./Toast";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useIssueAccessToken,
  useRemoveTeamMember,
} from "../hooks/useTeamData";
import {
  getListAccessTokensQueryKey,
  getListUsersQueryKey,
} from "@workspace/api-client-react";

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

export default function MemberAccessActions({
  userId,
  userName,
  userEmail,
  userRole,
}: Props) {
  const { t } = useTheme();
  const { toast } = useToast();
  const { currentUser } = useTeamAuth();
  const queryClient = useQueryClient();
  const issue = useIssueAccessToken();
  const remove = useRemoveTeamMember();

  const isOwner = currentUser?.role === "owner" || currentUser?.role === "partner";
  const canRemove = isOwner && currentUser?.id !== userId && userRole !== "owner";

  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isOwner) return null;

  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const handleIssue = async () => {
    setBusy(true);
    try {
      const res = await issue.mutateAsync({
        data: { label: `Onboarding for ${userName || userEmail}`, userId },
      });
      setIssuedToken(res.token);
      queryClient.invalidateQueries({ queryKey: getListAccessTokensQueryKey() });
      toast("Access token issued. Copy it now — it cannot be retrieved later.", "success");
    } catch (err: any) {
      toast(err?.data?.error || err?.message || "Failed to issue access token", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await remove.mutateAsync({ id: userId });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListAccessTokensQueryKey() });
      toast(`${userName || userEmail} removed.`, "success");
    } catch (err: any) {
      toast(err?.data?.error || err?.message || "Failed to remove user", "error");
      setBusy(false);
      setConfirmRemove(false);
    }
  };

  const handleCopy = async () => {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      toast("Token copied to clipboard.", "success");
    } catch {
      toast("Copy failed — select and copy manually.", "error");
    }
  };

  const btn = (variant: "primary" | "ghost" | "danger") =>
    f({
      fontWeight: 600,
      fontSize: "11px",
      padding: "8px 14px",
      borderRadius: "6px",
      cursor: busy ? "not-allowed" : "pointer",
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
      opacity: busy ? 0.6 : 1,
      ...(variant === "primary"
        ? { background: t.text, color: t.bg, border: "none" }
        : variant === "danger"
          ? { background: "transparent", color: "#d24d4d", border: `1px solid #d24d4d` }
          : { background: "transparent", color: t.textSecondary, border: `1px solid ${t.border}` }),
    });

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "16px",
        background: t.bg,
        borderRadius: "8px",
        border: `1px solid ${t.border}`,
      }}
    >
      <p
        style={f({
          fontWeight: 700,
          fontSize: "10px",
          color: t.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "12px",
        })}
      >
        Access &amp; Account
      </p>

      {issuedToken ? (
        <div>
          <p
            style={f({
              fontWeight: 500,
              fontSize: "11px",
              color: t.textSecondary,
              marginBottom: "8px",
            })}
          >
            Hand this token to {userName || userEmail} out-of-band. It will not appear again.
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              padding: "10px 12px",
              background: t.bgCard,
              border: `1px dashed ${t.border}`,
              borderRadius: "6px",
              marginBottom: "10px",
            }}
          >
            <code
              style={f({
                flex: 1,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "12px",
                color: t.text,
                wordBreak: "break-all" as const,
              })}
            >
              {issuedToken}
            </code>
            <button type="button" onClick={handleCopy} style={btn("ghost")}>
              Copy
            </button>
          </div>
          <button type="button" onClick={() => setIssuedToken(null)} style={btn("ghost")}>
            Done
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={handleIssue} disabled={busy} style={btn("primary")}>
            Issue Access Token
          </button>
          {canRemove && !confirmRemove && (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              disabled={busy}
              style={btn("danger")}
            >
              Remove
            </button>
          )}
          {canRemove && confirmRemove && (
            <>
              <span
                style={f({
                  fontWeight: 500,
                  fontSize: "11px",
                  color: t.textSecondary,
                  alignSelf: "center",
                })}
              >
                This permanently removes {userName || userEmail} and revokes all their access.
              </span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                style={btn("danger")}
              >
                Confirm Remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                disabled={busy}
                style={btn("ghost")}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
