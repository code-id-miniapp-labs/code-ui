import { describe, expect, it, vi } from "vitest";
import type { ModuleNode, ViteDevServer } from "vite";
import { codeUI } from "../src/index";
import {
  RESOLVED_VIRTUAL_MODULE_ID,
  RESOLVED_VIRTUAL_THEME_PREFIX,
} from "../src/constants";

function createMockModule(
  id: string,
  importers: ModuleNode[] = [],
): ModuleNode {
  return {
    id,
    url: id,
    importers: new Set(importers),
    importedModules: new Set(),
    isSelfAccepting: false,
    transformResult: null,
  } as unknown as ModuleNode;
}

describe("codeUI Vite Plugin - HMR and Config Reactivity", () => {
  it("handleHotUpdate invalidates virtual modules and their importers when cui.config.ts changes", async () => {
    const appTsModule = createMockModule("/test/src/app.ts");
    const configVirtualModule = createMockModule(
      RESOLVED_VIRTUAL_MODULE_ID,
      [appTsModule],
    );
    const buttonVirtualModule = createMockModule(
      `${RESOLVED_VIRTUAL_THEME_PREFIX}button`,
    );
    const appCssModule = createMockModule("/test/src/app.css");

    const idToModuleMap = new Map<string, ModuleNode>([
      [RESOLVED_VIRTUAL_MODULE_ID, configVirtualModule],
      [`${RESOLVED_VIRTUAL_THEME_PREFIX}button`, buttonVirtualModule],
      ["/test/src/app.css", appCssModule],
      ["/test/src/app.ts", appTsModule],
    ]);

    const invalidatedModules = new Set<ModuleNode>();

    const mockServer = {
      ws: {
        send: vi.fn(),
      },
      moduleGraph: {
        idToModuleMap,
        getModuleById: (id: string) => idToModuleMap.get(id),
        invalidateModule: vi.fn((mod: ModuleNode) => {
          invalidatedModules.add(mod);
        }),
      },
      config: { root: "/test" },
    } as unknown as ViteDevServer;

    const plugin = codeUI({
      ui: {
        colors: {
          primary: "rose",
        },
      },
    });

    if (typeof plugin.configResolved === "function") {
      await (plugin.configResolved as any)({ root: "/test" });
    }

    const hmrHandler = plugin.handleHotUpdate;
    expect(typeof hmrHandler).toBe("function");

    if (typeof hmrHandler === "function") {
      // 1. Unrelated file change should return undefined
      const unrelatedResult = await (hmrHandler as any)({
        file: "/test/src/pages/index.ts",
        server: mockServer,
      });
      expect(unrelatedResult).toBeUndefined();

      // 2. cui.config.ts change should return affected modules
      const affected = await (hmrHandler as any)({
        file: "/test/cui.config.ts",
        server: mockServer,
      });

      expect(Array.isArray(affected)).toBe(true);
      expect(affected).toContain(configVirtualModule);
      expect(affected).toContain(appTsModule);
      expect(affected).toContain(buttonVirtualModule);
      expect(affected).toContain(appCssModule);

      expect(invalidatedModules.has(configVirtualModule)).toBe(true);
      expect(invalidatedModules.has(appTsModule)).toBe(true);
      expect(invalidatedModules.has(buttonVirtualModule)).toBe(true);
      expect(invalidatedModules.has(appCssModule)).toBe(true);

      // Verify full-reload signal was sent to dev server ws
      expect(mockServer.ws.send).toHaveBeenCalledWith({ type: "full-reload" });
    }
  });

  it("virtual config code updates global config reactively with ui and colors", async () => {
    const plugin = codeUI({
      ui: {
        colors: {
          primary: "emerald",
        },
      },
    });

    if (typeof plugin.configResolved === "function") {
      await (plugin.configResolved as any)({ root: "/test" });
    }

    const loadHandler = plugin.load;
    const code = (loadHandler as any)?.call({}, RESOLVED_VIRTUAL_MODULE_ID);

    expect(typeof code).toBe("string");
    expect(code).toContain('"primary": "emerald"');
    expect(code).toContain('"emerald": "#10b981"');
    expect(code).toContain("g.__CODE_UI_GLOBAL_CONFIG__ = Object.assign");
    expect(code).toContain("g.__CODE_UI_GLOBAL_CONFIG__.ui = config.ui;");
    expect(code).toContain("import.meta.hot.accept");
  });
});
