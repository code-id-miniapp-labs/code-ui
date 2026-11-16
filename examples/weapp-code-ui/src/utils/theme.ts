import {
  resolveThemePaletteHex,
  useTheme,
  type AppColorMode,
  type AppThemeColors,
} from "@code-ui/composables";

const STORAGE_KEY = "cui-example-theme";

export interface ThemeColorPreset {
  id: string;
  label: string;
  value: string;
  hex: string;
}

export const PRIMARY_COLOR_PRESETS: ThemeColorPreset[] = [
  { id: "stone", label: "Stone", value: "stone", hex: "#78716c" },
  { id: "indigo", label: "Indigo", value: "indigo", hex: "#6366f1" },
  { id: "blue", label: "Blue", value: "blue", hex: "#3b82f6" },
  { id: "emerald", label: "Emerald", value: "emerald", hex: "#10b981" },
  { id: "teal", label: "Teal", value: "teal", hex: "#14b8a6" },
  { id: "violet", label: "Violet", value: "violet", hex: "#8b5cf6" },
  { id: "rose", label: "Rose", value: "rose", hex: "#f43f5e" },
  { id: "orange", label: "Orange", value: "orange", hex: "#f97316" },
  { id: "amber", label: "Amber", value: "amber", hex: "#f59e0b" },
  { id: "cyan", label: "Cyan", value: "cyan", hex: "#06b6d4" },
];

export const SECONDARY_COLOR_PRESETS: ThemeColorPreset[] = [
  { id: "amber", label: "Amber", value: "amber", hex: "#f59e0b" },
  { id: "sky", label: "Sky", value: "sky", hex: "#0ea5e9" },
  { id: "purple", label: "Purple", value: "purple", hex: "#a855f7" },
  { id: "pink", label: "Pink", value: "pink", hex: "#ec4899" },
  { id: "lime", label: "Lime", value: "lime", hex: "#84cc16" },
];

interface PersistedExampleTheme {
  colorMode?: AppColorMode | undefined;
  colors?: AppThemeColors | undefined;
}

let initialized = false;

export function syncNavigationBarTheme(): void {
  if (typeof wx === "undefined") return;
  const isDark = useTheme().isDark;
  try {
    wx.setNavigationBarColor({
      frontColor: isDark ? "#ffffff" : "#000000",
      backgroundColor: isDark ? "#18181b" : "#ffffff",
      animation: { duration: 150, timingFunc: "easeIn" },
      fail: () => {},
    });
  } catch {
    // Ignore nav bar sync errors outside MiniProgram page lifecycle
  }
  try {
    wx.setBackgroundColor({
      backgroundColor: isDark ? "#18181b" : "#fafafa",
      backgroundColorTop: isDark ? "#18181b" : "#fafafa",
      backgroundColorBottom: isDark ? "#18181b" : "#fafafa",
      fail: () => {},
    });
  } catch {
    // Ignore background color errors in Skyline/unsupported views
  }
}

function readStoredTheme(): PersistedExampleTheme | null {
  if (typeof wx === "undefined" || typeof wx.getStorageSync !== "function") {
    return null;
  }
  try {
    const raw = wx.getStorageSync(STORAGE_KEY) as
      | PersistedExampleTheme
      | string
      | undefined;
    if (!raw) return null;
    if (typeof raw === "string") {
      return JSON.parse(raw) as PersistedExampleTheme;
    }
    return raw;
  } catch {
    return null;
  }
}

function persistCurrentTheme(): void {
  if (typeof wx === "undefined" || typeof wx.setStorageSync !== "function") {
    return;
  }
  const state = useTheme().state;
  const payload: PersistedExampleTheme = {
    colorMode: state.colorMode,
    colors: state.colors,
  };
  try {
    wx.setStorageSync(STORAGE_KEY, payload);
  } catch {
    // Ignore storage quota/access errors
  }
}

export function initExampleTheme(): void {
  const theme = useTheme();
  if (!initialized) {
    initialized = true;
    theme.subscribe(() => {
      syncNavigationBarTheme();
    });
  }

  const saved = readStoredTheme();
  if (saved) {
    theme.setTheme({
      ...(saved.colorMode ? { colorMode: saved.colorMode } : {}),
      ...(saved.colors ? { colors: saved.colors } : {}),
    });
  }
  syncNavigationBarTheme();
}

export function setExampleColorMode(mode: AppColorMode): void {
  useTheme().setColorMode(mode);
  persistCurrentTheme();
  syncNavigationBarTheme();
}

export function toggleExampleColorMode(): void {
  useTheme().toggleColorMode();
  persistCurrentTheme();
  syncNavigationBarTheme();
}

export function setExampleColors(colors: AppThemeColors): void {
  useTheme().setColors(colors);
  persistCurrentTheme();
}

export function resetExampleTheme(): void {
  useTheme().reset();
  if (typeof wx !== "undefined" && typeof wx.removeStorageSync === "function") {
    try {
      wx.removeStorageSync(STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
  }
  syncNavigationBarTheme();
}

export function normalizeExampleColorInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withHash =
    /^[0-9a-fA-F]{3}$/.test(trimmed) || /^[0-9a-fA-F]{6}$/.test(trimmed)
      ? `#${trimmed}`
      : trimmed;
  const hex = resolveThemePaletteHex(withHash);
  if (!hex) return null;
  return withHash.startsWith("#") ? hex : withHash.toLowerCase();
}
