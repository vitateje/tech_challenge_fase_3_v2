# Integração RAG (Retrieval-Augmented Generation)

## Visão Geral

O backend do BioByIA foi aprimorado com um sistema RAG completo para busca em base de conhecimento médico usando Pinecone e Google Generative AI Embeddings, seguindo a mesma arquitetura do notebook `demo.ipynb`.

## Arquitetura

### Componentes Principais

1. **RAG Service** (`src/services/ragService.js`)
   - Gerencia conexão com Pinecone
   - Gera embeddings usando Google Generative AI
   - Busca contexto médico relevante
   - Formata resultados para uso em prompts

2. **Medical Assistant Chain** (`src/langchain/chains/medicalAssistantChain.js`)
   - Integra RAG geral médico + RAG de documentos do paciente
   - Combina múltiplas fontes de contexto
   - Processa queries com contexto enriquecido

### Configuração

#### Variáveis de Ambiente Necessárias

```env
# Pinecone
PINECONE_API_KEY=your_pinecone_api_key

# Google Generative AI
GEMINI_API_KEY=your_gemini_api_key
```

#### Configurações do Pinecone

- **Index Name**: `biobyia`
- **Namespace**: `medical_qa`
- **Embedding Model**: `text-embedding-004` (Google)
- **Dimensões**: 768 (Google text-embedding-004)

## Fluxo de Dados

### 1. Query Médica Padrão

```
Usuário faz pergunta
    ↓
Medical Assistant Controller
    ↓
Medical Assistant Service
    ↓
Medical Assistant Chain
    ↓
    ├─→ RAG Service (Contexto Médico Geral)
    │   ├─ Gera embedding da query
    │   ├─ Busca no Pinecone (namespace: medical_qa)
    │   └─ Retorna top 5 documentos relevantes
    │
    ├─→ Patient Store (Contexto do Paciente - se aplicável)
    │   └─ Busca documentos específicos do paciente
    │
    └─→ LLM (Gemini/Ollama/BioByIA)
        ├─ Recebe query + contexto RAG + contexto paciente
        ├─ Gera resposta fundamentada
        └─ Aplica guardrails e validações
            ↓
        Retorna resposta com rastreabilidade de fontes
```

### 2. Estrutura do Contexto RAG

O contexto final combinado segue o formato:

```
=== CONTEXTO MÉDICO GERAL ===
Fonte Médica 1 [ID: article_123, Origem: PubMed]:
[Texto do documento...]

Fonte Médica 2 [ID: article_456, Origem: Nature]:
[Texto do documento...]

=== DOCUMENTOS DO PACIENTE ===
Documento do Paciente 1 [source: exam_results.pdf]:
[Texto do documento...]
```

## API Endpoints

### 1. Testar Conexão RAG

```http
GET /api/medical/rag/test
Authorization: Bearer {token}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Conexão com Pinecone estabelecida com sucesso",
    "indexName": "biobyia",
    "namespace": "medical_qa",
    "testResults": 1
  }
}
```

### 2. Buscar na Base de Conhecimento

```http
POST /api/medical/rag/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "Explique o conceito de edição genética",
  "topK": 5
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "query": "Explique o conceito de edição genética",
    "resultsCount": 5,
    "results": [
      {
        "id": "article_123",
        "source": "PubMed",
        "text": "Conteúdo do artigo...",
        "score": 0.92
      }
    ],
    "formattedContext": "Fonte Médica 1 [ID: article_123]...",
    "sources": [
      {
        "type": "rag_document",
        "reference": "article_123",
        "title": "Artigo Médico: article_123",
        "source": "PubMed",
        "excerpt": "Conteúdo do artigo...",
        "score": 0.92,
        "metadata": {
          "article_id": "article_123",
          "source": "PubMed",
          "similarity_score": 0.92
        }
      }
    ]
  }
}
```

### 3. Query Médica com RAG (Endpoint Existente Aprimorado)

```http
POST /api/medical/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "Quais são os efeitos colaterais da aspirina?",
  "patientId": "optional_patient_id",
  "queryType": "general_medical"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "queryId": "query_id",
    "answer": "Resposta fundamentada em fontes...",
    "sources": [
      {
        "type": "rag_document",
        "reference": "article_123",
        "title": "Artigo Médico: article_123",
        "source": "PubMed",
        "excerpt": "...",
        "score": 0.92
      },
      {
        "type": "patient_document",
        "reference": "doc_456",
        "title": "Fonte: exam_results.pdf",
        "excerpt": "..."
      }
    ],
    "requiresReview": false,
    "guardrails": {
      "passed": true,
      "issues": []
    },
    "responseTime": 1500
  }
}
```

## Benefícios da Integração RAG

### 1. Respostas Fundamentadas
- Todas as respostas são baseadas em documentos médicos reais
- Rastreabilidade completa de fontes
- Maior precisão e confiabilidade

### 2. Contexto Duplo
- **Contexto Médico Geral**: Base de conhecimento médico ampla
- **Contexto do Paciente**: Documentos específicos do paciente (quando aplicável)

### 3. Explainability
- Cada resposta inclui as fontes utilizadas
- IDs dos artigos para referência
- Scores de similaridade para transparência

### 4. Escalabilidade
- Busca vetorial eficiente no Pinecone
- Top-K configurável (padrão: 5 documentos)
- Cache inteligente de embeddings

## Uso no Código

### Exemplo: Buscar Contexto RAG

```javascript
const ragService = require('./services/ragService');

// Buscar contexto relevante
const results = await ragService.queryRAGContext(
  'Qual o tratamento para hipertensão?',
  5 // top K resultados
);

// Formatar para uso em prompt
const formattedContext = ragService.formatRAGContext(results);

// Obter informações de rastreabilidade
const sourcesInfo = ragService.getSourcesInfo(results);
```

### Exemplo: Testar Conexão

```javascript
const ragService = require('./services/ragService');

const testResult = await ragService.testConnection();
console.log(testResult);
// {
//   success: true,
//   message: 'Conexão com Pinecone estabelecida com sucesso',
//   indexName: 'biobyia',
//   namespace: 'medical_qa',
//   testResults: 1
// }
```

## Logs e Monitoramento

O sistema RAG gera logs detalhados:

```
✅ RAG Service inicializado com sucesso
   - Index: biobyia
   - Namespace: medical_qa

📚 RAG: 5 documentos médicos relevantes encontrados

✅ RAG Médico Geral: 5 fontes encontradas
✅ RAG Documentos Paciente: 3 documentos encontrados
```

## Troubleshooting

### Erro: "PINECONE_API_KEY não encontrada"
**Solução**: Adicionar a chave no arquivo `.env`

### Erro: "GEMINI_API_KEY não encontrada"
**Solução**: Adicionar a chave do Google Generative AI no `.env`

### Erro: "Failed to retrieve patient context"
**Solução**: Verificar se o namespace do paciente existe no Pinecone

### RAG retorna resultados vazios
**Possíveis causas**:
1. Index Pinecone vazio ou não populado
2. Namespace incorreto
3. Query muito específica ou fora do domínio

**Solução**: 
- Verificar se o index foi populado com dados
- Confirmar namespace: `medical_qa`
- Tentar queries mais gerais

## Próximos Passos

1. **Híbrido Search**: Combinar busca vetorial + busca léxica
2. **Re-ranking**: Implementar re-ranking dos resultados
3. **Feedback Loop**: Usar feedback dos médicos para melhorar relevância
4. **Cache**: Implementar cache de embeddings frequentes
5. **Analytics**: Dashboard de métricas de uso do RAG

## Referências

- Notebook Demo: `tech_challenge_fase_3_v2/demo.ipynb`
- Pinecone Documentation: https://docs.pinecone.io
- Google Generative AI: https://ai.google.dev/docs
- LangChain RAG: https://python.langchain.com/docs/use_cases/question_answering/

