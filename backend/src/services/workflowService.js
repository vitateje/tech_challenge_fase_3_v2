const patientIntakeWorkflow = require('../langchain/workflows/patientIntakeWorkflow');
const treatmentSuggestionWorkflow = require('../langchain/workflows/treatmentSuggestionWorkflow');
const examVerificationWorkflow = require('../langchain/workflows/examVerificationWorkflow');

/**
 * Workflow Service
 * Orchestrates automated medical workflows
 */
class WorkflowService {
    /**
     * Execute patient intake workflow
     * @param {Object} patientData - Patient information
     * @param {string} admissionReason - Reason for admission
     * @param {string} doctorId - Admitting doctor ID
     */
    async executePatientIntake(patientData, admissionReason, doctorId) {
        try {
            console.log('🏥 Executing patient intake workflow...');
            const result = await patientIntakeWorkflow.execute(
                patientData,
                admissionReason,
                doctorId
            );

            return result;
        } catch (error) {
            console.error('Error in patient intake workflow:', error);
            throw error;
        }
    }

    /**
     * Execute treatment suggestion workflow
     * @param {string} patientId - Patient ID
     * @param {string} condition - Medical condition
     * @param {string} doctorId - Requesting doctor ID
     */
    async executeTreatmentSuggestion(patientId, condition, doctorId) {
        try {
            console.log('💊 Executing treatment suggestion workflow...');
            const result = await treatmentSuggestionWorkflow.execute(
                patientId,
                condition,
                doctorId
            );

            return result;
        } catch (error) {
            console.error('Error in treatment suggestion workflow:', error);
            throw error;
        }
    }

    /**
     * Execute exam verification workflow
     * @param {string} patientId - Patient ID
     * @param {string} doctorId - Requesting doctor ID
     */
    async executeExamVerification(patientId, doctorId) {
        try {
            console.log('🔬 Executing exam verification workflow...');
            const result = await examVerificationWorkflow.execute(
                patientId,
                doctorId
            );

            return result;
        } catch (error) {
            console.error('Error in exam verification workflow:', error);
            throw error;
        }
    }

    /**
     * Get workflow status (placeholder for future enhancement)
     * In production, you'd track workflow executions in database
     */
    async getWorkflowStatus(workflowId) {
        // Placeholder - in production, implement workflow state persistence
        return {
            workflowId,
            status: 'completed',
            message: 'Workflow status tracking not yet implemented'
        };
    }
}

module.exports = new WorkflowService();
