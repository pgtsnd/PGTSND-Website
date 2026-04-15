import { createContext, useContext, useState, type ReactNode } from "react";

export interface ThemeTokens {
  mode: "dark" | "light";
  bg: string;
  bgSidebar: string;
  bgCard: string;
  bgCardHover: string;
  bgInput: string;
  bgElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  teamBubble: string;
  clientBubble: string;
  activeNav: string;
  hoverBg: string;
  modalOverlay: string;
  modalBg: string;
  tagBg: string;
  tagText: string;
  videoPlayerBg: string;
}

const darkTokens: ThemeTokens = {
  mode: "dark",
  bg: "#111114",
  bgSidebar: "#0c0c0f",
  bgCard: "#1a1a1f",
  bgCardHover: "#222228",
  bgInput: "rgba(255,255,255,0.05)",
  bgElevated: "#1e1e24",
  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.65)",
  textTertiary: "rgba(255,255,255,0.4)",
  textMuted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.08)",
  borderSubtle: "rgba(255,255,255,0.04)",
  accent: "#ffffff",
  accentText: "#000000",
  badgeBg: "#ffffff",
  badgeText: "#000000",
  teamBubble: "rgba(255,255,255,0.05)",
  clientBubble: "rgba(255,255,255,0.08)",
  activeNav: "rgba(255,255,255,0.07)",
  hoverBg: "rgba(255,255,255,0.04)",
  modalOverlay: "rgba(0,0,0,0.7)",
  modalBg: "#1a1a1f",
  tagBg: "rgba(255,255,255,0.05)",
  tagText: "rgba(255,255,255,0.4)",
  videoPlayerBg: "#0a0a0c",
};

const lightTokens: ThemeTokens = {
  mode: "light",
  bg: "#f4f4f6",
  bgSidebar: "#ffffff",
  bgCard: "#ffffff",
  bgCardHover: "#f0f0f3",
  bgInput: "rgba(0,0,0,0.04)",
  bgElevated: "#ffffff",
  text: "#111118",
  textSecondary: "rgba(0,0,0,0.6)",
  textTertiary: "rgba(0,0,0,0.4)",
  textMuted: "rgba(0,0,0,0.25)",
  border: "rgba(0,0,0,0.08)",
  borderSubtle: "rgba(0,0,0,0.04)",
  accent: "#111118",
  accentText: "#ffffff",
  badgeBg: "#111118",
  badgeText: "#ffffff",
  teamBubble: "rgba(0,0,0,0.04)",
  clientBubble: "rgba(0,0,0,0.07)",
  activeNav: "rgba(0,0,0,0.06)",
  hoverBg: "rgba(0,0,0,0.03)",
  modalOverlay: "rgba(0,0,0,0.4)",
  modalBg: "#ffffff",
  tagBg: "rgba(0,0,0,0.05)",
  tagText: "rgba(0,0,0,0.5)",
  videoPlayerBg: "#1a1a1f",
};

interface ThemeContextValue {
  t: ThemeTokens;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  t: darkTokens,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const t = mode === "dark" ? darkTokens : lightTokens;
  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  return <ThemeContext.Provider value={{ t, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
