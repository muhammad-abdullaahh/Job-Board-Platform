import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import { jobBoardClient, type AnalyticsResponse } from '../lib/jobboard/client'
import { ReadOnlyBanner } from '../components/ReadOnlyBanner'

export async function DashboardView({ user }: AdminViewServerProps) {
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'

  let analytics: AnalyticsResponse = {}
  let fetchError: string | null = null

  try {
    analytics = await jobBoardClient.analytics.get()
  } catch (err: any) {
    fetchError = err.message || 'Failed to load platform analytics'
  }

  const pendingCompanies = analytics.companies?.pending ?? analytics.pending_companies ?? 0
  const totalCompanies = analytics.companies?.total ?? analytics.total_companies ?? 0
  const verifiedCompanies = analytics.companies?.verified ?? analytics.verified_companies ?? 0

  const totalUsers = analytics.users?.total ?? analytics.total_users ?? 0
  const standardUsers = analytics.users?.candidates ?? analytics.standard_users ?? 0
  const adminUsers = analytics.users?.admins ?? analytics.admin_users ?? 0
  const suspendedUsers = analytics.users?.suspended ?? analytics.suspended_users ?? 0

  const totalJobs = analytics.jobs?.total ?? analytics.total_jobs ?? 0
  const activeJobs = analytics.jobs?.active ?? analytics.active_jobs ?? 0

  const totalApplications = analytics.applications?.total ?? analytics.total_applications ?? 0
  const hiredOrAccepted = analytics.applications?.hired_or_accepted ?? analytics.hired_or_accepted ?? 0
  const offersIssued = analytics.applications?.offers_issued ?? analytics.offers_issued ?? 0

  const statusBreakdown = analytics.applications?.status_breakdown ?? analytics.status_breakdown ?? {}
  const employmentTypeBreakdown = analytics.jobs?.employment_types ?? analytics.employment_type_breakdown ?? {}

  return (
    <Gutter>
      <div style={{ padding: '24px 0' }}>
        <ReadOnlyBanner isReadOnly={isReadOnly} />

        <div className="cms-header-wrap">
          <div>
            <h1 className="cms-title">Platform Analytics & Moderation</h1>
            <p className="cms-subtitle">
              Live operational health and platform KPIs aggregated from FastAPI single source of truth.
            </p>
          </div>
          <div className="cms-user-pill">
            <span>Staff:</span>
            <strong>{user?.email}</strong>
            <span className="cms-role-badge">{user?.roles || 'moderator'}</span>
          </div>
        </div>

        {fetchError && (
          <div className="cms-alert cms-alert-danger">
            <span>⚠️ {fetchError}</span>
          </div>
        )}

        {/* Prominent Verification Callout */}
        <div className={`cms-hero-card ${pendingCompanies > 0 ? 'action-required' : 'all-clear'}`}>
          <div>
            <div className="cms-hero-badge">
              {pendingCompanies > 0 ? '⚡ Priority Action Required' : '✓ Verification Queue Clear'}
            </div>
            <div className="cms-hero-number">
              {pendingCompanies} {pendingCompanies === 1 ? 'Company' : 'Companies'} Awaiting Verification
            </div>
            <div className="cms-hero-desc">
              {pendingCompanies > 0
                ? 'Employers cannot publish active job listings until their organization is reviewed and verified.'
                : 'All registered companies are verified. Unverified companies will appear here for review.'}
            </div>
          </div>
          {pendingCompanies > 0 ? (
            <Link
              href="/admin/companies?verified=false"
              className="btn btn-warning"
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              Review Pending Companies →
            </Link>
          ) : (
            <Link
              href="/admin/companies"
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '13.5px' }}
            >
              View All Companies →
            </Link>
          )}
        </div>

        {/* Metric Cards Grid */}
        <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cms-text-muted)', marginBottom: 14 }}>
          Platform Metrics Overview
        </h2>
        <div className="cms-grid">
          <div className="cms-card">
            <div className="cms-card-label">Total Companies</div>
            <div className="cms-card-number">{totalCompanies}</div>
            <div className="cms-card-detail">
              <span className="badge badge-success" style={{ marginRight: 6 }}>{verifiedCompanies} verified</span>
              <span>{totalCompanies ? Math.round((verifiedCompanies / totalCompanies) * 100) : 0}% verified rate</span>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-label">Total Jobs</div>
            <div className="cms-card-number">{totalJobs}</div>
            <div className="cms-card-detail">
              <span className="badge badge-success" style={{ marginRight: 6 }}>{activeJobs} open</span>
              <span>active public listings</span>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-label">Total Applications</div>
            <div className="cms-card-number">{totalApplications}</div>
            <div className="cms-card-detail">
              <span>{offersIssued} offers issued • {hiredOrAccepted} hired</span>
            </div>
          </div>

          <div className="cms-card">
            <div className="cms-card-label">Total Users</div>
            <div className="cms-card-number">{totalUsers}</div>
            <div className="cms-card-detail">
              <span>{standardUsers} standard • {adminUsers} admins • {suspendedUsers} suspended</span>
            </div>
          </div>
        </div>

        {/* Breakdown Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="cms-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: 0, marginBottom: 16, color: 'var(--cms-text-primary)' }}>
              Applications Status Breakdown
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {Object.entries(statusBreakdown).length === 0 ? (
                  <tr>
                    <td style={{ color: 'var(--cms-text-muted)', padding: '12px 0' }}>No application status records found.</td>
                  </tr>
                ) : (
                  Object.entries(statusBreakdown).map(([status, count]) => (
                    <tr key={status} style={{ borderBottom: '1px solid var(--cms-border)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 500, color: 'var(--cms-text-secondary)', textTransform: 'capitalize' }}>
                        {status.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--cms-text-primary)' }}>
                        {count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="cms-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: 0, marginBottom: 16, color: 'var(--cms-text-primary)' }}>
              Job Employment Types Breakdown
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {Object.entries(employmentTypeBreakdown).length === 0 ? (
                  <tr>
                    <td style={{ color: 'var(--cms-text-muted)', padding: '12px 0' }}>No employment type records found.</td>
                  </tr>
                ) : (
                  Object.entries(employmentTypeBreakdown).map(([type, count]) => (
                    <tr key={type} style={{ borderBottom: '1px solid var(--cms-border)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 500, color: 'var(--cms-text-secondary)', textTransform: 'capitalize' }}>
                        {type.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--cms-text-primary)' }}>
                        {count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Gutter>
  )
}

export default DashboardView
