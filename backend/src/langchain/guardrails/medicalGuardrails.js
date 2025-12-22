/**
 * Medical Guardrails
 * Validates AI responses for safety and compliance
 * Prevents inappropriate medical suggestions
 */

/**
 * Check if response contains direct prescriptions
 * AI should never directly prescribe - only suggest with validation requirement
 */
function checkForDirectPrescriptions(response) {
    const prescriptionPatterns = [
        /prescribe\s+\d+\s*mg/i,
        /take\s+\d+\s*pills?/i,
        /administer\s+\d+/i,
        /give\s+the\s+patient\s+\d+/i
    ];

    const issues = [];

    for (const pattern of prescriptionPatterns) {
        if (pattern.test(response)) {
            issues.push({
                flag: 'DIRECT_PRESCRIPTION',
                severity: 'CRITICAL',
                message: 'Response contains what appears to be a direct prescription. AI should only suggest treatments for physician validation.'
            });
            break;
        }
    }

    return issues;
}

/**
 * Check if response includes required disclaimer
 * All medical responses must include disclaimer about human oversight
 */
function checkForDisclaimer(response) {
    const disclaimerKeywords = [
        'physician',
        'doctor',
        'validation',
        'consult',
        'professional',
        'licensed medical'
    ];

    const hasDisclaimer = disclaimerKeywords.some(keyword =>
        response.toLowerCase().includes(keyword)
    );

    if (!hasDisclaimer) {
        return [{
            flag: 'MISSING_DISCLAIMER',
            severity: 'HIGH',
            message: 'Response lacks required disclaimer about physician validation/consultation.'
        }];
    }

    return [];
}

/**
 * Check if response cites sources
 * Responses should reference protocols or knowledge base
 */
function checkForSourceCitation(response, sources = []) {
    const issues = [];

    // Check if sources were provided
    if (!sources || sources.length === 0) {
        issues.push({
            flag: 'NO_SOURCES',
            severity: 'MEDIUM',
            message: 'Response does not cite any sources (protocols, documents, etc.).'
        });
    }

    // Check if response mentions protocol codes or references
    const hasProtocolReference = /PROT-[A-Z]+-\d+/i.test(response) ||
        /protocol/i.test(response) ||
        /according to/i.test(response);

    if (!hasProtocolReference && sources.length > 0) {
        issues.push({
            flag: 'SOURCES_NOT_CITED',
            severity: 'MEDIUM',
            message: 'Sources were found but not explicitly cited in response.'
        });
    }

    return issues;
}

/**
 * Check for high-risk content that requires immediate human review
 */
function checkForHighRiskContent(question, response) {
    const highRiskKeywords = [
        'emergency',
        'cardiac arrest',
        'stroke',
        'severe bleeding',
        'anaphylaxis',
        'overdose',
        'suicide',
        'life-threatening',
        'critical condition'
    ];

    const combinedText = (question + ' ' + response).toLowerCase();

    for (const keyword of highRiskKeywords) {
        if (combinedText.includes(keyword)) {
            return [{
                flag: 'HIGH_RISK_CONTENT',
                severity: 'CRITICAL',
                message: `Response involves high-risk scenario (${keyword}). Requires immediate physician review.`,
                requiresReview: true
            }];
        }
    }

    return [];
}

/**
 * Check for contraindication mentions
 * Responses about treatments should mention checking contraindications
 */
function checkForContraindicationMention(response, queryType) {
    if (queryType !== 'treatment_suggestion' && queryType !== 'drug_interaction') {
        return []; // Not applicable for other query types
    }

    const contraindicationKeywords = [
        'contraindication',
        'allergy',
        'interaction',
        'avoid',
        'caution'
    ];

    const hasContraindicationMention = contraindicationKeywords.some(keyword =>
        response.toLowerCase().includes(keyword)
    );

    if (!hasContraindicationMention) {
        return [{
            flag: 'NO_CONTRAINDICATION_CHECK',
            severity: 'HIGH',
            message: 'Treatment suggestion does not mention checking contraindications or interactions.'
        }];
    }

    return [];
}

/**
 * Main guardrail validation function
 * Runs all checks and returns combined results
 */
function validateMedicalResponse(question, response, options = {}) {
    const {
        sources = [],
        queryType = 'general_medical'
    } = options;

    let allIssues = [];

    // Run all checks
    allIssues = allIssues.concat(checkForDirectPrescriptions(response));
    allIssues = allIssues.concat(checkForDisclaimer(response));
    allIssues = allIssues.concat(checkForSourceCitation(response, sources));
    allIssues = allIssues.concat(checkForHighRiskContent(question, response));
    allIssues = allIssues.concat(checkForContraindicationMention(response, queryType));

    // Determine if response requires human review
    const requiresReview = allIssues.some(issue =>
        issue.severity === 'CRITICAL' || issue.requiresReview
    );

    // Determine overall pass/fail
    const criticalIssues = allIssues.filter(issue => issue.severity === 'CRITICAL');
    const passed = criticalIssues.length === 0;

    return {
        passed,
        requiresReview,
        issues: allIssues,
        summary: {
            total: allIssues.length,
            critical: allIssues.filter(i => i.severity === 'CRITICAL').length,
            high: allIssues.filter(i => i.severity === 'HIGH').length,
            medium: allIssues.filter(i => i.severity === 'MEDIUM').length,
            low: allIssues.filter(i => i.severity === 'LOW').length
        }
    };
}

/**
 * Add safety disclaimer to response if missing
 */
function addSafetyDisclaimer(response) {
    const disclaimer = '\n\n⚠️ IMPORTANTE: Esta é uma resposta gerada por IA para apoio à decisão clínica. Todas as recomendações devem ser validadas por um médico licenciado antes da implementação.';

    // Check if disclaimer already exists (em português ou inglês)
    const hasDisclaimer = response.toLowerCase().includes('médico licenciado') ||
        response.toLowerCase().includes('validação médica') ||
        response.toLowerCase().includes('licensed physician') ||
        response.toLowerCase().includes('physician validation') ||
        response.toLowerCase().includes('consulte um médico') ||
        response.toLowerCase().includes('consulte o médico');

    if (hasDisclaimer) {
        return response;
    }

    return response + disclaimer;
}

module.exports = {
    validateMedicalResponse,
    addSafetyDisclaimer,
    checkForDirectPrescriptions,
    checkForDisclaimer,
    checkForSourceCitation,
    checkForHighRiskContent,
    checkForContraindicationMention
};
