import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate(redirectTo || "/client-hub");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (["owner", "partner", "crew"].includes(user.role)) {
        navigate("/team/dashboard");
      } else {
        navigate("/client-hub/dashboard");
      }
    }
  }, [user, loading, navigate, allowedRoles, redirectTo]);

  if (loading) {
    return (
      <div style={{
        background: "#000000",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 400,
          fontSize: "14px",
          color: "rgba(255,255,255,0.5)",
        }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
