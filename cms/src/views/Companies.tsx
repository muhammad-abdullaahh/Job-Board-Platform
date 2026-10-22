import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { jobBoardClient, type CompanyResponse } from '../lib/jobboard/client'
import { ViewLayout } from '../components/ViewLayout'
import { CompaniesClient } from './CompaniesClient'

export async function CompaniesView(props: AdminViewServerProps) {
  const { searchParams, user } = props
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'
  const sp = await searchParams

  const verifiedParam = typeof sp?.verified === 'string' ? sp.verified : 'all'
  const is_verified = verifiedParam === 'true' ? true : verifiedParam === 'false' ? false : undefined
  const q = typeof sp?.q === 'string' ? sp.q : undefined
  const skip = typeof sp?.skip === 'string' ? Math.max(0, parseInt(sp.skip, 10) || 0) : 0
  const limit = 20

  let companies: CompanyResponse[] = []
  let errorMsg: string | null = null

  try {
    companies = await jobBoardClient.companies.list({
      is_verified,
      q,
      skip,
      limit,
    })
  } catch (err: any) {
    errorMsg = err.message || 'Failed to fetch companies'
  }

  const userRole = (user as any)?.roles || 'moderator'

  return (
    <ViewLayout
      serverProps={props}
      title="Company Directory & Verification"
      subtitle="Review employer profiles, grant or revoke verification status, and manage company records."
      isReadOnly={isReadOnly}
      errorMsg={errorMsg}
    >
      <CompaniesClient
        companies={companies}
        initialFilter={verifiedParam}
        initialSearch={q || ''}
        skip={skip}
        limit={limit}
        userRole={userRole}
        isReadOnly={isReadOnly}
      />
    </ViewLayout>
  )
}

export default CompaniesView
