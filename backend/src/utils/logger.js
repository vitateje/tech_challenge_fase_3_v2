/**
 * Simple structured logger used across the application.
 * Implemented in a minimal way to avoid external dependencies.
 */

/**
 * Log informational events in a structured format.
 * @param {string} source - Logical source (e.g. 'MedicalAssistantChain')
 * @param {string} message - Human readable message
 * @param {object} [meta] - Optional metadata for debugging/analytics
 */
async function logInfo(source, message, meta = {}) {
  const payload = {
    level: 'info',
    source,
    message,
    meta,
    timestamp: new Date().toISOString()
  };

  // For now, just log to stdout. This can be replaced by a real logger later.
  console.log(JSON.stringify(payload));
}

/**
 * Log errors in a structured format.
 * @param {string} source - Logical source (e.g. 'MedicalAssistantChain')
 * @param {string} message - Human readable message
 * @param {object} [meta] - Optional metadata including original error
 */
async function logError(source, message, meta = {}) {
  const payload = {
    level: 'error',
    source,
    message,
    meta,
    timestamp: new Date().toISOString()
  };

  // For now, just log to stderr. This can be replaced by a real logger later.
  console.error(JSON.stringify(payload));
}

module.exports = {
  logInfo,
  logError
};


