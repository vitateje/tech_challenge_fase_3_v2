const { AgentExecutor, createOpenAIFunctionsAgent } = require('langchain/agents');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const providerAdapter = require('../adapters/providerAdapter');
const langchainConfig = require('../config');
const toolRegistry = require('./tools/registry');

/**
 * Serviço de Agent Executor para tomada de decisão inteligente
 * Integra tools e memória para criar agentes autônomos
 */
class AgentExecutorService {
  constructor() {
    this.executors = new Map();
    this.agents = new Map();
  }

  /**
   * Cria um agente com tools especializadas
   */
  async createAgent(agentType = 'default', tools = [], providerName = null) {
    const key = `${agentType}_${providerName || langchainConfig.provider}`;
    
    if (this.agents.has(key)) {
      return this.agents.get(key);
    }

    const chatModel = await providerAdapter.getChatModel(providerName);

    // Se não foram fornecidas tools, usar as padrão
    const agentTools = tools.length > 0 ? tools : await toolRegistry.getAllTools();

    // Template do prompt para o agente
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', this._getSystemPrompt(agentType)],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Criar agente usando OpenAI Functions Agent (compatível com Gemini e outros)
    let agent;
    try {
      agent = await createOpenAIFunctionsAgent({
        llm: chatModel,
        tools: agentTools,
        prompt: prompt
      });
    } catch (error) {
      // Fallback: criar agente simples se a criação falhar
      console.warn(`⚠️ Erro ao criar agente com functions, usando fallback: ${error.message}`);
      agent = await this._createSimpleAgent(chatModel, agentTools, prompt);
    }

    this.agents.set(key, agent);
    return agent;
  }

  /**
   * Cria um executor de agente (combina agente + memória + tools)
   */
  async createExecutor(agentType = 'default', memory = null, tools = [], providerName = null) {
    const key = `${agentType}_${memory ? 'with_memory' : 'no_memory'}_${providerName || langchainConfig.provider}`;
    
    if (this.executors.has(key)) {
      return this.executors.get(key);
    }

    const agent = await this.createAgent(agentType, tools, providerName);

    // Criar executor com configurações
    const executor = new AgentExecutor({
      agent: agent,
      tools: tools.length > 0 ? tools : await toolRegistry.getAllTools(),
      memory: memory,
      verbose: langchainConfig.chains.verbose,
      maxIterations: 15,
      returnIntermediateSteps: false
    });

    this.executors.set(key, executor);
    return executor;
  }



  /**
   * Cria um executor completo (todas as tools)
   */
  async createFullExecutor(memory = null, providerName = null) {
    const allTools = await toolRegistry.getAllTools();
    return await this.createExecutor('full', memory, allTools, providerName);
  }

  /**
   * Invoca o executor com uma pergunta
   */
  async invoke(executor, input, options = {}) {
    try {
      const result = await executor.invoke({
        input: input,
        ...options
      });

      return {
        output: result.output || result.text || result,
        intermediateSteps: result.intermediateSteps || [],
        success: true
      };
    } catch (error) {
      console.error(`❌ Erro ao executar agente: ${error.message}`);
      return {
        output: 'Desculpe, ocorreu um erro ao processar sua pergunta.',
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Obtém prompt do sistema baseado no tipo de agente
   */
  _getSystemPrompt(agentType) {
    const prompts = {
      default: `Você é um assistente médico virtual para profissionais de saúde. 
Forneça suporte clínico baseado em conhecimento médico atualizado.
Sempre inclua avisos de segurança e recomende consulta com médico responsável.`,

      medical: `Você é um assistente médico especializado em suporte clínico. 
Forneça informações médicas precisas, sempre considerando o contexto do paciente.
Nunca forneça diagnósticos ou prescrições diretas - sempre recomende consulta médica.`,

      full: `Você é um assistente médico completo e versátil.
Forneça suporte clínico abrangente, sempre com avisos de segurança apropriados.
Seja preciso, baseado em evidências e sempre recomende supervisão médica profissional.`
    };

    return prompts[agentType] || prompts.default;
  }

  /**
   * Cria um agente simples (fallback)
   * Usa uma abordagem mais básica quando createOpenAIFunctionsAgent falha
   */
  async _createSimpleAgent(chatModel, tools, prompt) {
    // Retornar um objeto que simula um agente básico
    return {
      llm: chatModel,
      tools: tools,
      prompt: prompt,
      type: 'simple'
    };
  }
}

module.exports = new AgentExecutorService();

