import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Staff } from './collections/Staff'
import { getEnv } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Run environment validation on startup (fail loudly naming missing variables)
// Allow generate scripts (like generate:types) to run during initial scaffolding if env is not yet written
const isGenerateScript = process.argv.some((arg) => arg.includes('generate:'))
const env = !isGenerateScript ? getEnv() : undefined

const publicUrl = env?.CMS_PUBLIC_URL || process.env.CMS_PUBLIC_URL
const allowedOrigins = publicUrl ? [publicUrl] : []

export default buildConfig({
  admin: {
    user: Staff.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeNavLinks: ['/components/NavLinks#NavLinks'],
      actions: ['/components/ReadOnlyBanner#ReadOnlyAction'],
      views: {
        dashboard: {
          Component: '/views/Dashboard#DashboardView',
        },
        companies: {
          Component: '/views/Companies#CompaniesView',
          path: '/companies',
        },
        jobs: {
          Component: '/views/Jobs#JobsView',
          path: '/jobs',
        },
        applications: {
          Component: '/views/Applications#ApplicationsView',
          path: '/applications',
        },
        users: {
          Component: '/views/Users#UsersView',
          path: '/users',
        },
        auditLogs: {
          Component: '/views/AuditLogs#AuditLogsView',
          path: '/audit-logs',
        },
      },
    },
  },
  collections: [Staff],
  editor: lexicalEditor(),
  secret: env?.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET || 'temp_secret_placeholder_min_32_chars_long',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Payload uses its OWN Postgres database (CMS_DATABASE_URL) for staff accounts only
  // Never connects to job board DB and never reads a variable named DATABASE_URL
  db: postgresAdapter({
    pool: {
      connectionString: env?.CMS_DATABASE_URL || process.env.CMS_DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false, // Migrations only, no schema push
  }),
  cors: allowedOrigins,
  csrf: allowedOrigins,
})
