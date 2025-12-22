const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const providerAdapter = require('../adapters/providerAdapter');
const langchainConfig = require('../config');

/**
 * Transformadores de documentos para processamento inteligente
 * Inclui: resumo, tradução, formatação, chunking inteligente
 */
class DocumentTransformerService {
  constructor() {
    this.splitter = null;
    this.initialized = false;
  }

  /**
   * Inicializa o serviço
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Inicializar text splitter padrão
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: langchainConfig.documentProcessing.chunkSize || 1000,
      chunkOverlap: langchainConfig.documentProcessing.chunkOverlap || 200,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });

    this.initialized = true;
  }

  /**
   * Divide um documento em chunks com sobreposição
   */
  async splitIntoChunks(text, chunkSize = null, chunkOverlap = null) {
    await this.initialize();

    const splitter = chunkSize || chunkOverlap
      ? new RecursiveCharacterTextSplitter({
          chunkSize: chunkSize || langchainConfig.documentProcessing.chunkSize || 1000,
          chunkOverlap: chunkOverlap || langchainConfig.documentProcessing.chunkOverlap || 200,
          separators: ['\n\n', '\n', '. ', ' ', '']
        })
      : this.splitter;

    const chunks = await splitter.createDocuments([text]);
    return chunks.map(chunk => ({
      content: chunk.pageContent,
      metadata: chunk.metadata
    }));
  }

  /**
   * Cria um resumo executivo de um documento usando LLM
   */
  async summarizeDocument(
    text,
    maxLength = 500,
    providerName = null
  ) {
    try {
      await this.initialize();
      const chatModel = await providerAdapter.getChatModel(providerName);

      const { ChatPromptTemplate } = require('@langchain/core/prompts');
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Você é um especialista em criar resumos concisos e informativos de documentos médicos e científicos.
Crie um resumo executivo que capture os pontos principais de forma clara e precisa.
O resumo deve ter no máximo ${maxLength} palavras.`
        ],
        ['human', 'Resuma o seguinte documento:\n\n{document}']
      ]);

      const chain = prompt.pipe(chatModel);
      const result = await chain.invoke({ document: text });

      return {
        summary: typeof result === 'string' ? result : result.content || result.text,
        originalLength: text.length,
        summaryLength: result.length || result.content?.length || 0
      };
    } catch (error) {
      console.error(`Erro ao resumir documento: ${error.message}`);
      // Fallback: retornar primeiras N palavras
      const words = text.split(/\s+/);
      return {
        summary: words.slice(0, maxLength / 5).join(' ') + '...',
        originalLength: text.length,
        summaryLength: words.slice(0, maxLength / 5).join(' ').length,
        fallback: true
      };
    }
  }

  /**
   * Traduz um documento (português <-> inglês)
   */
  async translateDocument(
    text,
    targetLanguage = 'português',
    providerName = null
  ) {
    try {
      await this.initialize();
      const chatModel = await providerAdapter.getChatModel(providerName);

      const { ChatPromptTemplate } = require('@langchain/core/prompts');
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Você é um tradutor especializado em textos médicos e científicos.
Traduza o texto preservando termos técnicos médicos quando apropriado e mantendo a precisão.
Traduza para: ${targetLanguage}`
        ],
        ['human', 'Traduza o seguinte texto:\n\n{text}']
      ]);

      const chain = prompt.pipe(chatModel);
      const result = await chain.invoke({ text: text });

      return {
        translated: typeof result === 'string' ? result : result.content || result.text,
        targetLanguage: targetLanguage,
        originalLength: text.length
      };
    } catch (error) {
      console.error(`Erro ao traduzir documento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Formata um documento para melhor legibilidade
   */
  async formatDocument(text, format = 'markdown') {
    await this.initialize();

    // Formatação básica (pode ser expandida)
    let formatted = text;

    if (format === 'markdown') {
      // Adicionar formatação markdown básica
      formatted = formatted
        .replace(/\n{3,}/g, '\n\n') // Remover múltiplas linhas vazias
        .replace(/^([A-Z][^.!?]+)$/gm, '## $1') // Títulos simples
        .trim();
    } else if (format === 'plain') {
      // Limpar formatação excessiva
      formatted = formatted
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s{3,}/g, ' ')
        .trim();
    }

    return {
      formatted: formatted,
      format: format,
      originalLength: text.length,
      formattedLength: formatted.length
    };
  }

  /**
   * Processa um documento completo (split + resumo)
   * Útil para economizar tokens em context window
   */
  async processDocument(
    text,
    chunkSize = null,
    summarize = false,
    maxSummaryLength = 500,
    providerName = null
  ) {
    await this.initialize();

    // Dividir em chunks
    const chunks = await this.splitIntoChunks(text, chunkSize);

    // Se solicitado, criar resumo para o primeiro chunk (contexto geral)
    let summary = null;
    if (summarize && chunks.length > 0) {
      const summaryResult = await this.summarizeDocument(
        chunks[0].content,
        maxSummaryLength,
        providerName
      );
      summary = summaryResult.summary;
    }

    return {
      chunks: chunks,
      summary: summary,
      totalChunks: chunks.length,
      totalLength: text.length
    };
  }

  /**
   * Remove ruído e formatação desnecessária de texto
   */
  async cleanText(text) {
    await this.initialize();

    return text
      .replace(/\s+/g, ' ') // Múltiplos espaços -> um espaço
      .replace(/\n{3,}/g, '\n\n') // Múltiplas linhas -> duas linhas
      .replace(/[^\S\n]+/g, ' ') // Espaços não-newline múltiplos
      .trim();
  }
}

module.exports = new DocumentTransformerService();

