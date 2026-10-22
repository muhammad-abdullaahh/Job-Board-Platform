import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { jobBoardClient, type JobResponse, type JobStatus } from '../lib/jobboard/client'
import { ViewLayout } from '../components/ViewLayout'
import { JobsClient } from './JobsClient'

export async function JobsView(props: AdminViewServerProps) {
  const { searchParams } = props
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'
  const sp = await searchParams

  const statusParam = typeof sp?.status === 'string' ? sp.status : 'all'
  const status = (['open', 'closed', 'draft'].includes(statusParam) ? statusParam : undefined) as JobStatus | undefined
  const companyIdParam = typeof sp?.company_id === 'string' ? sp.company_id : ''
  const company_id = companyIdParam ? parseInt(companyIdParam, 10) || undefined : undefined
  const q = typeof sp?.q === 'string' ? sp.q : undefined
  const skip = typeof sp?.skip === 'string' ? Math.max(0, parseInt(sp.skip, 10) || 0) : 0
  const limit = 20

  let jobs: JobResponse[] = []
  let errorMsg: string | null = null

  try {
    jobs = await jobBoardClient.jobs.list({
      status,
      company_id,
      q,
      skip,
      limit,
    })
  } catch (err: any) {
    errorMsg = err.message || 'Failed to fetch job postings'
  }

  return (
    <ViewLayout
      serverProps={props}
      title="Jobs Moderation & Status Control"
      subtitle="Inspect and moderate job postings across companies, change visibility statuses, and remove listings."
      isReadOnly={isReadOnly}
      errorMsg={errorMsg}
    >
      <JobsClient
        jobs={jobs}
        statusFilter={statusParam}
        companyIdFilter={companyIdParam}
        searchFilter={q || ''}
        skip={skip}
        limit={limit}
        isReadOnly={isReadOnly}
      />
    </ViewLayout>
  )
}

export default JobsView
