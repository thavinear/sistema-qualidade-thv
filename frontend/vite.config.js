import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  },
  plugins: [{
    name: 'copy-auth-runtime',
    closeBundle() {
      mkdirSync(resolve(__dirname, 'dist/src'), { recursive: true });
      copyFileSync(resolve(__dirname, 'src/auth.js'), resolve(__dirname, 'dist/src/auth.js'));
      copyFileSync(resolve(__dirname, 'src/auth.css'), resolve(__dirname, 'dist/src/auth.css'));
    }
  }],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        login: resolve(__dirname, 'login.html')
      }
    }
  }
});
