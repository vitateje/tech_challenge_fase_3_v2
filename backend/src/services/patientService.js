const Patient = require('../models/Patient');

/**
 * Patient Service
 * Handles all patient-related operations
 */
class PatientService {
    /**
     * Create a new patient
     */
    async createPatient(patientData) {
        try {
            const patient = new Patient(patientData);
            await patient.save();
            return patient;
        } catch (error) {
            console.error('Error creating patient:', error);
            throw error;
        }
    }

    /**
     * Get patient by ID
     */
    async getPatientById(patientId) {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            throw new Error('Patient not found');
        }
        return patient;
    }

    /**
     * Get patient by anonymized ID
     */
    async getPatientByAnonymizedId(anonymizedId) {
        const patient = await Patient.findOne({ anonymizedId });
        if (!patient) {
            throw new Error('Patient not found');
        }
        return patient;
    }

    /**
     * Update patient
     */
    async updatePatient(patientId, updateData) {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            throw new Error('Patient not found');
        }

        Object.assign(patient, updateData);
        await patient.save();
        return patient;
    }

    /**
     * Search patients
     */
    async searchPatients(query, options = {}) {
        return await Patient.searchPatients(query, options);
    }

    /**
     * Get all active patients
     */
    async getActivePatients(options = {}) {
        const { limit = 50, skip = 0 } = options;

        return await Patient.find({ status: 'active' })
            .limit(limit)
            .skip(skip)
            .sort({ updatedAt: -1 });
    }

    /**
     * Get patient medical summary (for AI context)
     */
    async getPatientMedicalSummary(patientId) {
        const patient = await this.getPatientById(patientId);
        return patient.getMedicalSummary();
    }

    /**
     * Get anonymized patient data
     */
    async getAnonymizedPatientData(patientId) {
        const patient = await this.getPatientById(patientId);
        return patient.getAnonymizedData();
    }

    /**
     * Update patient vital signs
     */
    async updateVitalSigns(patientId, vitalSigns) {
        const patient = await this.getPatientById(patientId);

        patient.vitalSigns = {
            ...vitalSigns,
            lastUpdated: new Date()
        };

        await patient.save();
        return patient;
    }

    /**
     * Add medical history entry
     */
    async addMedicalHistory(patientId, historyEntry) {
        const patient = await this.getPatientById(patientId);

        patient.medicalHistory.push(historyEntry);
        await patient.save();

        return patient;
    }

    /**
     * Add allergy
     */
    async addAllergy(patientId, allergy) {
        const patient = await this.getPatientById(patientId);

        patient.allergies.push(allergy);
        await patient.save();

        return patient;
    }

    /**
     * Add medication
     */
    async addMedication(patientId, medication) {
        const patient = await this.getPatientById(patientId);

        patient.currentMedications.push(medication);
        await patient.save();

        return patient;
    }

    /**
     * Discharge patient
     */
    async dischargePatient(patientId) {
        const patient = await this.getPatientById(patientId);

        patient.status = 'discharged';
        patient.dischargeDate = new Date();
        await patient.save();

        return patient;
    }
}

module.exports = new PatientService();
