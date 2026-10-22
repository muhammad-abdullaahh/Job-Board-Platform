'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ApplicationResponse } from '../lib/jobboard/client'
import { Pagination } from '../components/Pagination'

interface ApplicationsClientProps {
  applications: ApplicationResponse[]
  statusFilter: string
  jobIdFilter: string
  userIdFilter: string
  companyIdFilter: string
  fromDateFilter: string
  toDateFilter: string
  skip: number
  limit: number
}

export const ApplicationsClient: React.FC<ApplicationsClientProps> = ({
  applications,
  statusFilter,
  jobIdFilter,
  userIdFilter,
  companyIdFilter,
  fromDateFilter,
  toDateFilter,
  skip,
  limit,
}) => {
  const router = useRouter()
  const [status, setStatus] = useState(statusFilter)
  const [jobId, setJobId] = useState(jobIdFilter)
  const [userId, setUserId] = useState(userIdFilter)
  const [companyId, setCompanyId] = useState(companyIdFilter)
  const [fromDate, setFromDate] = useState(fromDateFilter)
  const [toDate, setToDate] = useState(toDateFilter)
  const [selectedApp, setSelectedApp] = useState<ApplicationResponse | null>(null)

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (jobId.trim()) params.set('job_id', jobId.trim())
    if (userId.trim()) params.set('user_id', userId.trim())
    if (companyId.trim()) params.set('company_id', companyId.trim())
    if (fromDate.trim()) params.set('from_date', fromDate.trim())
    if (toDate.trim()) params.set('to_date', toDate.trim())
    params.set('skip', '0')
    router.push(`/admin/applications?${params.toString()}`)
  }

  const handlePagination = (newSkip: number) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (jobId.trim()) params.set('job_id', jobId.trim())
    if (userId.trim()) params.set('user_id', userId.trim())
    if (companyId.trim()) params.set('company_id', companyId.trim())
    if (fromDate.trim()) params.set('from_date', fromDate.trim())
    if (toDate.trim()) params.set('to_date', toDate.trim())
    params.set('skip', String(newSkip))
    router.push(`/admin/applications?${params.toString()}`)
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'hired':
      case 'offer_accepted':
        return <span className="badge badge-success">{st.replace(/_/g, ' ')}</span>
      case 'offer_issued':
      case 'interview_scheduled':
        return <span className="badge badge-warning">{st.replace(/_/g, ' ')}</span>
      case 'rejected':
      case 'offer_declined':
        return <span className="badge badge-danger">{st.replace(/_/g, ' ')}</span>
      default:
        return <span className="badge badge-neutral">{st.replace(/_/g, ' ')}</span>
    }
  }

  return (
    <div>
      {/* Filter Bar */}
      <form onSubmit={handleApplyFilters} className="cms-toolbar">
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Status
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="cms-select">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="offer_issued">Offer Issued</option>
            <option value="offer_accepted">Offer Accepted</option>
            <option value="offer_declined">Offer Declined</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Job ID
          </label>
          <input
            type="number"
            placeholder="e.g. 10"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="cms-input"
            style={{ width: 85 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Candidate User ID
          </label>
          <input
            type="number"
            placeholder="e.g. 42"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="cms-input"
            style={{ width: 85 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Company ID
          </label>
          <input
            type="number"
            placeholder="e.g. 2"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="cms-input"
            style={{ width: 85 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            From Date (UTC)
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="cms-input"
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            To Date (UTC)
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="cms-input"
          />
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button type="submit" className="btn btn-secondary">
            Filter Applications
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="cms-table-wrapper">
        <table className="cms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Job Position</th>
              <th>Status</th>
              <th>Cover Letter</th>
              <th>Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  No candidate applications found matching current filters.
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const applicantName = (app as any).applicant?.name || `User #${app.user_id}`
                const applicantEmail = (app as any).applicant?.email || ''
                const jobTitle = (app as any).job?.title || `Job #${app.job_id}`
                const companyName = (app as any).job?.company?.name || ''
                const snippet = app.cover_letter
                  ? app.cover_letter.slice(0, 60) + (app.cover_letter.length > 60 ? '...' : '')
                  : '—'

                return (
                  <tr key={app.application_id}>
                    <td>
                      <code>#{app.application_id}</code>
                    </td>
                    <td>
                      <strong>{applicantName}</strong>
                      {applicantEmail && <div style={{ fontSize: 12, color: '#64748b' }}>{applicantEmail}</div>}
                    </td>
                    <td>
                      <strong>{jobTitle}</strong>
                      {companyName && <div style={{ fontSize: 12, color: '#64748b' }}>{companyName}</div>}
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td style={{ maxWidth: 200, color: '#475569' }}>{snippet}</td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="btn btn-secondary"
                      >
                        View Full
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} limit={limit} count={applications.length} onPageChange={handlePagination} />

      {/* Full Application Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Application #{selectedApp.application_id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
              <div>
                <strong>Applicant:</strong> {(selectedApp as any).applicant?.name || `User #${selectedApp.user_id}`}
              </div>
              <div>
                <strong>Status:</strong> {getStatusBadge(selectedApp.status)}
              </div>
              <div>
                <strong>Email:</strong> {(selectedApp as any).applicant?.email || '—'}
              </div>
              <div>
                <strong>Submitted At:</strong> {new Date(selectedApp.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Job Title:</strong> {(selectedApp as any).job?.title || `Job #${selectedApp.job_id}`}
              </div>
              <div>
                <strong>Offer Issued At:</strong>{' '}
                {selectedApp.offer_issued_at ? new Date(selectedApp.offer_issued_at).toLocaleString() : '—'}
              </div>
              <div>
                <strong>Company:</strong> {(selectedApp as any).job?.company?.name || '—'}
              </div>
              <div>
                <strong>Offer Expires At:</strong>{' '}
                {selectedApp.offer_expires_at ? new Date(selectedApp.offer_expires_at).toLocaleString() : '—'}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13 }}>
              <strong>Cover Letter:</strong>
              <div
                style={{
                  marginTop: 6,
                  padding: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 250,
                  overflowY: 'auto',
                  lineHeight: 1.5,
                  color: '#334155',
                }}
              >
                {selectedApp.cover_letter || 'No cover letter submitted.'}
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: 20 }}>
              <button type="button" onClick={() => setSelectedApp(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationsClient
