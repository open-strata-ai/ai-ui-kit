import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Library build: dual ESM/CJS, react/react-dom/antd kept external so consumers
// never end up with duplicate antd instances or theme conflicts (DESIGN §4.3).
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OpenStrataUiKit',
      formats: ['es', 'cjs'],
      fileName: (format) => `ai-ui-kit.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'antd', 'axios', 'mermaid'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          antd: 'antd',
          axios: 'axios',
        },
      },
    },
  },
});
