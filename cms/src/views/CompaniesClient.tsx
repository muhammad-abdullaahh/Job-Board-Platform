'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CompanyResponse } from '../lib/jobboard/client'
import { verifyCompanyAction, unverifyCompanyAction, deleteCompanyAction } from '../actions/adminActions'
import { Pagination } from '../components/Pagination'
import { FeedbackAlert, type FeedbackMessage } from '../components/FeedbackAlert'

interface CompaniesClientProps {
  companies: CompanyResponse[]
  initialFilter: string
  initialSearch: string
  skip: number
  limit: number
  userRole: string
  isReadOnly: boolean
}

export const CompaniesClient: React.FC<CompaniesClientProps> = ({
  companies,
  initialFilter,
  initialSearch,
  skip,
  limit,
  userRole,
  isReadOnly,
}) => {
  const router = useRouter()
  const [filter, setFilter] = useState(initialFilter)
  const [search, setSearch] = useState(initialSearch)
  const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null)

  // Delete modal state
  const [deletingCompany, setDeletingCompany] = useState<CompanyResponse | null>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (filter && filter !== 'all') params.set('verified', filter)
    if (search.trim()) params.set('q', search.trim())
    params.set('skip', '0')
    router.push(`/admin/companies?${params.toString()}`)
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    const params = new URLSearchParams()
    if (newFilter && newFilter !== 'all') params.set('verified', newFilter)
    if (search.trim()) params.set('q', search.trim())
    params.set('skip', '0')
    router.push(`/admin/companies?${params.toString()}`)
  }

  const handlePagination = (newSkip: number) => {
    const params = new URLSearchParams()
    if (filter && filter !== 'all') params.set('verified', filter)
    if (search.trim()) params.set('q', search.trim())
    params.set('skip', String(newSkip))
    router.push(`/admin/companies?${params.toString()}`)
  }

  const handleVerify = async (company: CompanyResponse) => {
    if (isReadOnly) return
    setIsSubmitting(true)
    setFeedback(null)
    const res = await verifyCompanyAction(company.company_id)
    setIsSubmitting(false)
    if (res.success) {
      setFeedback({ type: 'success', message: `Company "${company.name}" verified successfully.` })
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to verify company' })
    }
  }

  const handleUnverify = async (company: CompanyResponse) => {
    if (isReadOnly) return
    setIsSubmitting(true)
    setFeedback(null)
    const res = await unverifyCompanyAction(company.company_id)
    setIsSubmitting(false)
    if (res.success) {
      setFeedback({ type: 'success', message: `Company "${company.name}" unverified successfully.` })
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to unverify company' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (isReadOnly || !deletingCompany) return
    if (confirmInput.trim() !== deletingCompany.name.trim()) return

    setIsSubmitting(true)
    setFeedback(null)
    const res = await deleteCompanyAction(deletingCompany.company_id)
    setIsSubmitting(false)
    if (res.success) {
      setFeedback({ type: 'success', message: `Company "${deletingCompany.name}" deleted successfully.` })
      setDeletingCompany(null)
      setConfirmInput('')
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to delete company' })
    }
  }

  const isAdmin = userRole === 'admin'

  return (
    <div>
      <FeedbackAlert feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="cms-toolbar">
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Status Filter
          </label>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="cms-select"
          >
            <option value="all">All Companies</option>
            <option value="false">Pending Verification Only</option>
            <option value="true">Verified Companies Only</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Search by Company Name
          </label>
          <input
            type="text"
            placeholder="Type company name and press Enter..."
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
              <th>Company Name</th>
              <th>Location</th>
              <th>Employees</th>
              <th>Verification</th>
              <th>HR Contact</th>
              <th>Registration No.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  No companies found matching current filters.
                </td>
              </tr>
            ) : (
              companies.map((co) => (
                <tr key={co.company_id}>
                  <td>
                    <code>#{co.company_id}</code>
                  </td>
                  <td>
                    <strong>{co.name}</strong>
                    {co.website && (
                      <div style={{ fontSize: 12 }}>
                        <a href={co.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                          {co.website}
                        </a>
                      </div>
                    )}
                  </td>
                  <td>{co.location || '—'}</td>
                  <td>{co.employee_count ?? '—'}</td>
                  <td>
                    {co.is_verified ? (
                      <span className="badge badge-success">Verified</span>
                    ) : (
                      <span className="badge badge-warning">Pending Review</span>
                    )}
                  </td>
                  <td>{co.hr_contact_email || '—'}</td>
                  <td>
                    <code>{co.registration_number || '—'}</code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedCompany(co)}
                        className="btn btn-secondary"
                        title="View Full Company Profile"
                      >
                        Details
                      </button>

                      {co.is_verified ? (
                        <button
                          type="button"
                          onClick={() => handleUnverify(co)}
                          disabled={isReadOnly || isSubmitting}
                          className="btn btn-secondary"
                          title={isReadOnly ? 'Disabled in read-only mode' : 'Revoke company verification'}
                        >
                          Unverify
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerify(co)}
                          disabled={isReadOnly || isSubmitting}
                          className="btn btn-primary"
                          title={isReadOnly ? 'Disabled in read-only mode' : 'Verify company to allow posting jobs'}
                        >
                          Verify
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingCompany(co)
                            setConfirmInput('')
                          }}
                          disabled={isReadOnly || isSubmitting}
                          className="btn btn-danger"
                          title={isReadOnly ? 'Disabled in read-only mode' : 'Delete company (Admin only)'}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} limit={limit} count={companies.length} onPageChange={handlePagination} />

      {/* Detail Modal */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Company Details: {selectedCompany.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <strong>Company ID:</strong> #{selectedCompany.company_id}
              </div>
              <div>
                <strong>Verification:</strong> {selectedCompany.is_verified ? 'Verified' : 'Pending'}
              </div>
              <div>
                <strong>HR Contact:</strong> {selectedCompany.hr_contact_email || '—'}
              </div>
              <div>
                <strong>Location:</strong> {selectedCompany.location || '—'}
              </div>
              <div>
                <strong>Registration Number:</strong> {selectedCompany.registration_number || '—'}
              </div>
              <div>
                <strong>Employee Count:</strong> {selectedCompany.employee_count ?? '—'}
              </div>
              <div>
                <strong>Created By User ID:</strong> {selectedCompany.created_by ?? 'None (Unowned)'}
              </div>
              <div>
                <strong>Verified By Admin ID:</strong> {selectedCompany.verified_by ?? '—'}
              </div>
              <div>
                <strong>CRO / LinkedIn:</strong> {selectedCompany.cro_linkedin || '—'}
              </div>
              <div>
                <strong>Created At:</strong> {new Date(selectedCompany.created_at).toLocaleString()}
              </div>
            </div>

            {selectedCompany.description && (
              <div style={{ marginTop: 16, fontSize: 13 }}>
                <strong>Description:</strong>
                <p style={{ margin: '6px 0 0 0', color: '#475569', lineHeight: 1.5 }}>
                  {selectedCompany.description}
                </p>
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: 20 }}>
              <button type="button" onClick={() => setSelectedCompany(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCompany && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: 18 }}>Confirm Company Deletion</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete company <strong>{deletingCompany.name}</strong>?
              This action cannot be undone and will delete all associated jobs.
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              Type <code>{deletingCompany.name}</code> to confirm:
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type exact company name here..."
              className="cms-input"
              style={{ width: '100%', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setDeletingCompany(null)
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
                disabled={isSubmitting || confirmInput.trim() !== deletingCompany.name.trim()}
                className="btn btn-danger"
              >
                {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompaniesClient
