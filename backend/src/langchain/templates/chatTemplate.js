const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const promptBuilder = require('../prompts/promptBuilder');

/**
 * ChatTemplates para medical assistant - Formatação de mensagens com LangChain
 * Usa sistema modular de prompts
 */
class ChatTemplateService {
  constructor() {
    this.templates = new Map();
    this.promptBuilder = promptBuilder;
    this.initializeTemplates();
  }

  /**
   * Inicializa templates padrão usando PromptBuilder modular
   */
  initializeTemplates() {
    // Template básico para medical assistant
    this.templates.set('basic', this.createBasicTemplate());
    
    // Template com contexto RAG (não usado atualmente)
    this.templates.set('rag', this.createRAGTemplate());
    
    // Template com contexto conversacional
    this.templates.set('conversational', this.createConversationalTemplate());
    
    // Template combinado (RAG + Conversação) (não usado atualmente)
    this.templates.set('combined', this.createCombinedTemplate());
  }

  /**
   * Template básico para medical assistant
   */
  createBasicTemplate() {
    const systemPrompt = this.promptBuilder.buildFullPrompt({
      instructionTypes: ['general']
    });

    return ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', '{input}']
    ]);
  }

  /**
   * Template com contexto RAG
   */
  createRAGTemplate() {
    const systemPrompt = this.promptBuilder.buildFullPrompt({
      instructionTypes: ['general', 'rag']
    });

    return ChatPromptTemplate.fromMessages([
      ['system', `${systemPrompt}\n\n{rag_context}`],
      ['human', '{input}']
    ]);
  }

  /**
   * Template com contexto conversacional
   */
  createConversationalTemplate() {
    const systemPrompt = this.promptBuilder.buildFullPrompt({
      instructionTypes: ['general', 'conversational']
    });

    return ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}']
    ]);
  }

  /**
   * Template combinado (RAG + Conversação)
   */
  createCombinedTemplate() {
    const systemPrompt = this.promptBuilder.buildFullPrompt({
      instructionTypes: ['general', 'rag', 'conversational']
    });

    return ChatPromptTemplate.fromMessages([
      ['system', `${systemPrompt}\n\n{conversation_context}\n\n{rag_context}`],
      ['human', '{input}']
    ]);
  }

  /**
   * Obtém um template pelo nome
   */
  getTemplate(name) {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template "${name}" não encontrado. Templates disponíveis: ${Array.from(this.templates.keys()).join(', ')}`);
    }
    return template;
  }

  /**
   * Cria mensagens formatadas para um template
   */
  async formatMessages(templateName, variables) {
    const template = this.getTemplate(templateName);
    return await template.formatMessages(variables);
  }

  /**
   * Cria prompt formatado para um template
   */
  async formatPrompt(templateName, variables) {
    const template = this.getTemplate(templateName);
    return await template.format(variables);
  }

  /**
   * Cria mensagens de histórico de conversa para LangChain
   */
  createChatHistory(messages) {
    const { HumanMessage, AIMessage } = require('@langchain/core/messages');
    
    return messages.map(msg => {
      if (msg.type === 'user') {
        return new HumanMessage(msg.message || msg.content);
      } else if (msg.type === 'assistant') {
        return new AIMessage(msg.message || msg.content);
      }
      return null;
    }).filter(msg => msg !== null);
  }
}

module.exports = new ChatTemplateService();

