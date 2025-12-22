# Medical Virtual Assistant - Hospital AI System

Sistema de assistente virtual médico baseado em IA para hospitais, desenvolvido com LangChain, Gemini LLM e MongoDB.

## 🏥 Visão Geral

Assistente médico inteligente que auxilia equipes médicas com:
- ✅ Suporte à decisão clínica baseado em protocolos hospitalares
- ✅ Sugestões de tratamento personalizadas por paciente
- ✅ Fluxos automatizados (admissão, verificação de exames, tratamentos)
- ✅ Trilha de auditoria completa para compliance
- ✅ Guardrails de segurança e validação humana obrigatória

## 🚀 Início Rápido

### 1. Configuração

```bash
cd backend
npm install

# Configure .env
cp .env.example .env
# Adicione: GEMINI_API_KEY=sua_chave_aqui
```

### 2. Popular Banco de Dados

```bash
# Criar dados de exemplo (2 pacientes, 2 protocolos, 2 médicos)
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
```

### 5. Credenciais de Teste

- **Médico**: `doctor@hospital.com` / `demo@123`
- **Enfermeira**: `nurse@hospital.com` / `demo@123`

## 📋 Funcionalidades

### 🤖 Assistente Médico com IA
- **LLM**: Gemini Pro para processamento de linguagem natural
- **RAG**: Busca semântica em protocolos hospitalares
- **Guardrails**: Validação automática de segurança
- **Auditoria**: Log completo de todas as interações

### 👥 Gestão de Pacientes
- Cadastro com anonimização automática (PAT-YYYYMMDD-XXXXX)
- Histórico médico, alergias, medicações
- Sinais vitais e exames
- Busca e filtros

### 🔄 Workflows Automatizados

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
- **Requer validação médica obrigatória**

**3. Verificação de Exames**
- Lista exames pendentes e completados
- Identifica resultados anormais
- Analisa resultados com IA
- Gera alertas para equipe médica

### 🛡️ Segurança

- ✅ Nunca prescreve diretamente (apenas sugere)
- ✅ Sempre cita fontes (protocolos)
- ✅ Inclui disclaimers obrigatórios
- ✅ Verifica contraindicações e interações
- ✅ Flagging automático para revisão humana
- ✅ Trilha de auditoria completa
- ✅ Anonimização de dados sensíveis

## 🔌 API Endpoints

### Autenticação
```
POST   /api/auth/register     - Registrar usuário
POST   /api/auth/login        - Login
GET    /api/auth/me           - Usuário atual
```

### Assistente Médico
```
POST   /api/medical/query                    - Processar consulta médica
GET    /api/medical/history                  - Histórico de consultas
GET    /api/medical/patient/:id/history      - Histórico por paciente
GET    /api/medical/review-queue             - Fila de revisão
POST   /api/medical/query/:id/feedback       - Enviar feedback
POST   /api/medical/query/:id/review         - Marcar como revisado
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

## 📊 Exemplo de Uso

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

## 🏗️ Arquitetura

### Modelos de Dados (MongoDB)

- **Patient** - Dados do paciente (com anonimização)
- **MedicalProtocol** - Protocolos hospitalares (RAG-ready)
- **MedicalQuery** - Log de consultas (auditoria)
- **Exam** - Exames médicos
- **Treatment** - Tratamentos (com workflow de validação)
- **User** - Equipe médica (médicos, enfermeiros)

### Estrutura do Projeto

```
backend/src/
├── models/                          # MongoDB Models
│   ├── Patient.js
│   ├── MedicalProtocol.js
│   ├── MedicalQuery.js
│   ├── Exam.js
│   ├── Treatment.js
│   └── User.js
│
├── langchain/                       # LangChain Integration
│   ├── chains/
│   │   └── medicalAssistantChain.js
│   ├── prompts/medical/
│   │   └── medicalPrompts.js
│   ├── guardrails/
│   │   └── medicalGuardrails.js
│   └── workflows/
│       ├── patientIntakeWorkflow.js
│       ├── treatmentSuggestionWorkflow.js
│       └── examVerificationWorkflow.js
│
├── services/                        # Business Logic
│   ├── medicalAssistantService.js
│   ├── patientService.js
│   ├── workflowService.js
│   ├── authService.js
│   └── userService.js
│
├── controllers/                     # HTTP Controllers
│   ├── medicalAssistantController.js
│   ├── patientController.js
│   ├── workflowController.js
│   ├── authController.js
│   └── userController.js
│
└── routes/                          # API Routes
    ├── medicalAssistantRoutes.js
    ├── patientRoutes.js
    ├── workflowRoutes.js
    ├── authRoutes.js
    └── userRoutes.js
```

## 🔧 Configuração (.env)

```bash
# LLM Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/medical_assistant

# RAG (Optional)
USE_PINECONE=false
PINECONE_API_KEY=your_pinecone_key_here

# Server
PORT=4000
NODE_ENV=development
```

## 🧠 LangChain & IA

### Prompts Especializados
- `medicalAssistantPrompt` - Consultas gerais
- `protocolSearchPrompt` - Busca de protocolos
- `treatmentSuggestionPrompt` - Sugestões de tratamento
- `examAnalysisPrompt` - Análise de exames
- `drugInteractionPrompt` - Verificação de interações

### Guardrails de Segurança
- Detecção de prescrições diretas
- Verificação de disclaimers
- Checagem de citação de fontes
- Identificação de conteúdo de alto risco
- Validação de menção a contraindicações

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                           # Iniciar servidor em modo desenvolvimento

# Dados
node scripts/seedMedicalData.js       # Popular banco com dados de exemplo
node scripts/testMedicalAssistant.js  # Testar assistente médico

# Produção
npm start                             # Iniciar servidor em produção
```

## ⚠️ Avisos Importantes

> **ATENÇÃO**: Este é um sistema de **suporte à decisão clínica**. Todas as sugestões da IA devem ser validadas por profissionais médicos licenciados antes da implementação.

> **COMPLIANCE**: O sistema implementa guardrails de segurança, mas a responsabilidade final pelas decisões médicas é sempre do profissional de saúde.

> **DADOS**: Utilize apenas dados anonimizados ou sintéticos em ambientes de desenvolvimento/teste.

## 📖 Documentação Adicional

- Todos os arquivos incluem comentários detalhados
- Modelos documentados com JSDoc
- Workflows com explicação de cada etapa
- Guardrails com regras de segurança explicadas

## 🤝 Contribuição

Desenvolvido como parte do Tech Challenge Fase 3 - FIAP.

---

**Medical Virtual Assistant** - Suporte inteligente para decisões clínicas 🏥🤖
