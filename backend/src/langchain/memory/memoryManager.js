const { ConversationBufferMemory } = require('langchain/memory');
const { ConversationSummaryMemory } = require('langchain/memory');
const { ConversationBufferWindowMemory } = require('langchain/memory');
const { ConversationSummaryBufferMemory } = require('langchain/memory');
const providerAdapter = require('../adapters/providerAdapter');
const langchainConfig = require('../config');

/**
 * Gerenciador de memória avançado para diferentes tipos de memória
 * Suporta múltiplos tipos: Buffer, Summary, Window, SummaryBuffer
 */
class MemoryManager {
  constructor() {
    this.memories = new Map();
    this.initialized = false;
  }

  /**
   * Cria memória de buffer simples (armazena todo histórico)
   */
  async createBufferMemory(returnMessages = true, inputKey = 'input', outputKey = 'output') {
    return new ConversationBufferMemory({
      returnMessages: returnMessages,
      inputKey: inputKey,
      outputKey: outputKey
    });
  }

  /**
   * Cria memória com janela (mantém apenas últimas N mensagens)
   */
  async createWindowMemory(
    k = 10,
    returnMessages = true,
    inputKey = 'input',
    outputKey = 'output'
  ) {
    return new ConversationBufferWindowMemory({
      k: k,
      returnMessages: returnMessages,
      inputKey: inputKey,
      outputKey: outputKey
    });
  }

  /**
   * Cria memória com sumarização (resume histórico antigo)
   */
  async createSummaryMemory(
    providerName = null,
    returnMessages = true,
    inputKey = 'input',
    outputKey = 'output'
  ) {
    const chatModel = await providerAdapter.getChatModel(providerName);

    return new ConversationSummaryMemory({
      llm: chatModel,
      returnMessages: returnMessages,
      inputKey: inputKey,
      outputKey: outputKey,
      memoryKey: 'history'
    });
  }

  /**
   * Cria memória combinada (sumarização + buffer recente)
   * Ideal para conversas longas: resume antigo, mantém recente em buffer
   */
  async createSummaryBufferMemory(
    maxTokenLimit = 2000,
    providerName = null,
    returnMessages = true,
    inputKey = 'input',
    outputKey = 'output'
  ) {
    const chatModel = await providerAdapter.getChatModel(providerName);

    return new ConversationSummaryBufferMemory({
      llm: chatModel,
      maxTokenLimit: maxTokenLimit,
      returnMessages: returnMessages,
      inputKey: inputKey,
      outputKey: outputKey,
      memoryKey: 'history'
    });
  }

  /**
   * Obtém ou cria memória para um usuário (com cache)
   */
  async getUserMemory(
    userId,
    memoryType = 'buffer',
    options = {},
    providerName = null
  ) {
    const key = `${userId}_${memoryType}_${providerName || langchainConfig.provider}`;

    if (this.memories.has(key)) {
      return this.memories.get(key);
    }

    let memory;
    const {
      k = 10,
      maxTokenLimit = 2000,
      returnMessages = true,
      inputKey = 'input',
      outputKey = 'output'
    } = options;

    switch (memoryType) {
      case 'buffer':
        memory = await this.createBufferMemory(returnMessages, inputKey, outputKey);
        break;

      case 'window':
        memory = await this.createWindowMemory(k, returnMessages, inputKey, outputKey);
        break;

      case 'summary':
        memory = await this.createSummaryMemory(providerName, returnMessages, inputKey, outputKey);
        break;

      case 'summary_buffer':
        memory = await this.createSummaryBufferMemory(
          maxTokenLimit,
          providerName,
          returnMessages,
          inputKey,
          outputKey
        );
        break;

      default:
        memory = await this.createBufferMemory(returnMessages, inputKey, outputKey);
    }

    this.memories.set(key, memory);
    return memory;
  }

  /**
   * Limpa memória de um usuário
   */
  async clearUserMemory(userId, memoryType = 'buffer', providerName = null) {
    const key = `${userId}_${memoryType}_${providerName || langchainConfig.provider}`;
    const memory = this.memories.get(key);

    if (memory) {
      await memory.clear();
      this.memories.delete(key);
      return true;
    }

    return false;
  }

  /**
   * Obtém histórico de mensagens de uma memória
   */
  async getHistory(userId, memoryType = 'buffer', providerName = null) {
    const key = `${userId}_${memoryType}_${providerName || langchainConfig.provider}`;
    const memory = this.memories.get(key);

    if (!memory) {
      return [];
    }

    try {
      const messages = await memory.chatHistory.getMessages();
      return messages.map(msg => ({
        type: msg.constructor.name === 'HumanMessage' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Erro ao obter histórico: ${error.message}`);
      return [];
    }
  }

  /**
   * Adiciona mensagens à memória de um usuário
   */
  async addMessages(userId, messages, memoryType = 'buffer', providerName = null) {
    const memory = await this.getUserMemory(userId, memoryType, {}, providerName);

    for (const msg of messages) {
      if (msg.type === 'user' || msg.type === 'human') {
        await memory.chatHistory.addUserMessage(msg.content || msg.message);
      } else if (msg.type === 'assistant' || msg.type === 'ai') {
        await memory.chatHistory.addAIChatMessage(msg.content || msg.message);
      }
    }
  }

  /**
   * Salva variáveis de contexto na memória
   */
  async saveContext(
    userId,
    input,
    output,
    memoryType = 'buffer',
    providerName = null
  ) {
    const memory = await this.getUserMemory(userId, memoryType, {}, providerName);
    await memory.saveContext({ input: input }, { output: output });
  }

  /**
   * Remove memória de usuário da cache (não limpa o histórico)
   */
  removeFromCache(userId, memoryType = 'buffer', providerName = null) {
    const key = `${userId}_${memoryType}_${providerName || langchainConfig.provider}`;
    return this.memories.delete(key);
  }

  /**
   * Lista todas as memórias em cache
   */
  listCachedMemories() {
    return Array.from(this.memories.keys());
  }
}

module.exports = new MemoryManager();

