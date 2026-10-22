import React from 'react'

export const ReadOnlyBanner: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = true }) => {
  if (!isReadOnly) return null

  return (
    <div className="read-only-banner" role="alert">
      <span className="read-only-badge">SAFETY LOCK</span>
      <span>
        🔒 <strong>Read-Only Mode Active:</strong> Mutating actions (verify, lock, delete, status change)
        are blocked at the server boundary. Action buttons are disabled. Set <code>CMS_READ_ONLY=false</code> to enable mutations.
      </span>
    </div>
  )
}

export const ReadOnlyAction: React.FC = () => {
  const isReadOnly = (process.env.CMS_READ_ONLY ?? 'true').toLowerCase() !== 'false'
  if (!isReadOnly) return null

  return (
    <div className="read-only-action-pill">
      <span>🔒 READ-ONLY MODE</span>
    </div>
  )
}

export default ReadOnlyBanner
