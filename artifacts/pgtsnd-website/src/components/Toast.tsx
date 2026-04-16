import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useTheme } from "./ThemeContext";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const { t } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 10000,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      pointerEvents: "none",
    }}>
      {toasts.map((item) => {
        const colors = {
          success: { bg: "rgba(96,208,96,0.12)", border: "rgba(96,208,96,0.25)", icon: "rgba(96,208,96,0.9)" },
          error: { bg: "rgba(255,100,100,0.12)", border: "rgba(255,100,100,0.25)", icon: "rgba(255,100,100,0.9)" },
          info: { bg: "rgba(255,255,255,0.08)", border: t.border, icon: t.textTertiary },
        }[item.type];

        return (
          <div
            key={item.id}
            onClick={() => onDismiss(item.id)}
            style={{
              background: t.bgElevated,
              border: `1px solid ${colors.border}`,
              borderLeft: `3px solid ${colors.icon}`,
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              pointerEvents: "auto",
              cursor: "pointer",
              minWidth: "280px",
              maxWidth: "400px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {item.type === "success" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            {item.type === "error" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {item.type === "info" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
            <span style={{
              fontWeight: 500,
              fontSize: "13px",
              color: t.text,
              flex: 1,
            }}>
              {item.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
