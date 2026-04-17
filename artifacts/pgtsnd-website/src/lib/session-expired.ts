export const POST_LOGIN_REDIRECT_KEY = "pgtsnd_post_login_redirect";
export const SESSION_EXPIRED_MESSAGE_KEY = "pgtsnd_session_expired_message";
export const SIGNED_OUT_MESSAGE_KEY = "pgtsnd_signed_out_message";
export const SESSION_EXPIRED_EVENT = "pgtsnd:session-expired";

export const DEFAULT_SESSION_EXPIRED_MESSAGE =
  "Your session expired. Please sign in again to continue.";

export const DEFAULT_SIGNED_OUT_MESSAGE = "You've been signed out.";

export interface SessionExpiredDetail {
  message: string;
  status: number;
  reason: "unauthorized" | "csrf";
}

export function notifySessionExpired(
  partial: Partial<SessionExpiredDetail> = {},
): void {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  const detail: SessionExpiredDetail = {
    message: partial.message ?? DEFAULT_SESSION_EXPIRED_MESSAGE,
    status: typeof partial.status === "number" ? partial.status : 401,
    reason: partial.reason ?? "unauthorized",
  };
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail }));
}

export function isSessionExpiredResponse(
  status: number,
  errorMessage: string | null | undefined,
): SessionExpiredDetail | null {
  if (status === 401) {
    return {
      message: DEFAULT_SESSION_EXPIRED_MESSAGE,
      status,
      reason: "unauthorized",
    };
  }
  if (status === 403 && typeof errorMessage === "string" && /csrf/i.test(errorMessage)) {
    return {
      message: DEFAULT_SESSION_EXPIRED_MESSAGE,
      status,
      reason: "csrf",
    };
  }
  return null;
}

function stripBasePath(path: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  if (base && path.startsWith(base)) {
    return path.slice(base.length) || "/";
  }
  return path;
}

export function getLoginPathForCurrentLocation(): string {
  if (typeof window === "undefined") return "/client-hub";
  const path = stripBasePath(window.location.pathname);
  return path.startsWith("/team") ? "/team" : "/client-hub";
}

export function rememberPostLoginRedirect(): void {
  if (typeof window === "undefined") return;
  const path = stripBasePath(window.location.pathname + window.location.search);
  if (!path.startsWith("/")) return;
  const pathname = path.split("?")[0];
  if (
    pathname === "/" ||
    pathname === "/client-hub" ||
    pathname === "/team" ||
    pathname.startsWith("/auth/verify")
  ) {
    return;
  }
  try {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
  } catch {
    // ignore storage failures
  }
}

export function rememberSessionExpiredMessage(message: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_EXPIRED_MESSAGE_KEY, message);
  } catch {
    // ignore
  }
}

export function consumeSessionExpiredMessage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY);
    if (value) sessionStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
    return value;
  } catch {
    return null;
  }
}

export function rememberSignedOutMessage(message: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SIGNED_OUT_MESSAGE_KEY, message);
  } catch {
    // ignore
  }
}

export function consumeSignedOutMessage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(SIGNED_OUT_MESSAGE_KEY);
    if (value) sessionStorage.removeItem(SIGNED_OUT_MESSAGE_KEY);
    return value;
  } catch {
    return null;
  }
}

export function consumePostLoginRedirect(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (value) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return value && value.startsWith("/") ? value : null;
  } catch {
    return null;
  }
}
