const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Patient Routes
 * All routes require authentication
 */

// Create new patient
router.post('/',
    authMiddleware.protect,
    patientController.createPatient
);

// Get all patients or search
router.get('/',
    authMiddleware.protect,
    patientController.getPatients
);

// Get patient by ID
router.get('/:id',
    authMiddleware.protect,
    patientController.getPatient
);

// Update patient
router.put('/:id',
    authMiddleware.protect,
    patientController.updatePatient
);

// Get patient medical summary
router.get('/:id/summary',
    authMiddleware.protect,
    patientController.getPatientSummary
);

// Update vital signs
router.post('/:id/vital-signs',
    authMiddleware.protect,
    patientController.updateVitalSigns
);

// Add allergy
router.post('/:id/allergies',
    authMiddleware.protect,
    patientController.addAllergy
);

// Add medication
router.post('/:id/medications',
    authMiddleware.protect,
    patientController.addMedication
);

// Discharge patient
router.post('/:id/discharge',
    authMiddleware.protect,
    patientController.dischargePatient
);

module.exports = router;
