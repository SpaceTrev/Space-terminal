export const THEMES = {
  dark: {
    bg: "#060d1a", bgHeader: "#08111f", bgSidebar: "#07101e", bgCard: "#0d1828",
    bgHover: "#111e30", bgInput: "#0d1828", bgAIBubble: "#0d1e35", bgUserBubble: "#0d1828",
    bgActiveTF: "#1a2a40", border: "#1a2a40", borderSub: "#0d1a2e",
    text: "#c8d8f0", textStrong: "#e2e8f8", textMuted: "#4a6080", textSub: "#6a88aa", textSymbol: "#8899bb",
    accent: "#ff6b35", accentBlue: "#7dd3fc", up: "#00d4aa", down: "#ff4d6d",
    candleGrad1: "#1a2234", candleGrad2: "#0d1421", candleGrid: "#1e2d45",
    scrollTrack: "#060d1a", scrollThumb: "#1a2a40",
    sendBtnText: "#060d1a", sendDisabled: "#1a2a40", sendDisabledTxt: "#4a6080",
    activeRow: "#112038", tabActive: "#0d1828", tabInactive: "transparent",
    badge: "#1a2a40", badgeText: "#7dd3fc",
  },
  light: {
    bg: "#f2f5fb", bgHeader: "#ffffff", bgSidebar: "#f8fafd", bgCard: "#ffffff",
    bgHover: "#edf1fa", bgInput: "#ffffff", bgAIBubble: "#fff7f3", bgUserBubble: "#eef4ff",
    bgActiveTF: "#e4eaf8", border: "#dce3f0", borderSub: "#edf0f8",
    text: "#2a3650", textStrong: "#0f1d32", textMuted: "#8a9ab8", textSub: "#5a6f90", textSymbol: "#7a8faa",
    accent: "#e05a1a", accentBlue: "#1d4ed8", up: "#059669", down: "#dc2626",
    candleGrad1: "#edf1fa", candleGrad2: "#e2e8f5", candleGrid: "#cdd5e8",
    scrollTrack: "#f2f5fb", scrollThumb: "#dce3f0",
    sendBtnText: "#ffffff", sendDisabled: "#e4eaf8", sendDisabledTxt: "#8a9ab8",
    activeRow: "#deeaff", tabActive: "#ffffff", tabInactive: "transparent",
    badge: "#e4eaf8", badgeText: "#1d4ed8",
  },
};

export type Theme = typeof THEMES.dark;
export type ThemeKey = keyof typeof THEMES;
