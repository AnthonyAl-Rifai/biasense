import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        // Copy manifest and icons
        const files = [
          'manifest.json',
          'icon16.png',
          'icon48.png',
          'icon128.png'
        ]
        files.forEach(file => {
          copyFileSync(
            resolve(__dirname, `public/${file}`),
            resolve(__dirname, `dist/${file}`)
          )
        })
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        contentScript: resolve(__dirname, 'src/content/contentScript.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep the original names for extension files
          if (['background', 'contentScript'].includes(chunkInfo.name)) {
            return '[name].js'
          }
          return '[name]/[name].js'
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          // Move content styles to root
          if (name.includes('contentScript') && name.endsWith('.css')) {
            return 'content.css'
          }
          // Keep popup styles in popup directory
          if (name.endsWith('.css')) {
            return '[name]/[name].css'
          }
          return '[name].[ext]'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: './'
})
