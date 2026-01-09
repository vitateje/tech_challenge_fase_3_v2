# Medical Assistant - Documentação Técnica

Sistema de assistente virtual médico baseado em IA, utilizando Fine-Tuning de LLMs e RAG (Retrieval-Augmented Generation).

## Visão Geral

O Medical Assistant é um sistema completo de suporte à decisão clínica que combina:
- **Fine-Tuning**: Modelo LLM especializado em domínio médico
- **RAG**: Busca semântica em base de conhecimento médico
- **Guardrails**: Validações de segurança e compliance
- **Backend**: API REST com Node.js e LangChain
- **Frontend**: Interface Vue.js moderna

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vue.js)                       │
│                     Interface do Usuário                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + LangChain)              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Medical    │  │   Patient    │  │   Workflow   │          │
│  │  Assistant   │  │   Service    │  │   Service    │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                        │
│         ├─────────────┬─────────────────┬──────────────┐        │
│         ▼             ▼                 ▼              ▼        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐   │
│  │   RAG    │  │ Fine-    │  │  Guardrails  │  │  Memory  │   │
│  │ Service  │  │ Tuned    │  │   Validator  │  │          │   │
│  │          │  │  Model   │  │              │  │          │   │
│  └────┬─────┘  └────┬─────┘  └──────────────┘  └──────────┘   │
└───────┼─────────────┼────────────────────────────────────────────┘
        │             │
        │             │
┌───────▼─────────────▼────────────────────────────────────────────┐
│                     CAMADA DE DADOS                              │
├──────────────────────┬───────────────────────┬───────────────────┤
│   Pinecone Index     │  MongoDB Database     │  Ollama Server    │
│   (Vector Store)     │  (Structured Data)    │  (LLM Inference)  │
│                      │                       │                   │
│  • medical_qa        │  • Patients           │  • BioByIA        │
│  • Embeddings        │  • Protocols          │  • Gemini         │
│  • Semantic Search   │  • Queries            │  • Local Models   │
└──────────────────────┴───────────────────────┴───────────────────┘
```

## Módulos Principais

### 1. Fine-Tuning (`fine_tuning/`)

Especialização de modelos LLM para domínio médico usando dataset PubMedQA.

**Pipeline:**
```
ori_pqal.json (PubMedQA Dataset)
    ↓
[Pré-processamento]
  • Anonimização de dados sensíveis
  • Formatação com delimitadores
  • Validação de qualidade
    ↓
medical_tuning_data.json
    ↓
[Formatação ChatML]
  • Conversão para formato de treinamento
  • Separação instruction/input/output
    ↓
formatted_medical_dataset.jsonl
    ↓
[Fine-Tuning com LoRA]
  • Modelo base: Llama-3 8B
  • Técnica: LoRA (Low-Rank Adaptation)
  • 4-bit quantization
    ↓
lora_model_medical/
```

**Componentes:**
- `preprocessing/`: Processamento e validação de dados
- `training/`: Scripts de fine-tuning
- `inference/`: Testes do modelo treinado
- `utils/`: Templates de prompts

### 2. RAG (`rag_medical/`)

Sistema de busca semântica em base de conhecimento médico.

**Pipeline:**
```
Dataset Médico (PubMedQA)
    ↓
[Processamento]
  • Limpeza de dados
  • Anonimização
  • Chunking de textos
    ↓
[Embeddings]
  • Modelo: text-embedding-004 (Gemini)
  • Dimensões: 768
  • Provider: Google AI
    ↓
[Ingestão Pinecone]
  • Index: biobyia
  • Namespace: medical_qa
  • Batch upload
    ↓
[Query RAG]
  • Busca vetorial semântica
  • Top-K retrieval
  • Reranking
```

**Componentes:**
- `scripts/`: Módulos de processamento e ingestão
- `notebooks/`: Jupyter notebooks exploratórios
- `config/`: Configurações e variáveis de ambiente

### 3. Backend (`backend/`)

API REST com LangChain para orquestração de LLMs.

**Estrutura:**
```
backend/
├── src/
│   ├── langchain/          # Integração LangChain
│   │   ├── chains/         # Chains principais
│   │   ├── prompts/        # Templates de prompts
│   │   ├── guardrails/     # Validações de segurança
│   │   └── workflows/      # Fluxos automatizados
│   │
│   ├── services/           # Lógica de negócio
│   │   ├── ragService.js            # Integração RAG
│   │   ├── medicalAssistantService.js
│   │   └── patientService.js
│   │
│   ├── models/             # Modelos MongoDB
│   │   ├── Patient.js
│   │   ├── MedicalProtocol.js
│   │   └── MedicalQuery.js
│   │
│   └── routes/             # Endpoints API
│       ├── medicalAssistantRoutes.js
│       └── patientRoutes.js
│
└── scripts/                # Scripts utilitários
```

**Fluxo de Query Médica:**
```
Pergunta do Médico
    ↓
POST /api/medical/query
    ↓
[Medical Assistant Service]
    ↓
[Medical Assistant Chain]
    ↓
    ├─→ [RAG Service]
    │     • Embedding da query
    │     • Busca no Pinecone
    │     • Top 5 documentos médicos
    │
    ├─→ [Patient Context]
    │     • Documentos do paciente
    │     • Histórico médico
    │
    └─→ [LLM Generation]
          • Contexto combinado
          • Geração de resposta
          • Guardrails validation
    ↓
Resposta + Fontes + Metadata
```

### 4. Frontend (`frontend/`)

Interface Vue.js 3 com Composition API.

**Funcionalidades:**
- Chat médico interativo
- Gestão de pacientes
- Visualização de histórico
- Dashboard de métricas

## Fluxo de Dados Completo

### Caso de Uso: Consulta Médica com RAG

```
1. Médico faz pergunta no frontend
   "Qual o tratamento para hipertensão em diabéticos?"
   
2. Frontend → Backend API
   POST /api/medical/query
   { "question": "...", "patientId": "PAT-123" }

3. Backend processa
   a) Busca contexto no RAG (Pinecone)
      → Top 5 artigos científicos relevantes
      
   b) Busca contexto do paciente (MongoDB)
      → Histórico, exames, medicações
      
   c) Combina contextos
      → Contexto Geral + Contexto do Paciente
      
   d) Envia para LLM (Gemini/BioByIA)
      → Gera resposta fundamentada
      
   e) Aplica Guardrails
      → Valida segurança
      → Checa citação de fontes
      → Verifica disclaimers

4. Resposta retorna ao Frontend
   {
     "answer": "Para hipertensão em diabéticos...",
     "sources": [
       { "type": "medical_article", "reference": "PMC123..." },
       { "type": "patient_document", "reference": "exam_2024..." }
     ],
     "requiresReview": false
   }

5. Frontend exibe
   • Resposta formatada
   • Fontes clicáveis
   • Aviso se requer revisão
```

## Configuração do Ambiente

### Requisitos

**Sistema:**
- Python 3.8+ (Fine-tuning e RAG)
- Node.js 16+ (Backend e Frontend)
- MongoDB 4.4+
- GPU com 8GB+ VRAM (Fine-tuning)

**Serviços Externos:**
- Pinecone Account (vector database)
- Google AI API Key (embeddings e LLM)
- Ollama (opcional, para modelos locais)

### Variáveis de Ambiente

**Backend (.env):**
```bash
# LLM
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Database
MONGODB_URI=mongodb://localhost:27017/medical_assistant

# RAG
PINECONE_API_KEY=your_key

# Server
PORT=4000
NODE_ENV=development
```

**RAG Medical (.env):**
```bash
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=biobyia
PINECONE_NAMESPACE=medical_qa

GEMINI_API_KEY=your_key
EMBEDDING_MODEL=text-embedding-004

MEDICAL_DATA_PATH=../context/pubmedqa-master/data/ori_pqal.json
CHUNK_SIZE=512
CHUNK_OVERLAP=50
```

## Início Rápido

### 1. Setup Inicial

```bash
# Clone o repositório
cd tech_challenge_fase_3_v2

# Setup Backend
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente

# Setup Frontend
cd ../frontend
npm install
cp .env.example .env

# Setup RAG
cd ../rag_medical
pip install -r requirements.txt
cp .env.example .env
```

### 2. Preparar Dados RAG

```bash
cd rag_medical

# Executar notebooks na ordem:
jupyter notebook notebooks/01-load-and-explore-data.ipynb
jupyter notebook notebooks/02-process-medical-data.ipynb
jupyter notebook notebooks/03-embed-and-ingest-pinecone.ipynb
jupyter notebook notebooks/04-test-rag-query.ipynb
```

### 3. Fine-Tuning (Opcional)

```bash
cd fine_tuning

# Pipeline completo
python run_pipeline.py --all

# Fine-tuning
jupyter notebook training/finetuning_medical.ipynb
```

### 4. Iniciar Serviços

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Ollama (se usar modelo local)
ollama serve
ollama run biobyia

# Terminal 3: Backend
cd backend
npm run dev

# Terminal 4: Frontend
cd frontend
npm run dev
```

### 5. Testar Sistema

```bash
# Testar RAG
cd backend
node src/scripts/test-rag.js

# Testar Medical Assistant
node scripts/testMedicalAssistant.js

# Popular dados
node scripts/seedMedicalData.js
```

## Segurança e Compliance

### Guardrails Implementados

1. **Detecção de Prescrições Diretas**
   - Sistema apenas sugere, nunca prescreve
   - Requer validação médica obrigatória

2. **Verificação de Fontes**
   - Todas as respostas devem citar fontes
   - Rastreabilidade completa

3. **Disclaimers Obrigatórios**
   - Avisos de que é ferramenta de suporte
   - Não substitui julgamento médico

4. **Validação de Interações**
   - Checa contraindicações
   - Verifica interações medicamentosas

5. **Anonimização**
   - Dados sensíveis automaticamente anonimizados
   - Conformidade LGPD/HIPAA

### Trilha de Auditoria

Todas as interações são logadas em `MedicalQuery`:
- Pergunta original
- Resposta gerada
- Fontes utilizadas
- Timestamp
- Usuário responsável
- Status de revisão

## APIs Principais

### Medical Assistant

```bash
# Query médica com RAG
POST /api/medical/query
{
  "question": "Qual o tratamento?",
  "queryType": "general_medical",
  "patientId": "optional"
}

# Histórico de consultas
GET /api/medical/history

# Testar RAG
GET /api/medical/rag/test

# Buscar na base de conhecimento
POST /api/medical/rag/search
{
  "query": "hipertensão",
  "topK": 5
}
```

### Patients

```bash
# Criar paciente
POST /api/patients
{
  "name": "João Silva",
  "age": 65,
  "gender": "male"
}

# Listar pacientes
GET /api/patients

# Resumo médico
GET /api/patients/:id/summary
```

### Workflows

```bash
# Admissão de paciente
POST /api/workflows/patient-intake
{
  "patientData": {...},
  "admissionReason": "Chest pain"
}

# Sugestão de tratamento
POST /api/workflows/treatment-suggestion
{
  "patientId": "123",
  "condition": "Hypertension"
}
```

## Monitoramento e Métricas

### Métricas RAG
- Taxa de sucesso de queries
- Tempo médio de resposta
- Score de similaridade médio
- Taxa de fallback

### Métricas do Sistema
- Queries por hora
- Taxa de queries que requerem revisão
- Tempo de resposta do LLM
- Uso de tokens

## Troubleshooting

### RAG não retorna resultados
1. Verificar conexão com Pinecone
2. Confirmar que dados foram ingeridos
3. Testar embeddings

### LLM não responde
1. Verificar API key
2. Confirmar quotas
3. Testar com modelo alternativo

### Fine-tuning falha
1. Verificar memória GPU
2. Reduzir batch size
3. Usar modelo menor

## Referências

- **Dataset**: PubMedQA - https://pubmedqa.github.io/
- **LangChain**: https://langchain.com/
- **Pinecone**: https://www.pinecone.io/
- **Unsloth**: https://github.com/unslothai/unsloth
- **LoRA**: https://arxiv.org/abs/2106.09685

## Licença

Tech Challenge Fase 3 - FIAP

---

**Versão**: 2.0  
**Última Atualização**: Janeiro 2025

