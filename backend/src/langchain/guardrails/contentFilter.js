/**
 * Filtros de conteúdo
 * Validação de entrada e saída
 */
module.exports = {
  /**
   * Valida entrada do usuário
   */
  validateInput(input) {
    const issues = [];
    
    // Verificar se está vazia
    if (!input || input.trim().length === 0) {
      issues.push({
        type: 'empty',
        severity: 'error',
        message: 'Entrada vazia'
      });
      return { valid: false, issues };
    }
    
    // Verificar comprimento mínimo
    if (input.trim().length < 3) {
      issues.push({
        type: 'too_short',
        severity: 'warning',
        message: 'Pergunta muito curta, pode ser difícil entender'
      });
    }
    
    // Verificar comprimento máximo (proteção contra spam)
    if (input.length > 2000) {
      issues.push({
        type: 'too_long',
        severity: 'error',
        message: 'Pergunta muito longa (máximo 2000 caracteres)'
      });
      return { valid: false, issues };
    }
    
    // Verificar caracteres especiais suspeitos
    const suspiciousPatterns = /(<script|javascript:|onerror=|onclick=)/i;
    if (suspiciousPatterns.test(input)) {
      issues.push({
        type: 'suspicious_content',
        severity: 'error',
        message: 'Conteúdo suspeito detectado'
      });
      return { valid: false, issues };
    }
    
    return { valid: true, issues };
  },
  
  /**
   * Valida resposta gerada
   */
  validateResponse(response) {
    const issues = [];
    
    if (!response || response.trim().length === 0) {
      issues.push({
        type: 'empty_response',
        severity: 'error',
        message: 'Resposta vazia'
      });
      return { valid: false, issues };
    }
    
    // Verificar comprimento mínimo (respostas muito curtas podem ser incompletas)
    if (response.trim().length < 20) {
      issues.push({
        type: 'too_short',
        severity: 'warning',
        message: 'Resposta muito curta, pode estar incompleta'
      });
    }
    
    // Verificar comprimento máximo (proteção contra respostas excessivamente longas)
    if (response.length > 5000) {
      issues.push({
        type: 'too_long',
        severity: 'warning',
        message: 'Resposta muito longa, considere dividir'
      });
    }
    
    // Verificar se contém apenas caracteres especiais ou números
    const hasText = /[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]{3,}/.test(response);
    if (!hasText) {
      issues.push({
        type: 'no_text',
        severity: 'error',
        message: 'Resposta não contém texto válido'
      });
      return { valid: false, issues };
    }
    
    return { valid: true, issues };
  },
  
  /**
   * Sanitiza entrada (remove caracteres problemáticos)
   */
  sanitizeInput(input) {
    if (!input) return '';
    
    // Remove tags HTML/XML
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove caracteres de controle exceto quebras de linha e tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    // Limita comprimento
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000);
    }
    
    return sanitized.trim();
  }
};

