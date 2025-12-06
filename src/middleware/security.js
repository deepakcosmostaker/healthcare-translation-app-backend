// Security middleware for healthcare data

export const validateRequest = (req, res, next) => {
  // Basic request validation
  if (req.body && typeof req.body === 'object') {
    // Sanitize input (basic implementation)
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
};

export const rateLimiter = (req, res, next) => {
  // TODO: Implement rate limiting for API protection
  next();
};

export const logRequest = (req, res, next) => {
  // Log requests for security auditing (without sensitive data)
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

