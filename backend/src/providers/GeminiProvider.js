const BaseProvider = require('./BaseProvider');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider extends BaseProvider {
  async initialize() {
    if (!this.config.apiKey) {
      console.warn(`⚠️ ${this.name}: API_KEY não configurada`);
      return false;
    }
    
    this.client = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.client.getGenerativeModel({ model: this.config.model });
    console.log(`🤖 ${this.name} inicializado (${this.config.model})`);
    return true;
  }

  async generate(prompt, options = {}) {
    if (!this.model) {
      throw new Error(`${this.name} não foi inicializado corretamente`);
    }

    const result = await this.model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || this.config.temperature,
        maxOutputTokens: options.maxTokens || this.config.maxTokens,
      }
    });
    
    const response = await result.response;
    return response.text();
  }

  isAvailable() {
    return !!this.model;
  }
}

module.exports = GeminiProvider;

