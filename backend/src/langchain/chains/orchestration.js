const { LLMChain } = require('langchain/chains');
const { SequentialChain } = require('langchain/chains');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const chatTemplateService = require('../templates/chatTemplate');
const providerAdapter = require('../adapters/providerAdapter');
const langchainConfig = require('../config');

/**
 * Chains de orquestração para fluxos complexos
 */
class OrchestrationService {
  constructor() {
    this.chains = new Map();
  }

  /**
   * Cria uma chain sequencial para fluxo completo
   */
  async createSequentialChain(providerName = null) {
    const key = `sequential_${providerName || langchainConfig.provider}`;
    
    if (this.chains.has(key)) {
      return this.chains.get(key);
    }

    const chatModel = await providerAdapter.getChatModel(providerName);

    // Chain 1: Processamento da pergunta
    const questionPrompt = ChatPromptTemplate.fromMessages([
      ['system', 'Você é um processador de perguntas médicas. Extraia palavras-chave e intenções da pergunta.'],
      ['human', 'Pergunta: {question}']
    ]);

    const questionChain = new LLMChain({
      llm: chatModel,
      prompt: questionPrompt,
      outputKey: 'processed_question',
      verbose: langchainConfig.chains.verbose
    });

    // Chain 2: Resposta final
    const answerPrompt = chatTemplateService.getTemplate('basic');

    const answerChain = new LLMChain({
      llm: chatModel,
      prompt: answerPrompt,
      outputKey: 'answer',
      verbose: langchainConfig.chains.verbose
    });

    // Chain sequencial
    const sequentialChain = new SequentialChain({
      chains: [questionChain, answerChain],
      inputVariables: ['question'],
      outputVariables: ['processed_question', 'answer'],
      verbose: langchainConfig.chains.verbose
    });

    this.chains.set(key, sequentialChain);
    return sequentialChain;
  }

  /**
   * Cria uma chain simples para perguntas diretas
   */
  async createSimpleChain(providerName = null) {
    const key = `simple_${providerName || langchainConfig.provider}`;
    
    if (this.chains.has(key)) {
      return this.chains.get(key);
    }

    const chatModel = await providerAdapter.getChatModel(providerName);
    const prompt = chatTemplateService.getTemplate('basic');

    const chain = new LLMChain({
      llm: chatModel,
      prompt: prompt,
      verbose: langchainConfig.chains.verbose
    });

    this.chains.set(key, chain);
    return chain;
  }

  /**
   * Decide qual chain usar baseado no contexto
   */
  async selectChain(context = {}) {
    const { hasConversation = false } = context;
    const providerName = context.provider || null;

    if (hasConversation) {
      return await this.createConversationalChain(providerName);
    } else {
      return await this.createSimpleChain(providerName);
    }
  }

  /**
   * Cria uma chain conversacional
   */
  async createConversationalChain(providerName = null) {
    const key = `conversational_${providerName || langchainConfig.provider}`;
    
    if (this.chains.has(key)) {
      return this.chains.get(key);
    }

    const chatModel = await providerAdapter.getChatModel(providerName);
    const prompt = chatTemplateService.getTemplate('conversational');

    const chain = new LLMChain({
      llm: chatModel,
      prompt: prompt,
      verbose: langchainConfig.chains.verbose
    });

    this.chains.set(key, chain);
    return chain;
  }
}

module.exports = new OrchestrationService();

