/**
 * Treatment Suggestion Workflow
 * Automated workflow for generating and validating treatment suggestions
 * 
 * Workflow Steps:
 * 1. Analyze patient data (conditions, medications, allergies)
 * 2. Search relevant protocols
 * 3. Generate treatment suggestions using AI
 * 4. Check contraindications and drug interactions
 * 5. Create treatment records requiring physician validation
 * 6. Flag for human review
 */

const medicalAssistantChain = require('../chains/medicalAssistantChain');
const Patient = require('../../models/Patient');
const Treatment = require('../../models/Treatment');
const MedicalQuery = require('../../models/MedicalQuery');

/**
 * Workflow State
 */
class TreatmentSuggestionState {
    constructor() {
        this.patient = null;
        this.condition = null;
        this.relevantProtocols = [];
        this.suggestions = [];
        this.contraindicationChecks = [];
        this.drugInteractionChecks = [];
        this.treatmentRecords = [];
        this.currentStep = 'start';
        this.errors = [];
    }
}

/**
 * Treatment Suggestion Workflow Orchestrator
 */
class TreatmentSuggestionWorkflow {
    /**
     * Execute the treatment suggestion workflow
     * @param {string} patientId - Patient ID
     * @param {string} condition - Medical condition to treat
     * @param {string} doctorId - ID of requesting doctor
     * @returns {Object} Workflow result
     */
    async execute(patientId, condition, doctorId) {
        const state = new TreatmentSuggestionState();

        try {
            console.log('💊 Starting Treatment Suggestion Workflow...');

            // Step 1: Load patient data
            state.currentStep = 'load_patient';
            state.patient = await Patient.findById(patientId);
            if (!state.patient) {
                throw new Error('Patient not found');
            }
            state.condition = condition;
            console.log(`✅ Loaded patient: ${state.patient.anonymizedId}`);

            // Step 2: Generate treatment suggestions using AI
            state.currentStep = 'generate_suggestions';
            const aiResponse = await this.generateTreatmentSuggestions(
                state.patient,
                condition,
                doctorId
            );
            state.suggestions = aiResponse.suggestions;
            state.relevantProtocols = aiResponse.protocols;
            console.log(`✅ Generated ${state.suggestions.length} treatment suggestions`);

            // Step 3: Check contraindications for each suggestion
            state.currentStep = 'check_contraindications';
            state.contraindicationChecks = await this.checkContraindications(
                state.patient,
                state.suggestions
            );
            console.log('✅ Contraindication checks completed');

            // Step 4: Check drug interactions
            state.currentStep = 'check_interactions';
            state.drugInteractionChecks = await this.checkDrugInteractions(
                state.patient,
                state.suggestions,
                doctorId
            );
            console.log('✅ Drug interaction checks completed');

            // Step 5: Create treatment records (requiring validation)
            state.currentStep = 'create_records';
            state.treatmentRecords = await this.createTreatmentRecords(
                state.patient,
                state.suggestions,
                state.contraindicationChecks,
                state.drugInteractionChecks,
                doctorId,
                aiResponse.queryId
            );
            console.log(`✅ Created ${state.treatmentRecords.length} treatment records`);

            // Step 6: Complete workflow
            state.currentStep = 'complete';

            return {
                success: true,
                patient: state.patient.anonymizedId,
                condition: state.condition,
                suggestions: state.treatmentRecords.map(t => t.getSummary()),
                protocols: state.relevantProtocols,
                requiresValidation: true, // All AI suggestions require validation
                workflowState: state.currentStep
            };

        } catch (error) {
            console.error('❌ Error in treatment suggestion workflow:', error);
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
     * Generate treatment suggestions using AI
     */
    async generateTreatmentSuggestions(patient, condition, doctorId) {
        const question = `What are the recommended treatments for ${condition}?`;

        const response = await medicalAssistantChain.processQuery(question, {
            patientId: patient._id,
            patientContext: patient.getMedicalSummary(),
            doctorId,
            queryType: 'treatment_suggestion'
        });

        // Log the query
        const queryRecord = await MedicalQuery.create({
            question,
            answer: response.answer,
            sources: response.sources,
            patientId: patient._id,
            doctorId,
            queryType: 'treatment_suggestion',
            patientContext: patient.getMedicalSummary(),
            modelInfo: response.modelInfo,
            guardrailFlags: response.guardrails.issues,
            requiresReview: response.requiresReview,
            responseTime: response.responseTime
        });

        // Parse suggestions from AI response
        // Simplified version - in production, use structured output
        const suggestions = this.parseTreatmentSuggestions(response.answer);

        return {
            suggestions,
            protocols: response.sources,
            queryId: queryRecord._id
        };
    }

    /**
     * Parse treatment suggestions from AI response
     * Simplified parser - in production, use structured LLM output
     */
    parseTreatmentSuggestions(aiResponse) {
        // This is a simplified version
        // In production, you'd use structured output or better parsing
        return [{
            name: 'AI-suggested treatment',
            description: aiResponse.substring(0, 500),
            type: 'medication',
            rationale: 'Based on hospital protocols and patient context'
        }];
    }

    /**
     * Check contraindications for suggested treatments
     */
    async checkContraindications(patient, suggestions) {
        const checks = [];

        for (const suggestion of suggestions) {
            const contraindications = [];

            // Check against patient allergies
            if (patient.allergies && patient.allergies.length > 0) {
                contraindications.push({
                    type: 'allergy',
                    items: patient.allergies.map(a => a.allergen),
                    severity: 'check_required'
                });
            }

            // Check against active conditions
            if (patient.medicalHistory && patient.medicalHistory.length > 0) {
                const activeConditions = patient.medicalHistory
                    .filter(h => h.status === 'active' || h.status === 'chronic')
                    .map(h => h.condition);

                if (activeConditions.length > 0) {
                    contraindications.push({
                        type: 'condition',
                        items: activeConditions,
                        severity: 'check_required'
                    });
                }
            }

            checks.push({
                treatment: suggestion.name,
                contraindications,
                requiresReview: contraindications.length > 0
            });
        }

        return checks;
    }

    /**
     * Check drug interactions
     */
    async checkDrugInteractions(patient, suggestions, doctorId) {
        const checks = [];

        if (!patient.currentMedications || patient.currentMedications.length === 0) {
            return checks; // No current medications to check
        }

        for (const suggestion of suggestions) {
            if (suggestion.type === 'medication') {
                // Use AI to check interactions
                const interactionAnalysis = await medicalAssistantChain.checkDrugInteractions(
                    patient.currentMedications.map(m => m.medication),
                    suggestion.name,
                    patient.allergies?.map(a => a.allergen) || []
                );

                checks.push({
                    treatment: suggestion.name,
                    analysis: interactionAnalysis,
                    currentMedications: patient.currentMedications.map(m => m.medication),
                    requiresReview: true // Always require review for drug interactions
                });
            }
        }

        return checks;
    }

    /**
     * Create treatment records in database
     * All AI suggestions require physician validation
     */
    async createTreatmentRecords(
        patient,
        suggestions,
        contraindicationChecks,
        drugInteractionChecks,
        doctorId,
        queryId
    ) {
        const records = [];

        for (let i = 0; i < suggestions.length; i++) {
            const suggestion = suggestions[i];
            const contraindications = contraindicationChecks[i]?.contraindications || [];
            const interactions = drugInteractionChecks.find(c => c.treatment === suggestion.name);

            const treatment = await Treatment.create({
                patientId: patient._id,
                treatmentType: suggestion.type || 'medication',
                treatment: {
                    name: suggestion.name,
                    description: suggestion.description,
                    dosage: suggestion.dosage,
                    frequency: suggestion.frequency,
                    duration: suggestion.duration,
                    instructions: suggestion.instructions
                },
                suggestedBy: {
                    source: 'ai',
                    userId: doctorId,
                    aiQueryId: queryId
                },
                status: 'suggested', // Requires validation
                rationale: suggestion.rationale,
                contraindicationsChecked: contraindications.length > 0,
                contraindications: contraindications.flatMap(c => c.items),
                drugInteractionsChecked: !!interactions,
                drugInteractions: interactions ? [interactions.analysis] : [],
                allergyCheckPerformed: patient.allergies && patient.allergies.length > 0,
                allergyWarnings: patient.allergies?.map(a => `${a.allergen} (${a.severity})`) || [],
                priority: this.determinePriority(contraindications, interactions)
            });

            records.push(treatment);
        }

        return records;
    }

    /**
     * Determine priority based on checks
     */
    determinePriority(contraindications, interactions) {
        if (interactions || contraindications.some(c => c.severity === 'critical')) {
            return 'urgent';
        }
        if (contraindications.length > 0) {
            return 'important';
        }
        return 'routine';
    }
}

module.exports = new TreatmentSuggestionWorkflow();
