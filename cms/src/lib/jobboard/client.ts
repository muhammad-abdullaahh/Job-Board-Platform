import 'server-only'

import type { components } from './types'

export type JobStatus = components['schemas']['JobStatus']
export type CompanyResponse = components['schemas']['CompanyResponse']
export type JobResponse = components['schemas']['JobResponse']
export type UserResponse = components['schemas']['UserResponse']
export type ApplicationResponse = components['schemas']['ApplicationResponse']
export type AdminAuditLogResponse = components['schemas']['AdminAuditLogResponse']

export type AnalyticsResponse = {
  users?: {
    total?: number
    admins?: number
    candidates?: number
    suspended?: number
  }
  companies?: {
    total?: number
    verified?: number
    pending?: number
  }
  jobs?: {
    total?: number
    active?: number
    employment_types?: Record<string, number>
  }
  applications?: {
    total?: number
    hired_or_accepted?: number
    offers_issued?: number
    status_breakdown?: Record<string, number>
  }
  total_users?: number
  admin_users?: number
  standard_users?: number
  suspended_users?: number
  total_companies?: number
  verified_companies?: number
  pending_companies?: number
  total_jobs?: number
  active_jobs?: number
  total_applications?: number
  hired_or_accepted?: number
  offers_issued?: number
  status_breakdown?: Record<string, number>
  employment_type_breakdown?: Record<string, number>
  [key: string]: unknown
}

export const ERROR_CODE_MAP: Record<string, string> = {
  ACCOUNT_LOCKED: 'This account has been locked. Action cannot be performed.',
  COMPANY_NOT_VERIFIED: 'Company is not verified.',
  COMPANY_NOT_FOUND: 'Company not found.',
  USER_NOT_FOUND: 'User not found.',
  CANNOT_MODIFY_SELF: 'Administrators cannot modify, lock, or delete their own account.',
  CANNOT_MODIFY_ADMIN: 'Administrators cannot modify, lock, or delete another administrator account.',
  LOCK_REASON_REQUIRED: 'A reason is required to lock an account.',
  USER_NOT_LOCKED: 'User must be locked or soft-deleted before they can be permanently deleted.',
}

export class JobBoardApiError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly detail: string
  public readonly correlationId: string | null

  constructor(
    status: number,
    code: string,
    detail: string,
    correlationId: string | null,
    customMessage?: string
  ) {
    const correlationSuffix = correlationId ? ` [Correlation ID: ${correlationId}]` : ''
    const msg = `${customMessage || detail || 'FastAPI backend request failed'}${correlationSuffix}`
    super(msg)
    this.name = 'JobBoardApiError'
    this.status = status
    this.code = code
    this.detail = detail
    this.correlationId = correlationId
  }
}

export class ReadOnlyModeError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'CMS is currently running in READ-ONLY mode (CMS_READ_ONLY=true). All mutations are blocked on the server.'
    )
    this.name = 'ReadOnlyModeError'
  }
}

/**
 * Decodes standard JWT payload to read token `exp` timestamp in epoch seconds.
 */
function decodeJwtExp(token: string): number {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return 0
    const rawPayload = Buffer.from(parts[1], 'base64url').toString('utf8')
    const parsed = JSON.parse(rawPayload)
    return typeof parsed.exp === 'number' ? parsed.exp : 0
  } catch {
    return 0
  }
}

interface TokenCache {
  token: string
  exp: number
}

// Module-level in-memory token cache (never written to disk, DB, logs, or cookies)
let cachedToken: TokenCache | null = null
let loginPromise: Promise<string> | null = null

export function _resetTokenCacheForTesting(): void {
  cachedToken = null
  loginPromise = null
}

export function _getCachedTokenForTesting(): TokenCache | null {
  return cachedToken
}

/**
 * Single-flight service account login. Reuses valid tokens until 60 seconds before expiry.
 */
async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  if (!forceRefresh && cachedToken && now < cachedToken.exp - 60) {
    return cachedToken.token
  }

  if (loginPromise) {
    return loginPromise
  }

  loginPromise = (async () => {
    try {
      const baseUrl = (process.env.JOB_BOARD_API_URL || 'https://job-board-platform-pi.vercel.app').replace(/\/$/, '')
      const email = process.env.CMS_SERVICE_EMAIL
      const password = process.env.CMS_SERVICE_PASSWORD

      if (!email || !password) {
        throw new Error('CMS_SERVICE_EMAIL and CMS_SERVICE_PASSWORD must be configured')
      }

      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        const correlationId = res.headers.get('x-correlation-id') || errorBody.correlation_id || null
        const detail = errorBody.detail || res.statusText || 'Authentication failed'
        throw new JobBoardApiError(
          res.status,
          errorBody.code || 'LOGIN_FAILED',
          detail,
          correlationId,
          `Service account login to FastAPI failed: ${detail}`
        )
      }

      const data = await res.json()
      const token = data.access_token as string
      const exp = decodeJwtExp(token)
      cachedToken = { token, exp }
      return token
    } finally {
      loginPromise = null
    }
  })()

  return loginPromise
}

/**
 * Base execution engine for calling FastAPI backend.
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options?: {
    params?: Record<string, string | number | boolean | undefined | null>
    body?: unknown
    actorEmail?: string
  }
): Promise<T> {
  // READ-ONLY SAFETY SWITCH:
  // Refuses any mutating call (POST, PATCH, DELETE) at the server boundary before any HTTP traffic leaves.
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'
  if (isReadOnly && method !== 'GET') {
    throw new ReadOnlyModeError(
      `Read-only mode active: mutating ${method} request to ${path} was blocked before leaving the server.`
    )
  }

  const baseUrl = (process.env.JOB_BOARD_API_URL || 'https://job-board-platform-pi.vercel.app').replace(/\/$/, '')
  let url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

  if (options?.params) {
    const searchParams = new URLSearchParams()
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val))
      }
    }
    const qs = searchParams.toString()
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs
    }
  }

  const send = async (token: string): Promise<Response> => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    if (options?.body) {
      headers['Content-Type'] = 'application/json'
    }

    // Every mutating call sends X-CMS-Actor with staff email
    if (method !== 'GET' && options?.actorEmail) {
      headers['X-CMS-Actor'] = options.actorEmail
    }

    return fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
  }

  let token = await getAccessToken()
  let response = await send(token)

  // On a 401 from FastAPI, log in again once and retry original request once
  if (response.status === 401) {
    cachedToken = null
    token = await getAccessToken(true)
    response = await send(token)
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const correlationId = response.headers.get('x-correlation-id') || errorBody.correlation_id || null
    const code = errorBody.code || 'API_ERROR'
    const detail = errorBody.detail || response.statusText || 'FastAPI call failed'
    const mapped = ERROR_CODE_MAP[code] || detail

    throw new JobBoardApiError(response.status, code, detail, correlationId, mapped)
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}

export const jobBoardClient = {
  analytics: {
    async get(): Promise<AnalyticsResponse> {
      return request<AnalyticsResponse>('GET', '/api/v1/admin/analytics')
    },
  },

  companies: {
    async list(params?: {
      is_verified?: boolean
      q?: string
      skip?: number
      limit?: number
      sort?: string
    }): Promise<CompanyResponse[]> {
      return request<CompanyResponse[]>('GET', '/api/v1/admin/companies', { params })
    },

    async get(companyId: number): Promise<CompanyResponse> {
      return request<CompanyResponse>('GET', `/api/v1/admin/companies/${companyId}`)
    },

    async verify(companyId: number, actorEmail: string): Promise<CompanyResponse> {
      return request<CompanyResponse>('POST', `/api/v1/admin/companies/${companyId}/verify`, {
        actorEmail,
      })
    },

    async unverify(companyId: number, actorEmail: string): Promise<CompanyResponse> {
      return request<CompanyResponse>('POST', `/api/v1/admin/companies/${companyId}/unverify`, {
        actorEmail,
      })
    },

    async delete(companyId: number, actorEmail: string): Promise<{ message: string }> {
      return request<{ message: string }>('DELETE', `/api/v1/admin/companies/${companyId}`, {
        actorEmail,
      })
    },
  },

  jobs: {
    async list(params?: {
      status?: JobStatus
      company_id?: number
      q?: string
      skip?: number
      limit?: number
      sort?: string
    }): Promise<JobResponse[]> {
      return request<JobResponse[]>('GET', '/api/v1/admin/jobs', { params })
    },

    async updateStatus(jobId: number, status: JobStatus, actorEmail: string): Promise<JobResponse> {
      return request<JobResponse>('PATCH', `/api/v1/admin/jobs/${jobId}/status`, {
        body: { status },
        actorEmail,
      })
    },

    async delete(jobId: number, actorEmail: string): Promise<{ message: string }> {
      return request<{ message: string }>('DELETE', `/api/v1/admin/jobs/${jobId}`, {
        actorEmail,
      })
    },
  },

  users: {
    async list(params?: {
      is_active?: boolean
      is_admin?: boolean
      q?: string
      skip?: number
      limit?: number
      sort?: string
    }): Promise<UserResponse[]> {
      return request<UserResponse[]>('GET', '/api/v1/admin/users', { params })
    },

    async get(userId: number): Promise<UserResponse> {
      return request<UserResponse>('GET', `/api/v1/admin/users/${userId}`)
    },

    async lock(userId: number, reason: string, actorEmail: string): Promise<UserResponse> {
      return request<UserResponse>('POST', `/api/v1/admin/users/${userId}/lock`, {
        body: { reason },
        actorEmail,
      })
    },

    async unlock(userId: number, actorEmail: string): Promise<UserResponse> {
      return request<UserResponse>('POST', `/api/v1/admin/users/${userId}/unlock`, {
        actorEmail,
      })
    },

    async delete(userId: number, hard: boolean, actorEmail: string): Promise<{ message: string }> {
      return request<{ message: string }>('DELETE', `/api/v1/admin/users/${userId}`, {
        params: { hard },
        actorEmail,
      })
    },
  },

  applications: {
    async list(params?: {
      status?: string
      job_id?: number
      user_id?: number
      company_id?: number
      from_date?: string
      to_date?: string
      skip?: number
      limit?: number
      sort?: string
    }): Promise<ApplicationResponse[]> {
      return request<ApplicationResponse[]>('GET', '/api/v1/admin/applications', { params })
    },
  },

  auditLogs: {
    async list(params?: {
      action?: string
      target_type?: string
      target_id?: number
      from_date?: string
      to_date?: string
      skip?: number
      limit?: number
    }): Promise<AdminAuditLogResponse[]> {
      return request<AdminAuditLogResponse[]>('GET', '/api/v1/admin/audit-logs', { params })
    },
  },
}
