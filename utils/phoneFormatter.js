/**
 * Phone number formatting utility for Kenyan mobile numbers
 * Normalizes various input formats to the required 254XXXXXXXXX format
 */

/**
 * Normalizes a phone number to Kenyan format (254XXXXXXXXX)
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string|null} Normalized phone number or null if invalid
 */
function normalizePhoneNumber(phoneNumber) {
  // Input validation - reject null, undefined, or non-string inputs
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  // Remove all non-digit characters to handle spaces, dashes, etc.
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different input formats:
  // 1. Starts with 0 and 10 digits (e.g., 0712345678) -> 254712345678
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1);
  }
  // 2. Already in correct format (254XXXXXXXXX)
  else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // Already correct
  }
  // 3. Starts with 7 and 9 digits (e.g., 712345678) -> 254712345678
  else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  // 4. Invalid format
  else {
    return null;
  }

  // Final validation: must be 12 digits starting with 254
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return cleaned;
  }

  return null;
}

module.exports = { normalizePhoneNumber };