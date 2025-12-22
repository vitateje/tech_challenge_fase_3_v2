# 🏥 Framework LangChain - Medical Assistant

Este módulo contém todos os componentes essenciais do LangChain para o sistema Medical Assistant, organizados seguindo as melhores práticas de engenharia de software.

## 📁 Estrutura de Módulos

```
langchain/
├── agents/              # Agentes e Executores
│   ├── agentExecutor.js    # Serviço principal de agentes
│   └── tools/              # Tools especializadas
│       └── registry.js         # Registry centralizado
├── chains/              # Chains de processamento
│   ├── chatChain.js         # Chain conversacional com memória
│   ├── medicalAssistantChain.js # Chain principal do assistente médico
│   ├── orchestration.js     # Chains de orquestração
│   └── evaluationChain.js   # Chain de avaliação de qualidade
├── memory/              # Gerenciamento de memória
│   └── memoryManager.js     # Múltiplos tipos de memória
├── transformers/        # Transformadores de documentos
│   └── documentTransformers.js # Resumo, tradução, formatação
├── workflows/           # Workflows clínicos
│   ├── patientIntakeWorkflow.js    # Workflow de admissão de paciente
│   ├── examVerificationWorkflow.js # Workflow de verificação de exames
│   └── treatmentSuggestionWorkflow.js # Workflow de sugestão de tratamento
├── prompts/             # Sistema modular de prompts
│   ├── medical/            # Prompts médicos especializados
│   ├── system/             # Prompts de sistema
│   ├── instructions/       # Instruções de comportamento
│   └── context/            # Contextos conversacionais
├── guardrails/          # Guardrails de segurança médica
│   ├── medicalGuardrails.js # Guardrails específicos para medicina
│   ├── businessRules.js    # Regras de negócio
│   └── contentFilter.js    # Filtros de conteúdo
├── adapters/            # Adaptadores de providers
│   └── providerAdapter.js  # Adaptador para diferentes LLMs
└── config.js            # Configuração centralizada
```

## 🚀 Componentes Principais

### 1. Medical Assistant Chain

Chain principal para processamento de consultas médicas.

```javascript
const medicalAssistantChain = require('./chains/medicalAssistantChain');

// Processar consulta médica
const response = await medicalAssistantChain.processQuery(
  'Qual o protocolo para hipertensão?',
  {
    patientId: 'patient123',
    patientContext: patientSummary,
    doctorId: 'doctor456',
    queryType: 'protocol_search'
  }
);

console.log(response.answer);
console.log(response.guardrails);
```

### 2. Memory Manager

Gerenciamento avançado de memória conversacional com múltiplos tipos.

```javascript
const { memoryManager } = require('./langchain');

// Tipos disponíveis:
// - 'buffer': Armazena todo histórico
// - 'window': Mantém apenas últimas N mensagens
// - 'summary': Resume histórico antigo
// - 'summary_buffer': Combina sumarização + buffer recente

const memory = await memoryManager.getUserMemory('user123', 'summary_buffer', {
  maxTokenLimit: 2000,
  returnMessages: true
});

// Adicionar mensagens
await memoryManager.addMessages('user123', [
  { type: 'user', content: 'Paciente com hipertensão...' },
  { type: 'assistant', content: 'Recomendo verificar pressão arterial...' }
], 'summary_buffer');
```

### 3. Document Transformers

Transformação inteligente de documentos médicos (resumo, tradução, formatação).

```javascript
const { documentTransformers } = require('./langchain');

// Resumir documento médico
const summary = await documentTransformers.summarizeDocument(
  protocoloLongo,
  500, // maxLength
  'gemini' // provider
);

// Dividir em chunks
const chunks = await documentTransformers.splitIntoChunks(texto, 1000, 200);

// Processar documento
const processed = await documentTransformers.processDocument(
  texto,
  1000, // chunkSize
  true, // summarize
  500 // maxSummaryLength
);
```

### 4. Medical Workflows

Workflows clínicos especializados para processos hospitalares.

```javascript
const patientIntakeWorkflow = require('./workflows/patientIntakeWorkflow');
const examVerificationWorkflow = require('./workflows/examVerificationWorkflow');
const treatmentSuggestionWorkflow = require('./workflows/treatmentSuggestionWorkflow');

// Workflow de admissão de paciente
const intakeResult = await patientIntakeWorkflow.execute(patientData, admissionReason, doctorId);

// Workflow de verificação de exames
const examResult = await examVerificationWorkflow.execute(patientId, examId, doctorId);

// Workflow de sugestão de tratamento
const treatmentResult = await treatmentSuggestionWorkflow.execute(patientId, condition, doctorId);
```

### 5. Evaluation Chain

Avaliação de qualidade e adequação clínica das respostas.

```javascript
const { evaluationChain } = require('./langchain');

// Avaliação completa
const evaluation = await evaluationChain.evaluateComplete(
  resposta,
  pergunta,
  { level: 'Residente', topic: 'Cardiologia' }
);

// Validar e melhorar se necessário
const validation = await evaluationChain.validateAndImprove(
  resposta,
  pergunta,
  { level: 'Residente' }
);

if (validation.needsImprovement) {
  console.log('Resposta melhorada:', validation.improvedResponse);
}
```

### 6. Medical Guardrails

Sistema de guardrails para segurança médica.

```javascript
const medicalGuardrails = require('./guardrails/medicalGuardrails');

// Validar resposta médica
const validation = medicalGuardrails.validateMedicalResponse(
  question,
  response,
  {
    sources: [],
    queryType: 'general_medical'
  }
);

if (validation.requiresReview) {
  console.log('Resposta requer revisão médica');
  console.log('Issues:', validation.issues);
}
```

## 📊 Fluxo Completo: Processamento de Consulta Médica

```javascript
const medicalAssistantChain = require('./chains/medicalAssistantChain');
const { evaluationChain } = require('./langchain');

async function processarConsultaMedica(pergunta, patientId, doctorId) {
  // 1. Obter contexto do paciente
  const patient = await Patient.findById(patientId);
  const patientContext = patient ? patient.getMedicalSummary() : null;

  // 2. Processar consulta através da chain
  const response = await medicalAssistantChain.processQuery(pergunta, {
    patientId,
    patientContext,
    doctorId,
    queryType: 'general_medical'
  });

  // 3. Validar guardrails
  if (response.requiresReview) {
    console.log('⚠️ Resposta requer revisão médica');
  }

  // 4. Avaliar qualidade (opcional)
  const evaluation = await evaluationChain.evaluateComplete(
    response.answer,
    pergunta,
    { level: 'Profissional', topic: 'Medicina Geral' }
  );

  return {
    answer: response.answer,
    sources: response.sources,
    guardrails: response.guardrails,
    requiresReview: response.requiresReview,
    evaluation: evaluation
  };
}
```

## 🔧 Configuração

Todas as configurações estão centralizadas em `config.js`:

```javascript
const { langchainConfig } = require('./langchain');

// Provider ativo
console.log(langchainConfig.provider); // 'gemini', 'openai', etc.

// Configurações de processamento de documentos
console.log(langchainConfig.documentProcessing.chunkSize); // 1000
console.log(langchainConfig.documentProcessing.chunkOverlap); // 200

// Configurações de Chains
console.log(langchainConfig.chains.temperature); // 0.7
```

## 🎯 Boas Práticas

1. **Sempre incluir contexto do paciente**: Use `patientContext` quando disponível
2. **Validar guardrails**: Sempre verifique `requiresReview` antes de retornar respostas
3. **Usar queryType apropriado**: Especifique o tipo de consulta para melhor precisão
4. **Avaliação contínua**: Use evaluationChain para garantir qualidade clínica
5. **Document Transformers**: Use resumos para economizar tokens em documentos longos

## ⚠️ Avisos Importantes

- **Nunca forneça prescrições diretas**: Sempre recomende consulta médica
- **Sempre inclua avisos de segurança**: Respostas devem ter disclaimers apropriados
- **Revisão médica**: Respostas com `requiresReview: true` devem ser revisadas por médico
- **Baseado em evidências**: Todas as respostas devem ser baseadas em evidências científicas

## 🔗 Integração com Sistema Existente

Todos os componentes são compatíveis com:
- `medicalAssistantService.js` - Serviço principal do assistente médico
- `medicalAssistantController.js` - Controller HTTP
- `medicalGuardrails.js` - Guardrails de segurança médica
- `llmConfig.js` - Configuração de LLMs
