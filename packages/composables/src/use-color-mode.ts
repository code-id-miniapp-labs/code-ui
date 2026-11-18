import {
  getAppTheme,
  subscribeAppTheme,
  type AppColorMode,
  type AppThemeColors,
  type AppThemeState,
  type ResolvedThemeMode,
  type ThemeRegistry,
} from "@code-id-labs/miniapp/behaviors/theme";

export type {
  AppColorMode,
  AppThemeColors,
  AppThemeState,
  ResolvedThemeMode,
};

export interface UseColorModeOptions {
  /** Optional Page or Component instance (`this`) to sync state into `instance.data` */
  target?: any;
  /** Data key under `target.data` (e.g. `key: "colorMode"`) */
  key?: string | undefined;
  /** Initial color mode to apply if specified */
  initialValue?: AppColorMode | undefined;
  /** Callback fired whenever theme mode or colors change */
  onChange?: ((state: AppThemeState) => void) | undefined;
}

export interface UseColorModeReturn {
  /** Current configured mode ("light" | "dark" | "system") */
  readonly mode: AppColorMode;
  /** Resolved effective mode ("light" | "dark") */
  readonly resolvedMode: ResolvedThemeMode;
  /** Active runtime color overrides */
  readonly colors: AppThemeColors;
  /** Compiled CSS variable string */
  readonly cssVars: string;
  /** Read full current theme state */
  getState: () => AppThemeState;
  /** Set color mode ("light" | "dark" | "system") */
  setMode: (mode: AppColorMode) => void;
  /** Toggle between "light" and "dark" */
  toggle: () => void;
  /** Stop any active subscription */
  stop: () => void;
}

function getThemeRegistry(): ThemeRegistry | undefined {
  return (globalThis as { __CODE_UI_THEME_REGISTRY__?: ThemeRegistry })
    .__CODE_UI_THEME_REGISTRY__;
}

function notifyRegistryListeners(reg: ThemeRegistry): void {
  const state = getAppTheme();
  for (const listener of reg.listeners) {
    listener(state);
  }
}

export function useColorMode(
  options: UseColorModeOptions = {},
): UseColorModeReturn {
  const { target, key, initialValue, onChange } = options;

  // Ensure registry is initialized
  getAppTheme();

  if (initialValue) {
    const reg = getThemeRegistry();
    if (reg && reg.colorMode !== initialValue) {
      reg.colorMode = initialValue;
      notifyRegistryListeners(reg);
    }
  }

  let unsubscribe: (() => void) | undefined;

  if (onChange || (target && key && typeof target.setData === "function")) {
    unsubscribe = subscribeAppTheme((state) => {
      onChange?.(state);
      if (target && key && typeof target.setData === "function") {
        target.setData({ [key]: state });
      }
    }, true);
  }

  const setMode = (mode: AppColorMode) => {
    const reg = getThemeRegistry();
    if (!reg) return;
    reg.colorMode = mode;
    notifyRegistryListeners(reg);
  };

  const toggle = () => {
    const current = getAppTheme().resolvedMode;
    setMode(current === "dark" ? "light" : "dark");
  };

  const stop = () => {
    unsubscribe?.();
    unsubscribe = undefined;
  };

  return {
    get mode() {
      return getAppTheme().colorMode;
    },
    get resolvedMode() {
      return getAppTheme().resolvedMode;
    },
    get colors() {
      return getAppTheme().colors;
    },
    get cssVars() {
      return getAppTheme().cssVars;
    },
    getState: () => getAppTheme(),
    setMode,
    toggle,
    stop,
  };
}
