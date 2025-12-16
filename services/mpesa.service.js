/**
 * M-Pesa service for handling Daraja API interactions
 * Implements secure token caching, STK Push, and callback handling
 */

const axios = require('axios');

class MpesaService {
  constructor() {
    // Determine base URL based on environment
    this.baseUrl = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    // Token caching properties
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Retrieves and caches OAuth access token
   * @returns {Promise<string>} Access token
   * @throws {Error} If token retrieval fails
   */
  async getAccessToken() {
    try {
      // Return cached token if still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Prepare basic auth header
      const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
      ).toString('base64');

      // Request new token with timeout
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          },
          timeout: 10000 // 10 seconds timeout for security
        }
      );

      // Cache token with safety margin (5 minutes before expiry)
      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      // Log error without exposing sensitive data
      console.error('Failed to retrieve M-Pesa access token:', error.message);
      throw new Error('Unable to authenticate with M-Pesa API');
    }
  }

  /**
   * Initiates STK Push transaction
   * @param {number} amount - Transaction amount
   * @param {string} phoneNumber - Normalized phone number (254XXXXXXXXX)
   * @param {string} accountReference - Account reference
   * @param {string} transactionDesc - Transaction description
   * @returns {Promise<Object>} STK Push response data
   * @throws {Error} If STK Push fails
   */
  async initiateSTKPush(amount, phoneNumber, accountReference, transactionDesc) {
    try {
      // Get valid access token
      const token = await this.getAccessToken();

      // Generate timestamp and password
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
      ).toString('base64');

      // Prepare STK Push payload
      const payload = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      // Send STK Push request with timeout
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout for STK Push
        }
      );

      return response.data;
    } catch (error) {
      // Log error without exposing sensitive data
      console.error('STK Push request failed:', error.message);
      throw new Error('Failed to initiate STK Push transaction');
    }
  }

  /**
   * Handles M-Pesa callback data safely
   * @param {Object} callbackData - Callback payload from M-Pesa
   * @returns {Object} Processing result
   */
  handleCallback(callbackData) {
    try {
      // Safely log callback data for debugging (avoid logging in production)
      if (process.env.MPESA_ENV === 'sandbox') {
        console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));
      }

      // Validate callback structure
      if (!callbackData || typeof callbackData !== 'object') {
        return { success: false, message: 'Invalid callback data structure' };
      }

      // Here you would typically:
      // 1. Validate the callback signature (if implemented)
      // 2. Update transaction status in database
      // 3. Send notifications
      // 4. Process business logic

      // For this implementation, we just acknowledge receipt
      return {
        success: true,
        message: 'Callback processed successfully',
        // Include relevant data for response if needed
      };
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error.message);
      return { success: false, message: 'Callback processing failed' };
    }
  }
}

// Export singleton instance
module.exports = new MpesaService();