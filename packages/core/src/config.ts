import { signal } from "alien-signals";
import { cx, defu, createEventBus } from "@code-ui/utils";
import type { EventBus } from "@code-ui/utils";

export type SlotRecord<TSlots extends string = string> = Partial<
  Record<TSlots, string>
>;

export interface ComponentVariantsConfig<TSlots extends string = string> {
  variant?: Record<string, SlotRecord<TSlots>>;
  size?: Record<string, SlotRecord<TSlots>>;
  [customVariantKey: string]: Record<string, SlotRecord<TSlots>> | undefined;
}

export interface ComponentConfig<TSlots extends string = string> {
  /** Default component properties */
  defaultProps?: Record<string, any>;
  /** Global default slot classes for this component */
  ui?: SlotRecord<TSlots>;
  /** Alias for ui slot classes */
  slots?: SlotRecord<TSlots>;
  /** Variant-specific slot classes */
  variants?: ComponentVariantsConfig<TSlots>;
}

export interface CodeUIConfig {
  /** Global prefix for custom components */
  prefix?: string | undefined;
  /** Component-level styling and configuration overrides */
  components?: Record<string, ComponentConfig<any>> | undefined;
  /** Global theme tokens and custom properties */
  theme?: Record<string, any> | undefined;
}

interface ConfigEvents {
  change: CodeUIConfig;
  reset: void;
}

/**
 * Global reactive configuration signal.
 * Any update via `setConfig` will automatically notify active component observers.
 */
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

const configBus: EventBus<ConfigEvents> =
  g.__CODE_UI_CONFIG_BUS__ ||
  (g.__CODE_UI_CONFIG_BUS__ = createEventBus<ConfigEvents>());

export const globalConfigSignal = signal<CodeUIConfig>(
  g.__CODE_UI_GLOBAL_CONFIG__,
);

configBus.on("change", (newConfig) => {
  globalConfigSignal(newConfig);
});

configBus.on("reset", () => {
  globalConfigSignal(initialConfig);
});

/**
 * Configure global Code-UI settings, themes, and component slot classes.
 * Can be called multiple times; subsequent calls merge recursively with existing config.
 */
export function setConfig(
  config: CodeUIConfig | ((prev: CodeUIConfig) => CodeUIConfig),
): void {
  const current = g.__CODE_UI_GLOBAL_CONFIG__ || globalConfigSignal();
  const next = typeof config === "function" ? config(current) : config;
  const merged = defu(next, current) as CodeUIConfig;

  g.__CODE_UI_GLOBAL_CONFIG__ = merged;
  globalConfigSignal(merged);

  // Broadcast to all other bundle instances across module boundaries
  configBus.emit("change", merged);
}

/**
 * Retrieve the current snapshot of the global configuration.
 */
export function getConfig(): CodeUIConfig {
  return g.__CODE_UI_GLOBAL_CONFIG__ || globalConfigSignal();
}

/**
 * Retrieve the configuration for a specific component.
 * Automatically tracks dependency in alien-signals reactive context.
 */
export function getComponentConfig<TSlots extends string = string>(
  componentName: string,
): ComponentConfig<TSlots> {
  const config = globalConfigSignal();
  return (config.components?.[componentName] || {}) as ComponentConfig<TSlots>;
}

/**
 * Reset the global configuration back to initial defaults.
 */
export function resetConfig(): void {
  g.__CODE_UI_GLOBAL_CONFIG__ = initialConfig;
  globalConfigSignal(initialConfig);
  configBus.emit("reset");
}

export interface MergeUIOptions<TSlots extends string> {
  /** Anatomy instance or definition to automatically infer slot keys from */
  anatomy?: { keys: () => TSlots[] } | undefined;
  /** Base default slot classes defined by the component */
  defaultSlots?: Partial<Record<TSlots, string>> | undefined;
  /** Global component config from setConfig */
  globalConfig?: ComponentConfig<TSlots> | undefined;
  /** Active visual variant (e.g. 'primary', 'secondary', 'outline') */
  variant?: string | undefined;
  /** Active size variant (e.g. 'sm', 'md', 'lg') */
  size?: string | undefined;
  /** Additional custom variant names & values */
  extraVariants?: Record<string, string | undefined> | undefined;
  /** Per-instance `ui` prop overrides */
  instanceUI?: Partial<Record<TSlots, string>> | undefined;
}

/**
 * Reconciles and resolves the final class names for all anatomy slots of a component.
 * Merging order (later overrides / appends cleanly with earlier):
 * 1. Component Base Default Slots
 * 2. Global Component Config Base Slots (`config.ui` / `config.slots`)
 * 3. Global Component Config Variant Slots (`config.variants.variant[v]`)
 * 4. Global Component Config Size Slots (`config.variants.size[s]`)
 * 5. Global Component Config Extra Variant Slots
 * 6. Per-Instance `ui` prop overrides
 */
export function mergeUI<TSlots extends string>(
  options: MergeUIOptions<TSlots>,
): Record<TSlots, string> {
  const {
    anatomy,
    defaultSlots,
    globalConfig,
    variant,
    size,
    extraVariants,
    instanceUI,
  } = options;

  const result = {} as Record<TSlots, string>;
  const allSlots: TSlots[] = anatomy
    ? anatomy.keys()
    : defaultSlots
      ? (Object.keys(defaultSlots) as TSlots[])
      : [];

  const safeInstanceUI = (
    instanceUI && typeof instanceUI === "object" ? instanceUI : {}
  ) as Record<string, string | undefined>;

  const globalBaseUI = (globalConfig?.ui ||
    globalConfig?.slots ||
    {}) as Record<string, string | undefined>;
  const globalVariants = (globalConfig?.variants || {}) as Record<
    string,
    Record<string, Record<string, string | undefined> | undefined> | undefined
  >;

  const variantRecord =
    variant && globalVariants.variant
      ? globalVariants.variant[variant]
      : undefined;
  const sizeRecord =
    size && globalVariants.size ? globalVariants.size[size] : undefined;

  for (const slot of allSlots) {
    const slotKey = slot as string;
    const defaultClass = defaultSlots?.[slot] || "";
    const globalBaseClass = globalBaseUI[slotKey] || "";

    const globalVariantClass = variantRecord?.[slotKey] || "";
    const globalSizeClass = sizeRecord?.[slotKey] || "";

    let globalExtraClass = "";
    if (extraVariants) {
      for (const [vKey, vVal] of Object.entries(extraVariants)) {
        if (vVal && globalVariants[vKey]?.[vVal]) {
          const cls = globalVariants[vKey]![vVal]![slotKey];
          if (cls) {
            globalExtraClass = cx(globalExtraClass, cls);
          }
        }
      }
    }

    const instanceClass = safeInstanceUI[slotKey] || "";

    result[slot] = cx(
      defaultClass,
      globalBaseClass,
      globalVariantClass,
      globalSizeClass,
      globalExtraClass,
      instanceClass,
    );
  }

  return result;
}
