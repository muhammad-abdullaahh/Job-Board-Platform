'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminAuditLogResponse } from '../lib/jobboard/client'
import { Pagination } from '../components/Pagination'

interface AuditLogsClientProps {
  logs: AdminAuditLogResponse[]
  actionFilter: string
  targetTypeFilter: string
  targetIdFilter: string
  fromDateFilter: string
  toDateFilter: string
  skip: number
  limit: number
}

export const AuditLogsClient: React.FC<AuditLogsClientProps> = ({
  logs,
  actionFilter,
  targetTypeFilter,
  targetIdFilter,
  fromDateFilter,
  toDateFilter,
  skip,
  limit,
}) => {
  const router = useRouter()
  const [action, setAction] = useState(actionFilter)
  const [targetType, setTargetType] = useState(targetTypeFilter)
  const [targetId, setTargetId] = useState(targetIdFilter)
  const [fromDate, setFromDate] = useState(fromDateFilter)
  const [toDate, setToDate] = useState(toDateFilter)
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogResponse | null>(null)

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (action.trim()) params.set('action', action.trim())
    if (targetType.trim() && targetType !== 'all') params.set('target_type', targetType.trim())
    if (targetId.trim()) params.set('target_id', targetId.trim())
    if (fromDate.trim()) params.set('from_date', fromDate.trim())
    if (toDate.trim()) params.set('to_date', toDate.trim())
    params.set('skip', '0')
    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  const handlePagination = (newSkip: number) => {
    const params = new URLSearchParams()
    if (action.trim()) params.set('action', action.trim())
    if (targetType.trim() && targetType !== 'all') params.set('target_type', targetType.trim())
    if (targetId.trim()) params.set('target_id', targetId.trim())
    if (fromDate.trim()) params.set('from_date', fromDate.trim())
    if (toDate.trim()) params.set('to_date', toDate.trim())
    params.set('skip', String(newSkip))
    router.push(`/admin/audit-logs?${params.toString()}`)
  }

  return (
    <div>
      {/* Filter Bar */}
      <form onSubmit={handleApplyFilters} className="cms-toolbar">
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Action
          </label>
          <input
            type="text"
            placeholder="e.g. USER_LOCKED"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="cms-input"
            style={{ width: 160 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Target Type
          </label>
          <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="cms-select">
            <option value="all">All Targets</option>
            <option value="company">company</option>
            <option value="user">user</option>
            <option value="job">job</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
            Target ID
          </label>
          <input
            type="number"
            placeholder="e.g. 1"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="cms-input"
            style={{ width: 90 }}
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
            Filter Logs
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="cms-table-wrapper">
        <table className="cms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp (UTC)</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  No audit trail records found matching current criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actor = log.actor_label || `Admin User #${log.admin_user_id}`
                const target = `${log.target_type} #${log.target_id}`

                return (
                  <tr key={log.id}>
                    <td>
                      <code>#{log.id}</code>
                    </td>
                    <td style={{ fontSize: 13, color: '#475569' }}>
                      {new Date(log.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td>
                      <strong>{actor}</strong>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <code>{target}</code>
                    </td>
                    <td style={{ maxWidth: 220, fontSize: 12, color: '#64748b' }}>
                      {log.details ? JSON.stringify(log.details).slice(0, 50) + '...' : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} limit={limit} count={logs.length} onPageChange={handlePagination} />

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Audit Log Record #{selectedLog.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
              <div>
                <strong>Action:</strong> {selectedLog.action}
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date(selectedLog.created_at).toISOString()}
              </div>
              <div>
                <strong>Actor:</strong> {selectedLog.actor_label || `Admin User #${selectedLog.admin_user_id}`}
              </div>
              <div>
                <strong>Target:</strong> {selectedLog.target_type} #{selectedLog.target_id}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13 }}>
              <strong>Structured Details:</strong>
              <pre
                style={{
                  marginTop: 6,
                  padding: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 12,
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div style={{ textAlign: 'right', marginTop: 20 }}>
              <button type="button" onClick={() => setSelectedLog(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogsClient
