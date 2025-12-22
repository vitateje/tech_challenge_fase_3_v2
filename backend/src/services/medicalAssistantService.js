const medicalAssistantChain = require('../langchain/chains/medicalAssistantChain');
const MedicalQuery = require('../models/MedicalQuery');
const Patient = require('../models/Patient');

/**
 * Medical Assistant Service
 * Main service for processing medical queries through the AI assistant
 */
class MedicalAssistantService {
    /**
     * Map guardrail severity values to model enum values
     * Guardrail uses: CRITICAL, HIGH, MEDIUM, LOW
     * Model expects: critical, warning, info
     */
    mapGuardrailSeverity(severity) {
        const severityMap = {
            'CRITICAL': 'critical',
            'HIGH': 'warning',
            'MEDIUM': 'warning',
            'LOW': 'info'
        };
        return severityMap[severity] || 'info';
    }

    /**
     * Normalize guardrail flags to match model schema
     */
    normalizeGuardrailFlags(issues) {
        if (!issues || !Array.isArray(issues)) {
            return [];
        }
        return issues.map(issue => ({
            flag: issue.flag,
            severity: this.mapGuardrailSeverity(issue.severity),
            message: issue.message
        }));
    }
    /**
     * Process a medical query
     * @param {string} question - The medical question
     * @param {Object} options - Query options
     * @returns {Object} Query result with answer, sources, and audit info
     */
    async processQuery(question, options = {}) {
        const {
            patientId = null,
            doctorId,
            queryType = 'general_medical'
        } = options;

        if (!doctorId) {
            throw new Error('Doctor ID is required for medical queries');
        }

        try {
            // Get patient context if patientId provided
            let patientContext = null;
            if (patientId) {
                const patient = await Patient.findById(patientId);
                if (patient) {
                    patientContext = patient.getMedicalSummary();
                }
            }

            // Process query through medical assistant chain
            const response = await medicalAssistantChain.processQuery(question, {
                patientId,
                patientContext,
                doctorId,
                queryType
            });

            // Normalize guardrail flags to match model schema
            const normalizedGuardrailFlags = this.normalizeGuardrailFlags(response.guardrails.issues);

            // Save to audit log
            const queryRecord = await MedicalQuery.create({
                question,
                answer: response.answer,
                sources: response.sources,
                patientId,
                doctorId,
                queryType,
                patientContext,
                modelInfo: response.modelInfo,
                guardrailFlags: normalizedGuardrailFlags,
                requiresReview: response.requiresReview,
                responseTime: response.responseTime
            });

            return {
                queryId: queryRecord._id,
                answer: response.answer,
                sources: response.sources,
                requiresReview: response.requiresReview,
                guardrails: response.guardrails,
                responseTime: response.responseTime
            };

        } catch (error) {
            console.error('Error processing medical query:', error);
            throw error;
        }
    }

    /**
     * Get query history for a doctor
     */
    async getDoctorQueryHistory(doctorId, options = {}) {
        return await MedicalQuery.getDoctorQueryHistory(doctorId, options);
    }

    /**
     * Get query history for a patient
     */
    async getPatientQueryHistory(patientId, options = {}) {
        return await MedicalQuery.getPatientAuditTrail(patientId, options);
    }

    /**
     * Get queries requiring review
     */
    async getQueriesRequiringReview(options = {}) {
        return await MedicalQuery.getQueriesRequiringReview(options);
    }

    /**
     * Submit feedback for a query
     */
    async submitFeedback(queryId, feedback) {
        const query = await MedicalQuery.findById(queryId);
        if (!query) {
            throw new Error('Query not found');
        }

        query.feedback = feedback;
        await query.save();

        return query;
    }

    /**
     * Mark query as reviewed
     */
    async markAsReviewed(queryId, reviewerId, notes = '') {
        const query = await MedicalQuery.findById(queryId);
        if (!query) {
            throw new Error('Query not found');
        }

        query.reviewedBy = reviewerId;
        query.reviewedAt = new Date();
        query.reviewNotes = notes;
        await query.save();

        return query;
    }
}

module.exports = new MedicalAssistantService();
