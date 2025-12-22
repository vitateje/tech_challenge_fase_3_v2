const { ChatOllama } = require('@langchain/ollama');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const llmConfig = require('../../config/llmConfig');
const langchainConfig = require('../config');

/**
 * Adapter para integrar providers existentes com LangChain ChatModels
 */
class ProviderAdapter {
  constructor() {
    this.models = new Map();
    this.initialized = false;
  }

  /**
   * Inicializa todos os ChatModels disponíveis
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    const providerConfigs = langchainConfig.getAvailableProviders();

    // Inicializar Gemini se disponível
    if (providerConfigs.gemini) {
      try {
        const model = new ChatGoogleGenerativeAI({
          model: providerConfigs.gemini.model,
          temperature: providerConfigs.gemini.temperature,
          maxOutputTokens: providerConfigs.gemini.maxTokens,
          apiKey: providerConfigs.gemini.apiKey
        });
        this.models.set('gemini', model);
        console.log(`✅ LangChain Gemini ChatModel inicializado`);
      } catch (error) {
        console.warn(`⚠️ Erro ao inicializar LangChain Gemini: ${error.message}`);
      }
    }

    // Inicializar Ollama se disponível
    if (providerConfigs.ollama) {
      try {
        const model = new ChatOllama({
          baseUrl: providerConfigs.ollama.baseUrl,
          model: providerConfigs.ollama.model,
          temperature: providerConfigs.ollama.temperature,
          numCtx: providerConfigs.ollama.maxTokens,
          timeout: 120000, // 120 segundos de timeout
          requestOptions: {
            timeout: 120000
          }
        });
        this.models.set('ollama', model);
        console.log(`✅ LangChain Ollama ChatModel inicializado`);
      } catch (error) {
        console.warn(`⚠️ Erro ao inicializar LangChain Ollama: ${error.message}`);
      }
    }

    // Inicializar BiobyIA (alias para modelo fine-tunado via Ollama ou serviço compatível)
    if (providerConfigs.biobyia) {
      try {
        const model = new ChatOllama({
          baseUrl: providerConfigs.biobyia.baseUrl,
          model: providerConfigs.biobyia.model,
          temperature: providerConfigs.biobyia.temperature,
          numCtx: providerConfigs.biobyia.maxTokens,
          timeout: 180000, // 180 segundos de timeout (3 minutos) para BiobyIA
          requestOptions: {
            timeout: 180000
          }
        });
        this.models.set('biobyia', model);
        console.log(`✅ LangChain BiobyIA ChatModel inicializado (${providerConfigs.biobyia.model})`);
        console.log(`📡 Base URL: ${providerConfigs.biobyia.baseUrl}`);
        console.log(`⚙️  Timeout: 180s | Temperature: ${providerConfigs.biobyia.temperature} | Max Tokens: ${providerConfigs.biobyia.maxTokens}`);
      } catch (error) {
        console.error(`❌ Erro ao inicializar LangChain BiobyIA: ${error.message}`);
        console.error(`💡 Verifique se o modelo ${providerConfigs.biobyia.model} está instalado: ollama pull ${providerConfigs.biobyia.model}`);
        console.error(`💡 Verifique se o Ollama está rodando em ${providerConfigs.biobyia.baseUrl}`);
        // Não lança erro aqui - deixa para falhar quando tentar usar
      }
    }

    this.initialized = true;
  }

  /**
   * Obtém o ChatModel do provider atual
   */
  async getChatModel(providerName = null) {
    await this.initialize();
    
    const provider = providerName || langchainConfig.provider;
    const model = this.models.get(provider);
    
    if (!model) {
      throw new Error(`ChatModel não encontrado para provider: ${provider}`);
    }
    
    return model;
  }

  /**
   * Obtém todos os ChatModels disponíveis
   */
  async getAllChatModels() {
    await this.initialize();
    return Array.from(this.models.entries());
  }

  /**
   * Verifica se um provider está disponível
   */
  hasProvider(providerName) {
    return this.models.has(providerName);
  }

  /**
   * Lista todos os providers disponíveis
   */
  listProviders() {
    return Array.from(this.models.keys());
  }
}

module.exports = new ProviderAdapter();

