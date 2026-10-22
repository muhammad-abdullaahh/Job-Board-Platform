import { z } from 'zod'

const envSchema = z.object({
  PAYLOAD_SECRET: z
    .string({ required_error: 'PAYLOAD_SECRET is required' })
    .min(32, 'PAYLOAD_SECRET must be at least 32 characters long'),
  CMS_DATABASE_URL: z
    .string({ required_error: 'CMS_DATABASE_URL is required' })
    .min(1, 'CMS_DATABASE_URL cannot be empty'),
  JOB_BOARD_API_URL: z
    .string({ required_error: 'JOB_BOARD_API_URL is required' })
    .url('JOB_BOARD_API_URL must be a valid URL')
    .default('https://job-board-platform-pi.vercel.app'),
  CMS_SERVICE_EMAIL: z
    .string({ required_error: 'CMS_SERVICE_EMAIL is required' })
    .email('CMS_SERVICE_EMAIL must be a valid email address'),
  CMS_SERVICE_PASSWORD: z
    .string({ required_error: 'CMS_SERVICE_PASSWORD is required' })
    .min(1, 'CMS_SERVICE_PASSWORD cannot be empty'),
  CMS_PUBLIC_URL: z
    .string({ required_error: 'CMS_PUBLIC_URL is required' })
    .url('CMS_PUBLIC_URL must be a valid URL (e.g. http://localhost:3000)'),
  CMS_READ_ONLY: z
    .enum(['true', 'false'], {
      invalid_type_error: 'CMS_READ_ONLY must be either "true" or "false"',
    })
    .default('true'),
})

export type EnvConfig = z.infer<typeof envSchema>

let validatedEnv: EnvConfig | null = null

/**
 * Validates all required CMS environment variables at startup.
 * Fails loudly naming each missing or invalid variable.
 * Note: Never reads or references DATABASE_URL.
 */
export function getEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv
  }

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  • [${issue.path.join('.')}] - ${issue.message}`)
      .join('\n')

    const message = [
      '================================================================================',
      '🚨 [CMS CRITICAL CONFIGURATION ERROR] Environment validation failed at startup:',
      '================================================================================',
      errorDetails,
      '================================================================================',
      'Please ensure all required variables are set in your .env file or environment.',
      'Refer to .env.example for guidance.',
      '================================================================================',
    ].join('\n')

    console.error(message)
    throw new Error(message)
  }

  validatedEnv = result.data
  return validatedEnv
}
