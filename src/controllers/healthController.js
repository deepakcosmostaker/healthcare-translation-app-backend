/**
 * Health Controller
 * Handles health check and system status
 */

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const healthCheck = (req, res) => {
  // Check if required services are configured
  const services = {
    gemini: !!process.env.GEMINI_API_KEY,
    assemblyai: !!process.env.ASSEMBLYAI_API_KEY
  };

  const allServicesConfigured = Object.values(services).every(Boolean);

  res.json({ 
    status: 'ok',
    message: 'Healthcare Translation API is running',
    timestamp: new Date().toISOString(),
    services: {
      ...services,
      allConfigured: allServicesConfigured
    },
    version: process.env.npm_package_version || '1.0.0'
  });
};

