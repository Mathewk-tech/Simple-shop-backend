/**
 * M-Pesa API routes
 * Handles STK Push requests and callback processing
 */

const express = require('express');
const router = express.Router();
const mpesaService = require('../services/mpesa.service');
const { normalizePhoneNumber } = require('../utils/phoneFormatter');

// POST /api/mpesa/stk-push
router.post('/stk-push', async (req, res) => {
  try {
    // Extract and validate request body
    const { amount, phoneNumber, accountReference, transactionDesc } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 150000) {
      return res.status(400).json({
        error: 'Invalid amount. Must be a positive number not exceeding KES 150,000.'
      });
    }

    // Validate phone number
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return res.status(400).json({
        error: 'Invalid phone number format. Must be a valid Kenyan mobile number.'
      });
    }

    // Validate account reference
    if (!accountReference || typeof accountReference !== 'string' || accountReference.length > 20) {
      return res.status(400).json({
        error: 'Invalid account reference. Must be a non-empty string (max 20 characters).'
      });
    }

    // Validate transaction description
    if (!transactionDesc || typeof transactionDesc !== 'string' || transactionDesc.length > 100) {
      return res.status(400).json({
        error: 'Invalid transaction description. Must be a non-empty string (max 100 characters).'
      });
    }

    // Sanitize inputs to prevent injection
    const sanitizedAccountRef = accountReference.replace(/[<>\"'&]/g, '');
    const sanitizedDesc = transactionDesc.replace(/[<>\"'&]/g, '');

    // Initiate STK Push
    const result = await mpesaService.initiateSTKPush(
      amount,
      normalizedPhone,
      sanitizedAccountRef,
      sanitizedDesc
    );

    // Return success response with relevant data
    res.status(200).json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        merchantRequestId: result.MerchantRequestID,
        checkoutRequestId: result.CheckoutRequestID,
        responseCode: result.ResponseCode,
        responseDescription: result.ResponseDescription,
        customerMessage: result.CustomerMessage
      }
    });

  } catch (error) {
    // Log error for debugging (without exposing sensitive data)
    console.error('STK Push endpoint error:', error.message);

    // Return generic error response
    res.status(500).json({
      error: 'Unable to process payment request. Please try again later.'
    });
  }
});

// POST /api/mpesa/callback
router.post('/callback', (req, res) => {
  try {
    // Extract callback data
    const callbackData = req.body;

    // Process callback safely
    const result = mpesaService.handleCallback(callbackData);

    // Always return 200 to acknowledge receipt (M-Pesa requirement)
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      // Still return 200 but indicate processing failure
      res.status(200).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    // Log error for debugging
    console.error('Callback endpoint error:', error.message);

    // Return 200 to prevent M-Pesa retries (as per their guidelines)
    res.status(200).json({
      success: false,
      message: 'Callback processing encountered an error'
    });
  }
});

module.exports = router;