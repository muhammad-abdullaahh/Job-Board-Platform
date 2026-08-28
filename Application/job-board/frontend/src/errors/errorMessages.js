export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  LOGIN_FAILED: 'Invalid email or password.',
  REGISTRATION_FAILED: 'Failed to create account. Email may already be registered.',
  RESET_PASSWORD_FAILED: 'Failed to reset password. The reset token may be invalid or expired.',
  COMPANY_CREATE_FAILED: 'Failed to submit company profile for verification.',
  JOB_CREATE_FAILED: 'Failed to publish job listing.',
  APPLICATION_SUBMIT_FAILED: 'Failed to submit job application.',
};

export default ERROR_MESSAGES;
