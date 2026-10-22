'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserResponse } from '../lib/jobboard/client'
import { lockUserAction, unlockUserAction, deleteUserAction } from '../actions/adminActions'
import { Pagination } from '../components/Pagination'
import { FeedbackAlert, type FeedbackMessage } from '../components/FeedbackAlert'

interface UsersClientProps {
  users: UserResponse[]
  statusFilter: string
  adminFilter: string
  searchFilter: string
  skip: number
  limit: number
  userRole: string
  isReadOnly: boolean
}

export const UsersClient: React.FC<UsersClientProps> = ({
  users,
  statusFilter,
  adminFilter,
  searchFilter,
  skip,
  limit,
  userRole,
  isReadOnly,
}) => {
  const router = useRouter()
  const [status, setStatus] = useState(statusFilter)
  const [isAdminOnly, setIsAdminOnly] = useState(adminFilter)
  const [search, setSearch] = useState(searchFilter)

  // Modals state
  const [lockingUser, setLockingUser] = useState<UserResponse | null>(null)
  const [lockReason, setLockReason] = useState('')

  const [deletingUser, setDeletingUser] = useState<{ user: UserResponse; hard: boolean } | null>(null)
  const [confirmEmail, setConfirmEmail] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('active', status)
    if (isAdminOnly && isAdminOnly !== 'all') params.set('is_admin', isAdminOnly)
    if (search.trim()) params.set('q', search.trim())
    params.set('skip', '0')
    router.push(`/admin/users?${params.toString()}`)
  }

  const handlePagination = (newSkip: number) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('active', status)
    if (isAdminOnly && isAdminOnly !== 'all') params.set('is_admin', isAdminOnly)
    if (search.trim()) params.set('q', search.trim())
    params.set('skip', String(newSkip))
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleLockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly || !lockingUser) return
    if (!lockReason.trim()) {
      setFeedback({ type: 'error', message: 'A reason is required to lock an account.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)
    const res = await lockUserAction(lockingUser.user_id, lockReason.trim())
    setIsSubmitting(false)
    if (res.success) {
      setFeedback({ type: 'success', message: `User "${lockingUser.email}" locked successfully.` })
      setLockingUser(null)
      setLockReason('')
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to lock user' })
    }
  }

  const handleUnlock = async (user: UserResponse) => {
    if (isReadOnly) return
    setIsSubmitting(true)
    setFeedback(null)
    const res = await unlockUserAction(user.user_id)
    setIsSubmitting(false)
    if (res.success) {
      setFeedback({ type: 'success', message: `User "${user.email}" unlocked successfully.` })
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to unlock user' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (isReadOnly || !deletingUser) return
    if (confirmEmail.trim().toLowerCase() !== deletingUser.user.email.trim().toLowerCase()) return

    setIsSubmitting(true)
    setFeedback(null)
    const res = await deleteUserAction(deletingUser.user.user_id, deletingUser.hard)
    setIsSubmitting(false)
    if (res.success) {
      const mode = deletingUser.hard ? 'permanently hard-deleted' : 'soft-deleted'
      setFeedback({ type: 'success', message: `User "${deletingUser.user.email}" ${mode} successfully.` })
      setDeletingUser(null)
      setConfirmEmail('')
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to delete user' })
    }
  }

  const isStaffAdmin = userRole === 'admin'

  return (
    <div>
      <FeedbackAlert feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* Filter and Search Bar */}
      <form onSubmit={handleApplyFilters} className="cms-toolbar">
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Status Filter
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="cms-select">
            <option value="all">All Users</option>
            <option value="true">Active Only</option>
            <option value="false">Locked Only</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Role Filter
          </label>
          <select value={isAdminOnly} onChange={(e) => setIsAdminOnly(e.target.value)} className="cms-select">
            <option value="all">All Roles</option>
            <option value="true">Admins Only</option>
            <option value="false">Standard Users Only</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Search by Name or Email
          </label>
          <input
            type="text"
            placeholder="Type name or email..."
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
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Experience</th>
              <th>Lock Reason / Notice</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isUserAdmin = Boolean(u.is_admin)
                const isLocked = !u.is_active
                const isSoftDeleted = Boolean(u.deleted_at)
                const canHardDelete = isStaffAdmin && (isLocked || isSoftDeleted)

                return (
                  <tr key={u.user_id}>
                    <td>
                      <code>#{u.user_id}</code>
                    </td>
                    <td>
                      <strong>{u.name}</strong>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      {isUserAdmin ? (
                        <span className="badge badge-warning">Admin</span>
                      ) : (
                        <span className="badge badge-neutral">User</span>
                      )}
                    </td>
                    <td>
                      {isSoftDeleted ? (
                        <span className="badge badge-danger">Soft Deleted</span>
                      ) : isLocked ? (
                        <span className="badge badge-danger">Locked</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td>{u.years_of_experience ?? 0} yrs</td>
                    <td style={{ maxWidth: 220, fontSize: 12, color: '#64748b' }}>
                      {u.lock_reason ? (
                        <span>
                          <strong>Reason:</strong> {u.lock_reason}
                        </span>
                      ) : isSoftDeleted ? (
                        <span>Deleted by admin #{u.deleted_by || '?'}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {/* Hide all actions for accounts with is_admin = true */}
                      {isUserAdmin ? (
                        <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                          Protected Admin
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {isLocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnlock(u)}
                              disabled={isReadOnly || isSubmitting}
                              className="btn btn-secondary"
                              title={isReadOnly ? 'Disabled in read-only mode' : 'Unlock user account'}
                            >
                              Unlock
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setLockingUser(u)
                                setLockReason('')
                              }}
                              disabled={isReadOnly || isSubmitting}
                              className="btn btn-secondary"
                              title={isReadOnly ? 'Disabled in read-only mode' : 'Lock account (requires reason)'}
                            >
                              Lock...
                            </button>
                          )}

                          {isStaffAdmin && (
                            <>
                              {!isSoftDeleted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingUser({ user: u, hard: false })
                                    setConfirmEmail('')
                                  }}
                                  disabled={isReadOnly || isSubmitting}
                                  className="btn btn-secondary"
                                  title={isReadOnly ? 'Disabled in read-only mode' : 'Soft delete user'}
                                >
                                  Soft Delete
                                </button>
                              )}

                              {canHardDelete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingUser({ user: u, hard: true })
                                    setConfirmEmail('')
                                  }}
                                  disabled={isReadOnly || isSubmitting}
                                  className="btn btn-danger"
                                  title={
                                    isReadOnly
                                      ? 'Disabled in read-only mode'
                                      : 'Permanently hard-delete user (allowed because locked/soft-deleted)'
                                  }
                                >
                                  Hard Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination skip={skip} limit={limit} count={users.length} onPageChange={handlePagination} />

      {/* Lock Modal */}
      {lockingUser && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 700 }}>
              Lock User Account: {lockingUser.email}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              Locking prevents the user from logging in, refreshing sessions, posting jobs, or applying.
              A reason is mandatory.
            </p>
            <form onSubmit={handleLockSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Lock Reason (Required):
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="e.g. Terms violation, suspicious activity, request by user..."
                  className="cms-input"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setLockingUser(null)
                    setLockReason('')
                  }}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !lockReason.trim()}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Locking...' : 'Confirm Lock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Soft / Hard) */}
      {deletingUser && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: 18 }}>
              Confirm {deletingUser.hard ? 'Permanent Hard Delete' : 'Soft Delete'}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              {deletingUser.hard
                ? `You are about to permanently eradicate user "${deletingUser.user.email}". This cannot be undone.`
                : `You are about to soft-delete user "${deletingUser.user.email}".`}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              Type <code>{deletingUser.user.email}</code> to confirm:
            </p>
            <input
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Type exact user email here..."
              className="cms-input"
              style={{ width: '100%', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setDeletingUser(null)
                  setConfirmEmail('')
                }}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={
                  isSubmitting ||
                  confirmEmail.trim().toLowerCase() !== deletingUser.user.email.trim().toLowerCase()
                }
                className="btn btn-danger"
              >
                {isSubmitting
                  ? 'Deleting...'
                  : deletingUser.hard
                  ? 'Permanently Hard Delete'
                  : 'Soft Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersClient
