
/**
 * Global Error Handler Middleware
 * Specifically handles Database connection errors like those when Aiven is hibernating/sleeping.
 */
function errorHandler(err, req, res, next) {
  // Log the error for debugging
  console.error('SERVER_ERROR:', err);

  // Check for Database Connection Errors (Aiven Sleep/Hibernation)
  const isDbConnectionError = 
    err.code === 'ECONNREFUSED' || 
    err.code === 'ETIMEDOUT' || 
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    err.message?.toLowerCase().includes('connection') ||
    err.message?.toLowerCase().includes('waking up');

  if (isDbConnectionError) {
    const message = 'The database is waking up. Please try again in 10 seconds.';
    
    // Check if the request expects HTML (like a browser page)
    if (req.accepts('html')) {
        return res.status(503).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #f8f9fa;">
                <h1 style="color: #333;">🚀 Server is Waking Up</h1>
                <p style="color: #666; font-size: 1.1em;">Our database is currently starting up from its sleep mode.</p>
                <p style="color: #888;">This happens during periods of low traffic. It usually takes 5-10 seconds.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; margin-top: 20px;">
                    Try Again Now
                </button>
                <script>setTimeout(() => window.location.reload(), 8000);</script>
            </div>
        `);
    }

    return res.status(503).json({
      error: 'Service Unavailable',
      message: message,
      retryAfter: 10
    });
  }

  // Handle other specific errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Default internal server error
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred.' 
      : err.message
  });
}

module.exports = errorHandler;
