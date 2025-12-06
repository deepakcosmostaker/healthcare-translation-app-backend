// Error handling middleware

/**
 * Global error handler middleware
 * Handles all errors thrown in controllers and routes
 */
export const errorHandler = (err, req, res, next) => {
  // Log error with limited stack trace to console
  console.error('Error:', err.message);
  if (err.cause) {
    console.error('Caused by:', err.cause.message);
  }
  // Print first few lines of stack trace only
  if (err.stack) {
    const stackLines = err.stack.split('\n').slice(0, 4);
    stackLines.forEach(line => console.error(line));
  }

  const statusCode = err.statusCode || 500;
  
  // Determine error message based on error type and status code
  let errorMessage = 'Internal server error';
  
  if (statusCode === 404) {
    errorMessage = 'Not found';
  } else if (statusCode === 400) {
    errorMessage = err.message || 'Bad request';
  } else if (statusCode === 401) {
    errorMessage = 'Unauthorized';
  } else if (statusCode === 403) {
    errorMessage = 'Forbidden';
  } else if (statusCode === 429) {
    errorMessage = 'Too many requests';
  } else if (statusCode === 503) {
    errorMessage = 'Service unavailable';
  } else if (err.message && err.message.includes('Translation failed')) {
    errorMessage = 'Translation failed. Please try again.';
  } else if (err.message && err.message.includes('Transcription failed')) {
    errorMessage = 'Transcription failed. Please check your audio data and try again.';
  } else if (err.message && err.message.includes('API key')) {
    errorMessage = 'Service configuration error';
    // Don't expose API key issues to client
  }

  res.status(statusCode).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      path: req.path
    })
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

