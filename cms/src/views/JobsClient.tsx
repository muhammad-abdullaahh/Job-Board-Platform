'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { JobResponse, JobStatus } from '../lib/jobboard/client'
import { updateJobStatusAction, deleteJobAction } from '../actions/adminActions'
import { Pagination } from '../components/Pagination'
import { FeedbackAlert, type FeedbackMessage } from '../components/FeedbackAlert'

interface JobsClientProps {
  jobs: JobResponse[]
  statusFilter: string
  companyIdFilter: string
  searchFilter: string
  skip: number
  limit: number
  isReadOnly: boolean
}

export const JobsClient: React.FC<JobsClientProps> = ({
  jobs,
  statusFilter,
  companyIdFilter,
  searchFilter,
  skip,
  limit,
  isReadOnly,
}) => {
  const router = useRouter()
  const [status, setStatus] = useState(statusFilter)
  const [companyId, setCompanyId] = useState(companyIdFilter)
  const [search, setSearch] = useState(searchFilter)

  // Status update & delete state
  const [deletingJob, setDeletingJob] = useState<JobResponse | null>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (companyId.trim()) params.set('company_id', companyId.trim())
    if (search.trim()) params.set('q', search.trim())
    params.set('skip', '0')
    router.push(`/admin/jobs?${params.toString()}`)
  }

  const handleStatusChange = async (job: JobResponse, newStatus: JobStatus) => {
    if (isReadOnly) return
    setIsSubmitting(true)
    setFeedback(null)
    const res = await updateJobStatusAction(job.job_id, newStatus)
    setIsSubmitting(false)
    if (res.success) {
      setFeedback({ type: 'success', message: `Job #${job.job_id} status updated to "${newStatus}".` })
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update job status' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (isReadOnly || !deletingJob) return
    if (confirmInput.trim() !== deletingJob.title.trim()) return

    setIsSubmitting(true)
    setFeedback(null)
    const res = await deleteJobAction(deletingJob.job_id)
    setIsSubmitting(false)
    if (res.success) {
      setFeedback({ type: 'success', message: `Job "${deletingJob.title}" deleted successfully.` })
      setDeletingJob(null)
      setConfirmInput('')
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to delete job' })
    }
  }

  const handlePagination = (newSkip: number) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (companyId.trim()) params.set('company_id', companyId.trim())
    if (search.trim()) params.set('q', search.trim())
    params.set('skip', String(newSkip))
    router.push(`/admin/jobs?${params.toString()}`)
  }

  return (
    <div>
      <FeedbackAlert feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* Filter and Search Bar */}
      <form onSubmit={handleApplyFilters} className="cms-toolbar">
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="cms-select"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Company ID
          </label>
          <input
            type="number"
            placeholder="e.g. 1"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="cms-input"
            style={{ width: 100 }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Search (Title, Location, Company)
          </label>
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cms-input"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button type="submit" className="btn btn-secondary">
            Apply Filters
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="cms-table-wrapper">
        <table className="cms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Job Title</th>
              <th>Company</th>
              <th>Location</th>
              <th>Type</th>
              <th>Salary Range</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  No job postings found matching current filters.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const companyName = job.company?.name || `Company #${job.company_id}`
                const salary =
                  job.salary_min || job.salary_max
                    ? `$${job.salary_min?.toLocaleString() ?? 0} - $${job.salary_max?.toLocaleString() ?? '?'}`
                    : 'Unspecified'

                return (
                  <tr key={job.job_id}>
                    <td>
                      <code>#{job.job_id}</code>
                    </td>
                    <td>
                      <strong>{job.title}</strong>
                    </td>
                    <td>{companyName}</td>
                    <td>{job.location || 'Remote'}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {job.employment_type?.replace(/_/g, ' ') || 'full time'}
                      </span>
                    </td>
                    <td>{salary}</td>
                    <td>
                      {job.status === 'open' && <span className="badge badge-success">Open</span>}
                      {job.status === 'closed' && <span className="badge badge-danger">Closed</span>}
                      {job.status === 'draft' && <span className="badge badge-warning">Draft</span>}
                    </td>
                    <td>{new Date(job.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                          value={job.status}
                          disabled={isReadOnly || isSubmitting}
                          onChange={(e) => handleStatusChange(job, e.target.value as JobStatus)}
                          className="cms-select"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          title={isReadOnly ? 'Disabled in read-only mode' : 'Change status'}
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                          <option value="draft">Draft</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setDeletingJob(job)
                            setConfirmInput('')
                          }}
                          disabled={isReadOnly || isSubmitting}
                          className="btn btn-danger"
                          title={isReadOnly ? 'Disabled in read-only mode' : 'Delete job posting'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} limit={limit} count={jobs.length} onPageChange={handlePagination} />

      {/* Delete Confirmation Modal */}
      {deletingJob && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: 18 }}>Confirm Job Deletion</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete job posting <strong>#{deletingJob.job_id}: {deletingJob.title}</strong>?
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              Type <code>{deletingJob.title}</code> to confirm:
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type exact job title here..."
              className="cms-input"
              style={{ width: '100%', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setDeletingJob(null)
                  setConfirmInput('')
                }}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting || confirmInput.trim() !== deletingJob.title.trim()}
                className="btn btn-danger"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobsClient
