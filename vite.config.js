import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fastFirstPaint, responsiveImages } from './scripts/vite-plugins.mjs'

const images = responsiveImages()

export default defineConfig({
  plugins: [react(), tailwindcss(), images, fastFirstPaint({ images })],
  build: {
    // Les polices restent des fichiers servis par le site (jamais en data: URI),
    // pour respecter la politique de sécurité « font-src 'self' » de vercel.json
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/i.test(file) ? false : undefined),
  },
})
