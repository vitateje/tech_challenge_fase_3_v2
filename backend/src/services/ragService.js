const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

/**
 * RAG Service
 * Serviço para busca vetorial em documentos médicos gerais usando Pinecone
 * Baseado no pipeline do notebook demo.ipynb
 */
class RAGService {
    constructor() {
        this.pc = null;
        this.index = null;
        this.embeddingsGen = null;
        this.initialized = false;
        
        // Configurações do Pinecone baseadas no notebook
        this.PINECONE_INDEX_NAME = 'biobyia';
        this.PINECONE_NAMESPACE = 'medical_qa';
    }

    /**
     * Inicializa a conexão com Pinecone e o gerador de embeddings
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            const pineconeApiKey = process.env.PINECONE_API_KEY;
            const geminiApiKey = process.env.GEMINI_API_KEY;

            if (!pineconeApiKey) {
                throw new Error('PINECONE_API_KEY não encontrada nas variáveis de ambiente');
            }

            if (!geminiApiKey) {
                throw new Error('GEMINI_API_KEY não encontrada nas variáveis de ambiente');
            }

            // Inicializar Pinecone
            this.pc = new Pinecone({ 
                apiKey: pineconeApiKey 
            });
            this.index = this.pc.Index(this.PINECONE_INDEX_NAME);

            // Inicializar Google Generative AI Embeddings
            this.embeddingsGen = new GoogleGenerativeAIEmbeddings({
                model: 'text-embedding-004',
                apiKey: geminiApiKey
            });

            this.initialized = true;
            console.log('✅ RAG Service inicializado com sucesso');
            console.log(`   - Index: ${this.PINECONE_INDEX_NAME}`);
            console.log(`   - Namespace: ${this.PINECONE_NAMESPACE}`);
        } catch (error) {
            console.error('❌ Erro ao inicializar RAG Service:', error.message);
            throw error;
        }
    }

    /**
     * Busca contexto médico relevante usando RAG
     * Equivalente à função query_rag_context() do notebook
     * 
     * @param {string} query - Pergunta ou consulta médica
     * @param {number} topK - Número de resultados a retornar (padrão: 5)
     * @returns {Array} Array de objetos com contexto médico relevante
     */
    async queryRAGContext(query, topK = 5) {
        try {
            // Garante que o serviço está inicializado
            await this.initialize();

            // Gera embedding da query
            const queryVector = await this.embeddingsGen.embedQuery(query);

            // Busca vetores similares no Pinecone
            const response = await this.index.namespace(this.PINECONE_NAMESPACE).query({
                vector: queryVector,
                topK: topK,
                includeMetadata: true
            });

            // Formata os resultados no mesmo formato do notebook
            const results = response.matches.map(match => ({
                id: match.metadata?.article_id || 'N/A',
                source: match.metadata?.source || 'N/A',
                text: match.metadata?.text || '',
                score: match.score
            }));

            console.log(`📚 RAG: ${results.length} documentos médicos relevantes encontrados`);
            
            return results;
        } catch (error) {
            console.error('❌ Erro ao buscar contexto RAG:', error.message);
            // Retorna array vazio em caso de erro para não quebrar o fluxo
            return [];
        }
    }

    /**
     * Formata os resultados do RAG para uso em prompts
     * 
     * @param {Array} ragResults - Resultados da busca RAG
     * @returns {string} Contexto formatado para o prompt
     */
    formatRAGContext(ragResults) {
        if (!ragResults || ragResults.length === 0) {
            return 'Nenhum documento médico específico encontrado. Forneça conhecimento médico geral com avisos apropriados.';
        }

        const formattedContext = ragResults
            .map((result, index) => {
                const header = `Fonte Médica ${index + 1}`;
                const sourceInfo = result.source !== 'N/A' ? ` [ID: ${result.id}, Origem: ${result.source}]` : '';
                return `${header}${sourceInfo}:\n${result.text}`;
            })
            .join('\n\n');

        return formattedContext;
    }

    /**
     * Obtém informações de rastreabilidade das fontes
     * 
     * @param {Array} ragResults - Resultados da busca RAG
     * @returns {Array} Array formatado para rastreabilidade
     */
    getSourcesInfo(ragResults) {
        if (!ragResults || ragResults.length === 0) {
            return [];
        }

        return ragResults.map(result => ({
            type: 'rag_document',
            reference: result.id,
            title: `Artigo Médico: ${result.id}`,
            source: result.source,
            excerpt: result.text.substring(0, 200) + '...',
            score: result.score,
            metadata: {
                article_id: result.id,
                source: result.source,
                similarity_score: result.score
            }
        }));
    }

    /**
     * Verifica se o serviço está disponível
     * 
     * @returns {boolean} True se o serviço está inicializado e pronto
     */
    isAvailable() {
        return this.initialized && this.index !== null && this.embeddingsGen !== null;
    }

    /**
     * Testa a conexão com o Pinecone
     * 
     * @returns {Object} Resultado do teste
     */
    async testConnection() {
        try {
            await this.initialize();
            
            // Tenta fazer uma busca simples
            const testQuery = 'medical test';
            const testVector = await this.embeddingsGen.embedQuery(testQuery);
            const testResponse = await this.index.namespace(this.PINECONE_NAMESPACE).query({
                vector: testVector,
                topK: 1,
                includeMetadata: true
            });

            return {
                success: true,
                message: 'Conexão com Pinecone estabelecida com sucesso',
                indexName: this.PINECONE_INDEX_NAME,
                namespace: this.PINECONE_NAMESPACE,
                testResults: testResponse.matches.length
            };
        } catch (error) {
            return {
                success: false,
                message: 'Erro ao conectar com Pinecone',
                error: error.message
            };
        }
    }
}

// Exporta instância singleton
module.exports = new RAGService();

