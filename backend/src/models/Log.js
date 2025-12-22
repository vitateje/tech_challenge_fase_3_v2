const mongoose = require('mongoose');

/**
 * Log Model
 * Stores system logs for observability and explainability
 */
const LogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },

  // Log level (info, warn, error, debug, etc.)
  level: {
    type: String,
    enum: ['debug', 'info', 'warn', 'error'],
    default: 'info',
    index: true,
  },

  // Logical module or component that generated the log
  module: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  // Short human-readable message
  message: {
    type: String,
    required: true,
    trim: true,
  },

  // Optional correlation identifiers
  requestId: {
    type: String,
    index: true,
  },
  sessionId: {
    type: String,
    index: true,
  },
  doctorId: {
    type: String,
    index: true,
  },
  patientId: {
    type: String,
    index: true,
  },

  // Model and RAG metadata (for auditability)
  model: {
    type: String,
  },
  latencyMs: {
    type: Number,
  },

  // Optional explainability and RAG trace for debugging
  explainabilityTrace: {
    type: String,
  },
  ragSources: [{
    type: mongoose.Schema.Types.Mixed,
  }],

  // Free-form metadata for structured data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  collection: 'system_logs',
  timestamps: true,
});

module.exports = mongoose.model('Log', LogSchema);


