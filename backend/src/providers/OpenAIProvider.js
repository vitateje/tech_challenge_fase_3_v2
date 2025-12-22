const BaseProvider = require('./BaseProvider');
const OpenAI = require('openai');

class OpenAIProvider extends BaseProvider {
  async initialize() {
    if (!this.config.apiKey) {
      console.warn(`⚠️ ${this.name}: API_KEY não configurada`);
      return false;
    }
    
    this.client = new OpenAI({ apiKey: this.config.apiKey });
    console.log(`🤖 ${this.name} inicializado (${this.config.model})`);
    return true;
  }

  async generate(prompt, options = {}) {
    if (!this.client) {
      throw new Error(`${this.name} não foi inicializado corretamente`);
    }

    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: options.systemMessage || "Você é um assistente de química especializado. Responda em português."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature || this.config.temperature
    });

    return completion.choices[0].message.content;
  }

  isAvailable() {
    return !!this.client;
  }
}

module.exports = OpenAIProvider;

