const GeminiProvider = require('./GeminiProvider');
const OpenAIProvider = require('./OpenAIProvider');
const OllamaProvider = require('./OllamaProvider');

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }

  registerDefaultProviders() {
    // Registro automático dos providers padrão
    this.register('gemini', GeminiProvider);
    this.register('openai', OpenAIProvider);
    this.register('ollama', OllamaProvider);
  }

  register(name, ProviderClass) {
    this.providers.set(name.toLowerCase(), ProviderClass);
  }

  getProvider(name) {
    return this.providers.get(name.toLowerCase());
  }

  hasProvider(name) {
    return this.providers.has(name.toLowerCase());
  }

  listProviders() {
    return Array.from(this.providers.keys());
  }
}

module.exports = new ProviderRegistry();

