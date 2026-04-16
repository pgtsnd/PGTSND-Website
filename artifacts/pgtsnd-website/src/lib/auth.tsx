import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { csrfHeaders } from "./csrf";
import { useToast } from "../components/Toast";
import {
  DEFAULT_SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_EVENT,
  getLoginPathForCurrentLocation,
  rememberPostLoginRedirect,
  rememberSessionExpiredMessage,
  type SessionExpiredDetail,
} from "./session-expired";

interface AuthUser {
  id: number;
  email: string;
  name?: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string) => Promise<{ success: boolean; demo?: boolean; redirect?: string; error?: string }>;
  verifyMagicLink: (token: string) => Promise<{ success: boolean; redirect?: string; error?: string }>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const userRef = useRef<AuthUser | null>(null);
  const handlingExpiryRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);



  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      if (handlingExpiryRef.current) return;
      if (userRef.current === null) return;
      const detail = (event as CustomEvent<Partial<SessionExpiredDetail>>).detail ?? {};
      handlingExpiryRef.current = true;
      rememberPostLoginRedirect();
      setUser(null);
      try {
        localStorage.removeItem("team-user-id");
      } catch {
        // ignore
      }
      const message = detail.message ?? DEFAULT_SESSION_EXPIRED_MESSAGE;
      rememberSessionExpiredMessage(message);
      toast(message, "info");
      const loginPath = getLoginPathForCurrentLocation();
      const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
      const targetPath = `${base}${loginPath}`;
      window.setTimeout(() => {
        window.location.assign(targetPath);
      }, 50);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
    };
  }, [toast]);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();

      if (data.demo) {
        await checkSession();
        return { success: true, demo: true, redirect: data.redirect };
      }

      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const verifyMagicLink = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-magic-link?token=${token}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true, redirect: data.redirect };
      }
      return { success: false, error: data.error || "Invalid or expired link" };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const googleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, { credentials: "include" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      console.error("Failed to initiate Google login");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
      });
    } catch {
      // ignore
    }
    localStorage.removeItem("team-user-id");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMagicLink, googleLogin, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function getDashboardPath(role: string): string {
  switch (role) {
    case "owner":
    case "partner":
    case "crew":
      return "/team/dashboard";
    case "client":
    default:
      return "/client-hub/dashboard";
  }
}
