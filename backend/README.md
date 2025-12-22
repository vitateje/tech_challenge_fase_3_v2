# quimicAI - Backend

API backend para a plataforma de aprendizado de química com IA.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados
- **LangChain** - Framework para LLM
- **Pinecone** - Vector database
- **Gemini/OpenAI/Ollama** - Provedores LLM

## 📁 Estrutura

```
backend/
├── src/
│   ├── server.js              # Servidor Express
│   ├── app.js                  # Configuração do app
│   ├── routes/                 # Rotas da API
│   ├── controllers/            # Controladores
│   ├── services/               # Lógica de negócio
│   ├── repositories/           # Camada de dados
│   ├── models/                 # Modelos MongoDB
│   ├── middleware/             # Middlewares
│   ├── langchain/              # Framework LangChain
│   ├── providers/              # Provedores LLM
│   └── config/                 # Configurações
├── scripts/                    # Scripts utilitários
├── docs/                       # Documentação
│   ├── SETUP.md               # Guia de setup
│   ├── API.md                 # Documentação da API
│   ├── RAG_INGESTION.md       # Guia de ingestion
│   └── ARCHITECTURE.md        # Arquitetura do sistema
└── package.json
```

## 🛠️ Instalação

### 1. Pré-requisitos

- Node.js 18+
- MongoDB (local ou Atlas)
- Conta Pinecone (para vector store)
- API key do Gemini ou OpenAI (opcional)

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 4. Configuração Mínima (.env)

```bash
# Servidor
BACKEND_PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/quimicai

# CORS
CORS_ORIGIN=http://localhost:3000

# LLM Provider
LLM_PROVIDER=gemini
GEMINI_API_KEY=sua_chave_aqui

# Pinecone (Vector Store)
USE_PINECONE=true
PINECONE_API_KEY=sua_chave_pinecone
PINECONE_INDEX_NAME=quimicai
PINECONE_ENVIRONMENT=us-east-1

# Embeddings
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

## 🚀 Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

## 📡 API Endpoints

Veja documentação completa em [docs/API.md](docs/API.md)

### Principais Endpoints

- `POST /api/auth/login` - Login
- `POST /api/chat/send/:userId` - Enviar mensagem
- `GET /api/chat/conversations/:userId` - Listar conversas
- `GET /api/student-activities/user/:userId` - Atividades do aluno
- `GET /api/rag/info` - Informações do RAG

## 🧠 Sistema de IA

### LLM Providers

- **Gemini** (padrão) - Gratuito, boa qualidade
- **OpenAI** - Pago, excelente qualidade
- **Ollama** - Local, gratuito

### Vector Store

- **Pinecone** - Vector database cloud para RAG

## 📚 Documentação

- [Setup Completo](docs/SETUP.md)
- [Documentação da API](docs/API.md)
- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [Guia de Ingestion RAG](docs/RAG_INGESTION.md)

## 🔧 Scripts Utilitários

```bash
# Testar LLM
npm test

# Alternar provedor LLM
npm run switch-llm gemini
```

## 🚀 Deploy

### Variáveis de Ambiente para Produção

```bash
NODE_ENV=production
BACKEND_PORT=4000
MONGODB_URI=mongodb+srv://...
PINECONE_API_KEY=...
GEMINI_API_KEY=...
CORS_ORIGIN=https://seu-frontend.com
```

### Docker

```bash
docker build -t quimicai-backend .
docker run -p 4000:4000 quimicai-backend
```

## 📝 Notas Importantes

- **Vector Store**: O sistema usa **Pinecone** como vector store padrão
- **Ingestion**: O processo de ingestion de documentos é feito em projeto separado (veja [RAG_INGESTION.md](docs/RAG_INGESTION.md))
- **Upload**: Upload de PDFs via API foi removido - use scripts de ingestion

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.
