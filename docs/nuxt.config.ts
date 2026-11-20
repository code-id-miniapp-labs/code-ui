// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxt/content",
    "nuxt-og-image",
    "nuxt-llms",
    "@nuxtjs/i18n",
    "@nuxtjs/seo",
    "nuxt-qrcode",
    "@vercel/analytics/nuxt",
  ],

  qrcode: {
    global: true,
  },

  devServer: {
    host: "0.0.0.0.0",
  },

  devtools: {
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  fonts: {
    defaults: {
      weights: [400, 500, 600, 700, 800]
    }
  },

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1,
        },
      },
    },
    experimental: {
      sqliteConnector: "native",
    },
  },

  experimental: {
    asyncContext: true,
  },

  compatibilityDate: "2026-06-30",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  llms: {
    domain: "https://github.com/code-id-miniapp-labs/code-ui",
    title: "Code UI",
    description:
      "@code-ui — a Tailwind-styled WeChat MiniProgram component library.",
    full: {
      title: "Code UI - Full Documentation",
      description:
        "This is the full documentation for Code UI (@code-ui), a Tailwind-styled WeChat MiniProgram component library.",
    },
    sections: [
      {
        title: "Getting Started",
        contentCollection: "docs",
        contentFilters: [
          { field: "path", operator: "LIKE", value: "/getting-started%" },
        ],
      },
      {
        title: "Theme",
        contentCollection: "docs",
        contentFilters: [
          { field: "path", operator: "LIKE", value: "/theme%" },
        ],
      },
      {
        title: "Integrations",
        contentCollection: "docs",
        contentFilters: [
          { field: "path", operator: "LIKE", value: "/integrations%" },
        ],
      },
      {
        title: "Components",
        contentCollection: "docs",
        contentFilters: [
          { field: "path", operator: "LIKE", value: "/components%" },
        ],
      },
      {
        title: "Composables",
        contentCollection: "docs",
        contentFilters: [
          { field: "path", operator: "LIKE", value: "/composables%" },
        ],
      },
    ],
  },

  mcp: {
    name: "Code UI",
  },

  ogImage: {
    zeroRuntime: true,
  },

  prerender: {
    routes: ["/"],
    crawlLinks: true,
  },
});
