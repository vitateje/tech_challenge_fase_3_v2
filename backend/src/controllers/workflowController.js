const workflowService = require('../services/workflowService');

/**
 * Workflow Controller
 * Handles HTTP requests for automated medical workflows
 */
class WorkflowController {
    /**
     * POST /api/workflows/patient-intake
     * Execute patient intake workflow
     */
    async executePatientIntake(req, res) {
        try {
            const { patientData, admissionReason } = req.body;
            const doctorId = req.user._id;

            if (!patientData || !admissionReason) {
                return res.status(400).json({
                    error: 'Patient data and admission reason are required'
                });
            }

            const result = await workflowService.executePatientIntake(
                patientData,
                admissionReason,
                doctorId
            );

            res.json({
                success: result.success,
                data: result
            });

        } catch (error) {
            console.error('Error in executePatientIntake:', error);
            res.status(500).json({
                error: 'Failed to execute patient intake workflow',
                message: error.message
            });
        }
    }

    /**
     * POST /api/workflows/treatment-suggestion
     * Execute treatment suggestion workflow
     */
    async executeTreatmentSuggestion(req, res) {
        try {
            const { patientId, condition } = req.body;
            const doctorId = req.user._id;

            if (!patientId || !condition) {
                return res.status(400).json({
                    error: 'Patient ID and condition are required'
                });
            }

            const result = await workflowService.executeTreatmentSuggestion(
                patientId,
                condition,
                doctorId
            );

            res.json({
                success: result.success,
                data: result
            });

        } catch (error) {
            console.error('Error in executeTreatmentSuggestion:', error);
            res.status(500).json({
                error: 'Failed to execute treatment suggestion workflow',
                message: error.message
            });
        }
    }

    /**
     * POST /api/workflows/exam-verification
     * Execute exam verification workflow
     */
    async executeExamVerification(req, res) {
        try {
            const { patientId } = req.body;
            const doctorId = req.user._id;

            if (!patientId) {
                return res.status(400).json({
                    error: 'Patient ID is required'
                });
            }

            const result = await workflowService.executeExamVerification(
                patientId,
                doctorId
            );

            res.json({
                success: result.success,
                data: result
            });

        } catch (error) {
            console.error('Error in executeExamVerification:', error);
            res.status(500).json({
                error: 'Failed to execute exam verification workflow',
                message: error.message
            });
        }
    }

    /**
     * GET /api/workflows/:workflowId/status
     * Get workflow status
     */
    async getWorkflowStatus(req, res) {
        try {
            const { workflowId } = req.params;

            const status = await workflowService.getWorkflowStatus(workflowId);

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Error in getWorkflowStatus:', error);
            res.status(500).json({
                error: 'Failed to get workflow status',
                message: error.message
            });
        }
    }
}

module.exports = new WorkflowController();
