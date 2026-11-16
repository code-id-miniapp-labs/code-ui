import {
  getAppTheme,
  resetAppTheme,
  resolveThemePaletteHex,
  setAppColorMode,
  setAppTheme,
  setAppThemeColors,
  subscribeAppTheme,
  toggleAppColorMode,
  type AppColorMode,
  type AppThemeColors,
  type AppThemeConfig,
  type AppThemeListener,
  type AppThemeState,
  type ResolvedThemeMode,
} from "@code-ui/miniapp/behaviors/theme";

export { resolveThemePaletteHex };

export type {
  AppColorMode,
  AppThemeColors,
  AppThemeConfig,
  AppThemeListener,
  AppThemeState,
  ResolvedThemeMode,
};

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
