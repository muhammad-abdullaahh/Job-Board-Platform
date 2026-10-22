import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      NODE_ENV: 'test',
      PAYLOAD_SECRET: 'test_payload_secret_must_be_32_characters_long_123',
      CMS_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/cms_dev',
      JOB_BOARD_API_URL: 'https://job-board-platform-pi.vercel.app',
      CMS_SERVICE_EMAIL: 'service@jobboard.internal',
      CMS_SERVICE_PASSWORD: 'service_password_123',
      CMS_PUBLIC_URL: 'http://localhost:3000',
      CMS_READ_ONLY: 'false',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@payload-config': path.resolve(dirname, './src/payload.config.ts'),
      'server-only': path.resolve(dirname, './tests/mocks/server-only.ts'),
    },
  },
})
