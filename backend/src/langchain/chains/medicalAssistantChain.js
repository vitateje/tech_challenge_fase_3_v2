const { LLMChain } = require('langchain/chains');
const providerAdapter = require('../adapters/providerAdapter');
const { getPatientContext } = require('../vectorstore/pineconePatientStore');
const medicalPrompts = require('../prompts/medical/medicalPrompts');
const medicalGuardrails = require('../guardrails/medicalGuardrails');
const langchainConfig = require('../config');
const { logInfo, logError } = require('../../utils/logger');

/**
 * Medical Assistant Chain
 * Main LangChain integration for medical virtual assistant
 * Uses Gemini LLM directly without RAG
 */
class MedicalAssistantChain {
    constructor() {
        this.chains = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the medical assistant chain
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize provider adapter (Gemini)
            await providerAdapter.initialize();
            this.initialized = true;
            console.log('✅ Medical Assistant Chain initialized (Gemini only, no RAG)');
        } catch (error) {
            console.error('❌ Error initializing Medical Assistant Chain:', error);
            throw error;
        }
    }

    /**
     * Main method to process medical queries
     * Uses Gemini LLM directly without RAG
     */
    async processQuery(question, options = {}) {
        await this.initialize();

        const {
            patientId = null,
            patientContext = null,
            doctorId = null,
            queryType = 'general_medical',
            providerName = null,
            // Additional variables for specific query types
            examType = null,
            examResults = null,
            newMedication = null
        } = options;

        const startTime = Date.now();

        try {
            // Step 1: Format patient context if provided
            const formattedPatientContext = patientContext
                ? this.formatPatientContext(patientContext)
                : 'No specific patient context provided.';

            // Step 2: Retrieve RAG context from Pinecone (patient-specific) when patientId is provided
            let ragContext =
                'No specific hospital protocols or patient documents available. Provide general medical knowledge with appropriate disclaimers.';
            let ragSources = [];

            if (patientId) {
                try {
                    const ragResult = await getPatientContext(patientId, question, {
                        nResults: 5
                    });

                    if (ragResult && Array.isArray(ragResult.chunks) && ragResult.chunks.length > 0) {
                        ragContext = ragResult.chunks
                            .map((chunk, index) => {
                                const header = `Patient document ${index + 1}:`;
                                const sourceInfo = chunk.metadata && chunk.metadata.source
                                    ? ` [source: ${chunk.metadata.source}]`
                                    : '';
                                return `${header}${sourceInfo}\n${chunk.text}`;
                            })
                            .join('\n\n');

                        ragSources = ragResult.chunks.map(chunk => ({
                            id: chunk.id,
                            metadata: chunk.metadata || {}
                        }));
                    }
                } catch (ragError) {
                    console.warn('⚠️ Failed to retrieve patient context from Pinecone:', ragError.message);
                }
            }

            // Step 3: Get appropriate prompt template based on query type
            const promptTemplate = this.getPromptForQueryType(queryType);

            // Step 4: Get LLM (provider configurável: gemini, ollama, biobyia, etc.)
            let chatModel;
            let usedFallback = false;
            const requestedProvider = providerName || langchainConfig.provider;
            const isBiobyIA = requestedProvider === 'biobyia';
            
            try {
                chatModel = await providerAdapter.getChatModel(requestedProvider);
            } catch (error) {
                console.warn(`⚠️ Erro ao obter modelo ${requestedProvider}:`, error.message);
                // BiobyIA não deve usar fallback - deve funcionar ou falhar
                if (isBiobyIA) {
                    console.error(`❌ BiobyIA não está disponível. Verifique se o modelo está instalado e o Ollama está rodando.`);
                    throw new Error(`BiobyIA não disponível: ${error.message}. Verifique a configuração do BIOBYIA_MODEL e se o Ollama está rodando.`);
                }
                
                // Para outros providers (ollama), tenta usar Gemini como fallback se disponível
                const providers = langchainConfig.getAvailableProviders();
                if (providers.gemini && providers.gemini.apiKey) {
                    console.log('🔄 Tentando usar Gemini como fallback...');
                    try {
                        chatModel = await providerAdapter.getChatModel('gemini');
                        usedFallback = true;
                    } catch (fallbackError) {
                        console.error('❌ Erro ao usar fallback Gemini:', fallbackError.message);
                        throw error; // Lança o erro original
                    }
                } else {
                    throw error;
                }
            }

            // Step 5: Create and execute chain
            const chain = new LLMChain({
                llm: chatModel,
                prompt: promptTemplate,
                verbose: langchainConfig.chains.verbose
            });

            const currentProvider = usedFallback ? 'gemini' : requestedProvider;
            console.log(`🤖 Generating response with provider: ${currentProvider}${usedFallback ? ' (fallback)' : ''} ...`);
            
            // Build variables object with proper mapping for each query type
            const variables = {
                rag_context: ragContext,
                patient_context: formattedPatientContext,
                protocols: 'No specific protocols available.',
                // Additional variables based on query type
                ...this.getAdditionalVariables(queryType, patientContext, { examType, examResults, newMedication })
            };

            // Map question to the correct variable name based on query type
            if (queryType === 'protocol_search') {
                variables.query = question;
            } else {
                variables.question = question;
            }

            let response;
            try {
                response = await chain.invoke(variables);
            } catch (error) {
                // BiobyIA não deve usar fallback - deve funcionar ou falhar completamente
                if (currentProvider === 'biobyia') {
                    console.error(`❌ Erro ao executar com BiobyIA:`, error.message);
                    console.error(`💡 Verifique se o modelo biobyia-lora está instalado: ollama pull biobyia-lora`);
                    console.error(`💡 Verifique se o Ollama está rodando: ollama serve`);
                    throw new Error(`BiobyIA falhou: ${error.message}. Verifique a configuração e se o modelo está disponível.`);
                }
                
                // Para Ollama (não BiobyIA), tenta usar Gemini como fallback se disponível
                if (currentProvider === 'ollama' && !usedFallback) {
                    const providers = langchainConfig.getAvailableProviders();
                    if (providers.gemini && providers.gemini.apiKey) {
                        console.warn(`⚠️ Erro ao executar com ${currentProvider}:`, error.message);
                        console.log('🔄 Tentando usar Gemini como fallback...');
                        
                        try {
                            const fallbackModel = await providerAdapter.getChatModel('gemini');
                            const fallbackChain = new LLMChain({
                                llm: fallbackModel,
                                prompt: promptTemplate,
                                verbose: langchainConfig.chains.verbose
                            });
                            
                            response = await fallbackChain.invoke(variables);
                            usedFallback = true;
                            console.log('✅ Fallback para Gemini executado com sucesso');
                        } catch (fallbackError) {
                            console.error('❌ Erro ao executar fallback Gemini:', fallbackError.message);
                            throw error; // Lança o erro original do provider
                        }
                    } else {
                        console.error('❌ Gemini não disponível para fallback');
                        throw error;
                    }
                } else {
                    throw error;
                }
            }

            // Step 5: Extract response text
            let responseText = response.text || response.response || response.output || '';

            // Step 5.5: Clean and validate response quality (especially for BiobyIA)
            if (currentProvider === 'biobyia') {
                responseText = this.cleanBiobyIAResponse(responseText);
            }

            // Step 6: Apply guardrails
            console.log('🛡️ Validating response with guardrails...');
            const guardrailResult = medicalGuardrails.validateMedicalResponse(
                question,
                responseText,
                {
                    sources: [],
                    queryType
                }
            );

            // Step 7: Add safety disclaimer if needed
            const finalResponse = medicalGuardrails.addSafetyDisclaimer(responseText);

            const responseTime = Date.now() - startTime;

            // Persist structured log for observabilidade e explainability
            await logInfo('MedicalAssistantChain', 'Processed medical query', {
                doctorId,
                patientId,
                queryType,
                model: chatModel.modelName || langchainConfig.provider,
                latencyMs: responseTime,
                ragSources,
                explainabilityTrace: responseText
            });

            // Return comprehensive result (include RAG sources for explainability)
            return {
                answer: finalResponse,
                sources: ragSources,
                explanation: responseText,
                guardrails: guardrailResult,
                requiresReview: guardrailResult.requiresReview,
                queryType,
                modelInfo: {
                    provider: usedFallback ? 'gemini' : (providerName || langchainConfig.provider),
                    model: chatModel.modelName || (usedFallback ? 'gemini-pro' : 'unknown'),
                    temperature: langchainConfig.chains.temperature,
                    usedFallback: usedFallback
                },
                responseTime,
                patientId,
                doctorId
            };

        } catch (error) {
            console.error('❌ Error processing medical query:', error);
            await logError('MedicalAssistantChain', 'Error processing medical query', {
                doctorId,
                patientId,
                queryType,
                error: error.message
            });
            throw error;
        }
    }


    /**
     * Clean and format BiobyIA responses
     * Removes confusing patterns, duplicate information, and malformed text
     */
    cleanBiobyIAResponse(responseText) {
        if (!responseText || responseText.trim().length === 0) {
            return responseText;
        }

        let cleaned = responseText;

        // Remove duplicate "Response:" markers
        cleaned = cleaned.replace(/###\s*Response:\s*/gi, '');
        cleaned = cleaned.replace(/Response:\s*/gi, '');
        
        // Remove duplicate "Conclusion:" markers
        cleaned = cleaned.replace(/###\s*Conclusion:\s*/gi, '');
        cleaned = cleaned.replace(/Conclusion:\s*/gi, '');
        
        // Remove duplicate "Comments:" markers
        cleaned = cleaned.replace(/###\s*Comments:\s*/gi, '');
        cleaned = cleaned.replace(/Comments:\s*/gi, '');

        // Remove confusing statistical patterns that appear malformed
        // Pattern: RR: 0·85 (95_CI −0 -1·33) or similar malformed stats
        cleaned = cleaned.replace(/RR[:\s]+[\d·]+[\s\(\)\[\]−\-_0-9·,;]+\d+[\)\]\s]*/gi, (match) => {
            // Only keep if it looks like a valid stat, otherwise remove
            if (/RR[:\s]+[\d.]+[\s\(]+95%?\s*CI/.test(match)) {
                return match;
            }
            return '';
        });

        // Remove lines that are just statistical gibberish
        const lines = cleaned.split('\n');
        const validLines = lines.filter(line => {
            const trimmed = line.trim();
            // Remove lines that are mostly numbers, symbols, and statistical notation
            if (trimmed.match(/^[\d·\s\(\)\[\]−\-_,;:]+$/)) {
                return false;
            }
            // Remove very short lines that are just symbols
            if (trimmed.length < 5 && /^[#\s\-_·]+$/.test(trimmed)) {
                return false;
            }
            return true;
        });

        cleaned = validLines.join('\n');

        // Remove excessive whitespace
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

        // If response is too confusing (has too many statistical errors), add a note
        const hasMalformedStats = /[\d·]+[\s\(\)\[\]−\-_0-9·,;]+[\d·]+/.test(cleaned) && 
                                   cleaned.split(/RR|CI|95%/i).length > 5;
        
        if (hasMalformedStats && cleaned.length > 500) {
            cleaned = cleaned.substring(0, cleaned.indexOf('### Response:') || cleaned.length);
            if (cleaned.trim().length < 100) {
                return 'Desculpe, a resposta gerada contém informações estatísticas mal formatadas. Por favor, reformule sua pergunta ou consulte diretamente as fontes científicas disponíveis.';
            }
        }

        return cleaned.trim();
    }

    /**
     * Format patient context for prompt
     */
    formatPatientContext(patientContext) {
        if (!patientContext) return 'Nenhum contexto de paciente fornecido.';

        return `
Informações do Paciente:
- Idade: ${patientContext.age || 'N/A'}
- Gênero: ${patientContext.gender || 'N/A'}
- Condições Ativas: ${patientContext.activeConditions?.join(', ') || 'Nenhuma listada'}
- Medicamentos Atuais: ${patientContext.currentMedications?.join(', ') || 'Nenhum listado'}
- Alergias Conhecidas: ${patientContext.allergies?.join(', ') || 'Nenhuma listada'}
    `.trim();
    }

    /**
     * Get appropriate prompt template based on query type
     */
    getPromptForQueryType(queryType) {
        switch (queryType) {
            case 'protocol_search':
                return medicalPrompts.protocolSearchPrompt;
            case 'treatment_suggestion':
                return medicalPrompts.treatmentSuggestionPrompt;
            case 'diagnosis_support':
                return medicalPrompts.examAnalysisPrompt;
            case 'drug_interaction':
                return medicalPrompts.drugInteractionPrompt;
            default:
                return medicalPrompts.medicalAssistantPrompt;
        }
    }

    /**
     * Get additional variables based on query type
     * @param {string} queryType - Type of query
     * @param {Object} patientContext - Patient context object
     * @param {Object} additionalOptions - Additional options (examType, examResults, newMedication)
     */
    getAdditionalVariables(queryType, patientContext, additionalOptions = {}) {
        const { examType, examResults, newMedication } = additionalOptions;

        switch (queryType) {
            case 'treatment_suggestion':
                if (!patientContext) return {};
                return {
                    age: patientContext.age || 'N/A',
                    gender: patientContext.gender || 'N/A',
                    conditions: patientContext.activeConditions?.join(', ') || 'None',
                    medications: patientContext.currentMedications?.join(', ') || 'None',
                    allergies: patientContext.allergies?.join(', ') || 'None'
                };
            case 'diagnosis_support':
                return {
                    exam_type: examType || 'Not specified',
                    exam_results: examResults || 'No exam results provided'
                };
            case 'drug_interaction':
                const vars = {};
                if (patientContext) {
                    vars.current_medications = patientContext.currentMedications?.join(', ') || 'None';
                    vars.allergies = patientContext.allergies?.join(', ') || 'None';
                } else {
                    vars.current_medications = 'None';
                    vars.allergies = 'None';
                }
                if (newMedication) {
                    vars.new_medication = newMedication;
                } else {
                    vars.new_medication = 'Not specified';
                }
                return vars;
            default:
                return {};
        }
    }


    /**
     * Process patient intake workflow
     */
    async processPatientIntake(patientData, admissionReason) {
        const chain = new LLMChain({
            llm: await providerAdapter.getChatModel(),
            prompt: medicalPrompts.patientIntakePrompt
        });

        const response = await chain.invoke({
            patient_data: JSON.stringify(patientData, null, 2),
            admission_reason: admissionReason
        });

        return response.text || response.response || response.output;
    }

    /**
     * Check drug interactions
     */
    async checkDrugInteractions(currentMedications, newMedication, allergies = []) {
        const chain = new LLMChain({
            llm: await providerAdapter.getChatModel(),
            prompt: medicalPrompts.drugInteractionPrompt
        });

        const response = await chain.invoke({
            current_medications: currentMedications.join(', '),
            new_medication: newMedication,
            allergies: allergies.join(', ')
        });

        return response.text || response.response || response.output;
    }
}

// Export singleton instance
module.exports = new MedicalAssistantChain();
