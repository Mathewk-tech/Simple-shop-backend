# M-Pesa STK Push Backend

A secure, crash-safe Node.js Express backend for integrating with Safaricom's M-Pesa Daraja API STK Push functionality.

## Features

- ✅ **Crash-safe**: Never crashes due to missing config or API errors
- 🔒 **Secure**: Environment variables, input validation, timeouts
- 📱 **STK Push**: Initiate mobile payments via M-Pesa
- 🔄 **Callback Handling**: Process payment confirmations
- 🛡️ **Defensive Programming**: Comprehensive error handling
- 🌐 **CORS Enabled**: Ready for frontend integration

## Frontend Integration

This backend includes CORS (Cross-Origin Resource Sharing) support to allow your frontend application to make requests:

- **Development**: All origins allowed by default
- **Production**: Configure `FRONTEND_URL` in your `.env` file for security

### Example Frontend Request

```javascript
// From your frontend (e.g., React, Vue, etc.)
const initiatePayment = async (paymentData) => {
  try {
    const response = await fetch('http://localhost:3000/api/mpesa/stk-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 100,
        phoneNumber: '0712345678',
        accountReference: 'ORDER123',
        transactionDesc: 'Payment for order'
      })
    });
    
    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## Project Structure

```
├── server.js              # Main application entry point
├── routes/
│   └── mpesa.routes.js    # M-Pesa API endpoints
├── services/
│   └── mpesa.service.js   # M-Pesa API integration logic
├── utils/
│   ├── envValidator.js    # Environment variable validation
│   └── phoneFormatter.js  # Phone number normalization
├── package.json           # Dependencies and scripts
└── .env.example           # Environment variables template
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your M-Pesa credentials from the [Daraja Portal](https://developer.safaricom.co.ke/):

   ```env
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
   MPESA_ENV=sandbox
   PORT=3000
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
```http
GET /health
```

### Initiate STK Push
```http
POST /api/mpesa/stk-push
Content-Type: application/json

{
  "amount": 100,
  "phoneNumber": "0712345678",
  "accountReference": "ORDER123",
  "transactionDesc": "Payment for order"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push initiated successfully",
  "data": {
    "merchantRequestId": "...",
    "checkoutRequestId": "...",
    "responseCode": "0",
    "responseDescription": "Success. Request accepted for processing",
    "customerMessage": "..."
  }
}
```

### Callback Handler
```http
POST /api/mpesa/callback
```

This endpoint receives payment confirmations from M-Pesa.

## Security Features

- **Environment Validation**: Checks all required variables at startup
- **Input Sanitization**: Validates and cleans all user inputs
- **Timeout Protection**: API calls have reasonable timeouts
- **Error Handling**: All errors are caught and logged safely
- **No Secrets in Logs**: Sensitive data never exposed in responses
- **HTTPS Enforcement**: Callback URLs must be HTTPS in production

## Error Handling

The server implements comprehensive error handling:

- **Validation Errors**: 400 status with descriptive messages
- **API Failures**: 500 status with generic messages
- **Configuration Issues**: Logged at startup, server continues running
- **Uncaught Errors**: Caught by global handlers, logged, server stays up

## Testing

Test the STK Push endpoint:

```bash
curl -X POST http://localhost:3000/api/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "phoneNumber": "0712345678",
    "accountReference": "TEST001",
    "transactionDesc": "Test payment"
  }'
```

### Frontend Testing

If your frontend is running on a different port (e.g., `http://localhost:3001`), you can now make direct API calls from your frontend code without CORS errors.

## Production Deployment

1. Set `MPESA_ENV=production`
2. Ensure `MPESA_CALLBACK_URL` uses HTTPS
3. Use a process manager like PM2
4. Set up monitoring and logging
5. Configure firewall and security groups

## License

ISC