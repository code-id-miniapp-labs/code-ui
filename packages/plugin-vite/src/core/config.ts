import { loadConfig } from "c12";
import {
  componentThemes,
  ICON_COLLECTION_PRESETS,
  getActiveCollections,
  type CodeUIConfig,
} from "@code-ui/core";
import type {
  AppWrapperOptions,
  AutoImportOptions,
  CodeUIVitePluginOptions,
  IconsPluginOptions,
  ResolvedAppWrapperOptions,
  ResolvedAutoImportOptions,
  ResolvedTreeShakeOptions,
  TreeShakeOptions,
} from "../types";
import {
  compileComponentTheme,
  DEFAULT_COLORS,
  extractClassesFromThemeConfig,
  generateThemeCSS,
  isPlainObject,
  mergeComponentConfig,
  TAILWIND_500_FALLBACKS,
} from "./theme";
import { serializeConfig } from "./serialize";

export function mergeConfig(
  base: CodeUIConfig,
  overrides?: Partial<CodeUIConfig>,
): CodeUIConfig {
  if (!overrides) return base;

  const merged: CodeUIConfig = { ...base };

  // Avoid overwriting base properties with explicit `undefined` from options
  for (const [key, val] of Object.entries(overrides)) {
    if (val !== undefined && key !== "ui" && key !== "components") {
      (merged as Record<string, any>)[key] = val;
    }
  }

  if (base.ui || overrides.ui) {
    merged.ui = {
      ...base.ui,
      ...overrides.ui,
    };
    if (base.ui?.colors || overrides.ui?.colors) {
      merged.ui.colors = {
        ...base.ui?.colors,
        ...overrides.ui?.colors,
      };
    }
  }

  if (base.icons || overrides.icons) {
    merged.icons = {
      ...base.icons,
      ...overrides.icons,
    };
  }

  if (base.components || overrides.components) {
    const mergedComponents: NonNullable<CodeUIConfig["components"]> = {
      ...base.components,
    };

    if (isPlainObject(overrides.components)) {
      for (const [compName, compOverride] of Object.entries(
        overrides.components,
      )) {
        if (!compOverride) continue;
        mergedComponents[compName] = mergeComponentConfig(
          mergedComponents[compName],
          compOverride,
        );
      }
    }

    merged.components = mergedComponents;
  }

  return merged;
}

export function resolveAutoImportOptions(
  autoImport?: boolean | AutoImportOptions,
): ResolvedAutoImportOptions {
  const raw: AutoImportOptions =
    typeof autoImport === "boolean"
      ? { enable: autoImport }
      : autoImport || { enable: false };

  const enable = Boolean(raw.enable);
  const prefix = raw.prefix || "c";
  const library = raw.library || "@code-ui/components";
  const compDir =
    raw.componentDir !== undefined
      ? raw.componentDir
      : library === "@code-ui/components"
        ? "runtime"
        : "";
  const dirPrefix = compDir ? `${compDir}/` : "";
  const suffix =
    raw.componentSuffix !== undefined ? raw.componentSuffix : "/index";

  return {
    enable,
    prefix,
    library,
    dirPrefix,
    suffix,
    tagRegex: new RegExp(`<(${prefix}-[a-zA-Z0-9-]+)[\\s>\\/]`, "g"),
    prefixRegex: new RegExp(`^${prefix}-`),
  };
}

export function resolveTreeShakeOptions(
  treeShake?: boolean | TreeShakeOptions,
): ResolvedTreeShakeOptions {
  const raw: TreeShakeOptions =
    typeof treeShake === "boolean"
      ? { enable: treeShake }
      : treeShake || { enable: false };

  return {
    enable: Boolean(raw.enable),
    library: raw.library || "@code-ui/components",
  };
}

export function resolveAppWrapperOptions(
  appWrapper?: boolean | AppWrapperOptions,
  prefix: string = "c",
): ResolvedAppWrapperOptions {
  const raw: AppWrapperOptions =
    typeof appWrapper === "boolean"
      ? { enable: appWrapper }
      : appWrapper || { enable: true };

  const enable = raw.enable !== false;
  const tag = raw.tag || `${prefix}-app`;
  const pageMeta = raw.pageMeta === true;
  const defaultProps = raw.defaultProps;
  const exclude = raw.exclude || [];
  const include = raw.include;

  return {
    enable,
    tag,
    pageMeta,
    defaultProps,
    exclude,
    include,
  };
}

export class PluginConfigManager {
  public resolvedConfig: CodeUIConfig;
  public configPath: string | null = null;

  private readonly options: CodeUIVitePluginOptions;

  // Memoized artifacts for the current config snapshot
  private cachedVirtualConfigCode: string | null = null;
  private cachedVirtualAllThemesCode: string | null = null;
  private cachedInlineThemeSource: string | null = null;
  private cachedThemeCSS: string | null = null;
  private readonly cachedComponentThemes = new Map<string, any>();
  private readonly cachedVirtualComponentCodes = new Map<string, string>();

  constructor(options: CodeUIVitePluginOptions) {
    this.options = options;
    this.resolvedConfig = mergeConfig(
      { prefix: "cui" },
      {
        ui: options.ui,
        components: options.components,
        icons: isPlainObject(options.icons)
          ? (options.icons as any)
          : undefined,
      },
    );
  }

  public invalidateCache(): void {
    this.cachedVirtualConfigCode = null;
    this.cachedVirtualAllThemesCode = null;
    this.cachedInlineThemeSource = null;
    this.cachedThemeCSS = null;
    this.cachedComponentThemes.clear();
    this.cachedVirtualComponentCodes.clear();
  }

  public async reload(root: string): Promise<void> {
    try {
      const { config, configFile } = await loadConfig<CodeUIConfig>({
        name: "cui",
        configFile: this.options.configFile || "cui.config",
        cwd: this.options.cwd || root,
        rcFile: false,
      });

      this.resolvedConfig = mergeConfig(config || { prefix: "cui" }, {
        ui: this.options.ui,
        components: this.options.components,
        icons: isPlainObject(this.options.icons)
          ? (this.options.icons as any)
          : undefined,
      });

      if (configFile) {
        this.configPath = configFile;
      }
    } catch (err) {
      console.warn("[code-ui] Failed to load cui.config.ts:", err);
      this.resolvedConfig = mergeConfig(
        { prefix: "cui" },
        {
          ui: this.options.ui,
          components: this.options.components,
          icons: isPlainObject(this.options.icons)
            ? (this.options.icons as any)
            : undefined,
        },
      );
    } finally {
      this.invalidateCache();
    }
  }

  public getVirtualConfigCode(): string {
    if (this.cachedVirtualConfigCode !== null) {
      return this.cachedVirtualConfigCode;
    }
    const effectiveColors: Record<string, any> = {
      ...DEFAULT_COLORS,
      ...this.resolvedConfig.ui?.colors,
    };
    const resolvedPalettes: Record<string, string> = {};
    for (const val of Object.values(effectiveColors)) {
      if (typeof val === "string") {
        const lower = val.trim().toLowerCase();
        const fallback = TAILWIND_500_FALLBACKS[lower];
        if (fallback) {
          resolvedPalettes[lower] = fallback;
        }
      }
    }
    const finalUiColors = {
      ...resolvedPalettes,
      ...effectiveColors,
    };
    const finalConfig = {
      ...this.resolvedConfig,
      ui: {
        ...this.resolvedConfig.ui,
        colors: finalUiColors,
      },
    };
    const code = `
const config = ${serializeConfig(finalConfig)};
const g = typeof globalThis !== "undefined"
  ? globalThis
  : typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : {};

g.__CODE_UI_GLOBAL_CONFIG__ = Object.assign(g.__CODE_UI_GLOBAL_CONFIG__ || {}, config);
if (config && config.ui) {
  g.__CODE_UI_GLOBAL_CONFIG__.ui = config.ui;
}

export default config;

if (import.meta.hot) {
  import.meta.hot.accept();
}
`;
    this.cachedVirtualConfigCode = code;
    return code;
  }

  public getCompiledComponentTheme(componentName: string): any {
    const cached = this.cachedComponentThemes.get(componentName);
    if (cached !== undefined) {
      return cached;
    }

    const camelName = componentName.replace(/-([a-z])/g, (_, c: string) =>
      c.toUpperCase(),
    );
    const themesMap = componentThemes as Record<string, any>;
    const factory = themesMap[componentName] ?? themesMap[camelName];
    if (!factory) {
      throw new Error(
        `[code-ui] Unknown component theme: "${componentName}". Available themes: ${Object.keys(componentThemes).join(", ")}`,
      );
    }

    const compiled = compileComponentTheme(
      componentName,
      factory,
      this.resolvedConfig,
    );
    this.cachedComponentThemes.set(componentName, compiled);
    return compiled;
  }

  public getVirtualComponentThemeCode(componentName: string): string {
    const cached = this.cachedVirtualComponentCodes.get(componentName);
    if (cached !== undefined) {
      return cached;
    }

    const themeConfig = this.getCompiledComponentTheme(componentName);
    const code = `export default ${serializeConfig(themeConfig)};`;
    this.cachedVirtualComponentCodes.set(componentName, code);
    return code;
  }

  public getVirtualAllThemesCode(): string {
    if (this.cachedVirtualAllThemesCode !== null) {
      return this.cachedVirtualAllThemesCode;
    }

    const allThemes: Record<string, any> = {};
    for (const name of Object.keys(componentThemes)) {
      allThemes[name] = this.getCompiledComponentTheme(name);
    }
    const code = `export default ${serializeConfig(allThemes)};`;
    this.cachedVirtualAllThemesCode = code;
    return code;
  }

  public getInlineThemeClassesDirective(): string {
    if (this.cachedInlineThemeSource !== null) {
      return this.cachedInlineThemeSource;
    }

    const allThemeClasses = new Set<string>();
    for (const name of Object.keys(componentThemes)) {
      const themeConfig = this.getCompiledComponentTheme(name);
      for (const c of extractClassesFromThemeConfig(themeConfig)) {
        allThemeClasses.add(c);
      }
    }

    const iconsConfig = this.resolvedConfig.icons;
    const prefix =
      typeof iconsConfig?.prefix === "string" ? iconsConfig.prefix : "i";
    const collections = getActiveCollections(iconsConfig);

    for (const col of collections) {
      if (col in ICON_COLLECTION_PRESETS) {
        const preset =
          ICON_COLLECTION_PRESETS[col as keyof typeof ICON_COLLECTION_PRESETS];
        allThemeClasses.add(`${prefix}-${col}-${preset.check}`);
        allThemeClasses.add(`${prefix}-${col}-${preset.minus}`);
        allThemeClasses.add(`${prefix}-${col}-${preset.close}`);
        allThemeClasses.add(`${prefix}-${col}-${preset.loading}`);
      } else {
        allThemeClasses.add(`${prefix}-${col}-check`);
        allThemeClasses.add(`${prefix}-${col}-minus`);
        allThemeClasses.add(`${prefix}-${col}-close`);
        allThemeClasses.add(`${prefix}-${col}-loading`);
      }
    }

    if (iconsConfig) {
      for (const [key, val] of Object.entries(iconsConfig)) {
        if (
          key === "collection" ||
          key === "collections" ||
          key === "prefix" ||
          !val
        )
          continue;
        if (
          typeof val === "string" &&
          !val.startsWith("data:") &&
          !val.includes("/")
        ) {
          allThemeClasses.add(val);
        }
      }
    }

    if (allThemeClasses.size === 0) {
      this.cachedInlineThemeSource = "";
      return "";
    }

    const inlineClasses = Array.from(allThemeClasses)
      .join(" ")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    const directive = `\n@source inline("${inlineClasses}");\n`;
    this.cachedInlineThemeSource = directive;
    return directive;
  }

  public getIconsPluginOptions(): IconsPluginOptions | null {
    const raw = this.options.icons;
    if (raw === false) return null;
    if (raw === true) return { autoPlugin: true };
    if (isPlainObject(raw)) {
      return raw as IconsPluginOptions;
    }
    return { autoPlugin: "auto" };
  }

  public getThemeCSS(): string {
    if (this.cachedThemeCSS !== null) {
      return this.cachedThemeCSS;
    }
    const css = generateThemeCSS(this.resolvedConfig.ui);
    this.cachedThemeCSS = css;
    return css;
  }
}
