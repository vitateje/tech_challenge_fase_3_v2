const patientService = require('../services/patientService');

/**
 * Patient Controller
 * Handles HTTP requests for patient management
 */
class PatientController {
    /**
     * POST /api/patients
     * Create a new patient
     */
    async createPatient(req, res) {
        try {
            const patientData = req.body;
            const patient = await patientService.createPatient(patientData);

            res.status(201).json({
                success: true,
                data: patient
            });

        } catch (error) {
            console.error('Error in createPatient:', error);
            res.status(500).json({
                error: 'Failed to create patient',
                message: error.message
            });
        }
    }

    /**
     * GET /api/patients/:id
     * Get patient by ID
     */
    async getPatient(req, res) {
        try {
            const { id } = req.params;
            const patient = await patientService.getPatientById(id);

            res.json({
                success: true,
                data: patient
            });

        } catch (error) {
            console.error('Error in getPatient:', error);
            res.status(404).json({
                error: 'Patient not found',
                message: error.message
            });
        }
    }

    /**
     * GET /api/patients
     * Get all active patients or search
     */
    async getPatients(req, res) {
        try {
            const { query, limit = 50, skip = 0 } = req.query;

            let patients;
            if (query) {
                patients = await patientService.searchPatients(query, {
                    limit: parseInt(limit),
                    skip: parseInt(skip)
                });
            } else {
                patients = await patientService.getActivePatients({
                    limit: parseInt(limit),
                    skip: parseInt(skip)
                });
            }

            res.json({
                success: true,
                data: patients,
                count: patients.length
            });

        } catch (error) {
            console.error('Error in getPatients:', error);
            res.status(500).json({
                error: 'Failed to get patients',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/patients/:id
     * Update patient
     */
    async updatePatient(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const patient = await patientService.updatePatient(id, updateData);

            res.json({
                success: true,
                data: patient
            });

        } catch (error) {
            console.error('Error in updatePatient:', error);
            res.status(500).json({
                error: 'Failed to update patient',
                message: error.message
            });
        }
    }

    /**
     * GET /api/patients/:id/summary
     * Get patient medical summary (for AI context)
     */
    async getPatientSummary(req, res) {
        try {
            const { id } = req.params;
            const summary = await patientService.getPatientMedicalSummary(id);

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('Error in getPatientSummary:', error);
            res.status(500).json({
                error: 'Failed to get patient summary',
                message: error.message
            });
        }
    }

    /**
     * POST /api/patients/:id/vital-signs
     * Update patient vital signs
     */
    async updateVitalSigns(req, res) {
        try {
            const { id } = req.params;
            const vitalSigns = req.body;

            const patient = await patientService.updateVitalSigns(id, vitalSigns);

            res.json({
                success: true,
                data: patient
            });

        } catch (error) {
            console.error('Error in updateVitalSigns:', error);
            res.status(500).json({
                error: 'Failed to update vital signs',
                message: error.message
            });
        }
    }

    /**
     * POST /api/patients/:id/allergies
     * Add allergy to patient
     */
    async addAllergy(req, res) {
        try {
            const { id } = req.params;
            const allergy = req.body;

            const patient = await patientService.addAllergy(id, allergy);

            res.json({
                success: true,
                data: patient
            });

        } catch (error) {
            console.error('Error in addAllergy:', error);
            res.status(500).json({
                error: 'Failed to add allergy',
                message: error.message
            });
        }
    }

    /**
     * POST /api/patients/:id/medications
     * Add medication to patient
     */
    async addMedication(req, res) {
        try {
            const { id } = req.params;
            const medication = req.body;

            const patient = await patientService.addMedication(id, medication);

            res.json({
                success: true,
                data: patient
            });

        } catch (error) {
            console.error('Error in addMedication:', error);
            res.status(500).json({
                error: 'Failed to add medication',
                message: error.message
            });
        }
    }

    /**
     * POST /api/patients/:id/discharge
     * Discharge patient
     */
    async dischargePatient(req, res) {
        try {
            const { id } = req.params;
            const patient = await patientService.dischargePatient(id);

            res.json({
                success: true,
                data: patient
            });

        } catch (error) {
            console.error('Error in dischargePatient:', error);
            res.status(500).json({
                error: 'Failed to discharge patient',
                message: error.message
            });
        }
    }
}

module.exports = new PatientController();
