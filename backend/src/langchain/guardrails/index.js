/**
 * Módulo principal de guardrails
 * Exporta todos os componentes de validação
 */
const validator = require('./validator');
const businessRules = require('./businessRules');
const contentFilter = require('./contentFilter');

module.exports = {
  validator,
  businessRules,
  contentFilter,
  
  // Métodos de conveniência
  validateInput: (input) => validator.validateInput(input),
  validateResponse: (response, input) => validator.validateResponse(response, input),
  validateRequest: (input) => validator.validateRequest(input)
};

