const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class HuggingFaceProvider extends BaseProvider {
  async initialize() {
    if (!this.config.apiKey) {
      console.warn(`⚠️ ${this.name}: API_KEY não configurada`);
      return false;
    }

    if (!this.config.modelId) {
      console.warn(`⚠️ ${this.name}: MODEL_ID não configurado`);
      return false;
    }

    // URL da API do HuggingFace (nova API)
    // Nota: API antiga (api-inference.huggingface.co) retorna 410 Gone
    this.apiUrl = `https://router.huggingface.co/models/${this.config.modelId}`;
    
    this.headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };

    console.log(`🤖 ${this.name} inicializado (${this.config.modelId})`);
    return true;
  }

  async generate(prompt, options = {}) {
    if (!this.apiUrl) {
      throw new Error(`${this.name} não foi inicializado corretamente`);
    }

    const payload = {
      inputs: prompt,
      parameters: {
        temperature: options.temperature || this.config.temperature || 0.7,
        max_new_tokens: options.maxTokens || this.config.maxTokens || 500,
        return_full_text: false
      }
    };

    try {
      const response = await axios.post(
        this.apiUrl,
        payload,
        { 
          headers: this.headers,
          timeout: 60000 // 60 segundos de timeout (modelos podem demorar para carregar)
        }
      );

      // Processa a resposta com sucesso
      return this._extractResponse(response.data);
        
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Extrai o texto gerado da resposta do HuggingFace
   */
  _extractResponse(data) {
    // A resposta do HuggingFace pode vir em diferentes formatos
    if (Array.isArray(data) && data.length > 0) {
      // Formato padrão: [{ generated_text: "..." }]
      const firstItem = data[0];
      if (firstItem.generated_text) {
        return firstItem.generated_text;
      } else if (firstItem.text) {
        return firstItem.text;
      } else if (typeof firstItem === 'string') {
        return firstItem;
      }
    } else if (data.generated_text) {
      // Formato alternativo: { generated_text: "..." }
      return data.generated_text;
    } else if (typeof data === 'string') {
      // Formato simples: string direta
      return data;
    } else if (data[0]?.generated_text) {
      // Formato aninhado: { 0: { generated_text: "..." } }
      return data[0].generated_text;
    }
    
    // Se não conseguir extrair, retorna string JSON
    console.warn(`⚠️  Formato de resposta não reconhecido, retornando JSON:`, JSON.stringify(data).substring(0, 200));
    return JSON.stringify(data);
  }

  /**
   * Trata erros da API do HuggingFace
   */
  _handleError(error) {
    if (!error.response) {
      if (error.request) {
        // Erro de rede
        throw new Error(`${this.name} erro de conexão: ${error.message}`);
      } else {
        // Outro erro
        throw new Error(`${this.name} erro: ${error.message}`);
      }
    }

    // Erro da API do HuggingFace
    const status = error.response.status;
    const data = error.response.data;
    let message = '';
    
    // Tenta extrair mensagem de erro de diferentes formatos
    if (typeof data === 'string') {
      message = data;
    } else if (data?.error) {
      message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    } else if (data?.message) {
      message = data.message;
    } else if (Array.isArray(data) && data.length > 0 && data[0]?.error) {
      message = data[0].error;
    } else {
      message = error.message || 'Erro desconhecido';
    }
    
    // Trata diferentes códigos de status
    switch (status) {
      case 503:
        // Modelo ainda carregando
        throw new Error(
          `${this.name} modelo está carregando. Aguarde alguns segundos e tente novamente.\n` +
          `💡 Modelos grandes podem levar até 30 segundos para carregar na primeira requisição.`
        );
        
      case 429:
        // Rate limit
        throw new Error(
          `${this.name} rate limit excedido. Aguarde antes de tentar novamente.\n` +
          `💡 Verifique seu plano no HuggingFace: https://huggingface.co/settings/billing`
        );
        
      case 400:
        // Bad request - pode ser formato incorreto
        throw new Error(
          `${this.name} erro de requisição: ${message}\n` +
          `💡 Verifique se o formato do prompt está correto.`
        );
        
      case 404:
        // Modelo não encontrado ou não disponível via Inference API
        throw new Error(
          `${this.name} modelo não encontrado ou não disponível: ${this.config.modelId}\n\n` +
          `💡 Verifique:\n` +
          `   1. Se o modelo existe: https://huggingface.co/${this.config.modelId}\n` +
          `   2. Se você aceitou as condições do modelo (se necessário)\n` +
          `   3. Se o modelo está público e acessível\n` +
          `   4. Se o nome está correto no .env (HUGGINGFACE_MODEL_ID)\n` +
          `   5. ⚠️  IMPORTANTE: Modelos LoRA podem não funcionar via Inference API\n` +
          `      Se este é um modelo LoRA, considere usar via Ollama localmente\n` +
          `   6. Faça login: hf auth login`
        );
        
      case 401:
      case 403:
        // Não autorizado - pode ser que precise aceitar condições do modelo
        throw new Error(
          `${this.name} erro de autenticação (${status}): ${message}\n\n` +
          `💡 Verifique:\n` +
          `   1. Se HUGGINGFACE_API_KEY está correto no .env\n` +
          `   2. Se você aceitou as condições do modelo: https://huggingface.co/${this.config.modelId}\n` +
          `   3. Se o token tem permissão para acessar o modelo\n` +
          `   4. Faça login e aceite condições: hf auth login\n` +
          `   5. Obtenha um novo token: https://huggingface.co/settings/tokens`
        );
        
      case 410:
        // API antiga não é mais suportada
        throw new Error(
          `${this.name} API antiga não é mais suportada (410)\n\n` +
          `💡 A API router.huggingface.co deve ser usada.\n` +
          `   Se este erro persistir, o modelo pode não estar disponível via Inference API.\n` +
          `   Modelos LoRA podem precisar ser usados localmente via Ollama.`
        );
        
      default:
        throw new Error(`${this.name} erro (${status}): ${message}`);
    }
  }

  isAvailable() {
    return !!this.apiUrl;
  }
}

module.exports = HuggingFaceProvider;
