import { getConfig, setConfig } from "@code-ui/core";

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

type RgbTuple = readonly [number, number, number];

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

interface ThemeRegistry {
  colorMode: AppColorMode;
  systemMode: ResolvedThemeMode;
  colors: AppThemeColors;
  cssVars: string;
  baselineColors: AppThemeColors | null;
  listeners: Set<AppThemeListener>;
  systemListening: boolean;
}

interface ThemeGlobalScope {
  __CODE_UI_THEME_REGISTRY__?: ThemeRegistry | undefined;
  __CODE_UI_GLOBAL_CONFIG__?: { ui?: { colors?: AppThemeColors } } | undefined;
}

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
  return globalScope.__CODE_UI_THEME_REGISTRY__;
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
  const resolvedMode = resolveMode(reg);
  return {
    colorMode: reg.colorMode,
    resolvedMode,
    colors: { ...reg.colors },
    cssVars: reg.cssVars,
  };
}

function syncCoreColors(reg: ThemeRegistry, restoreBaseline = false): void {
  if (reg.baselineColors === null) {
    const existing = getConfig()?.ui?.colors;
    reg.baselineColors = existing ? { ...(existing as AppThemeColors) } : {};
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
  setConfig({ ui: {} });
  const cfg = globalScope.__CODE_UI_GLOBAL_CONFIG__;
  if (cfg?.ui) {
    cfg.ui.colors = {
      ...reg.baselineColors,
      ...resolvedEntries,
    };
  }
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

export function getAppTheme(): AppThemeState {
  return buildState(getRegistry());
}

export function setAppTheme(config: AppThemeConfig): AppThemeState {
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

export function setAppColorMode(colorMode: AppColorMode): AppThemeState {
  return setAppTheme({ colorMode });
}

export function toggleAppColorMode(): AppThemeState {
  const current = resolveMode(getRegistry());
  return setAppColorMode(current === "dark" ? "light" : "dark");
}

export function setAppThemeColors(
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

export function resetAppTheme(): AppThemeState {
  const reg = getRegistry();
  reg.colorMode = "system";
  reg.systemMode = detectSystemTheme();
  reg.colors = {};
  syncCoreColors(reg, true);
  return recomputeAndNotify(reg);
}

export function subscribeAppTheme(
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

interface ThemeOwnerInstance
  extends WechatMiniprogram.Component.InstanceProperties {
  __cuiUnsubTheme?: (() => void) | undefined;
  setData?: ((data: Record<string, unknown>) => void) | undefined;
  data?: {
    themeMode?: ResolvedThemeMode | undefined;
    themeCssVars?: string | undefined;
  };
}

export function createAppThemeBehavior() {
  return Behavior({
    data: {
      themeMode: getAppTheme().resolvedMode as ResolvedThemeMode,
      themeCssVars: getAppTheme().cssVars,
    },

    lifetimes: {
      attached(this: ThemeOwnerInstance) {
        this.__cuiUnsubTheme?.();
        this.__cuiUnsubTheme = subscribeAppTheme((state) => {
          this.setData?.({
            themeMode: state.resolvedMode,
            themeCssVars: state.cssVars,
          });
        }, true);
      },

      detached(this: ThemeOwnerInstance) {
        this.__cuiUnsubTheme?.();
        this.__cuiUnsubTheme = undefined;
      },
    },

    pageLifetimes: {
      show(this: ThemeOwnerInstance) {
        const state = getAppTheme();
        if (
          this.data?.themeMode !== state.resolvedMode ||
          this.data?.themeCssVars !== state.cssVars
        ) {
          this.setData?.({
            themeMode: state.resolvedMode,
            themeCssVars: state.cssVars,
          });
        }
      },
    },
  });
}

export function __resetThemeRegistry(): void {
  const reg = getRegistry();
  reg.listeners.clear();
  reg.colorMode = "system";
  reg.systemMode = "light";
  reg.colors = {};
  reg.cssVars = "";
  reg.systemListening = false;
  if (reg.baselineColors !== null) {
    syncCoreColors(reg, true);
  }
  reg.baselineColors = null;
}
