import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

# 1. Configuração de Quantização (Para caber na GPU doméstica)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)

# 2. Carregar o Modelo BASE
base_model_id = "meta-llama/Meta-Llama-3-8B-Instruct" 
model = AutoModelForCausalLM.from_pretrained(
    base_model_id,
    quantization_config=bnb_config,
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(base_model_id)

# 3. APLICAR O SEU FINE-TUNING (Sem Merge!)
# adapter_id = "vitateje/biobyia"
adapter_id = "../lora_model_medical" 
print(f"Injetando conhecimento médico de: {adapter_id}")
model = PeftModel.from_pretrained(model, adapter_id)

# 4. Teste Rápido
text = "Contexto: Paciente com dores agudas... Pergunta: Qual o procedimento?"
inputs = tokenizer(text, return_tensors="pt").to("cuda")
outputs = model.generate(**inputs, max_new_tokens=200)
print("\nRESPOSTA DO AGENTE:\n")
print(tokenizer.decode(outputs[0], skip_special_tokens=True))