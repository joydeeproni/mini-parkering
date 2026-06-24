// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/mini-parkering/',
  build: { outDir: 'dist' }
})
