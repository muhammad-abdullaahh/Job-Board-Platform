'use client'

import React from 'react'

interface PaginationProps {
  skip: number
  limit: number
  count: number
  onPageChange: (newSkip: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  skip,
  limit,
  count,
  onPageChange,
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--cms-text-muted)' }}>
        Showing up to {limit} records per page (Offset: {skip})
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, skip - limit))}
          disabled={skip === 0}
          className="btn btn-secondary"
        >
          ← Previous Page
        </button>
        <button
          type="button"
          onClick={() => onPageChange(skip + limit)}
          disabled={count < limit}
          className="btn btn-secondary"
        >
          Next Page →
        </button>
      </div>
    </div>
  )
}
