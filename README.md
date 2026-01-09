# Medical Virtual Assistant

Sistema de assistente virtual médico baseado em IA para hospitais, desenvolvido com LangChain, Gemini LLM e MongoDB.

## Visão Geral

Assistente médico inteligente que auxilia equipes médicas com:
- Suporte à decisão clínica baseado em protocolos hospitalares
- RAG (Retrieval-Augmented Generation) com base de conhecimento médico
- Sugestões de tratamento personalizadas por paciente
- Fluxos automatizados (admissão, verificação de exames, tratamentos)
- Trilha de auditoria completa para compliance
- Guardrails de segurança e validação humana obrigatória
- Rastreabilidade de fontes para explainability

## Início Rápido

### 1. Configuração

```bash
cd backend
npm install

# Configure .env
cp .env.example .env
# Adicione as chaves necessárias:
# - GEMINI_API_KEY=sua_chave_gemini
# - PINECONE_API_KEY=sua_chave_pinecone (para RAG)
```

### 2. Popular Banco de Dados

```bash
node scripts/seedMedicalData.js
```

### 3. Iniciar Servidor

```bash
npm run dev
# Servidor rodando em http://localhost:4000
```

### 4. Testar Sistema

```bash
# Testar assistente médico
node scripts/testMedicalAssistant.js

# Testar RAG Service
node src/scripts/test-rag.js
```

### 5. Credenciais de Teste

- **Médico**: `doctor@hospital.com` / `demo@123`
- **Enfermeira**: `nurse@hospital.com` / `demo@123`

## Funcionalidades

### Assistente Médico com IA
- **LLM**: Gemini Pro para processamento de linguagem natural
- **RAG**: Busca semântica em protocolos hospitalares
- **Guardrails**: Validação automática de segurança
- **Auditoria**: Log completo de todas as interações

### Gestão de Pacientes
- Cadastro com anonimização automática
- Histórico médico, alergias, medicações
- Sinais vitais e exames
- Busca e filtros

### Workflows Automatizados

**1. Admissão de Paciente**
- Cria registro do paciente
- Verifica exames pendentes
- Gera avaliação inicial com IA
- Sugere próximos passos

**2. Sugestão de Tratamento**
- Analisa dados do paciente
- Busca protocolos relevantes
- Gera sugestões de tratamento
- Verifica contraindicações e interações
- Requer validação médica obrigatória

**3. Verificação de Exames**
- Lista exames pendentes e completados
- Identifica resultados anormais
- Analisa resultados com IA
- Gera alertas para equipe médica

### Segurança

- Nunca prescreve diretamente (apenas sugere)
- Sempre cita fontes (protocolos)
- Inclui disclaimers obrigatórios
- Verifica contraindicações e interações
- Flagging automático para revisão humana
- Trilha de auditoria completa
- Anonimização de dados sensíveis

## API Endpoints

### Autenticação
```
POST   /api/auth/register     - Registrar usuário
POST   /api/auth/login        - Login
GET    /api/auth/me           - Usuário atual
```

### Assistente Médico
```
POST   /api/medical/query                    - Processar consulta médica (com RAG)
GET    /api/medical/history                  - Histórico de consultas
GET    /api/medical/patient/:id/history      - Histórico por paciente
GET    /api/medical/review-queue             - Fila de revisão
POST   /api/medical/query/:id/feedback       - Enviar feedback
POST   /api/medical/query/:id/review         - Marcar como revisado
GET    /api/medical/rag/test                 - Testar conexão RAG
POST   /api/medical/rag/search               - Buscar na base de conhecimento
```

### Pacientes
```
POST   /api/patients                         - Criar paciente
GET    /api/patients                         - Listar/buscar pacientes
GET    /api/patients/:id                     - Obter paciente
PUT    /api/patients/:id                     - Atualizar paciente
GET    /api/patients/:id/summary             - Resumo médico
POST   /api/patients/:id/vital-signs         - Atualizar sinais vitais
POST   /api/patients/:id/allergies           - Adicionar alergia
POST   /api/patients/:id/medications         - Adicionar medicação
POST   /api/patients/:id/discharge           - Dar alta
```

### Workflows
```
POST   /api/workflows/patient-intake         - Admissão de paciente
POST   /api/workflows/treatment-suggestion   - Sugestão de tratamento
POST   /api/workflows/exam-verification      - Verificação de exames
```

## Exemplos de Uso

### Consultar Protocolo

```bash
curl -X POST http://localhost:4000/api/medical/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "question": "Qual o protocolo para hipertensão?",
    "queryType": "protocol_search"
  }'
```

**Resposta:**
```json
{
  "answer": "Protocolo PROT-CARD-001: Hypertension Management...",
  "sources": [
    {
      "type": "protocol",
      "reference": "PROT-CARD-001",
      "title": "Hypertension Management Protocol"
    }
  ],
  "requiresReview": false
}
```

### Admitir Paciente

```bash
curl -X POST http://localhost:4000/api/workflows/patient-intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "patientData": {
      "name": "João Silva",
      "age": 65,
      "gender": "male",
      "allergies": [{"allergen": "Penicillin", "severity": "severe"}]
    },
    "admissionReason": "Chest pain"
  }'
```

## Arquitetura

### Modelos de Dados (MongoDB)

- **Patient** - Dados do paciente (com anonimização)
- **MedicalProtocol** - Protocolos hospitalares (RAG-ready)
- **MedicalQuery** - Log de consultas (auditoria)
- **Exam** - Exames médicos
- **Treatment** - Tratamentos (com workflow de validação)
- **User** - Equipe médica (médicos, enfermeiros)

### Estrutura do Projeto

```
tech_challenge_fase_3_v2/
├── backend/                    # API REST com Node.js
│   └── src/
│       ├── langchain/         # Integração LangChain
│       ├── services/          # Lógica de negócio
│       ├── models/            # Modelos MongoDB
│       └── routes/            # Endpoints API
│
├── frontend/                   # Interface Vue.js
│   └── src/
│       ├── components/        # Componentes Vue
│       └── config/            # Configurações
│
├── fine_tuning/               # Pipeline de fine-tuning
│   ├── preprocessing/         # Processamento de dados
│   ├── training/              # Scripts de treinamento
│   └── inference/             # Testes do modelo
│
├── rag_medical/               # Pipeline RAG
│   ├── scripts/               # Scripts modulares
│   ├── notebooks/             # Jupyter notebooks
│   └── config/                # Configurações
│
└── DOCUMENTATION.md           # Documentação técnica completa
```

## Configuração (.env)

```bash
# LLM Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/medical_assistant

# RAG - Retrieval-Augmented Generation
PINECONE_API_KEY=your_pinecone_key_here

# Server
PORT=4000
NODE_ENV=development
```

## RAG - Retrieval-Augmented Generation

O sistema utiliza RAG para fundamentar as respostas médicas em documentos científicos reais.

### Características

**Base de Conhecimento Médico**
- Index Pinecone: `biobyia`
- Namespace: `medical_qa`
- Embeddings: Google Generative AI (`text-embedding-004`)
- Busca vetorial semântica

**Contexto Duplo**
- **Contexto Médico Geral**: Artigos científicos, guidelines, literatura médica
- **Contexto do Paciente**: Documentos específicos do paciente

**Rastreabilidade**
- Todas as respostas incluem referências às fontes
- IDs dos artigos médicos utilizados
- Scores de similaridade para transparência
- Metadata completo de cada fonte

### Como Funciona

1. **Pergunta do médico** → "Quais são os efeitos da aspirina?"
2. **Embedding da query** → Vetor de 768 dimensões
3. **Busca no Pinecone** → Top 5 documentos mais relevantes
4. **Contexto enriquecido** → Documentos médicos + contexto do paciente
5. **LLM gera resposta** → Fundamentada nas fontes encontradas
6. **Resposta com fontes** → Rastreabilidade completa

### Endpoints RAG

```bash
# Testar conexão com Pinecone
GET /api/medical/rag/test

# Buscar na base de conhecimento
POST /api/medical/rag/search
{
  "query": "tratamento para hipertensão",
  "topK": 5
}

# Query médica com RAG
POST /api/medical/query
{
  "question": "Como tratar hipertensão em diabéticos?",
  "patientId": "optional"
}
```

### Exemplo de Resposta com RAG

```json
{
  "answer": "Para hipertensão em diabéticos...",
  "sources": [
    {
      "type": "medical_rag_document",
      "reference": "PMC7891234",
      "title": "Artigo Médico: PMC7891234",
      "source": "PubMed",
      "score": 0.92,
      "excerpt": "Estudos mostram que..."
    }
  ],
  "requiresReview": false
}
```

### Testes

```bash
node src/scripts/test-rag.js
```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                           # Iniciar servidor em modo desenvolvimento

# Dados
node scripts/seedMedicalData.js       # Popular banco com dados de exemplo
node scripts/testMedicalAssistant.js  # Testar assistente médico

# RAG
node src/scripts/test-rag.js          # Testar integração RAG

# Produção
npm start                             # Iniciar servidor em produção
```

## Avisos Importantes

**ATENÇÃO**: Este é um sistema de suporte à decisão clínica. Todas as sugestões da IA devem ser validadas por profissionais médicos licenciados antes da implementação.

**COMPLIANCE**: O sistema implementa guardrails de segurança, mas a responsabilidade final pelas decisões médicas é sempre do profissional de saúde.

**DADOS**: Utilize apenas dados anonimizados ou sintéticos em ambientes de desenvolvimento/teste.

## Documentação

### Guia de Navegação
Consulte `NAVIGATION.md` para um guia completo de navegação da documentação.

### Documentação Técnica
- **Arquitetura Completa**: `DOCUMENTATION.md`
- **Fine-Tuning**: `fine_tuning/README.md`
- **RAG Medical**: `rag_medical/README.md`
- **Backend**: `backend/README.md`
- **Frontend**: `frontend/README.md`

### Histórico
- **Cleanup Summary**: `CLEANUP_SUMMARY.md`

## Contribuição

Desenvolvido como parte do Tech Challenge Fase 3 - FIAP.

---

**Medical Virtual Assistant** - Suporte inteligente para decisões clínicas
