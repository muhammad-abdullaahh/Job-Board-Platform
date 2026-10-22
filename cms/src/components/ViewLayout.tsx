import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { ReadOnlyBanner } from './ReadOnlyBanner'

interface ViewLayoutProps {
  serverProps?: AdminViewServerProps
  title: string
  subtitle: string
  isReadOnly?: boolean
  errorMsg?: string | null
  children: React.ReactNode
}

export const ViewLayout: React.FC<ViewLayoutProps> = ({
  serverProps,
  title,
  subtitle,
  isReadOnly = true,
  errorMsg,
  children,
}) => {
  const content = (
    <Gutter>
      <div style={{ padding: '24px 0' }}>
        <ReadOnlyBanner isReadOnly={isReadOnly} />

        <div style={{ marginBottom: 24 }}>
          <h1 className="cms-title">{title}</h1>
          <p className="cms-subtitle">{subtitle}</p>
        </div>

        {errorMsg && (
          <div style={{ padding: 14, background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', borderRadius: 6, marginBottom: 16 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {children}
      </div>
    </Gutter>
  )

  if (!serverProps || !serverProps.initPageResult) {
    return content
  }

  const { initPageResult, params, searchParams, user } = serverProps

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={initPageResult.visibleEntities}
    >
      {content}
    </DefaultTemplate>
  )
}

export default ViewLayout
