# 🚀 Guia de Setup - quimicAI Backend

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- MongoDB (para persistência de dados)
- Conta com API key do Gemini ou OpenAI (opcional, para LLM)

## Instalação Rápida

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 3. Configuração Básica (.env)

```bash
# Servidor
BACKEND_PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/quimicai

# CORS
CORS_ORIGIN=http://localhost:3000

# LLM Provider (gemini, openai, ou ollama)
LLM_PROVIDER=gemini

# Gemini (se usar Gemini)
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-pro

# OpenAI (se usar OpenAI)
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-3.5-turbo

# Ollama (se usar Ollama local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:2b

# Vector Store (ChromaDB ou Pinecone)
USE_CHROMADB=true
# ou
USE_PINECONE=true
PINECONE_API_KEY=sua_chave_pinecone
PINECONE_INDEX_NAME=quimicai
```

### 4. Iniciar MongoDB

```bash
# Com Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Ou use MongoDB local/cloud
```

### 5. Executar Aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## Configuração de LLM

### Gemini (Recomendado - Gratuito)

1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma API key
3. Configure no `.env`:
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-pro  # Padrão: gemini-pro
GEMINI_TEMPERATURE=0.7   # Opcional
GEMINI_MAX_TOKENS=1000   # Opcional
```

### OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Crie uma API key
3. Configure no `.env`:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-3.5-turbo  # Opcional
OPENAI_TEMPERATURE=0.7      # Opcional
OPENAI_MAX_TOKENS=500      # Opcional
```

### Ollama (Local)

1. Instale Ollama: https://ollama.ai
2. Baixe um modelo:
```bash
ollama pull gemma2:2b
# ou
ollama pull llama3
```
3. Configure no `.env`:
```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434  # Padrão
OLLAMA_MODEL=gemma2:2b
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=1000
```

## Variáveis de Ambiente Importantes

### Caracteres Especiais no .env

Se sua senha ou URI contém caracteres especiais como `#`, use aspas:

```bash
# ✅ CORRETO - Com aspas
MONGODB_URI="mongodb://user:senha#123@localhost:27017/quimicai"

# ❌ ERRADO - Sem aspas (o # será interpretado como comentário)
MONGODB_URI=mongodb://user:senha#123@localhost:27017/quimicai
```

## Vector Store

### ChromaDB (Padrão)

```bash
USE_CHROMADB=true
CHROMA_DB_PATH=./data/chroma
```

### Pinecone

```bash
USE_PINECONE=true
PINECONE_API_KEY=sua_chave
PINECONE_INDEX_NAME=quimicai
PINECONE_ENVIRONMENT=us-east-1
```

## Verificar Instalação

```bash
# Testar LLM
npm test

# Verificar saúde do servidor
curl http://localhost:4000/health
```

## Usuário Padrão

Após iniciar o servidor, um usuário demo é criado automaticamente:
- **Email**: `admin@quimicai.com`
- **Senha**: `demo@123`

## Próximos Passos

- Configure o frontend: `../frontend/README.md`
- Veja documentação da API: `API.md`
- Guia de ingestion: `RAG_INGESTION.md`

