import type { Plugin } from "weapp-vite";
import { DEFAULT_THEME_COLORS, componentThemes } from "@code-id-labs/core";
import { serializeCompactThemeModule } from "@code-id-labs/compiler";

const VIRTUAL_THEME_PREFIX = "virtual:cui/theme/";

/**
 * Resolves `virtual:cui/theme/<component>` to an external sibling `./theme.js`
 * CJS module and emits the default compiled theme into `runtime/<component>/theme.js`.
 *
 * Keeping each component's compiled theme in a dedicated `theme.js` file allows
 * `@code-id-labs/plugin-vite` to overwrite it at build time with the user's
 * pre-merged `cui.config.ts` overrides (`ui` + `components` + custom colors)
 * without parsing or rewriting minified component JS.
 */
export function virtualThemePlugin(): Plugin {
  const usedThemes = new Set<string>();
  const cache = new Map<string, string>();
  const themesMap = componentThemes as Record<string, any>;

  return {
    name: "cui:virtual-theme",
    enforce: "pre",

    buildStart() {
      usedThemes.clear();
    },

    resolveId(id) {
      if (id.startsWith(VIRTUAL_THEME_PREFIX)) {
        const componentName = id.slice(VIRTUAL_THEME_PREFIX.length);
        if (componentName) {
          usedThemes.add(componentName);
        }
        return { id: "./theme.js", external: true };
      }
      return null;
    },

    generateBundle() {
      for (const componentName of usedThemes) {
        let code = cache.get(componentName);
        if (code === undefined) {
          const camelName = componentName.replace(/-([a-z])/g, (_, c: string) =>
            c.toUpperCase(),
          );
          const factory = themesMap[componentName] ?? themesMap[camelName];
          if (!factory) {
            throw new Error(
              `[code-ui] Unknown component theme: "${componentName}". Available themes: ${Object.keys(componentThemes).join(", ")}`,
            );
          }

          const compiled =
            typeof factory === "function"
              ? factory({
                  colors: DEFAULT_THEME_COLORS,
                  errorColor: "danger",
                  colorMode: "system",
                })
              : structuredClone(factory);

          code = serializeCompactThemeModule(
            {
              name: componentName,
              ...compiled,
            },
            { format: "cjs" },
          );
          cache.set(componentName, code);
        }

        this.emitFile({
          type: "asset",
          fileName: `runtime/${componentName}/theme.js`,
          source: code,
        });
      }
    },
  };
}
