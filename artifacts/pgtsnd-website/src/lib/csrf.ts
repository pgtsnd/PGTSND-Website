const CSRF_COOKIE_NAME = "pgtsnd_csrf";
export const CSRF_HEADER_NAME = "X-CSRF-Token";

export function getCsrfToken(): string | null {
  if (typeof document === "undefined" || !document.cookie) return null;
  const prefix = `${CSRF_COOKIE_NAME}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}
