const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class OllamaProvider extends BaseProvider {
  async initialize() {
    this.baseUrl = this.config.baseUrl || 'http://localhost:11434';
    this.model = this.config.model;
    
    // Verificar se Ollama está rodando com retry
    const maxRetries = 3;
    const retryDelay = 1000; // 1 segundo
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/tags`, {
          timeout: 5000 // 5 segundos de timeout
        });
        
        // Verificar se o modelo está disponível
        const models = response.data.models || [];
        const modelExists = models.some(m => m.name === this.model || m.model === this.model);
        
        if (!modelExists) {
          console.warn(`[AVISO] ${this.name}: Modelo "${this.model}" não encontrado nos modelos disponíveis`);
          console.warn(`   Modelos disponíveis: ${models.map(m => m.name || m.model).join(', ')}`);
          console.warn(`   Execute: ollama pull ${this.model}`);
        } else {
          console.log(`[OK] Modelo "${this.model}" encontrado no Ollama`);
        }
        
        console.log(`[OK] ${this.name} Provider inicializado`);
        console.log(`   Modelo: ${this.model}`);
        console.log(`   Servidor: ${this.baseUrl}`);
        return true;
      } catch (error) {
        if (attempt < maxRetries) {
          console.log(`[AVISO] ${this.name}: Tentativa ${attempt}/${maxRetries} falhou, tentando novamente em ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        if (error.code === 'ECONNREFUSED') {
          console.warn(`[AVISO] ${this.name}: Servidor Ollama não está rodando em ${this.baseUrl}`);
          console.warn(`   Execute: ollama serve (ou inicie o Ollama manualmente)`);
        } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          console.warn(`[AVISO] ${this.name}: Timeout ao conectar - servidor pode estar lento ou ocupado`);
        } else {
          console.warn(`[AVISO] ${this.name}: Erro ao conectar - ${error.message}`);
        }
        return false;
      }
    }
    
    return false;
  }

  async generate(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || this.config.temperature,
          num_predict: options.maxTokens || this.config.maxTokens
        }
      });
      
      return response.data.response || 'Não foi possível gerar resposta.';
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Ollama não está rodando em ${this.baseUrl}`);
      }
      throw error;
    }
  }

  isAvailable() {
    // Considerar disponível se tem baseUrl e model configurados
    // A verificação real de conexão é feita em initialize()
    return !!this.baseUrl && !!this.model;
  }
}

module.exports = OllamaProvider;

