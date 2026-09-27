import { defineConfig } from 'weapp-vite'
import { codeUI } from '@code-ui/plugin-vite'

export default defineConfig(
  ({ mode }) => {
    console.log('[mode]:', mode)
    return {
      weapp: {
        srcRoot: 'src',
        web: {
          pluginOptions: {
            runtime: {
              routing: {
                mode: 'history',
              },
            },
          },
        },
        generate: {
          extensions: {
            js: 'ts',
            wxss: 'scss',
          },
          dirs: {
            component: 'src/components',
            page: 'src/pages',
          },
        },
      },
      css: {
        preprocessorOptions: {
          scss: {
            silenceDeprecations: ['legacy-js-api', 'import'],
          },
        },
      },
      plugins: [
        codeUI({
          autoImport: true,
          treeShake: true,
        }),
      ],
    }
  },
)
