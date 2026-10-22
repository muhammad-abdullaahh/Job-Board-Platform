import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateApiTypes() {
  const baseUrl = process.env.JOB_BOARD_API_URL || 'https://job-board-platform-pi.vercel.app'
  const openApiUrl = `${baseUrl.replace(/\/$/, '')}/openapi.json`

  console.log(`📡 Fetching OpenAPI schema from: ${openApiUrl}`)

  const ast = await openapiTS(new URL(openApiUrl))
  const contents = astToString(ast)

  const outputDir = path.resolve(__dirname, '../src/lib/jobboard')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, 'types.ts')
  fs.writeFileSync(outputPath, contents, 'utf-8')

  console.log(`✅ Generated API types into: ${outputPath}`)
}

generateApiTypes().catch((err) => {
  console.error('❌ Failed to generate API types:', err)
  process.exit(1)
})
