# 📋 Pré-Processamento de Dados Médicos para Fine-Tuning

Este diretório contém o pipeline completo de **pré-processamento** de dados médicos para fine-tuning de modelos LLM (LLaMA, Falcon, Mistral, etc.) em domínio médico.

## 📖 Visão Geral

O processo de pré-processamento transforma o dataset médico bruto (`ori_pqal.json`) do PubMedQA em um formato estruturado adequado para **Instruction Tuning**, garantindo:

- ✅ **Anonimização** de dados sensíveis (conformidade LGPD/HIPAA)
- ✅ **Formatação** em estrutura de instrução para modelos LLM
- ✅ **Validação** de qualidade e integridade dos dados
- ✅ **Enriquecimento** com termos técnicos médicos (MESH)

---

## 📁 Estrutura do Projeto

```
fine_tuning/
├── prepare-medical-data.ipynb    # Notebook Jupyter com pipeline completo
├── data_processor.py              # Script Python modular para processamento
├── validate_data.py               # Script de validação de dados
├── run_pipeline.py                # Pipeline completo (processamento + validação)
├── medical_tuning_data.json       # Dataset processado (gerado após execução)
└── README.md                      # Este arquivo
```

---

## 🔄 Pipeline de Pré-Processamento

O pipeline é composto por **6 etapas sequenciais**:

### Etapa 0: Importação de Bibliotecas
- Importa `json`, `re` e `Path` necessários para o processamento

### Etapa 1: Carregamento do Dataset
- Lê o arquivo `ori_pqal.json` do PubMedQA
- Estrutura: `{id_artigo: {QUESTION, CONTEXTS, LONG_ANSWER, MESHES, ...}}`
- Valida estrutura e exibe estatísticas iniciais

### Etapa 2: Anonimização de Dados Sensíveis
- Remove padrões que possam identificar pacientes:
  - **Datas**: `15/03/2024` → `[DATA]`
  - **IDs de pacientes**: `ID: 12345` → `ID: [PACIENTE_ID]`
  - **Telefones**: `11987654321` → `[TELEFONE]`
  - **Emails**: `email@hospital.com` → `[EMAIL]`

### Etapa 3: Formatação para Instruction Tuning
- Transforma dados brutos em formato de instrução
- Estrutura do prompt:
  ```
  INSTRUÇÃO MÉDICA: Responda à pergunta baseando-se nos contextos fornecidos.
  [|Contexto|] {contextos anonimizados} [|eContexto|]
  [|Termos|] {termos MESH} [|eTermos|]
  [|Pergunta|] {pergunta} [|ePergunta|]
  [|Resposta|] {resposta anonimizada} [|eResposta|]
  ```

### Etapa 4: Processamento Completo
- Processa todas as entradas do dataset
- Aplica anonimização e formatação
- Tratamento de erros robusto

### Etapa 5: Salvamento do Dataset
- Salva dados processados em `medical_tuning_data.json`
- Formato JSON com indentação para legibilidade

### Etapa 6: Verificação Final
- Visualiza amostra dos dados processados
- Valida formato e qualidade

---

## 🚀 Como Usar

### Opção 1: Notebook Jupyter (Recomendado para Exploração)

Ideal para entender o processo passo a passo e fazer ajustes:

```bash
cd fine_tuning
jupyter notebook prepare-medical-data.ipynb
```

**Vantagens:**
- Visualização interativa de cada etapa
- Facilita debugging e ajustes
- Comentários detalhados em cada célula

**Ordem de execução:**
1. Execute as células **sequencialmente** (de cima para baixo)
2. Aguarde o processamento completo
3. Verifique os resultados na última célula

### Opção 2: Script Python Individual

Para processar apenas os dados:

```bash
cd fine_tuning
python data_processor.py
```

**Saída:** `medical_tuning_data.json`

### Opção 3: Pipeline Completo (Recomendado para Produção)

Executa processamento + validação automaticamente:

```bash
cd fine_tuning
python run_pipeline.py
```

**Vantagens:**
- Processamento e validação em uma única execução
- Relatório completo de estatísticas
- Verificação automática de erros

### Opção 4: Validação Separada

Para validar dados já processados:

```bash
cd fine_tuning
python validate_data.py
```

**Saída:** Relatório detalhado com estatísticas e validações

---

## 📊 Formato dos Dados

### Entrada (ori_pqal.json)

```json
{
  "21645374": {
    "QUESTION": "Do mitochondria play a role in remodelling lace plant leaves?",
    "CONTEXTS": [
      "Programmed cell death (PCD) is the regulated death...",
      "The following paper elucidates the role..."
    ],
    "LONG_ANSWER": "Results depicted mitochondrial dynamics...",
    "MESHES": ["Mitochondria", "Apoptosis", "Cell Differentiation"],
    "YEAR": "2011"
  }
}
```

### Saída (medical_tuning_data.json)

```json
[
  {
    "id": "21645374",
    "input": "INSTRUÇÃO MÉDICA: Responda à pergunta baseando-se nos contextos fornecidos.\n[|Contexto|] Programmed cell death (PCD) is the regulated death... [|eContexto|]\n[|Termos|] Mitochondria, Apoptosis, Cell Differentiation [|eTermos|]\n[|Pergunta|] Do mitochondria play a role in remodelling lace plant leaves? [|ePergunta|]\n\n[|Resposta|] Results depicted mitochondrial dynamics... [|eResposta|]"
  }
]
```

---

## 🔒 Anonimização de Dados

### Padrões Identificados e Substituídos

| Padrão Original | Placeholder | Exemplo |
|----------------|-------------|---------|
| Datas (DD/MM/YYYY) | `[DATA]` | `15/03/2024` → `[DATA]` |
| Datas (YYYY-MM-DD) | `[DATA]` | `2024-03-15` → `[DATA]` |
| IDs de pacientes | `[PACIENTE_ID]` | `ID: 12345` → `ID: [PACIENTE_ID]` |
| Telefones | `[TELEFONE]` | `11987654321` → `[TELEFONE]` |
| Emails | `[EMAIL]` | `email@hospital.com` → `[EMAIL]` |

### Conformidade Legal

- ✅ **LGPD** (Lei Geral de Proteção de Dados - Brasil)
- ✅ **HIPAA** (Health Insurance Portability and Accountability Act - EUA)
- ✅ Proteção de dados pessoais de pacientes
- ✅ Prevenção de vazamento de informações sensíveis

---

## 📝 Componentes do Prompt Formatado

Cada entrada processada contém:

### 1. Instrução Geral
```
INSTRUÇÃO MÉDICA: Responda à pergunta baseando-se nos contextos fornecidos.
```

### 2. Contexto Científico
```
[|Contexto|] {evidências científicas dos artigos PubMed} [|eContexto|]
```
- Múltiplos contextos são unidos em um único bloco
- Dados sensíveis são anonimizados automaticamente

### 3. Termos MESH (Opcional)
```
[|Termos|] {termos técnicos médicos separados por vírgula} [|eTermos|]
```
- Medical Subject Headings (vocabulário controlado)
- Ajuda o modelo a entender o domínio médico

### 4. Pergunta
```
[|Pergunta|] {questão médica a ser respondida} [|ePergunta|]
```

### 5. Resposta Esperada
```
[|Resposta|] {resposta longa baseada nas evidências} [|eResposta|]
```
- Resposta é anonimizada para proteção de dados

---

## ✅ Validação de Dados

O script `validate_data.py` verifica:

- ✅ Estrutura correta (presença de campos `id` e `input`)
- ✅ Tamanho médio, mínimo e máximo dos inputs
- ✅ Presença de componentes obrigatórios:
  - Delimitadores `[|Contexto|]`, `[|Pergunta|]`, `[|Resposta|]`
- ✅ Consistência entre entradas
- ✅ Identificação de erros e inconsistências

**Exemplo de saída:**
```
================================================================================
RELATÓRIO DE VALIDAÇÃO DO DATASET
================================================================================

📊 Estatísticas Gerais:
  Total de entradas: 1000
  Entradas com ID: 1000
  Entradas com input: 1000

📏 Estatísticas de Tamanho:
  Tamanho médio do input: 1250 caracteres
  Tamanho mínimo: 450 caracteres
  Tamanho máximo: 3200 caracteres

✅ Componentes Presentes:
  Entradas com contexto: 1000
  Entradas com pergunta: 1000
  Entradas com resposta: 1000

✅ Nenhum erro encontrado!
```

---

## 🔧 Configuração e Requisitos

### Requisitos do Sistema

- Python 3.7+
- Bibliotecas padrão: `json`, `re`, `pathlib`
- Jupyter Notebook (opcional, para uso do notebook)

### Estrutura de Diretórios Esperada

```
tech_challenge_fase_3_v2/
├── context/
│   └── pubmedqa-master/
│       └── data/
│           └── ori_pqal.json      # Dataset original
└── fine_tuning/
    ├── prepare-medical-data.ipynb
    ├── data_processor.py
    ├── validate_data.py
    └── run_pipeline.py
```

### Ajustando Caminhos

Se o dataset estiver em outro local, ajuste o caminho em:

**No notebook:**
```python
input_file = '../context/pubmedqa-master/data/ori_pqal.json'
```

**Nos scripts Python:**
```python
input_file = '../context/pubmedqa-master/data/ori_pqal.json'
```

---

## 📈 Estatísticas e Performance

### Tempo de Processamento

- **Dataset pequeno** (< 1.000 entradas): ~30 segundos
- **Dataset médio** (1.000 - 10.000 entradas): ~2-5 minutos
- **Dataset grande** (> 10.000 entradas): ~10-30 minutos

### Uso de Memória

- Depende do tamanho do dataset
- Recomendado: mínimo 4GB RAM disponível
- Para datasets muito grandes, considere processamento em lotes

### Taxa de Sucesso

- Esperado: > 99% de entradas processadas com sucesso
- Entradas com erro são registradas mas não interrompem o processamento

---

## 🐛 Troubleshooting

### Erro: Arquivo não encontrado

```
Erro: Arquivo não encontrado: ../context/pubmedqa-master/data/ori_pqal.json
```

**Solução:** Verifique o caminho do arquivo e ajuste se necessário.

### Erro: Memória insuficiente

**Solução:** Processe o dataset em lotes ou aumente a memória disponível.

### Erro: Encoding UTF-8

**Solução:** Certifique-se de que o arquivo está em UTF-8. O script já trata isso automaticamente.

### Validação mostra erros

**Solução:** 
1. Verifique os logs de processamento
2. Revise as entradas com erro
3. Execute novamente o processamento

---

## 🔄 Próximos Passos Após Pré-Processamento

Após concluir o pré-processamento:

### 1. Validar Dados
```bash
python validate_data.py
```

### 2. Preparar para Fine-Tuning

Use o arquivo `medical_tuning_data.json` com:

- **Hugging Face Transformers**
  ```python
  from datasets import load_dataset
  dataset = load_dataset('json', data_files='medical_tuning_data.json')
  ```

- **PEFT (LoRA/QLoRA)**
  - Configuração de adaptadores para treinamento eficiente

- **Axolotl**
  - Framework especializado em fine-tuning de LLMs

- **Outras ferramentas**
  - Qualquer framework que aceite formato JSON de instruções

### 3. Configurar Hiperparâmetros

- Learning rate: `1e-4` a `5e-4`
- Batch size: 4-16 (depende da GPU)
- Epochs: 1-3 (evitar overfitting)
- LoRA rank: 8-64

---

## 📚 Referências e Recursos

### Dataset Original
- **PubMedQA**: Dataset de perguntas e respostas médicas baseadas em evidências
- Localização: `../context/pubmedqa-master/data/ori_pqal.json`
- Mais informações: [PubMedQA Paper](https://arxiv.org/abs/1909.06146)

### Notebooks de Referência
- `../context/prepare-data.ipynb` - Preparação de dados de notícias
- `../context/generate-output-for-news.ipynb` - Geração de saídas

### Documentação Técnica
- **Instruction Tuning**: Técnica de fine-tuning para modelos LLM
- **LGPD**: Lei Geral de Proteção de Dados (Brasil)
- **HIPAA**: Health Insurance Portability and Accountability Act (EUA)
- **MESH**: Medical Subject Headings (vocabulário controlado)

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a seção **Troubleshooting** acima
2. Revise os comentários detalhados no notebook
3. Execute `validate_data.py` para diagnosticar problemas
4. Verifique os logs de processamento

---

## 📄 Licença

Este código faz parte do projeto Medical Assistant e segue as mesmas diretrizes de licenciamento do projeto principal.

---

**Última atualização:** 2024

**Versão do pipeline:** 1.0
