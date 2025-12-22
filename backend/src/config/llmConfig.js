require('dotenv').config();

// Função para carregar configuração dinâmica de providers
function loadProviderConfig() {
  const providers = {};
  
  // Gemini (padrão, mantém compatibilidade)
  if (process.env.GEMINI_API_KEY) {
    providers.gemini = {
      type: 'gemini',
      name: 'Gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      temperature: process.env.GEMINI_TEMPERATURE ? parseFloat(process.env.GEMINI_TEMPERATURE) : 0.7,
      maxTokens: process.env.GEMINI_MAX_TOKENS ? parseInt(process.env.GEMINI_MAX_TOKENS) : 1000
    };
  }

  // OpenAI (padrão, mantém compatibilidade)
  if (process.env.OPENAI_API_KEY) {
    providers.openai = {
      type: 'openai',
      name: 'OpenAI',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.7,
      maxTokens: process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS) : 500
    };
  }

  // Ollama (dinâmico)
  if (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL) {
    providers.ollama = {
      type: 'ollama',
      name: 'Ollama',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'gemma3:4b',
      temperature: process.env.OLLAMA_TEMPERATURE ? parseFloat(process.env.OLLAMA_TEMPERATURE) : 0.7,
      maxTokens: process.env.OLLAMA_MAX_TOKENS ? parseInt(process.env.OLLAMA_MAX_TOKENS) : 1000
    };
  }

  /**
   * BiobyIA (modelo fine-tunado)
   *
   * Este provider é um alias lógico para um modelo Ollama específico
   * (por exemplo, o modelo fine-tunado do BiobyIA).
   *
   * Variáveis de ambiente recomendadas:
   * - BIOBYIA_BASE_URL  (opcional, default: OLLAMA_BASE_URL ou http://localhost:11434)
   * - BIOBYIA_MODEL     (ex.: biobyia-lora)
   * - BIOBYIA_TEMPERATURE
   * - BIOBYIA_MAX_TOKENS
   *
   * Uso:
   * - LLM_PROVIDER=biobyia
   * - BIOBYIA_MODEL=biobyia-lora   (nome do modelo fine-tunado no Ollama ou servidor compatível)
   */
  if (process.env.BIOBYIA_BASE_URL || process.env.BIOBYIA_MODEL) {
    providers.biobyia = {
      type: 'ollama',
      name: 'BiobyIA',
      baseUrl: process.env.BIOBYIA_BASE_URL
        || process.env.OLLAMA_BASE_URL
        || 'http://localhost:11434',
      model: process.env.BIOBYIA_MODEL || process.env.OLLAMA_MODEL || 'biobyia',
      temperature: process.env.BIOBYIA_TEMPERATURE
        ? parseFloat(process.env.BIOBYIA_TEMPERATURE)
        : (process.env.OLLAMA_TEMPERATURE ? parseFloat(process.env.OLLAMA_TEMPERATURE) : 0.7),
      maxTokens: process.env.BIOBYIA_MAX_TOKENS
        ? parseInt(process.env.BIOBYIA_MAX_TOKENS)
        : (process.env.OLLAMA_MAX_TOKENS ? parseInt(process.env.OLLAMA_MAX_TOKENS) : 1000)
    };
  }

  return providers;
}

const llmConfig = {
  provider: process.env.LLM_PROVIDER || 'gemini',
  providers: loadProviderConfig(),
  
  // Método helper para obter config de um provider específico
  getProviderConfig(name) {
    return this.providers[name] || null;
  },
  
  // Fallback responses when no API key is configured
  fallback: {
    enabled: true,
    responses: {
      chemistry: 'Interessante pergunta sobre química! Como seu assistente de química, posso ajudar com elementos da tabela periódica, ligações químicas, reações químicas e conceitos fundamentais.',
      general: 'Olá! Sou seu assistente de química. Como posso ajudar?'
    }
  }
};

module.exports = llmConfig;
