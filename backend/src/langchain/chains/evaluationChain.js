const { LLMChain } = require('langchain/chains');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const providerAdapter = require('../adapters/providerAdapter');
const langchainConfig = require('../config');

/**
 * Chain de Avaliação para verificar qualidade e adequação didática das respostas
 * Avalia: clareza, didática, precisão, adequação ao nível do usuário
 */
class EvaluationChainService {
  constructor() {
    this.chains = new Map();
  }

  /**
   * Cria uma chain de avaliação
   */
  async createEvaluationChain(
    evaluationType = 'quality',
    providerName = null
  ) {
    const key = `${evaluationType}_${providerName || langchainConfig.provider}`;
    
    if (this.chains.has(key)) {
      return this.chains.get(key);
    }

    const chatModel = await providerAdapter.getChatModel(providerName);
    const prompt = this._getEvaluationPrompt(evaluationType);

    const chain = new LLMChain({
      llm: chatModel,
      prompt: prompt,
      verbose: langchainConfig.chains.verbose
    });

    this.chains.set(key, chain);
    return chain;
  }

  /**
   * Avalia a qualidade de uma resposta
   */
  async evaluateQuality(response, question = null, context = {}) {
    const chain = await this.createEvaluationChain('quality', context.provider);
    
    const variables = {
      response: response,
      question: question || 'N/A',
      level: context.level || 'Geral',
      topic: context.topic || 'Geral'
    };

    const result = await chain.invoke(variables);
    return this._parseEvaluationResult(result);
  }

  /**
   * Avalia se a resposta é didática
   */
  async evaluateDidacticQuality(response, question = null, context = {}) {
    const chain = await this.createEvaluationChain('didactic', context.provider);
    
    const variables = {
      response: response,
      question: question || 'N/A',
      level: context.level || 'Geral'
    };

    const result = await chain.invoke(variables);
    return this._parseEvaluationResult(result);
  }

  /**
   * Avalia se a linguagem é adequada ao nível do usuário
   */
  async evaluateLanguageAppropriateness(
    response,
    userLevel = 'Geral',
    context = {}
  ) {
    const chain = await this.createEvaluationChain('language', context.provider);
    
    const variables = {
      response: response,
      userLevel: userLevel,
      topic: context.topic || 'Geral'
    };

    const result = await chain.invoke(variables);
    return this._parseEvaluationResult(result);
  }

  /**
   * Avaliação completa (todos os aspectos)
   */
  async evaluateComplete(response, question = null, context = {}) {
    const [quality, didactic, language] = await Promise.all([
      this.evaluateQuality(response, question, context),
      this.evaluateDidacticQuality(response, question, context),
      this.evaluateLanguageAppropriateness(
        response,
        context.level || 'Geral',
        context
      )
    ]);

    return {
      quality,
      didactic,
      language,
      overall: this._calculateOverallScore(quality, didactic, language)
    };
  }

  /**
   * Valida e melhora resposta se necessário
   */
  async validateAndImprove(
    response,
    question = null,
    context = {}
  ) {
    const evaluation = await this.evaluateComplete(response, question, context);
    
    // Se a avaliação geral é baixa, tentar melhorar
    if (evaluation.overall < 0.7) {
      return {
        needsImprovement: true,
        evaluation: evaluation,
        originalResponse: response,
        improvedResponse: await this._improveResponse(
          response,
          evaluation,
          question,
          context
        )
      };
    }

    return {
      needsImprovement: false,
      evaluation: evaluation,
      originalResponse: response,
      improvedResponse: null
    };
  }

  /**
   * Obtém prompt de avaliação baseado no tipo
   */
  _getEvaluationPrompt(evaluationType) {
    const prompts = {
      quality: ChatPromptTemplate.fromMessages([
        [
          'system',
          `Você é um avaliador especializado em respostas médicas e clínicas.
Avalie a qualidade de uma resposta considerando:
1. Precisão médica e baseada em evidências
2. Completude da informação
3. Clareza e acessibilidade
4. Relevância clínica
5. Presença de avisos de segurança apropriados

Responda em formato JSON:
{
  "score": 0.0-1.0,
  "precision": 0.0-1.0,
  "completeness": 0.0-1.0,
  "clarity": 0.0-1.0,
  "relevance": 0.0-1.0,
  "safety": 0.0-1.0,
  "feedback": "comentários sobre a qualidade"
}`
        ],
        [
          'human',
          `Pergunta: {question}
Nível: {level}
Tópico: {topic}
Resposta: {response}

Avalie a qualidade desta resposta.`
        ]
      ]),

      didactic: ChatPromptTemplate.fromMessages([
        [
          'system',
          `Você é um avaliador especializado em comunicação médica.
Avalie se uma resposta é clara e apropriada considerando:
1. Clareza da comunicação
2. Progressão lógica do raciocínio clínico
3. Uso de exemplos clínicos relevantes
4. Acessibilidade ao profissional de saúde

Responda em formato JSON:
{
  "score": 0.0-1.0,
  "clarity": 0.0-1.0,
  "reasoningProgression": 0.0-1.0,
  "examples": 0.0-1.0,
  "accessibility": 0.0-1.0,
  "feedback": "comentários sobre a didática"
}`
        ],
        [
          'human',
          `Pergunta: {question}
Nível: {level}
Resposta: {response}

Avalie se esta resposta é didática e apropriada para o nível especificado.`
        ]
      ]),

      language: ChatPromptTemplate.fromMessages([
        [
          'system',
          `Você é um avaliador de adequação linguística para educação.
Avalie se a linguagem de uma resposta é adequada ao nível do usuário:
1. Vocabulário apropriado
2. Complexidade sintática adequada
3. Termos técnicos explicados
4. Tom e formalidade adequados

Responda em formato JSON:
{
  "score": 0.0-1.0,
  "vocabulary": 0.0-1.0,
  "syntacticComplexity": 0.0-1.0,
  "technicalTerms": 0.0-1.0,
  "tone": 0.0-1.0,
  "feedback": "comentários sobre a linguagem"
}`
        ],
        [
          'human',
          `Nível do Usuário: {userLevel}
Tópico: {topic}
Resposta: {response}

Avalie se a linguagem desta resposta é adequada para o nível do usuário.`
        ]
      ])
    };

    return prompts[evaluationType] || prompts.quality;
  }

  /**
   * Faz parse do resultado da avaliação
   */
  _parseEvaluationResult(result) {
    const output = typeof result === 'string' 
      ? result 
      : result.text || result.output || result;

    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn(`Erro ao fazer parse do JSON de avaliação: ${error.message}`);
    }

    // Fallback: retornar estrutura básica
    return {
      score: 0.5,
      feedback: output,
      raw: output
    };
  }

  /**
   * Calcula score geral baseado nas avaliações
   */
  _calculateOverallScore(quality, didactic, language) {
    const scores = [
      quality.score || 0,
      didactic.score || 0,
      language.score || 0
    ];
    
    // Média ponderada (qualidade tem peso maior)
    const weights = [0.4, 0.35, 0.25];
    const overall = scores.reduce((sum, score, index) => 
      sum + (score * weights[index]), 0
    );

    return Math.round(overall * 100) / 100;
  }

  /**
   * Melhora uma resposta baseada na avaliação
   */
  async _improveResponse(
    response,
    evaluation,
    question,
    context
  ) {
    try {
      const chatModel = await providerAdapter.getChatModel(context.provider);
      const { ChatPromptTemplate } = require('@langchain/core/prompts');
      
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Você é um revisor especializado em respostas médicas e clínicas.
Sua tarefa é melhorar uma resposta baseada em feedback de avaliação.
Mantenha a precisão médica e baseada em evidências, mas melhore a clareza, comunicação e adequação ao contexto clínico.`
        ],
        [
          'human',
          `Pergunta: {question}
Nível: {level}
Resposta Original: {response}

Feedback de Avaliação:
- Qualidade Geral: {overallScore}
- Qualidade: {qualityFeedback}
- Didática: {didacticFeedback}
- Linguagem: {languageFeedback}

Melhore esta resposta mantendo sua precisão técnica.`
        ]
      ]);

      const chain = prompt.pipe(chatModel);
      const result = await chain.invoke({
        question: question || 'N/A',
        level: context.level || 'Geral',
        response: response,
        overallScore: evaluation.overall,
        qualityFeedback: evaluation.quality.feedback || 'N/A',
        didacticFeedback: evaluation.didactic.feedback || 'N/A',
        languageFeedback: evaluation.language.feedback || 'N/A'
      });

      return typeof result === 'string' ? result : result.content || result.text;
    } catch (error) {
      console.error(`Erro ao melhorar resposta: ${error.message}`);
      return response; // Retornar original se falhar
    }
  }
}

module.exports = new EvaluationChainService();

