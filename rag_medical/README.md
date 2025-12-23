# Pipeline RAG para Dados Médicos com Pinecone

Sistema completo de ingestão e RAG (Retrieval-Augmented Generation) para dados médicos do dataset PubMedQA usando Pinecone como vector store.

## 📋 Visão Geral

Este pipeline processa dados médicos estruturados do arquivo `ori_pqal.json` e os ingere no Pinecone para permitir busca semântica e recuperação de contexto relevante para assistentes médicos baseados em IA.

### Características Principais

- ✅ **Processamento completo**: Carregamento, limpeza, anonimização e chunking de dados médicos
- ✅ **Integração Pinecone**: Ingestão otimizada em lotes com retry logic
- ✅ **Múltiplos Providers**: Suporte para Gemini e Ollama embeddings
- ✅ **Modular**: Scripts Python reutilizáveis e notebooks Jupyter detalhados
- ✅ **Conformidade**: Anonimização de dados sensíveis (LGPD/HIPAA)
- ✅ **Documentação**: Notebooks com comentários detalhados em português

## 🏗️ Arquitetura

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

## 📁 Estrutura de Arquivos

```
rag_medical/
├── notebooks/                    # Notebooks Jupyter detalhados
│   ├── 01-load-and-explore-data.ipynb
│   ├── 02-process-medical-data.ipynb
│   ├── 03-embed-and-ingest-pinecone.ipynb
│   └── 04-test-rag-query.ipynb
├── scripts/                      # Scripts Python modulares
│   ├── __init__.py
│   ├── data_loader.py           # Carregamento de dados
│   ├── data_processor.py        # Processamento e limpeza
│   ├── text_splitter.py         # Divisão em chunks
│   ├── embeddings_manager.py    # Gerenciamento de embeddings
│   ├── pinecone_ingester.py     # Ingestão no Pinecone
│   └── rag_query.py             # Queries RAG
├── config/                       # Configurações
│   ├── __init__.py
│   └── settings.py              # Gerenciamento de configurações
├── utils/                        # Utilitários
│   ├── __init__.py
│   └── anonymizer.py            # Anonimização de dados
├── .env.example                  # Template de variáveis de ambiente
├── requirements.txt              # Dependências Python
└── README.md                     # Este arquivo
```

## 🚀 Instalação

### 1. Pré-requisitos

- Python 3.8 ou superior
- Conta Pinecone (https://app.pinecone.io)
- API Key do Gemini (opcional, mas recomendado) ou Ollama configurado

### 2. Instalar Dependências

```bash
cd rag_medical
pip install -r requirements.txt
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Pinecone Configuration
PINECONE_API_KEY=sua_chave_pinecone_aqui
PINECONE_INDEX_NAME=biobyia
PINECONE_NAMESPACE=medical_qa

# Embeddings Configuration (Gemini - RECOMENDADO)
GEMINI_API_KEY=sua_chave_gemini_aqui
EMBEDDING_MODEL=text-embedding-004

# Data Configuration
MEDICAL_DATA_PATH=../context/pubmedqa-master/data/ori_pqal.json
CHUNK_SIZE=512
CHUNK_OVERLAP=50
```

### 4. Verificar Caminho dos Dados

Certifique-se de que o arquivo `ori_pqal.json` está no caminho especificado em `MEDICAL_DATA_PATH`. O caminho padrão é relativo ao diretório `rag_medical/`.

## 📖 Uso

### Execução via Notebooks Jupyter (Recomendado)

Execute os notebooks na ordem numérica:

1. **01-load-and-explore-data.ipynb**
   - Carrega e explora o dataset
   - Valida estrutura dos dados
   - Exibe estatísticas

2. **02-process-medical-data.ipynb**
   - Processa e anonimiza dados
   - Divide textos em chunks
   - Valida qualidade

3. **03-embed-and-ingest-pinecone.ipynb**
   - Gera embeddings
   - Ingesta dados no Pinecone
   - Verifica ingestão

4. **04-test-rag-query.ipynb**
   - Testa queries RAG
   - Valida recuperação
   - Exemplos práticos

### Execução via Scripts Python

```python
from scripts.data_loader import load_medical_dataset
from scripts.data_processor import process_batch
from scripts.text_splitter import create_text_splitter
from scripts.embeddings_manager import EmbeddingsManager
from scripts.pinecone_ingester import PineconeIngester
from config.settings import get_settings

# Carrega configurações
settings = get_settings()

# 1. Carrega dados
raw_data = load_medical_dataset(settings.MEDICAL_DATA_PATH)

# 2. Processa dados
processed_entries = process_batch(raw_data, anonymize=True)

# 3. Divide em chunks
text_splitter = create_text_splitter(
    chunk_size=settings.CHUNK_SIZE,
    chunk_overlap=settings.CHUNK_OVERLAP
)
chunks = text_splitter.split_batch(processed_entries)

# 4. Ingesta no Pinecone
embeddings_manager = EmbeddingsManager()
ingester = PineconeIngester(embeddings_manager=embeddings_manager)
stats = ingester.ingest_chunks(chunks)

# 5. Query RAG
from scripts.rag_query import query_medical_rag
results = query_medical_rag("Do mitochondria play a role?", top_k=5)
```

## 🔧 Configuração

### Pinecone

- **Índice**: `biobyia` (já criado)
- **Dimensões**: 1024 (compatível com embeddings de 768 dims)
- **Métrica**: Cosine similarity
- **Namespace**: `medical_qa` (opcional, para separar dados)

### Embeddings

**Opção 1: Gemini (Recomendado)**
- Modelo: `text-embedding-004`
- Dimensões: 768
- API Key: Obtenha em https://makersuite.google.com/app/apikey

**Opção 2: Ollama (Local)**
- Modelo: `mxbai-embed-large` (1024 dims) ou outro compatível
- Base URL: `http://localhost:11434`
- Requer Ollama instalado e rodando localmente

### Chunking

- **Chunk Size**: 512 caracteres (padrão)
- **Chunk Overlap**: 50 caracteres (padrão)
- Ajuste conforme necessário para otimizar recuperação

## 📊 Metadados no Pinecone

Cada documento no Pinecone contém:

```python
{
    "id": "article_21645374_chunk_0",
    "values": [0.123, -0.456, ...],  # Embedding vector
    "metadata": {
        "article_id": "21645374",
        "question": "Do mitochondria play a role?",
        "meshes": "Mitochondria, Apoptosis, ...",
        "year": "2011",
        "chunk_index": 0,
        "source": "pubmedqa",
        "type": "medical_qa",
        "text": "Context: ... Question: ... Answer: ..."
    }
}
```

## 🔍 Queries RAG

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
# Usa 'context' no prompt do LLM
```

## 🐛 Troubleshooting

### Erro: "PINECONE_API_KEY não configurada"
- Verifique se o arquivo `.env` existe e contém `PINECONE_API_KEY`
- Certifique-se de que o arquivo está no diretório `rag_medical/`

### Erro: "Arquivo de dados não encontrado"
- Verifique o caminho em `MEDICAL_DATA_PATH` no arquivo `.env`
- O caminho é relativo ao diretório `rag_medical/`

### Erro: "Nenhum provider de embeddings configurado"
- Configure `GEMINI_API_KEY` ou `OLLAMA_BASE_URL` no arquivo `.env`
- Para Ollama, certifique-se de que está rodando: `ollama serve`

### Embeddings muito lentos
- Use Gemini (mais rápido que Ollama)
- Reduza `BATCH_SIZE` se houver rate limiting
- Considere processar em paralelo (futura melhoria)

### Ingestão falhando
- Verifique créditos no Pinecone
- Reduza `BATCH_SIZE` para evitar rate limiting
- Verifique logs de erro para detalhes específicos

## 📈 Performance

### Tempos Estimados (Dataset ~10.000 entradas)

- **Carregamento**: ~5 segundos
- **Processamento**: ~30 segundos
- **Chunking**: ~10 segundos
- **Embeddings (Gemini)**: ~5-10 minutos
- **Ingestão Pinecone**: ~10-15 minutos
- **Total**: ~20-30 minutos

### Otimizações

- Use Gemini embeddings (mais rápido)
- Ajuste `BATCH_SIZE` conforme sua conexão
- Processe em paralelo para datasets muito grandes

## 🔒 Segurança e Privacidade

- **Anonimização**: Dados sensíveis são automaticamente anonimizados
- **LGPD/HIPAA**: Conformidade com regulamentações de privacidade
- **API Keys**: Nunca commite arquivos `.env` no Git
- **Dados**: Use namespace no Pinecone para separar ambientes

## 📝 Decisões de Design

1. **Embeddings**: Gemini text-embedding-004 (768 dims) funciona bem com índice de 1024 dims devido à similaridade de cosseno
2. **Chunking**: 512 caracteres com overlap de 50 preserva contexto médico
3. **Namespace**: `medical_qa` separa dados médicos de outros dados
4. **Metadados**: Estrutura rica permite filtragem e rastreabilidade
5. **Modularidade**: Scripts independentes facilitam manutenção e testes

## 🤝 Contribuindo

Para melhorias ou correções:
1. Mantenha a estrutura modular
2. Adicione comentários em português
3. Atualize documentação
4. Teste com dataset completo

## 📄 Licença

Este projeto faz parte do sistema de assistente médico. Consulte a licença do projeto principal.

## 🙏 Agradecimentos

- Dataset PubMedQA: https://pubmedqa.github.io/
- Pinecone: https://www.pinecone.io/
- LangChain: https://www.langchain.com/
- Google Gemini: https://ai.google.dev/

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a seção Troubleshooting
2. Consulte os notebooks para exemplos
3. Revise os comentários nos scripts

---

**Desenvolvido para o sistema de assistente médico - Tech Challenge Fase 3**

