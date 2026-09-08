import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { randomUUID } from 'node:crypto'

const version = randomUUID()
// Production aliases follow new deployments; individual deployment URLs do not.
const productionOrigin = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __UPDATE_ORIGIN__: JSON.stringify(productionOrigin),
  },
  plugins: [vue(), {
    name: 'app-version',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version }) })
    },
  }],
})
