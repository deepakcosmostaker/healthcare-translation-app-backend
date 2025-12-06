// Error handling middleware

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
  
  // Return simple error message to client
  let errorMessage = 'Internal server error';
  if (statusCode === 404) {
    errorMessage = 'Not found';
  } else if (statusCode === 400) {
    errorMessage = 'Bad request';
  }

  res.status(statusCode).json({
    error: errorMessage
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

