const { ConversationChain } = require('langchain/chains');
const { ConversationBufferMemory } = require('langchain/memory');
const chatTemplateService = require('../templates/chatTemplate');
const providerAdapter = require('../adapters/providerAdapter');
const langchainConfig = require('../config');

/**
 * Chain para conversação com gerenciamento de memória
 */
class ChatChainService {
  constructor() {
    this.chains = new Map();
    this.memories = new Map();
  }

  /**
   * Cria ou obtém uma chain de conversação para um usuário
   * IMPORTANTE: userId não pode ser null. Use sessionId ou um identificador único quando userId for null
   * para garantir isolamento de memória e privacidade entre diferentes sessões.
   */
  async getChatChain(userId, providerName = null) {
    // Garantir que userId não seja null para evitar compartilhamento de memória
    if (userId === null || userId === undefined) {
      throw new Error('userId não pode ser null ou undefined. Use sessionId ou um identificador único para isolar memória por sessão.');
    }
    
    const key = `${userId}_${providerName || langchainConfig.provider}`;
    
    if (this.chains.has(key)) {
      return this.chains.get(key);
    }

    // Obter ChatModel do provider
    const chatModel = await providerAdapter.getChatModel(providerName);
    
    // Criar memória de conversação
    const memory = new ConversationBufferMemory({
      returnMessages: true,
      inputKey: 'input',
      outputKey: 'output'
    });
    
    this.memories.set(key, memory);

    // Criar template conversacional
    const prompt = chatTemplateService.getTemplate('conversational');

    // Criar chain de conversação
    const chain = new ConversationChain({
      llm: chatModel,
      memory: memory,
      prompt: prompt,
      verbose: langchainConfig.chains.verbose
    });

    this.chains.set(key, chain);
    return chain;
  }

  /**
   * Adiciona mensagens ao histórico de memória
   */
  async addToHistory(userId, messages, providerName = null) {
    // Garantir que userId não seja null
    if (userId === null || userId === undefined) {
      throw new Error('userId não pode ser null ou undefined. Use sessionId ou um identificador único para isolar memória por sessão.');
    }
    
    const key = `${userId}_${providerName || langchainConfig.provider}`;
    const memory = this.memories.get(key);
    
    if (!memory) {
      await this.getChatChain(userId, providerName);
      return;
    }

    // Converter mensagens do formato do sistema para formato LangChain
    const langchainMessages = chatTemplateService.createChatHistory(messages);
    
    // Adicionar ao histórico
    for (const msg of langchainMessages) {
      if (msg.constructor.name === 'HumanMessage') {
        await memory.chatHistory.addUserMessage(msg.content);
      } else if (msg.constructor.name === 'AIMessage') {
        await memory.chatHistory.addAIChatMessage(msg.content);
      }
    }
  }

  /**
   * Limpa a memória de um usuário
   */
  async clearMemory(userId, providerName = null) {
    // Garantir que userId não seja null
    if (userId === null || userId === undefined) {
      throw new Error('userId não pode ser null ou undefined. Use sessionId ou um identificador único para isolar memória por sessão.');
    }
    
    const key = `${userId}_${providerName || langchainConfig.provider}`;
    const memory = this.memories.get(key);
    
    if (memory) {
      await memory.clear();
    }
    
    // Remover da cache
    this.chains.delete(key);
    this.memories.delete(key);
  }

  /**
   * Obtém o histórico de mensagens da memória
   */
  async getHistory(userId, providerName = null) {
    // Garantir que userId não seja null
    if (userId === null || userId === undefined) {
      throw new Error('userId não pode ser null ou undefined. Use sessionId ou um identificador único para isolar memória por sessão.');
    }
    
    const key = `${userId}_${providerName || langchainConfig.provider}`;
    const memory = this.memories.get(key);
    
    if (!memory) {
      return [];
    }

    const messages = await memory.chatHistory.getMessages();
    return messages.map(msg => ({
      type: msg.constructor.name === 'HumanMessage' ? 'user' : 'assistant',
      message: msg.content
    }));
  }

  /**
   * Invoca a chain com uma pergunta
   * IMPORTANTE: userId não pode ser null. Use sessionId ou um identificador único quando userId for null
   * para garantir isolamento de memória e privacidade entre diferentes sessões.
   */
  async invoke(userId, question, conversationContext = null, providerName = null) {
    // Garantir que userId não seja null
    if (userId === null || userId === undefined) {
      throw new Error('userId não pode ser null ou undefined. Use sessionId ou um identificador único para isolar memória por sessão.');
    }
    
    const chain = await this.getChatChain(userId, providerName);
    
    // Preparar variáveis para o template
    const variables = {
      input: question
    };

    // Se há contexto conversacional, adicionar ao histórico
    if (conversationContext) {
      // Converter contexto conversacional em mensagens
      const contextMessages = this.parseConversationContext(conversationContext);
      await this.addToHistory(userId, contextMessages, providerName);
    }

    // Invocar a chain
    const result = await chain.invoke(variables);
    
    return result.output || result.response || result.text || result;
  }

  /**
   * Converte contexto de conversação em formato de mensagens
   */
  parseConversationContext(contextString) {
    const messages = [];
    const lines = contextString.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('Usuário:')) {
        messages.push({
          type: 'user',
          message: line.replace('Usuário:', '').trim()
        });
      } else if (line.startsWith('Assistente:')) {
        messages.push({
          type: 'assistant',
          message: line.replace('Assistente:', '').trim()
        });
      }
    }
    
    return messages;
  }
}

module.exports = new ChatChainService();

