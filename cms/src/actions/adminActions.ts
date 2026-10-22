'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { jobBoardClient, type JobStatus, JobBoardApiError } from '../lib/jobboard/client'
import { logStaffAction } from '../lib/logger'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  correlationId?: string | null
}

function handleActionError(err: unknown, defaultMessage: string): ActionResult {
  const correlationId = err instanceof JobBoardApiError ? err.correlationId : null
  const message = err instanceof Error ? err.message : defaultMessage
  return {
    success: false,
    error: message || defaultMessage,
    correlationId,
  }
}

async function getAuthenticatedStaff(): Promise<{ email: string; role: 'admin' | 'moderator' }> {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user || !user.email) {
    throw new Error('UNAUTHORIZED: Valid staff session required')
  }

  const role = (user as any).roles === 'admin' ? 'admin' : 'moderator'
  return { email: user.email, role }
}

export async function verifyCompanyAction(companyId: number): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    const res = await jobBoardClient.companies.verify(companyId, staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: 'COMPANY_VERIFIED',
      target: `company:${companyId}`,
      result: 'SUCCESS',
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to verify company')
  }
}

export async function unverifyCompanyAction(companyId: number): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    const res = await jobBoardClient.companies.unverify(companyId, staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: 'COMPANY_UNVERIFIED',
      target: `company:${companyId}`,
      result: 'SUCCESS',
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to unverify company')
  }
}

export async function deleteCompanyAction(companyId: number): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    // Role check: Only admin can delete companies
    if (staff.role !== 'admin') {
      logStaffAction({
        staffEmail: staff.email,
        action: 'DELETE_COMPANY',
        target: `company:${companyId}`,
        result: 'BLOCKED',
        details: { reason: 'Moderator attempted admin-only action' },
      })
      return { success: false, error: 'Forbidden: Only administrators can delete companies.' }
    }

    const res = await jobBoardClient.companies.delete(companyId, staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: 'COMPANY_DELETED',
      target: `company:${companyId}`,
      result: 'SUCCESS',
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to delete company')
  }
}

export async function updateJobStatusAction(jobId: number, status: JobStatus): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    const res = await jobBoardClient.jobs.updateStatus(jobId, status, staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: 'JOB_STATUS_UPDATED',
      target: `job:${jobId}`,
      result: 'SUCCESS',
      details: { newStatus: status },
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to update job status')
  }
}

export async function deleteJobAction(jobId: number): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    const res = await jobBoardClient.jobs.delete(jobId, staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: 'JOB_DELETED',
      target: `job:${jobId}`,
      result: 'SUCCESS',
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to delete job')
  }
}

export async function lockUserAction(userId: number, reason: string): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Lock reason is required' }
    }

    const res = await jobBoardClient.users.lock(userId, reason.trim(), staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: 'USER_LOCKED',
      target: `user:${userId}`,
      result: 'SUCCESS',
      details: { reason },
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to lock user')
  }
}

export async function unlockUserAction(userId: number): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    const res = await jobBoardClient.users.unlock(userId, staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: 'USER_UNLOCKED',
      target: `user:${userId}`,
      result: 'SUCCESS',
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to unlock user')
  }
}

export async function deleteUserAction(userId: number, hard: boolean): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff()
    // Role check: Only admin can soft-delete or hard-delete users
    if (staff.role !== 'admin') {
      logStaffAction({
        staffEmail: staff.email,
        action: hard ? 'HARD_DELETE_USER' : 'SOFT_DELETE_USER',
        target: `user:${userId}`,
        result: 'BLOCKED',
        details: { reason: 'Moderator attempted admin-only action' },
      })
      return { success: false, error: 'Forbidden: Only administrators can delete users.' }
    }

    const res = await jobBoardClient.users.delete(userId, hard, staff.email)

    logStaffAction({
      staffEmail: staff.email,
      action: hard ? 'USER_HARD_DELETED' : 'USER_SOFT_DELETED',
      target: `user:${userId}`,
      result: 'SUCCESS',
      details: { hard },
    })

    return { success: true, data: res }
  } catch (err) {
    return handleActionError(err, 'Failed to delete user')
  }
}
