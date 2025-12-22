/**
 * Patient Intake Workflow
 * Automated workflow for processing new patient admissions
 * Uses LangGraph concepts for state management and decision flow
 * 
 * Workflow Steps:
 * 1. Receive patient information
 * 2. Check for pending exams
 * 3. Generate initial assessment
 * 4. Suggest next steps for medical team
 */

const medicalAssistantChain = require('../chains/medicalAssistantChain');
const Patient = require('../../models/Patient');
const Exam = require('../../models/Exam');
const MedicalQuery = require('../../models/MedicalQuery');

/**
 * Workflow State
 * Tracks the current state of the patient intake process
 */
class PatientIntakeState {
    constructor() {
        this.patient = null;
        this.pendingExams = [];
        this.initialAssessment = null;
        this.suggestedActions = [];
        this.currentStep = 'start';
        this.errors = [];
    }
}

/**
 * Patient Intake Workflow Orchestrator
 */
class PatientIntakeWorkflow {
    /**
     * Execute the complete patient intake workflow
     * @param {Object} patientData - Patient information
     * @param {string} admissionReason - Reason for admission
     * @param {string} doctorId - ID of admitting doctor
     * @returns {Object} Workflow result
     */
    async execute(patientData, admissionReason, doctorId) {
        const state = new PatientIntakeState();

        try {
            console.log('🏥 Starting Patient Intake Workflow...');

            // Step 1: Create or update patient record
            state.currentStep = 'create_patient';
            state.patient = await this.createPatientRecord(patientData);
            console.log(`✅ Patient record created: ${state.patient.anonymizedId}`);

            // Step 2: Check for pending exams
            state.currentStep = 'check_exams';
            state.pendingExams = await this.checkPendingExams(state.patient._id);
            console.log(`📋 Found ${state.pendingExams.length} pending exams`);

            // Step 3: Generate initial assessment using AI
            state.currentStep = 'generate_assessment';
            state.initialAssessment = await this.generateInitialAssessment(
                state.patient,
                admissionReason,
                doctorId
            );
            console.log('✅ Initial assessment generated');

            // Step 4: Suggest next steps
            state.currentStep = 'suggest_actions';
            state.suggestedActions = await this.suggestNextSteps(
                state.patient,
                admissionReason,
                state.pendingExams,
                doctorId
            );
            console.log(`✅ Generated ${state.suggestedActions.length} suggested actions`);

            // Step 5: Complete workflow
            state.currentStep = 'complete';

            return {
                success: true,
                patient: state.patient.getAnonymizedData(),
                pendingExams: state.pendingExams.map(e => e.getSummary()),
                initialAssessment: state.initialAssessment,
                suggestedActions: state.suggestedActions,
                workflowState: state.currentStep
            };

        } catch (error) {
            console.error('❌ Error in patient intake workflow:', error);
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
     * Create patient record in database
     */
    async createPatientRecord(patientData) {
        // Check if patient already exists
        const existing = await Patient.findOne({
            name: patientData.name,
            status: 'active'
        });

        if (existing) {
            console.log('Patient already exists, updating record');
            Object.assign(existing, patientData);
            return await existing.save();
        }

        // Create new patient
        const patient = new Patient(patientData);
        return await patient.save();
    }

    /**
     * Check for pending exams
     */
    async checkPendingExams(patientId) {
        return await Exam.getPendingExams(patientId);
    }

    /**
     * Generate initial assessment using AI
     */
    async generateInitialAssessment(patient, admissionReason, doctorId) {
        const patientSummary = patient.getMedicalSummary();

        // Use medical assistant to generate assessment
        const response = await medicalAssistantChain.processPatientIntake(
            patientSummary,
            admissionReason
        );

        // Log the query for audit trail
        await MedicalQuery.create({
            question: `Patient intake assessment for ${patient.anonymizedId}: ${admissionReason}`,
            answer: response,
            doctorId,
            patientId: patient._id,
            queryType: 'general_medical',
            sources: [{
                type: 'llm',
                reference: 'patient_intake_workflow'
            }],
            modelInfo: {
                provider: 'gemini',
                model: 'gemini-pro'
            }
        });

        return response;
    }

    /**
     * Suggest next steps for medical team
     */
    async suggestNextSteps(patient, admissionReason, pendingExams, doctorId) {
        const suggestions = [];

        // Check if vital signs need to be recorded
        if (!patient.vitalSigns || !patient.vitalSigns.lastUpdated) {
            suggestions.push({
                action: 'record_vital_signs',
                priority: 'urgent',
                description: 'Record patient vital signs (BP, HR, temperature, etc.)'
            });
        }

        // Check if basic exams are needed
        if (pendingExams.length === 0) {
            suggestions.push({
                action: 'order_basic_exams',
                priority: 'routine',
                description: 'Consider ordering basic exams (blood test, urinalysis) based on admission reason'
            });
        }

        // Check for allergy information
        if (!patient.allergies || patient.allergies.length === 0) {
            suggestions.push({
                action: 'verify_allergies',
                priority: 'important',
                description: 'Verify and document patient allergies'
            });
        }

        // Check for medication history
        if (!patient.currentMedications || patient.currentMedications.length === 0) {
            suggestions.push({
                action: 'review_medications',
                priority: 'important',
                description: 'Review and document current medications'
            });
        }

        // AI-suggested actions based on admission reason
        const aiSuggestions = await this.getAISuggestedActions(
            patient,
            admissionReason,
            doctorId
        );

        suggestions.push(...aiSuggestions);

        return suggestions;
    }

    /**
     * Get AI-suggested actions
     */
    async getAISuggestedActions(patient, admissionReason, doctorId) {
        try {
            const question = `Based on admission reason "${admissionReason}", what initial actions should the medical team take for this patient?`;

            const response = await medicalAssistantChain.processQuery(question, {
                patientId: patient._id,
                patientContext: patient.getMedicalSummary(),
                doctorId,
                queryType: 'general_medical'
            });

            // Parse AI response for actionable items
            // This is a simplified version - in production, you'd use more sophisticated parsing
            return [{
                action: 'ai_suggested_protocol',
                priority: 'routine',
                description: response.answer.substring(0, 200) + '...',
                requiresReview: response.requiresReview
            }];

        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            return [];
        }
    }
}

module.exports = new PatientIntakeWorkflow();
