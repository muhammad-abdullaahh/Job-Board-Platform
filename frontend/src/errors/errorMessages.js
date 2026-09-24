/**
 * Centralized Error Messages and Error Handling Utilities
 * Ensures all user-facing error messages are clean, professional, and friendly,
 * preventing any internal technical jargon, framework names, stack traces,
 * IP addresses, or database connection strings from leaking to end users.
 */

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again in a few moments.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again later.',
  UNAUTHORIZED: 'Your session has expired or you are not logged in. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  LOGIN_FAILED: 'Invalid email or password.',
  REGISTRATION_FAILED: 'Failed to create account. Please verify your details and try again.',
  RESET_PASSWORD_FAILED: 'Failed to reset password. The reset token may be invalid or expired.',
  COMPANY_CREATE_FAILED: 'Failed to submit company profile for verification.',
  JOB_CREATE_FAILED: 'Failed to publish job listing.',
  APPLICATION_SUBMIT_FAILED: 'Failed to submit job application.',
};

/**
 * Machine-readable backend error code to user-facing message mapping (Plan Spec #13).
 * Gives the frontend full control over wording, tone, and localization.
 */
export const ERROR_CODE_MAPPINGS = {
  USER_NOT_FOUND: 'No user account found with that email address. Please check your credentials or register.',
  USER_ALREADY_EXISTS: 'An account with this email address already exists. Please log in or use another email.',
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again.',
  ACCOUNT_SUSPENDED: 'Your account has been deactivated or suspended. Please contact support.',
  FORBIDDEN_ACTION: 'You do not have permission to perform this action.',
  UNAUTHORIZED: 'Your session has expired or you are not logged in. Please log in again.',
  JOB_NOT_FOUND: 'The requested job posting could not be found or has been removed.',
  COMPANY_NOT_FOUND: 'The organization profile could not be found.',
  JOB_NOT_OPEN: 'This job posting is closed and no longer accepting applications.',
  APPLICATION_ALREADY_EXISTS: 'You have already submitted an application for this job posting.',
  APPLICATION_NOT_FOUND: 'The requested application could not be found.',
  INVALID_STATUS_TRANSITION: 'This application cannot be moved to that status at this stage.',
  OFFER_EXPIRED: 'The 48-hour response window for this job offer has expired.',
  INVALID_SALARY_RANGE: 'Minimum salary cannot be greater than maximum salary.',
  COMPANY_NOT_VERIFIED: 'Your company profile is pending administrator verification. Job postings will activate once approved.',
};

/**
 * Regex pattern identifying technical implementation details, stack traces,
 * server internals, framework identifiers, and local URLs that must NEVER be
 * exposed to end users.
 */
const SENSITIVE_TECHNICAL_PATTERNS = [
  /fastapi/i,
  /127\.0\.0\.1/,
  /localhost/i,
  /:\d{4,5}/, // port numbers like :8000
  /psycopg/i,
  /sqlalchemy/i,
  /traceback/i,
  /syntaxerror/i,
  /internal server error/i,
  /relation ".*" does not exist/i,
  /foreignkeyviolation/i,
  /integrityerror/i,
  /operationalerror/i,
  /database.*warming up/i,
  /server.*connecting/i,
  /\.py:\d+/i,
  /at line \d+/i,
  /c:\\users/i,
  /\/backend\//i,
  /\.env/i,
];

/**
 * Check whether a message contains internal technical details.
 */
export const containsTechnicalDetails = (text) => {
  if (typeof text !== 'string') return false;
  return SENSITIVE_TECHNICAL_PATTERNS.some((pattern) => pattern.test(text));
};

/**
 * Clean and sanitize a message string to guarantee safety.
 */
export const sanitizeErrorMessage = (message, fallback = ERROR_MESSAGES.UNEXPECTED_ERROR) => {
  if (!message || typeof message !== 'string') return fallback;
  const trimmed = message.trim();
  if (containsTechnicalDetails(trimmed)) {
    return fallback;
  }
  return trimmed;
};

/**
 * Determine if an Axios or fetch error is caused by a network disconnection or server offline.
 */
export const isNetworkError = (err) => {
  if (!err) return false;
  if (!err.response && (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || err.message === 'Network Error')) {
    return true;
  }
  if (!err.response && err.isAxiosError) {
    return true;
  }
  return false;
};

/**
 * Extracts a clean, human-friendly, user-facing error message from any error object.
 *
 * @param {any} err - The caught error object (Axios error, Error, string, etc.)
 * @param {string} [fallback] - Optional custom fallback message if error cannot be cleanly parsed
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (err, fallback) => {
  if (!err) {
    return fallback || ERROR_MESSAGES.UNEXPECTED_ERROR;
  }

  // 1. If error is already a string
  if (typeof err === 'string') {
    return sanitizeErrorMessage(err, fallback || ERROR_MESSAGES.UNEXPECTED_ERROR);
  }

  // 2. Network connectivity / server unreachable
  if (isNetworkError(err)) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // 2b. Check machine-readable error_code mapping from backend (Plan Spec #13)
  const backendCode = err.response?.data?.code;
  if (backendCode && ERROR_CODE_MAPPINGS[backendCode]) {
    return ERROR_CODE_MAPPINGS[backendCode];
  }

  // 3. HTTP 502 / 503 / 504 Gateway / Service Unavailable
  const status = err.response?.status;
  if (status === 502 || status === 503 || status === 504) {
    return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  }

  // 4. HTTP 500 Internal Server Error
  if (status === 500) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string' && !containsTechnicalDetails(detail)) {
      return detail;
    }
    return ERROR_MESSAGES.UNEXPECTED_ERROR;
  }

  // 5. FastAPI / Pydantic validation errors (HTTP 422)
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    const parsedMessages = detail
      .map((item) => {
        if (typeof item === 'string') return sanitizeErrorMessage(item, null);
        if (item && typeof item.msg === 'string') {
          // Extract last field name from loc array (e.g. ['body', 'email'])
          const field = Array.isArray(item.loc) && item.loc.length > 0 ? item.loc[item.loc.length - 1] : null;
          const cleanField = field && typeof field === 'string' && isNaN(field) && field !== '__root__' && field !== 'body'
            ? `${field.replace(/_/g, ' ')}: `
            : '';

          let msg = item.msg;
          if (typeof msg === 'string') {
            msg = msg.replace(/^Value error,\s*/i, '');
          }
          if (/value is not a valid email/i.test(msg)) {
            msg = 'Please enter a valid email address';
          }
          const formatted = `${cleanField}${msg}`;
          return sanitizeErrorMessage(formatted, null);
        }
        return null;
      })
      .filter(Boolean);

    if (parsedMessages.length > 0) {
      return parsedMessages.join(' • ');
    }
    return fallback || 'Invalid form input. Please verify your details.';
  }

  // 6. Object detail (e.g. { message: "..." })
  if (detail && typeof detail === 'object') {
    const msg = detail.msg || detail.message;
    if (typeof msg === 'string') {
      return sanitizeErrorMessage(msg, fallback || ERROR_MESSAGES.UNEXPECTED_ERROR);
    }
  }

  // 7. Standard string detail from backend
  if (typeof detail === 'string' && detail.trim()) {
    return sanitizeErrorMessage(detail, fallback || ERROR_MESSAGES.UNEXPECTED_ERROR);
  }

  // 8. Custom backend response message
  const backendMessage = err.response?.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return sanitizeErrorMessage(backendMessage, fallback || ERROR_MESSAGES.UNEXPECTED_ERROR);
  }

  // 9. Standard HTTP Status Fallbacks
  if (status === 401) return ERROR_MESSAGES.UNAUTHORIZED;
  if (status === 403) return ERROR_MESSAGES.FORBIDDEN;
  if (status === 404) return ERROR_MESSAGES.NOT_FOUND;

  // 10. Fallback provided by caller or general unexpected error
  return fallback || ERROR_MESSAGES.UNEXPECTED_ERROR;
};

export default ERROR_MESSAGES;
