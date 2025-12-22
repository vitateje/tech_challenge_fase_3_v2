const systemPrompts = require('./system/base');
const conversationalInstructions = require('./instructions/conversational');
const generalInstructions = require('./instructions/general');
const pedagogicalInstructions = require('./instructions/pedagogical');
const conversationContext = require('./context/conversation');
const pedagogicalContext = require('./context/pedagogical');
const personalization = require('./personalization/default');

/**
 * Construtor modular de prompts
 * Combina componentes de forma flexível
 */
class PromptBuilder {
  constructor() {
    this.system = systemPrompts;
    this.instructions = {
      conversational: conversationalInstructions,
      general: generalInstructions,
      pedagogical: pedagogicalInstructions
    };
    this.context = {
      conversation: conversationContext,
      pedagogical: pedagogicalContext
    };
    this.personalization = personalization;
  }

  /**
   * Constrói prompt de sistema base
   */
  buildSystemPrompt(customPersonalization = null) {
    const pers = customPersonalization || this.personalization;

    return [
      this.system.identity,
      this.system.role,
      this.system.tone,
      this.system.language
    ].join(' ');
  }

  /**
   * Constrói instruções combinadas
   */
  buildInstructions(types = ['general']) {
    let allInstructions = [];

    types.forEach(type => {
      if (this.instructions[type]) {
        allInstructions = allInstructions.concat(this.instructions[type]);
      }
    });

    return allInstructions
      .map((inst, index) => `${index + 1}. ${inst}`)
      .join('\n');
  }


  /**
   * Constrói contexto conversacional formatado
   */
  buildConversationContext(conversationContent) {
    if (!conversationContent) return null;
    return `${this.context.conversation.header}\n${conversationContent}`;
  }

  /**
   * Constrói contexto pedagógico formatado
   */
  buildPedagogicalContext() {
    return `${this.context.pedagogical.header}\n${this.context.pedagogical.principles}`;
  }

  /**
   * Constrói prompt completo
   */
  buildFullPrompt(options = {}) {
    const {
      conversationContext: convCtx = null,
      instructionTypes = ['general', 'pedagogical'],
      customPersonalization = null,
      includePedagogicalContext = true
    } = options;

    // IMPORTANTE: Determinar tipos de instruções necessárias ANTES de construir
    // Baseado nos contextos fornecidos, não depois
    const finalInstructionTypes = [...instructionTypes];

    // Se há contexto conversacional, adicionar instruções conversacionais
    if (convCtx && !finalInstructionTypes.includes('conversational')) {
      finalInstructionTypes.push('conversational');
    }

    let prompt = this.buildSystemPrompt(customPersonalization);

    // Adicionar contexto pedagógico ANTES das instruções (contexto importante)
    if (includePedagogicalContext) {
      prompt += '\n\n';
      prompt += this.buildPedagogicalContext();
    }

    // Adicionar instruções com os tipos determinados ANTES
    if (finalInstructionTypes.length > 0) {
      prompt += '\n\nINSTRUÇÕES IMPORTANTES:\n';
      prompt += this.buildInstructions(finalInstructionTypes);
    }

    // Adicionar contexto conversacional
    if (convCtx) {
      prompt += '\n\n';
      prompt += this.buildConversationContext(convCtx);
    }

    return prompt;
  }

  /**
   * Aplica personalização a um prompt
   */
  applyPersonalization(prompt, customPersonalization = null) {
    const pers = customPersonalization || this.personalization;

    // Aqui podem ser aplicadas modificações baseadas em personalização
    // Por exemplo, ajustar nível de detalhe, tom, etc.

    return prompt;
  }
}

module.exports = new PromptBuilder();

