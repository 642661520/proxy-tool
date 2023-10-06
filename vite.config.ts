import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
// https://vitejs.dev/config/
export default ({ mode }) => {
  const config = {
    server: {
    },
    base: "./",
    plugins: [
      vue(),
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/,
          /\.vue\?vue/, // .vue
          /\.md$/, // .md
        ],
        dts: './auto-imports.d.ts',
        imports: [
          'vue',
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar'
            ]
          }
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()]
      })
    ],
    build: {
      watch: loadEnv(mode, process.cwd()).VITE_APP_MODEL === 'watch' ? { exclude: ['dist/**', 'electron/**', 'dist_electron/**'] } : null,
      emptyOutDir: loadEnv(mode, process.cwd()).VITE_APP_MODEL === 'watch' ? false : false,
    }
  }
  return defineConfig(config);
};