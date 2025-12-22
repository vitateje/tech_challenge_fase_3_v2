const medicalAssistantService = require('../services/medicalAssistantService');

/**
 * Medical Assistant Controller
 * Handles HTTP requests for medical AI assistant
 */
class MedicalAssistantController {
    /**
     * POST /api/medical/query
     * Process a medical query
     */
    async processQuery(req, res) {
        try {
            const { question, patientId, queryType } = req.body;
            const doctorId = req.user._id; // From auth middleware

            if (!question) {
                return res.status(400).json({ error: 'Question is required' });
            }

            const result = await medicalAssistantService.processQuery(question, {
                patientId,
                doctorId,
                queryType: queryType || 'general_medical'
            });

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in processQuery:', error);
            res.status(500).json({
                error: 'Failed to process query',
                message: error.message
            });
        }
    }

    /**
     * GET /api/medical/history
     * Get query history for current doctor
     */
    async getHistory(req, res) {
        try {
            const doctorId = req.user._id;
            const { limit = 20, skip = 0, queryType } = req.query;

            const history = await medicalAssistantService.getDoctorQueryHistory(doctorId, {
                limit: parseInt(limit),
                skip: parseInt(skip),
                queryType
            });

            res.json({
                success: true,
                data: history,
                count: history.length
            });

        } catch (error) {
            console.error('Error in getHistory:', error);
            res.status(500).json({
                error: 'Failed to get history',
                message: error.message
            });
        }
    }

    /**
     * GET /api/medical/patient/:patientId/history
     * Get query history for a specific patient
     */
    async getPatientHistory(req, res) {
        try {
            const { patientId } = req.params;
            const { limit = 20, skip = 0 } = req.query;

            const history = await medicalAssistantService.getPatientQueryHistory(patientId, {
                limit: parseInt(limit),
                skip: parseInt(skip)
            });

            res.json({
                success: true,
                data: history,
                count: history.length
            });

        } catch (error) {
            console.error('Error in getPatientHistory:', error);
            res.status(500).json({
                error: 'Failed to get patient history',
                message: error.message
            });
        }
    }

    /**
     * GET /api/medical/review-queue
     * Get queries requiring review
     */
    async getReviewQueue(req, res) {
        try {
            const { limit = 20, skip = 0 } = req.query;

            const queries = await medicalAssistantService.getQueriesRequiringReview({
                limit: parseInt(limit),
                skip: parseInt(skip)
            });

            res.json({
                success: true,
                data: queries,
                count: queries.length
            });

        } catch (error) {
            console.error('Error in getReviewQueue:', error);
            res.status(500).json({
                error: 'Failed to get review queue',
                message: error.message
            });
        }
    }

    /**
     * POST /api/medical/query/:queryId/feedback
     * Submit feedback for a query
     */
    async submitFeedback(req, res) {
        try {
            const { queryId } = req.params;
            const feedback = req.body;

            const query = await medicalAssistantService.submitFeedback(queryId, feedback);

            res.json({
                success: true,
                data: query
            });

        } catch (error) {
            console.error('Error in submitFeedback:', error);
            res.status(500).json({
                error: 'Failed to submit feedback',
                message: error.message
            });
        }
    }

    /**
     * POST /api/medical/query/:queryId/review
     * Mark query as reviewed
     */
    async markAsReviewed(req, res) {
        try {
            const { queryId } = req.params;
            const { notes } = req.body;
            const reviewerId = req.user._id;

            const query = await medicalAssistantService.markAsReviewed(queryId, reviewerId, notes);

            res.json({
                success: true,
                data: query
            });

        } catch (error) {
            console.error('Error in markAsReviewed:', error);
            res.status(500).json({
                error: 'Failed to mark as reviewed',
                message: error.message
            });
        }
    }
}

module.exports = new MedicalAssistantController();
