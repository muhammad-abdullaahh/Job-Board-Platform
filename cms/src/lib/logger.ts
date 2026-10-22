export interface StructuredLogPayload {
  staffEmail: string
  action: string
  target: string
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED'
  details?: Record<string, unknown>
  correlationId?: string | null
}

/**
 * Emits a structured JSON audit log entry for staff actions.
 * Never logs credentials, secrets, or tokens.
 */
export function logStaffAction(entry: StructuredLogPayload): void {
  // Sanitize details to ensure no sensitive fields accidentally leak
  const sanitizedDetails = entry.details ? { ...entry.details } : {}
  delete (sanitizedDetails as any).password
  delete (sanitizedDetails as any).token
  delete (sanitizedDetails as any).access_token
  delete (sanitizedDetails as any).secret
  delete (sanitizedDetails as any).authorization

  const logRecord = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    staff_email: entry.staffEmail,
    action: entry.action,
    target: entry.target,
    result: entry.result,
    correlation_id: entry.correlationId || null,
    details: sanitizedDetails,
  }

  // Structured single-line JSON log
  console.log(JSON.stringify(logRecord))
}
