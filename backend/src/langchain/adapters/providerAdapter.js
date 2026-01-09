const { ChatOllama } = require('@langchain/ollama');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { BaseChatModel } = require('@langchain/core/language_models/chat_models');
const { AIMessage, HumanMessage } = require('@langchain/core/messages');
const llmConfig = require('../../config/llmConfig');
const langchainConfig = require('../config');
const providerRegistry = require('../../providers/ProviderRegistry');

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
        console.log(`[OK] LangChain Gemini ChatModel inicializado`);
        console.log(`   Modelo: ${providerConfigs.gemini.model}`);
        console.log(`   Temperature: ${providerConfigs.gemini.temperature} | Max Tokens: ${providerConfigs.gemini.maxTokens}`);
      } catch (error) {
        console.warn(`[AVISO] Erro ao inicializar LangChain Gemini: ${error.message}`);
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
        console.log(`[OK] LangChain Ollama ChatModel inicializado`);
        console.log(`   Modelo: ${providerConfigs.ollama.model}`);
        console.log(`   Base URL: ${providerConfigs.ollama.baseUrl}`);
        console.log(`   Temperature: ${providerConfigs.ollama.temperature} | Max Tokens: ${providerConfigs.ollama.maxTokens}`);
      } catch (error) {
        console.warn(`[AVISO] Erro ao inicializar LangChain Ollama: ${error.message}`);
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
        console.log(`[OK] LangChain BiobyIA ChatModel inicializado`);
        console.log(`   Modelo: ${providerConfigs.biobyia.model}`);
        console.log(`   Base URL: ${providerConfigs.biobyia.baseUrl}`);
        console.log(`   Timeout: 180s | Temperature: ${providerConfigs.biobyia.temperature} | Max Tokens: ${providerConfigs.biobyia.maxTokens}`);
      } catch (error) {
        console.error(`[ERRO] Falha ao inicializar LangChain BiobyIA: ${error.message}`);
        console.error(`   Verifique se o modelo ${providerConfigs.biobyia.model} está instalado: ollama pull ${providerConfigs.biobyia.model}`);
        console.error(`   Verifique se o Ollama está rodando em ${providerConfigs.biobyia.baseUrl}`);
        // Não lança erro aqui - deixa para falhar quando tentar usar
      }
    }

    // Inicializar HuggingFace se disponível
    if (providerConfigs.huggingface) {
      try {
        // Tenta usar @langchain/huggingface se disponível
        let model = null;
        try {
          const { ChatHuggingFace } = require('@langchain/huggingface');
          model = new ChatHuggingFace({
            model: providerConfigs.huggingface.modelId,
            apiKey: providerConfigs.huggingface.apiKey,
            temperature: providerConfigs.huggingface.temperature,
            maxTokens: providerConfigs.huggingface.maxTokens,
          });
          this.models.set('huggingface', model);
          console.log(`✅ LangChain HuggingFace ChatModel inicializado (${providerConfigs.huggingface.modelId})`);
        } catch (langchainError) {
          // Se @langchain/huggingface não estiver instalado, cria wrapper customizado
          console.log(`ℹ️  @langchain/huggingface não instalado. Criando wrapper customizado...`);
          
          // Cria HuggingFaceProvider
          const HuggingFaceProvider = providerRegistry.getProvider('huggingface');
          if (!HuggingFaceProvider) {
            throw new Error('HuggingFaceProvider não encontrado no registry');
          }
          
          const hfProvider = new HuggingFaceProvider(providerConfigs.huggingface);
          await hfProvider.initialize();
          
          // Cria wrapper que adapta HuggingFaceProvider para ChatModel
          class HuggingFaceChatModel extends BaseChatModel {
            constructor(provider) {
              super({});
              this.provider = provider;
            }
            
            _llmType() {
              return 'huggingface';
            }
            
            async _generate(messages, options, runManager) {
              // Converte mensagens LangChain para prompt simples
              const prompt = this._formatMessagesAsPrompt(messages);
              
              // Chama o provider
              const response = await this.provider.generate(prompt, {
                temperature: options.temperature || this.provider.config.temperature,
                maxTokens: options.maxTokens || this.provider.config.maxTokens
              });
              
              // Retorna no formato LangChain esperado
              const aiMessage = new AIMessage(response);
              return {
                generations: [{
                  text: response,
                  message: aiMessage
                }],
                llmOutput: {}
              };
            }
            
            _formatMessagesAsPrompt(messages) {
              // Formata mensagens do LangChain para prompt simples
              return messages.map(msg => {
                if (msg instanceof HumanMessage) {
                  return `Human: ${msg.content}`;
                } else if (msg instanceof AIMessage) {
                  return `Assistant: ${msg.content}`;
                } else {
                  return msg.content;
                }
              }).join('\n');
            }
          }
          
          model = new HuggingFaceChatModel(hfProvider);
          this.models.set('huggingface', model);
          console.log(`✅ HuggingFace ChatModel wrapper inicializado (${providerConfigs.huggingface.modelId})`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao inicializar LangChain HuggingFace: ${error.message}`);
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

