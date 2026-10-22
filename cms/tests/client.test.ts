import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  jobBoardClient,
  _resetTokenCacheForTesting,
  _getCachedTokenForTesting,
  JobBoardApiError,
  ReadOnlyModeError,
} from '../src/lib/jobboard/client'
import {
  verifyCompanyAction,
  deleteCompanyAction,
  deleteUserAction,
} from '../src/actions/adminActions'

// Top-level mocks for Payload and Next.js headers
const mockAuth = vi.fn()

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return {
    ...actual,
    getPayload: vi.fn().mockImplementation(async () => ({
      auth: mockAuth,
    })),
  }
})

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

// Helper to create a mock JWT with specific exp
function createMockJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow
  const payload = Buffer.from(
    JSON.stringify({ sub: '1', role: 'admin', email: 'service@jobboard.internal', exp })
  ).toString('base64url')
  const signature = 'mock_signature'
  return `${header}.${payload}.${signature}`
}

describe('Job Board Proxy Client & CMS Security', () => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    _resetTokenCacheForTesting()
    process.env.JOB_BOARD_API_URL = 'https://job-board-platform-pi.vercel.app'
    process.env.CMS_SERVICE_EMAIL = 'service@jobboard.internal'
    process.env.CMS_SERVICE_PASSWORD = 'service_password_123'
    process.env.CMS_READ_ONLY = 'false' // Default to false for client tests unless testing switch
    mockAuth.mockReset()
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = { ...originalEnv }
  })

  // -------------------------------------------------------------------------
  // 1. Token reuse until near expiry
  // -------------------------------------------------------------------------
  it('reuses access token across requests until 60 seconds before expiry', async () => {
    const validJwt = createMockJwt(300) // Valid for 300 seconds
    let loginCalls = 0

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        loginCalls++
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: validJwt,
              token_type: 'bearer',
              role: 'admin',
              user_id: 1,
              name: 'Service',
              email: 'service@jobboard.internal',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      if (url.includes('/api/v1/admin/analytics')) {
        return Promise.resolve(
          new Response(JSON.stringify({ total_jobs: 42 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    global.fetch = mockFetch

    // First request -> triggers login
    const r1 = await jobBoardClient.analytics.get()
    expect(r1.total_jobs).toBe(42)
    expect(loginCalls).toBe(1)

    // Second request shortly after -> reuses cached token
    const r2 = await jobBoardClient.analytics.get()
    expect(r2.total_jobs).toBe(42)
    expect(loginCalls).toBe(1) // Token was reused, no new login

    // Now simulate token expiration (less than 60 seconds remaining)
    const expiringJwt = createMockJwt(30) // Expiring in 30 seconds (< 60s buffer)
    _resetTokenCacheForTesting()

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        loginCalls++
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: expiringJwt,
              token_type: 'bearer',
              role: 'admin',
              user_id: 1,
              name: 'Service',
              email: 'service@jobboard.internal',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ total_jobs: 100 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    await jobBoardClient.analytics.get()
    expect(loginCalls).toBe(2)

    // Another call should detect token is within 60s of expiry and refresh
    await jobBoardClient.analytics.get()
    expect(loginCalls).toBe(3)
  })

  // -------------------------------------------------------------------------
  // 2. One re-login and one retry on 401
  // -------------------------------------------------------------------------
  it('re-logins once and retries original request once on 401', async () => {
    const validJwt = createMockJwt(300)
    let loginCount = 0
    let analyticsAttempts = 0

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        loginCount++
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: validJwt,
              token_type: 'bearer',
              role: 'admin',
              user_id: 1,
              name: 'Service',
              email: 'service@jobboard.internal',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }

      if (url.includes('/api/v1/admin/analytics')) {
        analyticsAttempts++
        if (analyticsAttempts === 1) {
          // First attempt returns 401 (token invalidated on server)
          return Promise.resolve(new Response(JSON.stringify({ detail: 'Token expired on backend' }), { status: 401 }))
        }
        // Second attempt (retry) succeeds
        return Promise.resolve(
          new Response(JSON.stringify({ total_users: 50 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }

      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    global.fetch = mockFetch

    const result = await jobBoardClient.analytics.get()
    expect(result.total_users).toBe(50)
    expect(analyticsAttempts).toBe(2) // 1 initial + 1 retry
    expect(loginCount).toBe(2) // 1 initial + 1 re-login after 401
  })

  it('fails with clear error if retry after 401 still fails', async () => {
    const validJwt = createMockJwt(300)
    let loginCount = 0
    let analyticsAttempts = 0

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        loginCount++
        return Promise.resolve(
          new Response(JSON.stringify({ access_token: validJwt }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (url.includes('/api/v1/admin/analytics')) {
        analyticsAttempts++
        return Promise.resolve(
          new Response(JSON.stringify({ code: 'UNAUTHORIZED', detail: 'Invalid credentials' }), { status: 401 })
        )
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })

    global.fetch = mockFetch

    await expect(jobBoardClient.analytics.get()).rejects.toThrow(JobBoardApiError)
    expect(analyticsAttempts).toBe(2) // Tried once, re-logged in, retried once, stopped
    expect(loginCount).toBe(2)
  })

  // -------------------------------------------------------------------------
  // 3. Single-flight login under concurrent calls
  // -------------------------------------------------------------------------
  it('makes only ONE login request when multiple concurrent calls occur simultaneously', async () => {
    const validJwt = createMockJwt(300)
    let loginCalls = 0

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        loginCalls++
        // Simulate real network delay for login
        await new Promise((res) => setTimeout(res, 50))
        return new Response(
          JSON.stringify({
            access_token: validJwt,
            token_type: 'bearer',
            role: 'admin',
            user_id: 1,
            name: 'Service',
            email: 'service@jobboard.internal',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    global.fetch = mockFetch

    // Launch 5 concurrent calls simultaneously
    const results = await Promise.all([
      jobBoardClient.analytics.get(),
      jobBoardClient.companies.list(),
      jobBoardClient.jobs.list(),
      jobBoardClient.users.list(),
      jobBoardClient.applications.list(),
    ])

    expect(results.length).toBe(5)
    // Only ONE login call should have been made due to single-flight promise locking
    expect(loginCalls).toBe(1)
  })

  // -------------------------------------------------------------------------
  // 4. X-CMS-Actor header on mutations
  // -------------------------------------------------------------------------
  it('sends X-CMS-Actor header on mutating calls (POST/PATCH/DELETE) and omits it on GET', async () => {
    const validJwt = createMockJwt(300)
    const capturedHeaders: Record<string, string>[] = []

    const mockFetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/v1/auth/login')) {
        return Promise.resolve(
          new Response(JSON.stringify({ access_token: validJwt }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }

      capturedHeaders.push((init?.headers as Record<string, string>) || {})

      return Promise.resolve(
        new Response(JSON.stringify({ company_id: 1, is_verified: true, message: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    global.fetch = mockFetch

    // 1. GET call -> should NOT have X-CMS-Actor
    await jobBoardClient.companies.get(1)
    expect(capturedHeaders[0]['X-CMS-Actor']).toBeUndefined()

    // 2. POST call -> MUST have X-CMS-Actor
    await jobBoardClient.companies.verify(1, 'moderator_dan@jobboard.internal')
    expect(capturedHeaders[1]['X-CMS-Actor']).toBe('moderator_dan@jobboard.internal')

    // 3. PATCH call -> MUST have X-CMS-Actor
    await jobBoardClient.jobs.updateStatus(10, 'closed', 'admin_clara@jobboard.internal')
    expect(capturedHeaders[2]['X-CMS-Actor']).toBe('admin_clara@jobboard.internal')

    // 4. DELETE call -> MUST have X-CMS-Actor
    await jobBoardClient.companies.delete(1, 'admin_clara@jobboard.internal')
    expect(capturedHeaders[3]['X-CMS-Actor']).toBe('admin_clara@jobboard.internal')
  })

  // -------------------------------------------------------------------------
  // 5. Read-only safety switch blocks non-GET calls
  // -------------------------------------------------------------------------
  it('blocks all mutating requests at server level when CMS_READ_ONLY is true', async () => {
    process.env.CMS_READ_ONLY = 'true'

    const mockFetch = vi.fn()
    global.fetch = mockFetch

    // Mutating calls should fail BEFORE making any network call
    await expect(jobBoardClient.companies.verify(1, 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)
    await expect(jobBoardClient.companies.unverify(1, 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)
    await expect(jobBoardClient.companies.delete(1, 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)
    await expect(jobBoardClient.jobs.updateStatus(1, 'closed', 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)
    await expect(jobBoardClient.jobs.delete(1, 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)
    await expect(jobBoardClient.users.lock(1, 'Violation', 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)
    await expect(jobBoardClient.users.unlock(1, 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)
    await expect(jobBoardClient.users.delete(1, false, 'staff@test.com')).rejects.toThrow(ReadOnlyModeError)

    // No fetch call was ever dispatched for any of these
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('allows GET requests even when CMS_READ_ONLY is true', async () => {
    process.env.CMS_READ_ONLY = 'true'
    const validJwt = createMockJwt(300)

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        return Promise.resolve(
          new Response(JSON.stringify({ access_token: validJwt }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify([{ job_id: 1 }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    global.fetch = mockFetch

    const jobs = await jobBoardClient.jobs.list()
    expect(jobs).toEqual([{ job_id: 1 }])
  })

  // -------------------------------------------------------------------------
  // 6. Error code mapping and correlation ID formatting
  // -------------------------------------------------------------------------
  it('maps backend domain error codes to clear messages and includes correlation ID', async () => {
    const validJwt = createMockJwt(300)

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        return Promise.resolve(
          new Response(JSON.stringify({ access_token: validJwt }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: 'ACCOUNT_LOCKED',
            detail: 'User account is locked',
            correlation_id: 'corr-xyz-789',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      )
    })

    global.fetch = mockFetch

    try {
      await jobBoardClient.users.lock(5, 'Reason', 'admin@jobboard.internal')
      expect.fail('Should have thrown JobBoardApiError')
    } catch (err: any) {
      expect(err).toBeInstanceOf(JobBoardApiError)
      expect(err.code).toBe('ACCOUNT_LOCKED')
      expect(err.correlationId).toBe('corr-xyz-789')
      expect(err.message).toContain('This account has been locked. Action cannot be performed.')
      expect(err.message).toContain('[Correlation ID: corr-xyz-789]')
    }
  })

  // -------------------------------------------------------------------------
  // 7. Role checks reject moderator on admin-only actions
  // -------------------------------------------------------------------------
  it('rejects a moderator from deleting companies or users in server actions', async () => {
    mockAuth.mockResolvedValue({
      user: {
        email: 'moderator_sam@jobboard.internal',
        roles: 'moderator', // NOT admin
      },
    })

    // Moderator attempts to delete company -> must be rejected
    const coRes = await deleteCompanyAction(99)
    expect(coRes.success).toBe(false)
    expect(coRes.error).toContain('Forbidden: Only administrators can delete companies.')

    // Moderator attempts to delete user -> must be rejected
    const userRes = await deleteUserAction(88, false)
    expect(userRes.success).toBe(false)
    expect(userRes.error).toContain('Forbidden: Only administrators can delete users.')

    // Moderator attempts hard delete -> must be rejected
    const hardUserRes = await deleteUserAction(88, true)
    expect(hardUserRes.success).toBe(false)
    expect(hardUserRes.error).toContain('Forbidden: Only administrators can delete users.')
  })

  it('allows an admin to perform admin-only actions', async () => {
    mockAuth.mockResolvedValue({
      user: {
        email: 'admin_clara@jobboard.internal',
        roles: 'admin', // Admin role
      },
    })

    const validJwt = createMockJwt(300)
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/login')) {
        return Promise.resolve(
          new Response(JSON.stringify({ access_token: validJwt }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ message: 'Deleted successfully' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
    global.fetch = mockFetch

    // Admin attempts to delete company -> succeeds
    const coRes = await deleteCompanyAction(99)
    expect(coRes.success).toBe(true)

    // Admin attempts soft delete user -> succeeds
    const userRes = await deleteUserAction(88, false)
    expect(userRes.success).toBe(true)
  })
})
