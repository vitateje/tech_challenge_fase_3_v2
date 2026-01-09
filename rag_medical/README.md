# Pipeline RAG para Dados Médicos

Sistema de ingestão e RAG (Retrieval-Augmented Generation) para dados médicos do PubMedQA usando Pinecone como vector store.

## Visão Geral

Pipeline que processa dados médicos e os ingere no Pinecone para busca semântica e recuperação de contexto relevante.

### Características

- Processamento completo de dados médicos
- Integração com Pinecone
- Suporte para Gemini e Ollama embeddings
- Scripts modulares e notebooks detalhados
- Anonimização de dados (LGPD/HIPAA)

## Arquitetura

```
ori_pqal.json
    ↓
[Data Loader] → Carrega dados JSON
    ↓
[Data Processor] → Processa e anonimiza
    ↓
[Text Splitter] → Divide em chunks
    ↓
[Embeddings Manager] → Gera embeddings
    ↓
[Pinecone Ingester] → Ingestão em lotes
    ↓
Pinecone Index (biobyia)
    ↓
[RAG Query] → Busca semântica
```

## Estrutura

```
rag_medical/
├── notebooks/                  # Jupyter notebooks
│   ├── 01-load-and-explore-data.ipynb
│   ├── 02-process-medical-data.ipynb
│   ├── 03-embed-and-ingest-pinecone.ipynb
│   └── 04-test-rag-query.ipynb
├── scripts/                    # Scripts modulares
│   ├── data_loader.py
│   ├── data_processor.py
│   ├── text_splitter.py
│   ├── embeddings_manager.py
│   ├── pinecone_ingester.py
│   └── rag_query.py
├── config/                     # Configurações
│   └── settings.py
├── utils/                      # Utilitários
│   └── anonymizer.py
├── .env.example
├── requirements.txt
└── README.md
```

## Instalação

### Pré-requisitos

- Python 3.8+
- Conta Pinecone
- API Key do Gemini ou Ollama

### Setup

```bash
cd rag_medical

# Instalar dependências
pip install -r requirements.txt

# Configurar ambiente
cp .env.example .env
# Editar .env com suas credenciais
```

### Configuração (.env)

```env
# Pinecone
PINECONE_API_KEY=sua_chave
PINECONE_INDEX_NAME=biobyia
PINECONE_NAMESPACE=medical_qa

# Embeddings (Gemini - recomendado)
GEMINI_API_KEY=sua_chave
EMBEDDING_MODEL=text-embedding-004

# Dados
MEDICAL_DATA_PATH=../context/pubmedqa-master/data/ori_pqal.json
CHUNK_SIZE=512
CHUNK_OVERLAP=50
```

## Uso

### Via Notebooks (recomendado)

Execute os notebooks na ordem:

```bash
# 1. Carregar e explorar dados
jupyter notebook notebooks/01-load-and-explore-data.ipynb

# 2. Processar dados médicos
jupyter notebook notebooks/02-process-medical-data.ipynb

# 3. Gerar embeddings e ingerir
jupyter notebook notebooks/03-embed-and-ingest-pinecone.ipynb

# 4. Testar queries RAG
jupyter notebook notebooks/04-test-rag-query.ipynb
```

### Via Scripts Python

```python
from scripts.data_loader import load_medical_dataset
from scripts.data_processor import process_batch
from scripts.text_splitter import create_text_splitter
from scripts.embeddings_manager import EmbeddingsManager
from scripts.pinecone_ingester import PineconeIngester
from config.settings import get_settings

settings = get_settings()

# Carregar dados
raw_data = load_medical_dataset(settings.MEDICAL_DATA_PATH)

# Processar
processed_entries = process_batch(raw_data, anonymize=True)

# Dividir em chunks
text_splitter = create_text_splitter(
    chunk_size=settings.CHUNK_SIZE,
    chunk_overlap=settings.CHUNK_OVERLAP
)
chunks = text_splitter.split_batch(processed_entries)

# Ingerir no Pinecone
embeddings_manager = EmbeddingsManager()
ingester = PineconeIngester(embeddings_manager=embeddings_manager)
stats = ingester.ingest_chunks(chunks)

# Query RAG
from scripts.rag_query import query_medical_rag
results = query_medical_rag("Do mitochondria play a role?", top_k=5)
```

## Configuração Pinecone

- **Índice**: `biobyia`
- **Dimensões**: 1024
- **Métrica**: Cosine similarity
- **Namespace**: `medical_qa`

## Embeddings

### Opção 1: Gemini (recomendado)
- Modelo: `text-embedding-004`
- Dimensões: 768
- Rápido e eficiente

### Opção 2: Ollama (local)
- Modelo: `mxbai-embed-large` (1024 dims)
- Requer Ollama rodando localmente
- Base URL: `http://localhost:11434`

## Metadados no Pinecone

Cada documento contém:

```python
{
    "id": "article_21645374_chunk_0",
    "values": [0.123, -0.456, ...],
    "metadata": {
        "article_id": "21645374",
        "question": "Do mitochondria...",
        "meshes": "Mitochondria, Apoptosis",
        "year": "2011",
        "chunk_index": 0,
        "source": "pubmedqa",
        "type": "medical_qa",
        "text": "Context: ... Question: ... Answer: ..."
    }
}
```

## Queries RAG

### Query Básica

```python
from scripts.rag_query import query_medical_rag

results = query_medical_rag(
    "Do mitochondria play a role in cell death?",
    top_k=5
)
```

### Query com Filtros

```python
results = query_medical_rag(
    "medical research",
    top_k=10,
    filters={"year": "2011"}
)
```

### Formatação para LLM

```python
from scripts.rag_query import format_context_for_llm

context = format_context_for_llm(results)
# Usar 'context' no prompt do LLM
```

## Performance

### Tempos Estimados (10k entradas)

| Etapa | Tempo |
|-------|-------|
| Carregamento | ~5s |
| Processamento | ~30s |
| Chunking | ~10s |
| Embeddings (Gemini) | ~5-10min |
| Ingestão Pinecone | ~10-15min |
| **Total** | ~20-30min |

### Otimizações

- Usar Gemini embeddings (mais rápido)
- Ajustar `BATCH_SIZE`
- Processar em paralelo (datasets grandes)

## Troubleshooting

### PINECONE_API_KEY não configurada
- Verificar arquivo `.env`
- Confirmar que está no diretório `rag_medical/`

### Arquivo de dados não encontrado
- Verificar caminho em `MEDICAL_DATA_PATH`
- Caminho é relativo ao diretório `rag_medical/`

### Nenhum provider de embeddings configurado
- Configurar `GEMINI_API_KEY` ou `OLLAMA_BASE_URL`
- Para Ollama: `ollama serve`

### Embeddings lentos
- Usar Gemini (mais rápido)
- Reduzir `BATCH_SIZE`

### Ingestão falhando
- Verificar créditos no Pinecone
- Reduzir `BATCH_SIZE`
- Verificar logs de erro

## Segurança

- Anonimização automática de dados sensíveis
- Conformidade LGPD/HIPAA
- API Keys nunca no Git
- Namespace separado por ambiente

## Integração com Backend

O backend utiliza este RAG através do `ragService.js`:

```javascript
// backend/src/services/ragService.js
const results = await ragService.queryRAGContext(query, topK);
```

Consulte: `../backend/src/services/ragService.js`

## Documentação Adicional

Para visão geral completa do sistema, consulte: `../DOCUMENTATION.md`

## Referências

- [PubMedQA Dataset](https://pubmedqa.github.io/)
- [Pinecone Documentation](https://docs.pinecone.io)
- [LangChain RAG](https://python.langchain.com/docs/use_cases/question_answering/)
- [Google Gemini](https://ai.google.dev/)

---

**Versão**: 2.0  
**Tech Challenge Fase 3 - FIAP**
