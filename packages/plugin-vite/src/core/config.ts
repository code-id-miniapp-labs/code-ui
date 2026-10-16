import { loadConfig } from "c12";
import { componentThemes, type CodeUIConfig } from "@code-ui/core";
import type {
  AutoImportOptions,
  CodeUIVitePluginOptions,
  ResolvedAutoImportOptions,
  ResolvedTreeShakeOptions,
  TreeShakeOptions,
} from "../types";
import {
  compileComponentTheme,
  extractClassesFromThemeConfig,
  generateThemeCSS,
  isPlainObject,
  mergeComponentConfig,
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
      { ui: options.ui, components: options.components },
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
      });

      if (configFile) {
        this.configPath = configFile;
      }
    } catch (err) {
      console.warn("[code-ui] Failed to load cui.config.ts:", err);
      this.resolvedConfig = mergeConfig(
        { prefix: "cui" },
        { ui: this.options.ui, components: this.options.components },
      );
    } finally {
      this.invalidateCache();
    }
  }

  public getVirtualConfigCode(): string {
    if (this.cachedVirtualConfigCode !== null) {
      return this.cachedVirtualConfigCode;
    }
    const code = `
const config = ${serializeConfig(this.resolvedConfig)};
const g = typeof globalThis !== "undefined"
  ? globalThis
  : typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : {};

g.__CODE_UI_GLOBAL_CONFIG__ = Object.assign(g.__CODE_UI_GLOBAL_CONFIG__ || {}, config);

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

    const factory = (componentThemes as Record<string, any>)[componentName];
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

  public getThemeCSS(): string {
    if (this.cachedThemeCSS !== null) {
      return this.cachedThemeCSS;
    }
    const css = generateThemeCSS(this.resolvedConfig.ui);
    this.cachedThemeCSS = css;
    return css;
  }
}
