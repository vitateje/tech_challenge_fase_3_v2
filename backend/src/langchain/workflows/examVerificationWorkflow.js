/**
 * Exam Verification Workflow
 * Automated workflow for checking exam status and analyzing results
 * 
 * Workflow Steps:
 * 1. Check exam status (pending/completed)
 * 2. If completed, analyze results
 * 3. Identify abnormal findings
 * 4. Suggest follow-up actions
 * 5. Alert medical team if urgent
 */

const medicalAssistantChain = require('../chains/medicalAssistantChain');
const Patient = require('../../models/Patient');
const Exam = require('../../models/Exam');
const MedicalQuery = require('../../models/MedicalQuery');

/**
 * Workflow State
 */
class ExamVerificationState {
    constructor() {
        this.patient = null;
        this.exams = [];
        this.pendingExams = [];
        this.completedExams = [];
        this.abnormalResults = [];
        this.analysis = null;
        this.alerts = [];
        this.currentStep = 'start';
        this.errors = [];
    }
}

/**
 * Exam Verification Workflow Orchestrator
 */
class ExamVerificationWorkflow {
    /**
     * Execute the exam verification workflow
     * @param {string} patientId - Patient ID
     * @param {string} doctorId - ID of requesting doctor
     * @returns {Object} Workflow result
     */
    async execute(patientId, doctorId) {
        const state = new ExamVerificationState();

        try {
            console.log('🔬 Starting Exam Verification Workflow...');

            // Step 1: Load patient
            state.currentStep = 'load_patient';
            state.patient = await Patient.findById(patientId);
            if (!state.patient) {
                throw new Error('Patient not found');
            }
            console.log(`✅ Loaded patient: ${state.patient.anonymizedId}`);

            // Step 2: Get all exams for patient
            state.currentStep = 'fetch_exams';
            state.exams = await Exam.find({ patientId })
                .populate('requestedBy', 'name specialty')
                .sort({ createdAt: -1 });

            // Categorize exams
            state.pendingExams = state.exams.filter(e =>
                ['pending', 'scheduled', 'in_progress'].includes(e.status)
            );
            state.completedExams = state.exams.filter(e => e.status === 'completed');
            console.log(`📋 Found ${state.pendingExams.length} pending, ${state.completedExams.length} completed exams`);

            // Step 3: Check for abnormal results
            state.currentStep = 'check_abnormal';
            state.abnormalResults = await Exam.getAbnormalResults(patientId);
            console.log(`⚠️ Found ${state.abnormalResults.length} exams with abnormal results`);

            // Step 4: Analyze completed exams if any
            if (state.completedExams.length > 0) {
                state.currentStep = 'analyze_results';
                state.analysis = await this.analyzeExamResults(
                    state.patient,
                    state.completedExams,
                    doctorId
                );
                console.log('✅ Exam analysis completed');
            }

            // Step 5: Generate alerts for urgent findings
            state.currentStep = 'generate_alerts';
            state.alerts = this.generateAlerts(
                state.pendingExams,
                state.abnormalResults
            );
            console.log(`🚨 Generated ${state.alerts.length} alerts`);

            // Step 6: Complete workflow
            state.currentStep = 'complete';

            return {
                success: true,
                patient: state.patient.anonymizedId,
                summary: {
                    totalExams: state.exams.length,
                    pending: state.pendingExams.length,
                    completed: state.completedExams.length,
                    abnormal: state.abnormalResults.length
                },
                pendingExams: state.pendingExams.map(e => e.getSummary()),
                abnormalResults: state.abnormalResults.map(e => ({
                    code: e.examCode,
                    type: e.examType,
                    completedDate: e.completedDate,
                    findings: e.results.findings
                })),
                analysis: state.analysis,
                alerts: state.alerts,
                workflowState: state.currentStep
            };

        } catch (error) {
            console.error('❌ Error in exam verification workflow:', error);
            state.errors.push(error.message);

            return {
                success: false,
                error: error.message,
                workflowState: state.currentStep,
                errors: state.errors
            };
        }
    }

    /**
     * Analyze exam results using AI
     */
    async analyzeExamResults(patient, completedExams, doctorId) {
        const analyses = [];

        // Analyze most recent exams (limit to 3 for performance)
        const recentExams = completedExams.slice(0, 3);

        for (const exam of recentExams) {
            if (!exam.results || !exam.results.summary) {
                continue;
            }

            const question = `Analyze these exam results and suggest follow-up actions: ${exam.examType}`;

            // Format exam results for the prompt
            const examResultsText = exam.results.summary 
                ? `${exam.results.summary}\n${exam.results.conclusion || ''}`
                : 'No detailed results available';

            // Use medical assistant to analyze
            const response = await medicalAssistantChain.processQuery(question, {
                patientId: patient._id,
                patientContext: patient.getMedicalSummary(),
                doctorId,
                queryType: 'diagnosis_support',
                examType: exam.examType || exam.examName || 'Unknown',
                examResults: examResultsText
            });

            // Log the analysis
            await MedicalQuery.create({
                question: `Exam analysis for ${exam.examCode}: ${exam.examType}`,
                answer: response.answer,
                sources: response.sources,
                patientId: patient._id,
                doctorId,
                queryType: 'diagnosis_support',
                modelInfo: response.modelInfo,
                guardrailFlags: response.guardrails.issues,
                requiresReview: response.requiresReview,
                responseTime: response.responseTime
            });

            analyses.push({
                examCode: exam.examCode,
                examType: exam.examType,
                analysis: response.answer,
                requiresReview: response.requiresReview
            });
        }

        return analyses;
    }

    /**
     * Generate alerts for medical team
     */
    generateAlerts(pendingExams, abnormalResults) {
        const alerts = [];

        // Alert for overdue pending exams
        const now = new Date();
        const overdueExams = pendingExams.filter(exam => {
            if (!exam.scheduledDate) return false;
            return exam.scheduledDate < now && exam.status === 'pending';
        });

        if (overdueExams.length > 0) {
            alerts.push({
                type: 'overdue_exams',
                severity: 'medium',
                message: `${overdueExams.length} exam(s) are overdue`,
                exams: overdueExams.map(e => e.examCode)
            });
        }

        // Alert for urgent pending exams
        const urgentPending = pendingExams.filter(e => e.priority === 'emergency');
        if (urgentPending.length > 0) {
            alerts.push({
                type: 'urgent_pending',
                severity: 'high',
                message: `${urgentPending.length} urgent exam(s) pending`,
                exams: urgentPending.map(e => e.examCode)
            });
        }

        // Alert for abnormal results
        if (abnormalResults.length > 0) {
            alerts.push({
                type: 'abnormal_results',
                severity: 'high',
                message: `${abnormalResults.length} exam(s) with abnormal results require review`,
                exams: abnormalResults.map(e => e.examCode)
            });
        }

        return alerts;
    }
}

module.exports = new ExamVerificationWorkflow();
