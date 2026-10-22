import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { jobBoardClient, type ApplicationResponse } from '../lib/jobboard/client'
import { ViewLayout } from '../components/ViewLayout'
import { ApplicationsClient } from './ApplicationsClient'

export async function ApplicationsView(props: AdminViewServerProps) {
  const { searchParams } = props
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'
  const sp = await searchParams

  const statusParam = typeof sp?.status === 'string' ? sp.status : 'all'
  const status = statusParam !== 'all' ? statusParam : undefined
  const jobIdParam = typeof sp?.job_id === 'string' ? sp.job_id : ''
  const job_id = jobIdParam ? parseInt(jobIdParam, 10) || undefined : undefined
  const userIdParam = typeof sp?.user_id === 'string' ? sp.user_id : ''
  const user_id = userIdParam ? parseInt(userIdParam, 10) || undefined : undefined
  const companyIdParam = typeof sp?.company_id === 'string' ? sp.company_id : ''
  const company_id = companyIdParam ? parseInt(companyIdParam, 10) || undefined : undefined
  const from_date = typeof sp?.from_date === 'string' ? sp.from_date : undefined
  const to_date = typeof sp?.to_date === 'string' ? sp.to_date : undefined
  const skip = typeof sp?.skip === 'string' ? Math.max(0, parseInt(sp.skip, 10) || 0) : 0
  const limit = 20

  let applications: ApplicationResponse[] = []
  let errorMsg: string | null = null

  try {
    applications = await jobBoardClient.applications.list({
      status,
      job_id,
      user_id,
      company_id,
      from_date,
      to_date,
      skip,
      limit,
    })
  } catch (err: any) {
    errorMsg = err.message || 'Failed to fetch candidate applications'
  }

  return (
    <ViewLayout
      serverProps={props}
      title="Applications Review"
      subtitle="Read-only inspection of candidate submissions, interview statuses, and job offers."
      isReadOnly={isReadOnly}
      errorMsg={errorMsg}
    >
      <ApplicationsClient
        applications={applications}
        statusFilter={statusParam}
        jobIdFilter={jobIdParam}
        userIdFilter={userIdParam}
        companyIdFilter={companyIdParam}
        fromDateFilter={from_date || ''}
        toDateFilter={to_date || ''}
        skip={skip}
        limit={limit}
      />
    </ViewLayout>
  )
}

export default ApplicationsView
