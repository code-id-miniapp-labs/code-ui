import fs from "node:fs";
import path from "node:path";

function getCodeUiDepRange(): string {
  try {
    const pkgPath = new URL("../package.json", import.meta.url);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      version?: string;
    };
    if (pkg.version) return `^${pkg.version}`;
  } catch {}
  return "^1.0.0";
}

export interface StarterTemplateOptions {
  projectName: string;
  appId: string;
  primaryColor: string;
  iconCollection: string;
  prefix: string;
  pm?: "pnpm" | "npm" | "yarn";
}

export function generateStarterFiles(
  options: StarterTemplateOptions,
): Record<string, string> {
  const {
    projectName,
    appId,
    primaryColor,
    iconCollection,
    prefix,
    pm = "pnpm",
  } = options;
  const codeUiRange = getCodeUiDepRange();

  return {
    ".gitignore": [
      "node_modules",
      "dist",
      ".weapp-vite",
      ".DS_Store",
      "*.log",
      "",
    ].join("\n"),

    ...(pm === "pnpm"
      ? {
          "pnpm-workspace.yaml": [
            "allowBuilds:",
            '  "@parcel/watcher": false',
            '  "@swc/core": false',
            '  "@tailwindcss/oxide": false',
            "  core-js: false",
            "  core-js-pure: false",
            "  esbuild: true",
            "  unrs-resolver: false",
            "",
            "onlyBuiltDependencies:",
            "  - esbuild",
            "",
            "ignoredBuiltDependencies:",
            '  - "@parcel/watcher"',
            '  - "@swc/core"',
            '  - "@tailwindcss/oxide"',
            "  - core-js",
            "  - core-js-pure",
            "  - unrs-resolver",
            "",
          ].join("\n"),
        }
      : {}),

    "package.json": JSON.stringify(
      {
        name: projectName,
        type: "module",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "wv dev",
          "dev:open": "wv dev -o",
          build: "wv build",
          clean: "rm -rf dist",
          open: "wv open",
          postinstall: "wv prepare",
        },
        dependencies: {
          "@code-id-labs/components": codeUiRange,
          "@code-id-labs/plugin-vite": codeUiRange,
        },
        devDependencies: {
          ...(iconCollection !== "lucide"
            ? { [`@iconify-json/${iconCollection}`]: "^1.2.0" }
            : {}),
          "@types/node": "^22.0.0",
          "miniprogram-api-typings": "^5.2.3",
          tailwindcss: "^4.3.3",
          typescript: "^5.8.0",
          "weapp-vite": "^7.5.0",
        },
      },
      null,
      2,
    ) + "\n",

    "tsconfig.json": JSON.stringify(
      {
        references: [
          { path: "./.weapp-vite/tsconfig.app.json" },
          { path: "./.weapp-vite/tsconfig.server.json" },
          { path: "./.weapp-vite/tsconfig.node.json" },
          { path: "./.weapp-vite/tsconfig.shared.json" },
        ],
        files: [],
      },
      null,
      2,
    ) + "\n",

    "project.config.json": JSON.stringify(
      {
        description: "WeChat MiniProgram project powered by weapp-vite & Code UI",
        miniprogramRoot: "dist/",
        srcMiniprogramRoot: "dist/",
        compileType: "miniprogram",
        setting: {
          coverView: false,
          postcss: false,
          minified: false,
          enhance: false,
          showShadowRootInWxmlPanel: false,
          packNpmRelationList: [],
          ignoreUploadUnusedFiles: true,
          compileHotReLoad: false,
          skylineRenderEnable: false,
          packNpmManually: false,
          es6: true,
          minifyWXML: true,
          newFeature: true,
          urlCheck: false,
          nodeModules: true,
          autoAudits: false,
          uploadWithSourceMap: true,
          uglifyFileName: true,
          remoteDebugLogEnable: true,
          prefetch: false,
        },
        simulatorType: "wechat",
        simulatorPluginLibVersion: {},
        editorSetting: {
          tabIndent: "insertSpaces",
          tabSize: 2,
        },
        libVersion: "3.13.2",
        packOptions: {
          ignore: [],
          include: [],
        },
        appid: appId,
        projectname: projectName,
        condition: {},
      },
      null,
      2,
    ) + "\n",

    "weapp-vite.config.ts": `import { defineConfig } from "weapp-vite";
import { codeUI } from "@code-id-labs/plugin-vite";

export default defineConfig(({ mode }) => ({
  weapp: {
    srcRoot: "src",
    platform: "weapp",
    tailwindcss: {
      cssEntries: ["src/app.css"],
      cssOptions: {
        rem2rpx: true,
        autoprefixer: true,
      },
    },
    hmr: {
      runtime: "classic",
    },
    generate: {
      extensions: {
        js: "ts",
      },
      dirs: {
        component: "src/components",
        page: "src/pages",
      },
    },
  },
  plugins: [
    codeUI({
      autoImport: true,
      treeShake: mode === "production",
    }),
  ],
  build: {
    minify: mode === "production",
    cssMinify: mode === "production" ? "lightningcss" : false,
  },
}));
`,

    "cui.config.ts": `import { defineConfig } from "@code-id-labs/plugin-vite";

export default defineConfig({
  prefix: "${prefix}",
  ui: {
    colors: {
      primary: "${primaryColor}",
      secondary: "stone",
      neutral: "zinc",
      danger: "red",
      success: "green",
      warning: "amber",
      info: "blue",
    },
    colorMode: "system",
  },
  icons: {
    collections: ["${iconCollection}"],
  },
  components: {},
});
`,

    "src/app.css": `@import "tailwindcss";
@import "@code-id-labs/components";

* {
  box-sizing: border-box;
}
`,

    "src/app.ts": `App({
  globalData: {},
  onLaunch() {},
});
`,

    "src/app.json": JSON.stringify(
      {
        $schema: "https://vite.weapp.dev/app.json",
        pages: ["pages/index/index"],
        window: {
          navigationBarTitleText: "Code UI",
          navigationBarBackgroundColor: "@navBgColor",
          navigationBarTextStyle: "@navTxtStyle",
          backgroundColor: "@bgColor",
        },
        style: "v2",
        componentFramework: "glass-easel",
        sitemapLocation: "sitemap.json",
        darkmode: true,
        themeLocation: "theme.json",
      },
      null,
      2,
    ) + "\n",

    "src/theme.json": JSON.stringify(
      {
        light: {
          navBgColor: "#ffffff",
          navTxtStyle: "black",
          bgColor: "#fafafa",
        },
        dark: {
          navBgColor: "#18181b",
          navTxtStyle: "white",
          bgColor: "#09090b",
        },
      },
      null,
      2,
    ) + "\n",

    "src/sitemap.json": JSON.stringify(
      {
        desc: "WeChat MiniProgram Sitemap",
        rules: [{ action: "allow", page: "*" }],
      },
      null,
      2,
    ) + "\n",

    "src/pages/index/index.json": JSON.stringify(
      {
        $schema: "https://vite.weapp.dev/page.json",
        navigationBarTitleText: "Code UI Starter",
      },
      null,
      2,
    ) + "\n",

    "src/pages/index/index.ts": `Page({
  data: {
    count: 0,
  },
  handleIncrement() {
    this.setData({
      count: this.data.count + 1,
    });
  },
});
`,

    "src/pages/index/index.wxml": `<view class="min-h-screen bg-muted p-4 flex flex-col justify-center">
  <${prefix}-card
    title="Welcome to Code UI"
    description="Headless + Tailwind-styled WeChat MiniProgram components."
  >
    <view class="flex items-center justify-between py-2">
      <text class="text-sm text-default">Interactive counter</text>
      <${prefix}-badge label="Count: {{count}}" color="primary" variant="soft" />
    </view>

    <view slot="footer" class="flex justify-end gap-2">
      <${prefix}-button
        label="Increment"
        color="primary"
        leading-icon="i-${iconCollection}-plus"
        bind:tap="handleIncrement"
      />
    </view>
  </${prefix}-card>
</view>
`,
  };
}

export function writeStarterProject(
  targetDir: string,
  options: StarterTemplateOptions,
): void {
  const files = generateStarterFiles(options);
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.resolve(targetDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }
}
