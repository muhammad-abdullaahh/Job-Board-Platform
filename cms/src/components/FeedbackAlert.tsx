'use client'

import React from 'react'

export interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

interface FeedbackAlertProps {
  feedback: FeedbackMessage | null
  onDismiss: () => void
}

export const FeedbackAlert: React.FC<FeedbackAlertProps> = ({ feedback, onDismiss }) => {
  if (!feedback) return null

  return (
    <div
      className={`cms-alert ${feedback.type === 'success' ? 'cms-alert-success' : 'cms-alert-danger'}`}
      role="alert"
    >
      <span>{feedback.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
        aria-label="Dismiss message"
      >
        ✕
      </button>
    </div>
  )
}
