import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { jobBoardClient, type AdminAuditLogResponse } from '../lib/jobboard/client'
import { ViewLayout } from '../components/ViewLayout'
import { AuditLogsClient } from './AuditLogsClient'

export async function AuditLogsView(props: AdminViewServerProps) {
  const { searchParams } = props
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'
  const sp = await searchParams

  const action = typeof sp?.action === 'string' ? sp.action : undefined
  const targetTypeParam = typeof sp?.target_type === 'string' ? sp.target_type : 'all'
  const target_type = targetTypeParam !== 'all' ? targetTypeParam : undefined
  const targetIdParam = typeof sp?.target_id === 'string' ? sp.target_id : ''
  const target_id = targetIdParam ? parseInt(targetIdParam, 10) || undefined : undefined
  const from_date = typeof sp?.from_date === 'string' ? sp.from_date : undefined
  const to_date = typeof sp?.to_date === 'string' ? sp.to_date : undefined
  const skip = typeof sp?.skip === 'string' ? Math.max(0, parseInt(sp.skip, 10) || 0) : 0
  const limit = 20

  let logs: AdminAuditLogResponse[] = []
  let errorMsg: string | null = null

  try {
    logs = await jobBoardClient.auditLogs.list({
      action,
      target_type,
      target_id,
      from_date,
      to_date,
      skip,
      limit,
    })
  } catch (err: any) {
    errorMsg = err.message || 'Failed to fetch platform audit logs'
  }

  return (
    <ViewLayout
      serverProps={props}
      title="System Audit Trail & Compliance"
      subtitle="Immutable audit log of administrative actions, moderation decisions, and actor identities."
      isReadOnly={isReadOnly}
      errorMsg={errorMsg}
    >
      <AuditLogsClient
        logs={logs}
        actionFilter={action || ''}
        targetTypeFilter={targetTypeParam}
        targetIdFilter={targetIdParam}
        fromDateFilter={from_date || ''}
        toDateFilter={to_date || ''}
        skip={skip}
        limit={limit}
      />
    </ViewLayout>
  )
}

export default AuditLogsView
