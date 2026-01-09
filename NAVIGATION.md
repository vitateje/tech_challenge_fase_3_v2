# Guia de Navegação da Documentação

## Início Rápido

**Novo no projeto?** Comece aqui:
1. `README.md` - Visão geral e setup inicial
2. `DOCUMENTATION.md` - Arquitetura e detalhes técnicos

## Documentação por Módulo

### Fine-Tuning de LLMs
**Localização**: `fine_tuning/README.md`

**Quando usar:**
- Treinar modelo especializado em medicina
- Processar dataset PubMedQA
- Configurar LoRA e hiperparâmetros
- Fazer merge com Ollama

**Tópicos:**
- Pipeline de pré-processamento
- Configuração de treinamento
- Inferência e testes
- Troubleshooting GPU/CUDA

### RAG (Retrieval-Augmented Generation)
**Localização**: `rag_medical/README.md`

**Quando usar:**
- Configurar base de conhecimento médico
- Ingerir dados no Pinecone
- Implementar busca semântica
- Integrar RAG com backend

**Tópicos:**
- Setup do Pinecone
- Embeddings (Gemini/Ollama)
- Processamento de chunks
- Queries e filtros

### Backend API
**Localização**: `backend/README.md`

**Quando usar:**
- Desenvolver endpoints
- Integrar LLMs
- Configurar MongoDB
- Implementar workflows

**Tópicos:**
- Estrutura da API
- LangChain integration
- Guardrails e segurança
- Modelos de dados

### Frontend
**Localização**: `frontend/README.md`

**Quando usar:**
- Desenvolver interface
- Integrar com API
- Customizar componentes Vue
- Deploy

**Tópicos:**
- Componentes Vue 3
- Configuração de API
- Temas e estilos
- Build e deploy

## Documentação Técnica Completa

### DOCUMENTATION.md
**Conteúdo:**
- Arquitetura completa do sistema
- Diagramas de fluxo de dados
- Configuração de ambiente
- APIs e endpoints
- Casos de uso detalhados
- Segurança e compliance
- Monitoramento e métricas

**Quando consultar:**
- Entender arquitetura geral
- Integrar módulos
- Resolver problemas complexos
- Planejar novas features

## Guias Específicos

### Deploy e Infraestrutura
- `docker-compose.yml` - Containers Docker

### Merge e Modelos
- `fine_tuning/MERGE_OLLAMA_GUIDE.md` - Merge LoRA com Ollama

### Notebooks Exploratórios
- `fine_tuning/prepare-medical-data.ipynb` - Preparação de dados
- `fine_tuning/training/finetuning_medical.ipynb` - Treinamento
- `rag_medical/notebooks/` - Pipeline RAG completo

## Fluxo de Trabalho Recomendado

### Para Desenvolvedores Backend
1. `README.md` - Setup inicial
2. `backend/README.md` - Estrutura da API
3. `DOCUMENTATION.md` - Arquitetura completa
4. `rag_medical/README.md` - Integração RAG

### Para Cientistas de Dados / ML Engineers
1. `README.md` - Setup inicial
2. `fine_tuning/README.md` - Pipeline de treinamento
3. `rag_medical/README.md` - Processamento de dados
4. `DOCUMENTATION.md` - Integração com sistema

### Para Desenvolvedores Frontend
1. `README.md` - Setup inicial
2. `frontend/README.md` - Estrutura Vue
3. `backend/README.md` - APIs disponíveis
4. `DOCUMENTATION.md` - Fluxos de dados

### Para DevOps / SRE
1. `README.md` - Visão geral
2. `DOCUMENTATION.md` - Arquitetura e requisitos
3. `backend/VERCEL_DEPLOY.md` - Deploy
4. `docker-compose.yml` - Containers

## Troubleshooting

### Problemas Comuns

**"Não consigo iniciar o backend"**
→ `backend/README.md` - Seção de configuração

**"Fine-tuning falha com CUDA error"**
→ `fine_tuning/README.md` - Seção Troubleshooting

**"RAG não retorna resultados"**
→ `rag_medical/README.md` - Seção Troubleshooting

**"Como funciona o fluxo de dados?"**
→ `DOCUMENTATION.md` - Seção Arquitetura

## Estrutura de Arquivos

```
tech_challenge_fase_3_v2/
│
├── README.md                    ← Comece aqui
├── DOCUMENTATION.md             ← Arquitetura completa
├── NAVIGATION.md                ← Este arquivo
├── CLEANUP_SUMMARY.md           ← Histórico de mudanças
│
├── fine_tuning/
│   ├── README.md                ← Fine-tuning específico
│   └── MERGE_OLLAMA_GUIDE.md
│
├── rag_medical/
│   └── README.md                ← RAG específico
│
├── backend/
│   ├── README.md                ← Backend específico
│   └── VERCEL_DEPLOY.md
│
└── frontend/
    └── README.md                ← Frontend específico
```

## Convenções

### Formato de Código
- Python: PEP 8
- JavaScript: ESLint + Prettier
- Comentários em português nos módulos principais

### Logs e Mensagens
- `[OK]` - Sucesso
- `[ERRO]` - Erro crítico
- `[AVISO]` - Atenção necessária
- `[INFO]` - Informação

### Commits
- Mensagens em português
- Formato: `tipo: descrição`
- Tipos: `feat`, `fix`, `docs`, `refactor`, `test`

## Recursos Externos

### Documentação de Bibliotecas
- [LangChain](https://python.langchain.com/)
- [Pinecone](https://docs.pinecone.io/)
- [Unsloth](https://github.com/unslothai/unsloth)
- [Vue.js 3](https://vuejs.org/)

### Datasets
- [PubMedQA](https://pubmedqa.github.io/)

### APIs
- [Google Gemini](https://ai.google.dev/)
- [Ollama](https://ollama.ai/)

## Contato e Suporte

Para dúvidas ou problemas:
1. Consulte a seção Troubleshooting do módulo relevante
2. Verifique `DOCUMENTATION.md` para casos de uso
3. Revise os notebooks para exemplos práticos

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0

