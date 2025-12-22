const businessRules = require('./businessRules');
const contentFilter = require('./contentFilter');

/**
 * Validador principal de guardrails
 * Aplica todas as regras de negócio e filtros
 */
class GuardrailValidator {
  constructor() {
    this.rules = businessRules;
    this.filter = contentFilter;
  }

  /**
   * Valida entrada completa
   */
  async validateInput(input) {
    // 1. Filtro de conteúdo básico
    const contentValidation = this.filter.validateInput(input);
    if (!contentValidation.valid) {
      return {
        allowed: false,
        reason: 'content_filter',
        issues: contentValidation.issues,
        sanitized: null
      };
    }

    // 2. Sanitizar
    const sanitized = this.filter.sanitizeInput(input);

    // 3. Aplicar regras obrigatórias
    const mandatoryViolations = [];
    for (const rule of this.rules.mandatory) {
      const isValid = await rule.validate(sanitized);
      if (!isValid) {
        mandatoryViolations.push({
          rule: rule.rule,
          description: rule.description,
          action: rule.action,
          message: rule.message
        });
      }
    }

    if (mandatoryViolations.length > 0) {
      return {
        allowed: false,
        reason: 'business_rule',
        violations: mandatoryViolations,
        issues: mandatoryViolations.map(v => ({
          type: 'mandatory_rule_violation',
          severity: 'error',
          message: v.message || `Regra violada: ${v.description}`
        })),
        sanitized: sanitized
      };
    }

    // 4. Verificar advertências de qualidade
    const warnings = [];
    for (const rule of this.rules.quality) {
      // Regras de qualidade são aplicadas na resposta, não na entrada
      warnings.push({
        rule: rule.rule,
        description: rule.description,
        checkOnResponse: true
      });
    }

    return {
      allowed: true,
      sanitized: sanitized,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Valida resposta gerada
   */
  async validateResponse(response, originalInput = null) {
    // 1. Filtro de conteúdo básico
    const contentValidation = this.filter.validateResponse(response);
    if (!contentValidation.valid) {
      return {
        valid: false,
        reason: 'content_filter',
        issues: contentValidation.issues,
        corrected: null
      };
    }

    // 2. Aplicar regras de qualidade
    const qualityIssues = [];
    for (const rule of this.rules.quality) {
      const isValid = await rule.validate(response);
      if (!isValid) {
        qualityIssues.push({
          rule: rule.rule,
          description: rule.description,
          action: rule.action,
          message: rule.message
        });
      }
    }

    // 3. Aplicar regras de conteúdo
    const contentIssues = [];
    for (const rule of this.rules.content) {
      const isValid = await rule.validate(response);
      if (!isValid) {
        contentIssues.push({
          rule: rule.rule,
          description: rule.description,
          action: rule.action,
          message: rule.message
        });
      }
    }

    return {
      valid: true,
      issues: [...qualityIssues, ...contentIssues],
      corrected: response // Por enquanto retorna como está, pode ser corrigido no futuro
    };
  }

  /**
   * Aplica todas as validações em uma requisição completa
   */
  async validateRequest(input) {
    const inputValidation = await this.validateInput(input);
    
    if (!inputValidation.allowed) {
      return {
        allowed: false,
        inputValidation,
        responseValidation: null
      };
    }

    return {
      allowed: true,
      inputValidation,
      sanitizedInput: inputValidation.sanitized
    };
  }

  /**
   * Aplica validações em uma resposta completa
   */
  async validateCompleteRequest(input, response) {
    const requestValidation = await this.validateRequest(input);
    
    if (!requestValidation.allowed) {
      return requestValidation;
    }

    const responseValidation = await this.validateResponse(response, requestValidation.sanitizedInput);

    return {
      allowed: requestValidation.allowed,
      inputValidation: requestValidation.inputValidation,
      responseValidation,
      sanitizedInput: requestValidation.sanitizedInput
    };
  }
}

module.exports = new GuardrailValidator();

