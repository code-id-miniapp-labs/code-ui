import { defu } from "@code-ui/utils";

export type SlotRecord<TSlots extends string = string> = Partial<
  Record<TSlots, string>
>;

export interface ComponentVariantsConfig<TSlots extends string = string> {
  variant?: Record<string, SlotRecord<TSlots>>;
  size?: Record<string, SlotRecord<TSlots>>;
  [customVariantKey: string]: Record<string, SlotRecord<TSlots>> | undefined;
}

export interface ComponentRegistry {
  button: "root" | "label" | "icon" | "spinner";
  drawer:
    | "root"
    | "backdrop"
    | "content"
    | "grabber"
    | "grabberBar"
    | "header"
    | "title"
    | "description"
    | "closeTrigger"
    | "body"
    | "footer";
  [componentName: string]: string;
}

export type KnownComponentSlots<TName extends string> =
  TName extends keyof ComponentRegistry ? ComponentRegistry[TName] : string;

export interface ComponentConfig<TSlots extends string = string> {
  /** Global default slot classes for this component */
  slots?: SlotRecord<TSlots>;
  /** Alias for slots */
  ui?: SlotRecord<TSlots>;
  /** Variant-specific slot classes */
  variants?: ComponentVariantsConfig<TSlots>;
  /** Compound variants rules */
  compoundVariants?: Array<Record<string, any>>;
  /** Default variant values */
  defaultVariants?: Record<string, any>;
  /** Alias for defaultVariants */
  defaultProps?: Record<string, any>;
}

export interface UIColorsConfig {
  /** Primary brand color */
  primary?: string;
  /** Neutral/gray color */
  neutral?: string;
  /** Success color */
  success?: string;
  /** Warning color */
  warning?: string;
  /** Danger/destructive color */
  danger?: string;
  /** Info color */
  info?: string;
  /** Background color */
  background?: string;
  /** Foreground/text color */
  foreground?: string;
  /** Muted text/background color */
  muted?: string;
  /** Border color */
  border?: string;
  /** Allow custom color keys */
  [colorName: string]: string | undefined;
}

export interface UIConfig {
  /** Design token colors */
  colors?: UIColorsConfig;
  /** Border radius tokens */
  radius?: {
    sm?: string;
    md?: string;
    lg?: string;
    full?: string;
    [key: string]: string | undefined;
  };
  /** Transition duration tokens */
  transition?: {
    fast?: string;
    normal?: string;
    slow?: string;
    [key: string]: string | undefined;
  };
  /** Font family tokens */
  font?: {
    sans?: string;
    mono?: string;
    [key: string]: string | undefined;
  };
}

export interface CodeUIConfig {
  /** Global prefix for custom components */
  prefix?: string | undefined;
  /** Global design token configuration (colors, radius, transitions) */
  ui?: UIConfig | undefined;
  /** Component-level styling and configuration overrides */
  components?:
    | ({
        [K in keyof ComponentRegistry]?: ComponentConfig<ComponentRegistry[K]>;
      } & Record<string, ComponentConfig<any> | undefined>)
    | undefined;
}

/**
 * Type-safe configuration helper for cui.config.ts
 *
 * @example
 * ```ts
 * import { defineConfig } from '@code-ui/core'
 *
 * export default defineConfig({
 *   prefix: 'cui',
 *   ui: {
 *     colors: {
 *       primary: '#10b981',
 *       neutral: '#737373',
 *       danger: '#ef4444',
 *     },
 *     radius: {
 *       md: '12rpx',
 *       lg: '16rpx',
 *     },
 *   },
 *   components: {
 *     button: {
 *       slots: {
 *         root: 'rounded-full font-bold'
 *       }
 *     }
 *   }
 * })
 * ```
 */
export function defineConfig(config: CodeUIConfig): CodeUIConfig {
  return config;
}

const initialConfig: CodeUIConfig = {
  prefix: "cui",
  components: {},
};

const g: any =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {};

if (!g.__CODE_UI_GLOBAL_CONFIG__) {
  g.__CODE_UI_GLOBAL_CONFIG__ = initialConfig;
}

/**
 * Configure global Code-UI settings, themes, and component slot classes.
 * Can be called multiple times; subsequent calls merge recursively with existing config.
 */
export function setConfig(
  config: CodeUIConfig | ((prev: CodeUIConfig) => CodeUIConfig),
): void {
  const current = g.__CODE_UI_GLOBAL_CONFIG__ as CodeUIConfig;
  const next = typeof config === "function" ? config(current) : config;
  const merged = defu(next, current) as CodeUIConfig;

  g.__CODE_UI_GLOBAL_CONFIG__ = merged;
}

/**
 * Retrieve the current snapshot of the global configuration.
 */
export function getConfig(): CodeUIConfig {
  return g.__CODE_UI_GLOBAL_CONFIG__ as CodeUIConfig;
}

/**
 * Retrieve the configuration for a specific component.
 * Normalizes component names (stripping prefix) and aligns slot/variant aliases.
 */
export function getComponentConfig<TSlots extends string = string>(
  componentName: string,
): ComponentConfig<TSlots> {
  const config = g.__CODE_UI_GLOBAL_CONFIG__ as CodeUIConfig;
  const prefix = config.prefix || "cui";
  const normalizedName = componentName
    .replace(new RegExp(`^(?:${prefix}|cui|c)-`, "i"), "")
    .toLowerCase();

  const raw =
    (config.components?.[componentName] ||
      config.components?.[normalizedName] ||
      {}) as ComponentConfig<TSlots>;

  const slots = defu(raw.slots || {}, raw.ui || {}) as SlotRecord<TSlots>;
  const defaultVariants = defu(
    raw.defaultVariants || {},
    raw.defaultProps || {},
  );

  return {
    slots,
    ui: slots,
    variants: raw.variants,
    compoundVariants: raw.compoundVariants,
    defaultVariants,
    defaultProps: defaultVariants,
  } as ComponentConfig<TSlots>;
}

/**
 * Retrieve the active `ui` design tokens from global config.
 */
export function getUI(): UIConfig {
  const config = g.__CODE_UI_GLOBAL_CONFIG__ as CodeUIConfig;
  return config.ui || {};
}

/**
 * Retrieve the active colors from global config.
 */
export function getColors(): UIColorsConfig {
  return getUI().colors || {};
}

/**
 * Flatten the `ui` config into a flat `Record<string, string>` of CSS custom properties.
 * e.g. `{ colors: { primary: '#10b981' } }` → `{ '--cui-color-primary': '#10b981' }`
 */
export function flattenUI(prefix = "cui"): Record<string, string> {
  const ui = getUI();
  const result: Record<string, string> = {};

  if (ui.colors) {
    for (const [key, val] of Object.entries(ui.colors)) {
      if (val) result[`--${prefix}-color-${key}`] = val;
    }
  }
  if (ui.radius) {
    for (const [key, val] of Object.entries(ui.radius)) {
      if (val) result[`--${prefix}-radius-${key}`] = val;
    }
  }
  if (ui.transition) {
    for (const [key, val] of Object.entries(ui.transition)) {
      if (val) result[`--${prefix}-transition-${key}`] = val;
    }
  }
  if (ui.font) {
    for (const [key, val] of Object.entries(ui.font)) {
      if (val) result[`--${prefix}-font-${key}`] = val;
    }
  }

  return result;
}

/**
 * Format active UI tokens as an inline CSS style string for binding to page or container.
 *
 * @example
 * ```ts
 * const style = getThemeStyle();
 * // Output: "--cui-color-primary:#10b981;--cui-radius-md:12rpx"
 * ```
 */
export function getThemeStyle(): string {
  const tokens = flattenUI(getConfig().prefix || "cui");
  return Object.entries(tokens)
    .map(([key, val]) => `${key}:${val}`)
    .join(";");
}

/**
 * Reset the global configuration back to initial defaults.
 */
export function resetConfig(): void {
  g.__CODE_UI_GLOBAL_CONFIG__ = initialConfig;
}
