/**
 * Personalização padrão do assistente
 * Pode ser sobrescrito por configurações específicas
 */
module.exports = {
  // Personalidade e estilo
  personality: {
    friendly: true,
    encouraging: true,
    patient: true,
    professional: true
  },

  // Nível de detalhamento
  detailLevel: 'medium', // 'simple', 'medium', 'detailed', 'expert'

  // Preferências de resposta
  preferences: {
    useExamples: true,
    useAnalogies: true,
    suggestRelatedTopics: true,
    askFollowUp: false
  },

  // Personalização por tópico (pode ser expandido)
  topics: {
    general: {
      detailLevel: 'medium'
    },
    medical_protocols: {
      detailLevel: 'detailed',
      useExamples: true
    },
    patient_care: {
      detailLevel: 'detailed',
      useAnalogies: true
    }
  }
};

