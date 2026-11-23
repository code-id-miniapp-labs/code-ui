import {
  subscribePageLifecycle,
  type PageLifecycleInstanceLike,
} from "./page-lifecycle";

export type AppColorMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";
export type AppThemeColors = Record<string, string>;

export interface AppThemeState {
  colorMode: AppColorMode;
  resolvedMode: ResolvedThemeMode;
  colors: AppThemeColors;
  cssVars: string;
}

export type AppThemeListener = (state: AppThemeState) => void;

export interface ThemeRegistry {
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

function buildState(reg: ThemeRegistry): AppThemeState {
  return {
    colorMode: reg.colorMode,
    resolvedMode: resolveMode(reg),
    colors: { ...reg.colors },
    cssVars: reg.cssVars,
  };
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
      currentReg.onSystemChange?.(currentReg.systemMode);
      const state = buildState(currentReg);
      for (const listener of currentReg.listeners) {
        listener(state);
      }
    }
  });
}

export function getAppTheme(): AppThemeState {
  return buildState(getRegistry());
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
  extends WechatMiniprogram.Component.InstanceProperties,
    PageLifecycleInstanceLike {
  __cuiUnsubTheme?: (() => void) | undefined;
  __cuiUnsubPageLifecycle?: (() => void) | undefined;
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

        this.__cuiUnsubPageLifecycle?.();
        this.__cuiUnsubPageLifecycle = subscribePageLifecycle(this, {
          onShow: () => {
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
        });
      },

      detached(this: ThemeOwnerInstance) {
        this.__cuiUnsubTheme?.();
        this.__cuiUnsubTheme = undefined;
        this.__cuiUnsubPageLifecycle?.();
        this.__cuiUnsubPageLifecycle = undefined;
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
  reg.baselineColors = null;
  reg.systemListening = false;
  reg.onSystemChange = undefined;
}
