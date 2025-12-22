/**
 * Regras de negócio e restrições específicas para medical assistant
 * Define o que o assistente DEVE ou NÃO DEVE fazer
 */
module.exports = {
  /**
   * Regras obrigatórias (não podem ser violadas)
   */
  mandatory: [
    {
      rule: 'medical_only',
      description: 'Focar em questões médicas e de saúde',
      validate: (input) => {
        // Tópicos não permitidos
        const forbiddenTopics = [
          'legal advice', 'conselho jurídico',
          'financial advice', 'conselho financeiro',
          'como fazer uma bomba',
          'como criar explosivo'
        ];
        
        const lowerInput = input.toLowerCase();
        return !forbiddenTopics.some(topic => lowerInput.includes(topic));
      },
      action: 'reject',
      message: 'Desculpe, só posso ajudar com questões relacionadas a medicina e saúde. Para questões jurídicas ou financeiras, consulte profissionais especializados.'
    },
    
    {
      rule: 'no_direct_prescription',
      description: 'Nunca fornecer prescrições ou diagnósticos diretos',
      validate: (input) => {
        // Frases que indicam pedido de prescrição direta
        const prescriptionPatterns = [
          'prescreva',
          'receite',
          'diagnostique',
          'me dê um remédio',
          'qual remédio devo tomar'
        ];
        
        const lowerInput = input.toLowerCase();
        const hasPrescriptionRequest = prescriptionPatterns.some(pattern => lowerInput.includes(pattern));
        
        // Permitir perguntas sobre prescrições em contexto educacional, mas não prescrições diretas
        return true; // Validação mais detalhada será feita no guardrail médico
      },
      action: 'warn',
      message: 'Lembre-se: nunca forneça prescrições ou diagnósticos diretos. Sempre recomende consulta médica.'
    },
    
    {
      rule: 'portuguese_only',
      description: 'Responder apenas em português',
      validate: (input) => {
        // Implementar validação se necessário
        return true; // Por enquanto aceita qualquer input
      },
      action: 'enforce',
      message: null // Aplicado no prompt, não precisa mensagem
    }
  ],
  
  /**
   * Regras de qualidade (advertências)
   */
  quality: [
    {
      rule: 'complexity_level',
      description: 'Garantir que respostas complexas sejam explicadas progressivamente',
      validate: (response) => {
        // Verificar se resposta muito complexa para iniciantes
        const complexityTerms = ['decomposição quântica', 'termodinâmica avançada'];
        const hasComplexTerms = complexityTerms.some(term => response.toLowerCase().includes(term));
        
        if (hasComplexTerms) {
          // Verificar se há explicação simplificada antes
          return response.length > 200; // Resposta longa provavelmente tem explicação
        }
        return true;
      },
      action: 'warn',
      message: 'Considere simplificar a explicação ou adicionar contexto para iniciantes'
    }
  ],
  
  /**
   * Regras de conteúdo (filtros)
   */
  content: [
    {
      rule: 'accuracy_check',
      description: 'Evitar informações médicas incorretas ou desatualizadas',
      validate: (response) => {
        // Lista de informações médicas incorretas comuns
        const incorrectFacts = [
          'antibiótico cura vírus', // Incorreto - antibióticos não funcionam em vírus
          'vacina causa autismo' // Incorreto - desmentido por estudos
        ];
        
        const lowerResponse = response.toLowerCase();
        return !incorrectFacts.some(fact => lowerResponse.includes(fact));
      },
      action: 'flag',
      message: 'Possível informação médica incorreta detectada'
    }
  ]
};

