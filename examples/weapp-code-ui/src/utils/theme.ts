export type AppColorMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";
export type AppThemeColors = Record<string, string>;

export interface AppThemeConfig {
  colorMode?: AppColorMode | undefined;
  colors?: AppThemeColors | undefined;
}

export interface AppThemeState {
  colorMode: AppColorMode;
  resolvedMode: ResolvedThemeMode;
  colors: AppThemeColors;
  cssVars: string;
}

export type AppThemeListener = (state: AppThemeState) => void;

export interface UseThemeReturn {
  readonly state: AppThemeState;
  readonly colorMode: AppColorMode;
  readonly resolvedMode: ResolvedThemeMode;
  readonly isDark: boolean;
  readonly colors: AppThemeColors;
  readonly cssVars: string;
  getState(): AppThemeState;
  setTheme(config: AppThemeConfig): AppThemeState;
  setColorMode(mode: AppColorMode): AppThemeState;
  toggleColorMode(): AppThemeState;
  setColors(
    colors: AppThemeColors,
    options?: { merge?: boolean | undefined },
  ): AppThemeState;
  reset(): AppThemeState;
  subscribe(listener: AppThemeListener, immediate?: boolean): () => void;
}

type RgbTuple = readonly [number, number, number];

interface ThemeRegistry {
  colorMode: AppColorMode;
  systemMode: ResolvedThemeMode;
  colors: AppThemeColors;
  cssVars: string;
  baselineColors: AppThemeColors | null;
  listeners: Set<AppThemeListener>;
  systemListening: boolean;
  onSystemChange?: ((mode: ResolvedThemeMode) => void) | undefined;
}

interface ThemeGlobalScope {
  __CODE_UI_THEME_REGISTRY__?: ThemeRegistry | undefined;
  __CODE_UI_GLOBAL_CONFIG__?: { ui?: { colors?: AppThemeColors } } | undefined;
}

const SHADES = [
  [50, 1, 0.93],
  [100, 1, 0.85],
  [200, 1, 0.7],
  [300, 1, 0.48],
  [400, 1, 0.24],
  [500, 0, 0],
  [600, -1, 0.18],
  [700, -1, 0.35],
  [800, -1, 0.5],
  [900, -1, 0.64],
  [950, -1, 0.78],
] as const;

const ALPHA_STEPS = [5, 10, 15, 20, 25, 30, 70, 80, 90] as const;

const PALETTE_500: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  slate: "#64748b",
  gray: "#6b7280",
  zinc: "#71717a",
  neutral: "#737373",
  stone: "#78716c",
  black: "#000000",
  white: "#ffffff",
};

const VALID_ROLE_RE = /^[a-zA-Z0-9-]+$/;

const globalScope = (
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {}
) as ThemeGlobalScope;

function detectSystemTheme(): ResolvedThemeMode {
  if (typeof wx === "undefined") return "light";
  try {
    const info =
      typeof wx.getAppBaseInfo === "function"
        ? wx.getAppBaseInfo()
        : typeof wx.getSystemInfoSync === "function"
          ? wx.getSystemInfoSync()
          : undefined;
    if (info && info.theme === "dark") return "dark";
  } catch {
    // Ignore miniapp environment errors outside runtime
  }
  return "light";
}

function getRegistry(): ThemeRegistry {
  if (!globalScope.__CODE_UI_THEME_REGISTRY__) {
    globalScope.__CODE_UI_THEME_REGISTRY__ = {
      colorMode: "system",
      systemMode: detectSystemTheme(),
      colors: {},
      cssVars: "",
      baselineColors: null,
      listeners: new Set(),
      systemListening: false,
    };
  }
  const reg = globalScope.__CODE_UI_THEME_REGISTRY__;
  reg.onSystemChange = (mode) => {
    reg.cssVars = buildThemeCssVars(reg.colors, mode);
  };
  return reg;
}

function resolveMode(reg: ThemeRegistry): ResolvedThemeMode {
  if (reg.colorMode === "dark") return "dark";
  if (reg.colorMode === "light") return "light";
  return reg.systemMode;
}

export function resolveThemePaletteHex(color: string): string | null {
  const trimmed = color.trim();
  if (!trimmed) return null;
  const named = PALETTE_500[trimmed.toLowerCase()];
  const candidate = named ?? trimmed;
  if (!candidate.startsWith("#")) return null;
  const raw = candidate.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw.charAt(0);
    const g = raw.charAt(1);
    const b = raw.charAt(2);
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  return null;
}

function parseHexRgb(hex: string): RgbTuple {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function clampChannel(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function mixRgb(base: RgbTuple, target: RgbTuple, ratio: number): RgbTuple {
  const inv = 1 - ratio;
  return [
    clampChannel(base[0] * inv + target[0] * ratio),
    clampChannel(base[1] * inv + target[1] * ratio),
    clampChannel(base[2] * inv + target[2] * ratio),
  ];
}

function toHex(rgb: RgbTuple): string {
  const r = rgb[0].toString(16).padStart(2, "0");
  const g = rgb[1].toString(16).padStart(2, "0");
  const b = rgb[2].toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function buildThemeCssVars(
  colors: AppThemeColors,
  mode: ResolvedThemeMode = "light",
): string {
  const entries = Object.entries(colors);
  if (entries.length === 0) return "";

  const parts: string[] = [];
  const white: RgbTuple = [255, 255, 255];
  const darkBase: RgbTuple = [5, 5, 8];

  for (const [role, rawValue] of entries) {
    if (!role || !VALID_ROLE_RE.test(role) || !rawValue) continue;
    const baseHex = resolveThemePaletteHex(rawValue);
    if (!baseHex) continue;

    const baseRgb = parseHexRgb(baseHex);
    let shade400Rgb = baseRgb;
    let shade400Hex = baseHex;
    const shade500Rgb = baseRgb;
    const shade500Hex = baseHex;

    for (const [shade, dir, ratio] of SHADES) {
      const rgb =
        dir === 1
          ? mixRgb(baseRgb, white, ratio)
          : dir === -1
            ? mixRgb(baseRgb, darkBase, ratio)
            : baseRgb;
      const hex = toHex(rgb);
      if (shade === 400) {
        shade400Rgb = rgb;
        shade400Hex = hex;
      }
      parts.push(`--ui-color-${role}-${shade}:${hex}`);
    }

    if (role !== "neutral") {
      const activeRgb = mode === "dark" ? shade400Rgb : shade500Rgb;
      const activeHex = mode === "dark" ? shade400Hex : shade500Hex;
      parts.push(`--ui-${role}:${activeHex}`);
      for (const alpha of ALPHA_STEPS) {
        const opacity = alpha / 100;
        parts.push(
          `--ui-${role}-a${alpha}:rgba(${activeRgb[0]},${activeRgb[1]},${activeRgb[2]},${opacity})`,
        );
      }
    }
  }

  return parts.length > 0 ? `${parts.join(";")};` : "";
}

function buildState(reg: ThemeRegistry): AppThemeState {
  return {
    colorMode: reg.colorMode,
    resolvedMode: resolveMode(reg),
    colors: { ...reg.colors },
    cssVars: reg.cssVars,
  };
}

function syncCoreColors(reg: ThemeRegistry, restoreBaseline = false): void {
  const existing = globalScope.__CODE_UI_GLOBAL_CONFIG__?.ui?.colors;
  if (reg.baselineColors === null) {
    reg.baselineColors = existing ? { ...existing } : {};
  }

  if (restoreBaseline) {
    const cfg = globalScope.__CODE_UI_GLOBAL_CONFIG__;
    if (cfg?.ui) {
      cfg.ui.colors = { ...reg.baselineColors };
    }
    return;
  }

  const resolvedEntries: AppThemeColors = {};
  for (const [role, value] of Object.entries(reg.colors)) {
    const hex = resolveThemePaletteHex(value);
    if (hex) resolvedEntries[role] = hex;
  }

  globalScope.__CODE_UI_GLOBAL_CONFIG__ ||= {};
  globalScope.__CODE_UI_GLOBAL_CONFIG__.ui ||= {};
  globalScope.__CODE_UI_GLOBAL_CONFIG__.ui.colors = {
    ...reg.baselineColors,
    ...resolvedEntries,
  };
}

function recomputeAndNotify(reg: ThemeRegistry): AppThemeState {
  const resolvedMode = resolveMode(reg);
  reg.cssVars = buildThemeCssVars(reg.colors, resolvedMode);
  const state = buildState(reg);
  for (const listener of reg.listeners) {
    listener(state);
  }
  return state;
}

function ensureSystemListener(): void {
  const reg = getRegistry();
  if (reg.systemListening) return;
  if (typeof wx === "undefined" || typeof wx.onThemeChange !== "function") {
    return;
  }
  reg.systemListening = true;
  wx.onThemeChange((res) => {
    const currentReg = getRegistry();
    currentReg.systemMode = res.theme === "dark" ? "dark" : "light";
    if (currentReg.colorMode === "system") {
      recomputeAndNotify(currentReg);
    }
  });
}

function getAppTheme(): AppThemeState {
  return buildState(getRegistry());
}

function setAppTheme(config: AppThemeConfig): AppThemeState {
  const reg = getRegistry();
  ensureSystemListener();

  if (config.colorMode !== undefined) {
    reg.colorMode = config.colorMode;
    if (config.colorMode === "system") {
      reg.systemMode = detectSystemTheme();
    }
  }

  if (config.colors !== undefined) {
    const next: AppThemeColors = { ...reg.colors };
    for (const [k, v] of Object.entries(config.colors)) {
      if (!v || !v.trim()) {
        delete next[k];
      } else {
        next[k] = v.trim();
      }
    }
    reg.colors = next;
    syncCoreColors(reg, Object.keys(next).length === 0);
  }

  return recomputeAndNotify(reg);
}

function setAppColorMode(colorMode: AppColorMode): AppThemeState {
  return setAppTheme({ colorMode });
}

function toggleAppColorMode(): AppThemeState {
  const current = resolveMode(getRegistry());
  return setAppColorMode(current === "dark" ? "light" : "dark");
}

function setAppThemeColors(
  colors: AppThemeColors,
  options?: { merge?: boolean | undefined },
): AppThemeState {
  const reg = getRegistry();
  ensureSystemListener();
  const merge = options?.merge !== false;
  const next: AppThemeColors = merge ? { ...reg.colors } : {};

  for (const [k, v] of Object.entries(colors)) {
    if (!v || !v.trim()) {
      delete next[k];
    } else {
      next[k] = v.trim();
    }
  }

  reg.colors = next;
  syncCoreColors(reg, Object.keys(next).length === 0);
  return recomputeAndNotify(reg);
}

function resetAppTheme(): AppThemeState {
  const reg = getRegistry();
  reg.colorMode = "system";
  reg.systemMode = detectSystemTheme();
  reg.colors = {};
  syncCoreColors(reg, true);
  return recomputeAndNotify(reg);
}

function subscribeAppTheme(
  listener: AppThemeListener,
  immediate = false,
): () => void {
  const reg = getRegistry();
  ensureSystemListener();
  reg.listeners.add(listener);
  if (immediate) {
    listener(buildState(reg));
  }
  return () => {
    reg.listeners.delete(listener);
  };
}

export function useTheme(): UseThemeReturn {
  return {
    get state() {
      return getAppTheme();
    },
    get colorMode() {
      return getAppTheme().colorMode;
    },
    get resolvedMode() {
      return getAppTheme().resolvedMode;
    },
    get isDark() {
      return getAppTheme().resolvedMode === "dark";
    },
    get colors() {
      return getAppTheme().colors;
    },
    get cssVars() {
      return getAppTheme().cssVars;
    },
    getState: () => getAppTheme(),
    setTheme: (config) => setAppTheme(config),
    setColorMode: (mode) => setAppColorMode(mode),
    toggleColorMode: () => toggleAppColorMode(),
    setColors: (colors, options) => setAppThemeColors(colors, options),
    reset: () => resetAppTheme(),
    subscribe: (listener, immediate = false) =>
      subscribeAppTheme(listener, immediate),
  };
}

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
