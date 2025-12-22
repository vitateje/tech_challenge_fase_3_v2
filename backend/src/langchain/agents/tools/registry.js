/**
 * Registry centralizado de tools para agentes LangChain
 * Atualmente vazio - tools podem ser adicionadas conforme necessário para o medical assistant
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.initialized = false;
  }

  /**
   * Inicializa todas as tools
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Tools podem ser adicionadas aqui no futuro
      // Por enquanto, o medical assistant não usa tools específicas
      
      this.initialized = true;
      console.log(`✅ Tool Registry inicializado com ${this.tools.size} tools`);
    } catch (error) {
      console.error(`❌ Erro ao inicializar Tool Registry: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra uma tool
   */
  registerTool(name, tool) {
    this.tools.set(name, tool);
  }

  /**
   * Obtém uma tool por nome
   */
  async getTool(name) {
    await this.initialize();
    return this.tools.get(name);
  }

  /**
   * Obtém todas as tools disponíveis
   */
  async getAllTools() {
    await this.initialize();
    return Array.from(this.tools.values());
  }

  /**
   * Lista nomes de todas as tools
   */
  async listToolNames() {
    await this.initialize();
    return Array.from(this.tools.keys());
  }
}

module.exports = new ToolRegistry();

