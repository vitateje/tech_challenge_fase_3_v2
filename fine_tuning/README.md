# Fine-Tuning de Modelo LLM para Domínio Médico

Pipeline completo de pré-processamento e fine-tuning de modelos LLM para tarefas de question-answering médico baseado em evidências científicas do dataset PubMedQA.

## Visão Geral

O pipeline transforma dados médicos brutos em um modelo especializado através de:

1. **Pré-Processamento**: Anonimização, formatação e validação
2. **Fine-Tuning**: Treinamento com LoRA (Low-Rank Adaptation)
3. **Inferência**: Teste e uso do modelo treinado

## Estrutura do Projeto

```
fine_tuning/
├── preprocessing/               # Processamento de dados
│   ├── data_processor.py       # Processamento e anonimização
│   ├── validate_data.py        # Validação de dados
│   └── format_to_chatml.py     # Formatação ChatML
├── training/                    # Treinamento
│   ├── finetuning_medical.py   # Script de fine-tuning
│   ├── finetuning_medical.ipynb
│   └── model_config.py         # Configurações
├── inference/                   # Inferência
│   └── test_model.py           # Testes do modelo
├── utils/                       # Utilitários
│   └── prompts.py              # Templates de prompts
├── run_pipeline.py             # Pipeline completo
└── medical_tuning_data.json    # Dataset processado
```

## Início Rápido

### 1. Pipeline Completo

```bash
cd fine_tuning

# Pré-processamento + Formatação
python run_pipeline.py --all

# Fine-Tuning
python training/finetuning_medical.py
# ou
jupyter notebook training/finetuning_medical.ipynb

# Teste
python inference/test_model.py --model_path lora_model_medical
```

### 2. Etapas Individuais

```bash
# Apenas pré-processamento
python run_pipeline.py --preprocess

# Apenas formatação
python run_pipeline.py --format

# Validar dados
python preprocessing/validate_data.py
```

## Pré-Processamento

### Pipeline

```
ori_pqal.json (PubMedQA)
    ↓
[Anonimização]
  • Remove dados sensíveis
  • Substitui por placeholders
    ↓
[Formatação]
  • Estrutura de instrução
  • Delimitadores customizados
    ↓
[Validação]
  • Verifica qualidade
  • Estatísticas do dataset
    ↓
medical_tuning_data.json
```

### Anonimização

Dados sensíveis são automaticamente substituídos:

| Padrão | Placeholder |
|--------|-------------|
| Datas | `[DATA]` |
| IDs de pacientes | `[PACIENTE_ID]` |
| Telefones | `[TELEFONE]` |
| Emails | `[EMAIL]` |

Conformidade: LGPD e HIPAA

## Fine-Tuning

### Requisitos

- **GPU**: Mínimo 8GB VRAM
- **CUDA**: Instalado e configurado
- **Bibliotecas**:
```bash
pip install 'unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git'
pip install --no-deps xformers "trl<0.9.0" peft accelerate bitsandbytes
```

### Configurações

Em `training/model_config.py`:

**Modelo:**
- Base: `unsloth/llama-3-8b-bnb-4bit`
- Quantização: 4-bit

**LoRA:**
- Rank: 16
- Alpha: 16
- Dropout: 0

**Treinamento:**
- Learning rate: 2e-4
- Max steps: 100
- Batch size: 2
- Gradient accumulation: 4

### Execução

**Opção 1: Notebook (recomendado para exploração)**
```bash
jupyter notebook training/finetuning_medical.ipynb
```

**Opção 2: Script Python (automático)**
```bash
python training/finetuning_medical.py
```

## Inferência

### Teste do Modelo

```bash
# Modo exemplos
python inference/test_model.py --model_path lora_model_medical --mode examples

# Modo interativo
python inference/test_model.py --model_path lora_model_medical --mode interactive
```

### Uso Programático

```python
from unsloth import FastLanguageModel
from utils.prompts import get_medical_prompt, get_instruction_only

# Carrega modelo
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="lora_model_medical",
    max_seq_length=2048,
    load_in_4bit=True,
)
FastLanguageModel.for_inference(model)

# Prepara prompt
instruction = get_instruction_only()
input_text = "Contexto: ...\nPergunta: Qual o tratamento?"
prompt = get_medical_prompt(instruction, input_text, "")

# Gera resposta
inputs = tokenizer([prompt], return_tensors="pt").to("cuda")
outputs = model.generate(**inputs, max_new_tokens=256)
response = tokenizer.batch_decode(outputs)[0]
```

## Formato dos Dados

### Entrada (PubMedQA)
```json
{
  "21645374": {
    "QUESTION": "Do mitochondria play a role?",
    "CONTEXTS": ["..."],
    "LONG_ANSWER": "...",
    "MESHES": ["Mitochondria", "Apoptosis"]
  }
}
```

### Saída Processada
```json
{
  "id": "21645374",
  "input": "INSTRUÇÃO MÉDICA: ...\n[|Contexto|] ... [|eContexto|]\n[|Pergunta|] ... [|ePergunta|]\n[|Resposta|] ... [|eResposta|]"
}
```

## Estatísticas

### Tempo de Processamento

| Etapa | Dataset Pequeno | Dataset Grande |
|-------|----------------|----------------|
| Pré-processamento | ~30s | ~10-30min |
| Fine-tuning | ~1-4h | ~8-24h |

### Uso de Memória

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| RAM (pré-processamento) | 4GB | 8GB+ |
| VRAM (fine-tuning) | 8GB | 16GB+ |

## Troubleshooting

### CUDA out of memory
- Reduzir `batch_size` em `model_config.py`
- Aumentar `gradient_accumulation_steps`
- Usar modelo menor
- Reduzir `max_seq_length`

### Dataset não encontrado
```bash
# Execute primeiro o pré-processamento
python run_pipeline.py --preprocess
```

### Loss não diminui
- Verificar qualidade dos dados
- Ajustar learning rate
- Aumentar número de steps
- Validar formato do dataset

## Merge com Ollama

Para usar o modelo fine-tunado com Ollama, consulte:
```bash
# Guia de merge
cat MERGE_OLLAMA_GUIDE.md

# Script de merge
python merge_lora_for_ollama.py
```

## Referências

- **Dataset**: [PubMedQA](https://pubmedqa.github.io/)
- **Unsloth**: [GitHub](https://github.com/unslothai/unsloth)
- **LoRA Paper**: [arXiv:2106.09685](https://arxiv.org/abs/2106.09685)
- **Transformers**: [Hugging Face](https://huggingface.co/docs/transformers)

## Documentação Adicional

Para visão geral completa do sistema, consulte: `../DOCUMENTATION.md`

---

**Versão**: 2.0  
**Tech Challenge Fase 3 - FIAP**

