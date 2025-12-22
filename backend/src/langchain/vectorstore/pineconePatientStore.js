const { Pinecone } = require('@pinecone-database/pinecone');
const { PineconeStore } = require('@langchain/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { OllamaEmbeddings } = require('@langchain/ollama');
const langchainConfig = require('../config');

/**
 * Pinecone Patient Store
 * Responsável por buscar contexto de pacientes no Pinecone.
 *
 * Configuração do índice Pinecone:
 *  - Index: biobyia
 *  - Metric: cosine
 *  - Dimensions: 1024
 *  - Model: llama-text-embed-v2
 *  - Region: us-east-1 (AWS)
 *  - Type: Dense
 *  - Capacity mode: On-demand
 *  - Host: https://biobyia-c9udx7w.svc.aped-4627-b74a.pinecone.io
 *
 * IMPORTANTE: O índice foi criado com embeddings do modelo llama-text-embed-v2 (1024 dimensões).
 * Para queries, é recomendado usar o mesmo modelo de embedding ou um compatível com 1024 dimensões.
 *
 * Configuração de Embeddings (prioridade):
 *  1. Gemini: Configure GEMINI_API_KEY (usa text-embedding-004, 768 dimensões - RECOMENDADO)
 *  2. Ollama: Configure OLLAMA_BASE_URL e EMBEDDING_MODEL (apenas se necessário)
 *
 * IMPORTANTE: O modelo llama-text-embed-v2 pode não estar disponível no Ollama.
 * Recomenda-se usar Gemini embeddings (text-embedding-004) que funciona bem mesmo com
 * índices criados com 1024 dimensões devido à compatibilidade de similaridade de cosseno.
 *
 * Para usar Ollama (se necessário):
 *  - Instale Ollama: https://ollama.ai
 *  - Baixe um modelo de embedding disponível: ollama pull mxbai-embed-large (1024 dims)
 *  - Configure no .env:
 *    OLLAMA_BASE_URL=http://localhost:11434
 *    EMBEDDING_MODEL=mxbai-embed-large
 *
 * Configuração via variáveis de ambiente:
 *  - PINECONE_API_KEY   (token de API)
 *  - PINECONE_INDEX_NAME (nome do índice, padrão: biobyia)
 *  - PINECONE_NAMESPACE (namespace opcional para separar dados)
 *  - EMBEDDING_MODEL    (modelo de embedding para Ollama, padrão: llama-text-embed-v2)
 *
 * As entradas devem ter metadata contendo ao menos:
 *  - patient_id: identificador lógico (UUID/string) que será recebido do frontend.
 */

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'biobyia';
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || '';

let pineconeClient = null;
let vectorStore = null;

function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY
    });
  }
  return pineconeClient;
}

async function getEmbeddingsModel() {
  const provider = langchainConfig.provider;
  const providers = langchainConfig.getAvailableProviders();

  // Prioriza Gemini embeddings (geralmente tem API key configurada e funciona bem)
  if (providers.gemini && providers.gemini.apiKey) {
    try {
      return new GoogleGenerativeAIEmbeddings({
        model: 'text-embedding-004',
        apiKey: providers.gemini.apiKey,
      });
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Gemini embeddings:', error.message);
    }
  }

  // Tenta Ollama embeddings apenas se explicitamente configurado
  if (providers.ollama && process.env.EMBEDDING_MODEL) {
    try {
      const embeddingModel = process.env.EMBEDDING_MODEL;
      return new OllamaEmbeddings({
        model: embeddingModel,
        baseUrl: providers.ollama.baseUrl || 'http://localhost:11434',
      });
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Ollama embeddings:', error.message);
      console.warn('💡 Dica: Verifique se o modelo está instalado: ollama pull ' + process.env.EMBEDDING_MODEL);
      // Continua para tentar Gemini como fallback
    }
  }

  // Se Gemini não funcionou e Ollama não está configurado, tenta Gemini novamente como última opção
  if (providers.gemini && providers.gemini.apiKey) {
    return new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',
      apiKey: providers.gemini.apiKey,
    });
  }

  // Se nenhum provider estiver disponível, lança erro informativo
  throw new Error(
    'Nenhum modelo de embedding configurado ou disponível. ' +
    'Configure GEMINI_API_KEY (recomendado) ou configure OLLAMA_BASE_URL com EMBEDDING_MODEL. ' +
    'Nota: O modelo llama-text-embed-v2 pode não estar disponível no Ollama. ' +
    'Use Gemini embeddings (text-embedding-004) que funciona bem com o índice biobyia.'
  );
}

async function getVectorStore() {
  if (vectorStore) return vectorStore;

  try {
    const embeddings = await getEmbeddingsModel();
    const pc = getPineconeClient();
    const index = pc.index(PINECONE_INDEX_NAME);

    vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE || undefined,
    });

    console.log('✅ Pinecone vector store inicializado com sucesso');
    return vectorStore;
  } catch (error) {
    console.error('❌ Error initializing Pinecone vector store:', error.message || error);
    
    // Se o erro for relacionado a modelo não encontrado, tenta limpar o cache e usar Gemini
    if (error.message && error.message.includes('not found')) {
      console.warn('⚠️ Modelo de embedding não encontrado. Tentando usar Gemini como fallback...');
      vectorStore = null; // Limpa cache para tentar novamente
      
      // Força uso de Gemini se disponível
      const providers = langchainConfig.getAvailableProviders();
      if (providers.gemini && providers.gemini.apiKey) {
        try {
          const embeddings = new GoogleGenerativeAIEmbeddings({
            model: 'text-embedding-004',
            apiKey: providers.gemini.apiKey,
          });
          const pc = getPineconeClient();
          const index = pc.index(PINECONE_INDEX_NAME);
          
          vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            namespace: PINECONE_NAMESPACE || undefined,
          });
          
          console.log('✅ Pinecone vector store inicializado com Gemini embeddings (fallback)');
          return vectorStore;
        } catch (fallbackError) {
          console.error('❌ Erro no fallback para Gemini:', fallbackError.message);
        }
      }
    }
    
    throw error;
  }
}

/**
 * Busca contexto de paciente no Pinecone.
 *
 * @param {string} patientId
 * @param {string} query
 * @param {object} options
 * @returns {Promise<{chunks: Array<{id: string, text: string, metadata: object}>}>}
 */
async function getPatientContext(patientId, query, options = {}) {
  const { nResults = 5 } = options;

  if (!patientId) {
    return { chunks: [] };
  }

  try {
    const store = await getVectorStore();

    // Pinecone usa filter para metadata
    const filter = {
      patient_id: { $eq: patientId }
    };

    // Usa similaritySearch com filter como terceiro parâmetro
    const results = await store.similaritySearch(
      query || '',
      nResults,
      filter
    );

    const chunks = results.map((doc, idx) => ({
      id: doc.id || `${patientId}-${idx}`,
      text: doc.pageContent,
      metadata: doc.metadata || {},
    }));

    return { chunks };
  } catch (error) {
    console.error('❌ Error querying Pinecone patient context:', error.message || error);
    // Fail gracefully: no RAG context, but the main flow can continue
    return { chunks: [] };
  }
}

module.exports = {
  getPatientContext,
};

