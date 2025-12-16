/**
 * Main server file for M-Pesa STK Push backend
 * Implements crash-safe startup with environment validation
 */

require('dotenv').config();

const express = require('express');
const { validateEnvironment } = require('./utils/envValidator');
const mpesaRoutes = require('./routes/mpesa.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment variables at startup
// Log errors but do not crash - allows graceful degradation
const envErrors = validateEnvironment();
if (envErrors.length > 0) {
  console.error('🚨 Environment validation errors detected:');
  envErrors.forEach(error => console.error(`   - ${error}`));
  console.warn('⚠️  Server starting with configuration issues. Some features may not work.');
} else {
  console.log('✅ Environment validation passed');
}

// Security middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size for security
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (basic)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.MPESA_ENV || 'unknown',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/mpesa', mpesaRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handling middleware
// Prevents uncaught errors from crashing the server
app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err.message);
  console.error('Stack trace:', err.stack);

  // Return generic error response
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Process-level error handlers
// Prevent uncaught exceptions from crashing the server
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Stack trace:', err.stack);
  // In production, you might want to restart the process or alert monitoring
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to restart the process or alert monitoring
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 M-Pesa Environment: ${process.env.MPESA_ENV || 'unknown'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Export for testing purposes
module.exports = app;