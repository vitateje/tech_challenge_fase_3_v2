const mongoose = require('mongoose');

/**
 * Conversation Model
 * Stores doctor ⇄ assistant conversations with RAG and explainability traces
 */
const ConversationSchema = new mongoose.Schema({
  // Who is using the assistant
  doctorId: {
    type: String,
    index: true,
  },

  // Link to the patient (can use anonymized or business id)
  patientId: {
    type: String,
    index: true,
  },

  // Optional session id (web/app session, workflow instance, etc.)
  sessionId: {
    type: String,
    index: true,
  },

  // Messages exchanged in the conversation
  messages: [{
    role: {
      type: String,
      enum: ['doctor', 'assistant', 'system', 'user'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // RAG sources used to generate this message
    ragSources: [{
      type: mongoose.Schema.Types.Mixed,
    }],

    // Explainability / reasoning trace for this message
    explainabilityTrace: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  collection: 'conversations',
  timestamps: true,
});

module.exports = mongoose.model('Conversation', ConversationSchema);


