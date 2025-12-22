/**
 * Módulo principal de exportação do framework LangChain
 * Facilita importações centralizadas de todos os componentes
 */

// Chains
const chatChain = require('./chains/chatChain');
const orchestration = require('./chains/orchestration');
const evaluationChain = require('./chains/evaluationChain');

// Agents & Executors
const agentExecutor = require('./agents/agentExecutor');
const toolRegistry = require('./agents/tools/registry');

// Memory
const memoryManager = require('./memory/memoryManager');

// Document Transformers
const documentTransformers = require('./transformers/documentTransformers');

// Providers & Adapters
const providerAdapter = require('./adapters/providerAdapter');

// Config
const langchainConfig = require('./config');

// Guardrails
const guardrails = require('./guardrails');

module.exports = {
  // Chains
  chatChain,
  orchestration,
  evaluationChain,

  // Agents
  agentExecutor,
  toolRegistry,

  // Memory
  memoryManager,

  // Transformers
  documentTransformers,

  // Providers
  providerAdapter,

  // Config
  langchainConfig,

  // Guardrails
  guardrails
};

