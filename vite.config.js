import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vault: resolve(__dirname, 'vault.html'),
        analytics: resolve(__dirname, 'analytics.html'),
        products: resolve(__dirname, 'products.html'),
      }
    }
  }
})
