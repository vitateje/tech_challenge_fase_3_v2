require('dotenv').config();
const llmConfig = require('../config/llmConfig');

/**
 * Configuração centralizada do LangChain
 * Integra com providers existentes e configura ChatModels
 */
const langchainConfig = {
  // Provider ativo
  provider: process.env.LLM_PROVIDER || 'gemini',

  // Configurações de Document Processing
  documentProcessing: {
    chunkSize: process.env.DOC_CHUNK_SIZE ? parseInt(process.env.DOC_CHUNK_SIZE) : 1000,
    chunkOverlap: process.env.DOC_CHUNK_OVERLAP ? parseInt(process.env.DOC_CHUNK_OVERLAP) : 200
  },


  // Configurações de Chains
  chains: {
    temperature: process.env.CHAIN_TEMPERATURE ? parseFloat(process.env.CHAIN_TEMPERATURE) : 0.7,
    maxTokens: process.env.CHAIN_MAX_TOKENS ? parseInt(process.env.CHAIN_MAX_TOKENS) : 1000,
    verbose: process.env.CHAIN_VERBOSE === 'true' || false
  },

  // Método para obter config do provider atual
  getProviderConfig() {
    return llmConfig.getProviderConfig(this.provider);
  },

  // Método para obter todos os providers disponíveis
  getAvailableProviders() {
    return llmConfig.providers;
  }
};

module.exports = langchainConfig;

