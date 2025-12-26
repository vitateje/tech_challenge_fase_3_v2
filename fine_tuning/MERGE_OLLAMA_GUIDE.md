# 🔄 Guia: Merge LoRA para Ollama

Este guia explica como fazer merge do modelo LoRA (`vitateje/biobyia`) com o modelo base e configurá-lo para uso no Ollama.

## 📋 Pré-requisitos

### 1. Instalar Dependências

```bash
cd fine_tuning
pip install transformers peft accelerate huggingface_hub torch
```

### 2. Autenticar no HuggingFace

```bash
# Opção 1: Via CLI
hf auth login

# Opção 2: Via variável de ambiente
export HUGGINGFACE_API_KEY="seu_token_aqui"
# ou adicione ao .env:
# HUGGINGFACE_API_KEY=seu_token_aqui
```

### 3. Aceitar Condições do Modelo

1. Acesse: https://huggingface.co/vitateje/biobyia
2. Faça login
3. Aceite as condições do modelo

### 4. Verificar Acesso ao Modelo Base

O modelo base é `meta-llama/Meta-Llama-3-8B`. Verifique se você tem acesso:
- https://huggingface.co/meta-llama/Meta-Llama-3-8B
- Se necessário, solicite acesso no HuggingFace

## 🚀 Executar Merge

### Opção 1: Script Automatizado (Recomendado)

```bash
cd fine_tuning
python merge_lora_for_ollama.py
```

O script irá:
1. ✅ Verificar dependências
2. ✅ Autenticar no HuggingFace
3. ✅ Baixar modelo LoRA
4. ✅ Carregar modelo base
5. ✅ Fazer merge do LoRA com base
6. ✅ Criar Modelfile para Ollama
7. ✅ Gerar instruções finais

### Opção 2: Manual (Passo a Passo)

Se preferir fazer manualmente, siga os passos abaixo.

## 📦 Passo a Passo Manual

### 1. Baixar Modelo LoRA

```python
from huggingface_hub import login, snapshot_download

# Login
login()  # ou use token: login(token="seu_token")

# Baixar LoRA
snapshot_download(
    repo_id="vitateje/biobyia",
    local_dir="./outputs/lora_model"
)
```

### 2. Carregar Modelo Base

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3-8B",
    torch_dtype=torch.float16,
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
```

### 3. Fazer Merge

```python
from peft import PeftModel

# Carregar LoRA
lora_model = PeftModel.from_pretrained(
    model,
    "./outputs/lora_model",
    torch_dtype=torch.float16
)

# Fazer merge
merged_model = lora_model.merge_and_unload()

# Salvar modelo merged
merged_model.save_pretrained("./outputs/merged_model")
tokenizer.save_pretrained("./outputs/merged_model")
```

## 🦙 Configurar Ollama

### Opção A: Usar Modelo Merged Diretamente

Se o Ollama suportar modelos HuggingFace diretamente:

```bash
# Criar modelo no Ollama
ollama create biobyia -f outputs/merged_model/Modelfile

# Testar
ollama run biobyia "Qual é o papel das mitocôndrias na apoptose?"
```

### Opção B: Converter para GGUF (Recomendado)

#### 1. Instalar llama.cpp

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make
```

#### 2. Converter para GGUF

```bash
# Instalar dependências do conversor
pip install -r llama.cpp/requirements.txt

# Converter
python llama.cpp/convert_hf_to_gguf.py \
    fine_tuning/outputs/merged_model \
    --outdir fine_tuning/outputs/gguf \
    --outtype f16
```

#### 3. Quantizar (Opcional - Reduz Tamanho)

```bash
cd llama.cpp

# Quantização Q4_0 (recomendado - boa qualidade/tamanho)
./quantize \
    ../fine_tuning/outputs/gguf/model.gguf \
    ../fine_tuning/outputs/gguf/biobyia-q4_0.gguf \
    q4_0

# Quantização Q8_0 (melhor qualidade, maior tamanho)
./quantize \
    ../fine_tuning/outputs/gguf/model.gguf \
    ../fine_tuning/outputs/gguf/biobyia-q8_0.gguf \
    q8_0
```

#### 4. Criar Modelfile

Crie `fine_tuning/outputs/gguf/Modelfile`:

```dockerfile
FROM ./biobyia-q4_0.gguf

SYSTEM """Você é um assistente médico especializado em question-answering baseado em evidências científicas.
Você responde perguntas médicas baseando-se em contextos fornecidos, sempre citando evidências.
Seja preciso, claro e baseado em evidências científicas."""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 2048

TEMPLATE """{{ if .System }}System: {{ .System }}
{{ end }}{{ if .Prompt }}Instruction: {{ .Prompt }}
{{ end }}Response:"""
```

#### 5. Importar no Ollama

```bash
cd fine_tuning/outputs/gguf
ollama create biobyia -f Modelfile
```

#### 6. Testar

```bash
ollama run biobyia "Qual é o papel das mitocôndrias na apoptose?"
```

## ⚙️ Configurar Backend

### 1. Atualizar .env

Adicione ao `backend/.env`:

```env
# Provider BiobyIA (Ollama)
BIOBYIA_MODEL=biobyia
BIOBYIA_BASE_URL=http://localhost:11434
BIOBYIA_TEMPERATURE=0.7
BIOBYIA_MAX_TOKENS=2048

# Usar BiobyIA como provider padrão
LLM_PROVIDER=biobyia
```

### 2. Verificar Ollama está Rodando

```bash
# Iniciar Ollama (se não estiver rodando)
ollama serve

# Verificar modelos disponíveis
ollama list

# Deve aparecer: biobyia
```

### 3. Reiniciar Backend

```bash
cd backend
npm run dev
```

## 🧪 Testar Integração

### Via API

```bash
curl -X POST http://localhost:4000/api/medical-assistant/query \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "seu_doctor_id",
    "patientId": "seu_patient_id",
    "query": "Qual é o tratamento para hipertensão?",
    "queryType": "general_medical"
  }'
```

### Via Script de Teste

```bash
cd backend
node scripts/testMedicalAssistant.js
```

## 🔍 Troubleshooting

### Erro: "Model not found"

- Verifique se o modelo foi criado: `ollama list`
- Verifique se o nome está correto no `.env`: `BIOBYIA_MODEL=biobyia`

### Erro: "Connection refused"

- Verifique se Ollama está rodando: `ollama serve`
- Verifique a URL no `.env`: `BIOBYIA_BASE_URL=http://localhost:11434`

### Erro: "Out of memory"

- Use quantização Q4_0 ou Q8_0
- Reduza `BIOBYIA_MAX_TOKENS` no `.env`
- Feche outros aplicativos que usam memória

### Erro: "Model base not accessible"

- Solicite acesso em: https://huggingface.co/meta-llama/Meta-Llama-3-8B
- Aguarde aprovação (pode levar alguns dias)

### Erro: "LoRA model not found"

- Verifique se aceitou condições: https://huggingface.co/vitateje/biobyia
- Faça login: `hf auth login`
- Verifique se o token tem permissão

## 📊 Recursos Necessários

### Para Merge

- **RAM**: Mínimo 16GB (recomendado 32GB+)
- **Disco**: ~16GB (modelo base + merged)
- **GPU**: Opcional, mas acelera o processo

### Para Ollama

- **RAM**: 8-16GB (depende da quantização)
- **Disco**: 4-8GB (modelo quantizado)
- **CPU**: Qualquer CPU moderno funciona

## 📚 Referências

- [Ollama Documentation](https://ollama.ai/docs)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [HuggingFace PEFT](https://huggingface.co/docs/peft)
- [Modelo LoRA](https://huggingface.co/vitateje/biobyia)

## ✅ Checklist Final

- [ ] Dependências instaladas
- [ ] Autenticado no HuggingFace
- [ ] Condições do modelo aceitas
- [ ] Merge executado com sucesso
- [ ] Modelo convertido para GGUF (se necessário)
- [ ] Modelo importado no Ollama
- [ ] Teste local funcionando
- [ ] `.env` configurado
- [ ] Backend testado com BiobyIA

---

**Pronto!** Seu modelo fine-tunado está configurado e pronto para uso no backend! 🎉

