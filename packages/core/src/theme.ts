export type ThemeSlots = Record<string, string>;

export type ThemeVariants = Record<
  string,
  Record<string, Record<string, string> | string | Record<string, unknown>>
>;

export type StringToBoolean<T> = T extends "true" | "false" ? boolean : T;

export type VariantPropValue<V, K extends keyof V> = StringToBoolean<
  keyof V[K]
>;

export type CompoundVariant<V extends ThemeVariants, S extends ThemeSlots> = {
  [K in keyof V]?: VariantPropValue<V, K>;
} & {
  class?: Partial<Record<keyof S, string>>;
};

export type DefaultVariants<V extends ThemeVariants> = {
  [K in keyof V]?: VariantPropValue<V, K>;
};

export interface ThemeDefinition<
  S extends ThemeSlots,
  V extends ThemeVariants,
  DV = DefaultVariants<V>,
> {
  slots: S;
  variants: V;
  compoundVariants?: Array<CompoundVariant<V, S>>;
  defaultVariants?: DV;
}

/** Standard semantic colors supported across all component themes */
export const DEFAULT_THEME_COLORS = [
  "primary",
  "neutral",
  "danger",
  "success",
  "warning",
  "info",
] as const;

export type DefaultThemeColor = (typeof DEFAULT_THEME_COLORS)[number];

export type ThemeColor = DefaultThemeColor | (string & {});

export interface ThemeOptions<
  C extends readonly string[] = typeof DEFAULT_THEME_COLORS,
> {
  colors?: C | readonly string[] | string[];
  errorColor?: string;
  transitions?: boolean;
  [key: string]: any;
}

/**
 * Generates an empty variant map for a list of colors.
 * Used in component theme `variants.color`.
 */
export function createColorVariants<
  const C extends readonly string[] = typeof DEFAULT_THEME_COLORS,
>(colors?: C): Record<C[number], Record<string, string>> {
  const list = (colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const result: Record<string, Record<string, string>> = {};
  for (const c of list) {
    result[c] = {};
  }
  return result as Record<C[number], Record<string, string>>;
}

export type ColorVariantRule<S extends ThemeSlots> = (
  color: string,
) => Partial<Record<keyof S, string>>;

/**
 * Automatically generates compoundVariants across an array of colors and variant rules.
 */
export function createColorCompoundVariants<
  const C extends readonly string[] = typeof DEFAULT_THEME_COLORS,
  S extends ThemeSlots = ThemeSlots,
  Rules extends Record<string, ColorVariantRule<S>> = Record<
    string,
    ColorVariantRule<S>
  >,
>(
  colors: C | readonly string[] | string[],
  rules: Rules,
): Array<{
  variant: keyof Rules;
  color: C[number];
  class: Partial<Record<keyof S, string>>;
}> {
  const list = (colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const compounds: Array<{
    variant: keyof Rules;
    color: C[number];
    class: Partial<Record<keyof S, string>>;
  }> = [];

  for (const [variant, rule] of Object.entries(rules)) {
    for (const color of list) {
      compounds.push({
        variant: variant as keyof Rules,
        color: color as C[number],
        class: (rule as ColorVariantRule<S>)(color),
      });
    }
  }

  return compounds;
}

export function defineTheme<
  S extends ThemeSlots,
  V extends ThemeVariants,
  DV extends DefaultVariants<V> = DefaultVariants<V>,
>(config: {
  slots: S;
  variants: V;
  compoundVariants?: Array<CompoundVariant<V, S>>;
  defaultVariants?: DV;
}): ThemeDefinition<S, V, DV> & { defaultVariants: DV } {
  return config as any;
}

/**
 * Extract the slot union from a theme definition or theme factory function.
 *
 * @example
 * ```ts
 * type ButtonSlots = ExtractSlots<typeof buttonTheme>;
 * // 'root' | 'label' | 'icon' | 'spinner' | 'leadingIcon' | 'trailingIcon'
 * ```
 */
export type ExtractSlots<T> = T extends (...args: any[]) => { slots: infer S }
  ? keyof S
  : T extends { slots: infer S }
    ? keyof S
    : string;

/**
 * Type extractor that derives variant unions and slot keys from a theme definition or theme factory function.
 *
 * @example
 * ```ts
 * type ButtonTheme = ComponentTheme<typeof buttonTheme>;
 * export type ButtonVariant = ButtonTheme["variants"]["variant"];
 * export type ButtonColor = ButtonTheme["variants"]["color"];
 * export type ButtonSize = ButtonTheme["variants"]["size"];
 * export type ButtonSlots = ButtonTheme["slots"];
 * ```
 */
export type ComponentTheme<
  T extends
    | {
        variants?: Record<string, Record<string, any>>;
        slots?: Record<string, any>;
      }
    | ((...args: any[]) => {
        variants?: Record<string, Record<string, any>>;
        slots?: Record<string, any>;
      }),
> = T extends (...args: any[]) => infer R
  ? R extends {
      variants?: Record<string, Record<string, any>>;
      slots?: Record<string, any>;
    }
    ? {
        variants: {
          [K in keyof R["variants"]]: VariantPropValue<R["variants"], K>;
        };
        slots: keyof R["slots"];
      }
    : never
  : T extends {
        variants?: Record<string, Record<string, any>>;
        slots?: Record<string, any>;
      }
    ? {
        variants: {
          [K in keyof T["variants"]]: VariantPropValue<T["variants"], K>;
        };
        slots: keyof T["slots"];
      }
    : never;
