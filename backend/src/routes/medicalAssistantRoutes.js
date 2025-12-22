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

module.exports = router;
