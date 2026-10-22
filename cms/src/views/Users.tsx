import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { jobBoardClient, type UserResponse } from '../lib/jobboard/client'
import { ViewLayout } from '../components/ViewLayout'
import { UsersClient } from './UsersClient'

export async function UsersView(props: AdminViewServerProps) {
  const { searchParams, user } = props
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'
  const sp = await searchParams

  const activeParam = typeof sp?.active === 'string' ? sp.active : 'all'
  const is_active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined
  const adminParam = typeof sp?.is_admin === 'string' ? sp.is_admin : 'all'
  const is_admin = adminParam === 'true' ? true : adminParam === 'false' ? false : undefined
  const q = typeof sp?.q === 'string' ? sp.q : undefined
  const skip = typeof sp?.skip === 'string' ? Math.max(0, parseInt(sp.skip, 10) || 0) : 0
  const limit = 20

  let users: UserResponse[] = []
  let errorMsg: string | null = null

  try {
    users = await jobBoardClient.users.list({
      is_active,
      is_admin,
      q,
      skip,
      limit,
    })
  } catch (err: any) {
    errorMsg = err.message || 'Failed to fetch platform users'
  }

  const userRole = (user as any)?.roles || 'moderator'

  return (
    <ViewLayout
      serverProps={props}
      title="User Lifecycle & Account Moderation"
      subtitle="Manage user active/locked status, review suspension records, and execute soft or permanent deletions."
      isReadOnly={isReadOnly}
      errorMsg={errorMsg}
    >
      <UsersClient
        users={users}
        statusFilter={activeParam}
        adminFilter={adminParam}
        searchFilter={q || ''}
        skip={skip}
        limit={limit}
        userRole={userRole}
        isReadOnly={isReadOnly}
      />
    </ViewLayout>
  )
}

export default UsersView
