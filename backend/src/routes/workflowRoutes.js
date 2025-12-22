const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Workflow Routes
 * All routes require authentication
 */

// Execute patient intake workflow
router.post('/patient-intake',
    authMiddleware.protect,
    workflowController.executePatientIntake
);

// Execute treatment suggestion workflow
router.post('/treatment-suggestion',
    authMiddleware.protect,
    workflowController.executeTreatmentSuggestion
);

// Execute exam verification workflow
router.post('/exam-verification',
    authMiddleware.protect,
    workflowController.executeExamVerification
);

// Get workflow status
router.get('/:workflowId/status',
    authMiddleware.protect,
    workflowController.getWorkflowStatus
);

module.exports = router;
