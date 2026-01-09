const express = require('express');
const router = express.Router();
const medicalAssistantController = require('../controllers/medicalAssistantController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Medical Assistant Routes
 * All routes require authentication
 */

// Process medical query
router.post('/query',
    authMiddleware.protect,
    medicalAssistantController.processQuery
);

// Get query history for current doctor
router.get('/history',
    authMiddleware.protect,
    medicalAssistantController.getHistory
);

// Get query history for a specific patient
router.get('/patient/:patientId/history',
    authMiddleware.protect,
    medicalAssistantController.getPatientHistory
);

// Get queries requiring review
router.get('/review-queue',
    authMiddleware.protect,
    medicalAssistantController.getReviewQueue
);

// Submit feedback for a query
router.post('/query/:queryId/feedback',
    authMiddleware.protect,
    medicalAssistantController.submitFeedback
);

// Mark query as reviewed
router.post('/query/:queryId/review',
    authMiddleware.protect,
    medicalAssistantController.markAsReviewed
);

// Test RAG connection
router.get('/rag/test',
    authMiddleware.protect,
    medicalAssistantController.testRAGConnection
);

// Search medical knowledge base using RAG
router.post('/rag/search',
    authMiddleware.protect,
    medicalAssistantController.searchRAG
);

module.exports = router;
