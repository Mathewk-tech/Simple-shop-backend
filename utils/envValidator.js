/**
 * Environment variable validation utility
 * Ensures all required M-Pesa configuration is present at startup
 * Logs errors but does not crash the server for graceful degradation
 */

const requiredEnvVars = [
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_SHORTCODE',
  'MPESA_PASSKEY',
  'MPESA_CALLBACK_URL',
  'MPESA_ENV'
];

/**
 * Validates all required environment variables
 * @returns {string[]} Array of validation error messages
 */
function validateEnvironment() {
  const errors = [];

  // Check for missing required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Additional validation for MPESA_ENV
  if (process.env.MPESA_ENV && !['sandbox', 'production'].includes(process.env.MPESA_ENV)) {
    errors.push('MPESA_ENV must be either "sandbox" or "production"');
  }

  // Validate callback URL format (basic check)
  if (process.env.MPESA_CALLBACK_URL) {
    try {
      const url = new URL(process.env.MPESA_CALLBACK_URL);
      if (url.protocol !== 'https:' && process.env.MPESA_ENV === 'production') {
        errors.push('MPESA_CALLBACK_URL must use HTTPS in production environment');
      }
    } catch (error) {
      errors.push('MPESA_CALLBACK_URL must be a valid URL');
    }
  }

  return errors;
}

module.exports = { validateEnvironment };