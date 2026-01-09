# 🚀 Quick Start - RAG Integration

## ⚡ Início Rápido

### 1️⃣ Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env`:

```bash
# Chaves obrigatórias para RAG
PINECONE_API_KEY=sua_chave_pinecone
GEMINI_API_KEY=sua_chave_gemini

# Outras configurações
MONGODB_URI=mongodb://localhost:27017/medical_assistant
PORT=4000
```

### 2️⃣ Instalar Dependências

```bash
cd backend
npm install
```

As dependências do RAG já estão no `package.json`:
- `@pinecone-database/pinecone` v5.0.2
- `@langchain/google-genai` v0.2.18

### 3️⃣ Testar Conexão RAG

```bash
node src/scripts/test-rag.js
```

**Output esperado:**
```
✅ RAG Service inicializado com sucesso
   - Index: biobyia
   - Namespace: medical_qa
   
📚 RAG: 5 documentos médicos relevantes encontrados
```

### 4️⃣ Iniciar o Servidor

```bash
npm run dev
```

### 5️⃣ Testar Endpoints

#### Teste de Conexão
```bash
curl http://localhost:4000/api/medical/rag/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Busca RAG
```bash
curl -X POST http://localhost:4000/api/medical/rag/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "edição genética", "topK": 5}'
```

#### Query Médica com RAG
```bash
curl -X POST http://localhost:4000/api/medical/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explique o conceito de edição genética",
    "queryType": "general_medical"
  }'
```

## 📂 Arquivos Criados/Modificados

### ✅ Novos Arquivos

```
backend/
├── src/
│   ├── services/
│   │   └── ragService.js                    ← NOVO: Serviço RAG
│   └── scripts/
│       └── test-rag.js                      ← NOVO: Testes RAG
│
├── docs/
│   └── RAG_INTEGRATION.md                   ← NOVO: Documentação
│
├── CHANGELOG_RAG.md                         ← NOVO: Changelog
└── QUICK_START_RAG.md                       ← NOVO: Guia rápido
```

### 🔄 Arquivos Modificados

```
backend/
├── src/
│   ├── langchain/chains/
│   │   └── medicalAssistantChain.js        ← Integração RAG
│   ├── controllers/
│   │   └── medicalAssistantController.js   ← Novos endpoints
│   └── routes/
│       └── medicalAssistantRoutes.js       ← Novas rotas
│
└── README.md                                ← Documentação atualizada
```

## 🎯 O Que Mudou?

### Antes (Sem RAG)
```
Query → LLM → Resposta genérica
```

### Depois (Com RAG)
```
Query → RAG Pinecone → Documentos Médicos
                     → LLM → Resposta fundamentada + Fontes
```

## 🔍 Exemplo de Resposta

### Antes (Sem RAG)
```json
{
  "answer": "Edição genética é uma técnica...",
  "sources": []
}
```

### Depois (Com RAG)
```json
{
  "answer": "Edição genética, conforme descrito em [PMC7891234]...",
  "sources": [
    {
      "type": "rag_document",
      "reference": "PMC7891234",
      "source": "PubMed",
      "score": 0.92,
      "excerpt": "CRISPR-Cas9 é uma tecnologia..."
    }
  ]
}
```

## 🎓 Baseado em

Esta implementação replica a arquitetura do notebook `demo.ipynb`:

```python
# notebook: demo.ipynb (linhas 156-178)
PINECONE_INDEX_NAME = "biobyia"
PINECONE_NAMESPACE = "medical_qa"

pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY", ""))
index = pc.Index(PINECONE_INDEX_NAME)

embeddings_gen = GoogleGenerativeAIEmbeddings(
    model="text-embedding-004",
    google_api_key=os.environ.get("GEMINI_API_KEY", "")
)

def query_rag_context(query, top_k=5):
    query_vector = embeddings_gen.embed_query(query)
    response = index.query(
        vector=query_vector, 
        top_k=top_k, 
        include_metadata=True, 
        namespace=PINECONE_NAMESPACE
    )
    return results
```

## 💡 Dicas

### ✅ O RAG está funcionando se:
- ✅ Script de teste passa sem erros
- ✅ Endpoint `/rag/test` retorna `success: true`
- ✅ Queries retornam fontes com scores > 0.8
- ✅ Logs mostram "RAG: X documentos encontrados"

### ❌ Troubleshooting

**Erro: "PINECONE_API_KEY não encontrada"**
```bash
# Adicionar no .env
echo "PINECONE_API_KEY=sua_chave" >> .env
```

**Erro: "Failed to connect to Pinecone"**
- Verificar se a chave está correta
- Verificar se o index "biobyia" existe
- Verificar conexão com internet

**RAG retorna 0 resultados**
- Verificar se o index foi populado com dados
- Verificar namespace: deve ser "medical_qa"
- Tentar query mais geral

## 📊 Métricas de Sucesso

Após integração, você deve ver:

```bash
# Logs do servidor
✅ RAG Service inicializado com sucesso
   - Index: biobyia
   - Namespace: medical_qa

📚 RAG: 5 documentos médicos relevantes encontrados
✅ RAG Médico Geral: 5 fontes encontradas
🤖 Generating response with provider: gemini
✅ Response gerada com sucesso
```

## 🔗 Links Úteis

- **Documentação Completa**: `backend/docs/RAG_INTEGRATION.md`
- **Changelog**: `backend/CHANGELOG_RAG.md`
- **Notebook Original**: `demo.ipynb`
- **Pinecone Console**: https://app.pinecone.io
- **Google AI Studio**: https://aistudio.google.com

## 🎉 Pronto!

Agora seu backend está equipado com RAG completo, igual ao notebook `demo.ipynb`!

**Endpoints disponíveis:**
- `GET  /api/medical/rag/test` - Testar conexão
- `POST /api/medical/rag/search` - Buscar documentos
- `POST /api/medical/query` - Query com RAG integrado

---

**Desenvolvido para**: BioByIA Medical Assistant  
**Baseado em**: demo.ipynb (seção 4.1)  
**Data**: Janeiro 2024

