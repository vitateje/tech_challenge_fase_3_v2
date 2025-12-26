"""
Script para fazer merge do LoRA com modelo base e preparar para Ollama

Este script:
1. Baixa o modelo LoRA do HuggingFace (vitateje/biobyia)
2. Faz merge com o modelo base (meta-llama/Meta-Llama-3-8B)
3. Converte para formato GGUF (compatível com Ollama)
4. Cria instruções para importar no Ollama

Requisitos:
- pip install transformers peft accelerate huggingface_hub
- Ollama instalado e rodando
- Espaço em disco: ~16GB (modelo base + merged + GGUF)
"""

import os
import sys
from pathlib import Path
from huggingface_hub import login, snapshot_download
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Modelo LoRA no HuggingFace
LORA_MODEL_ID = "vitateje/biobyia"

# Modelo base (deve corresponder ao base model do LoRA)
BASE_MODEL_ID = "meta-llama/Meta-Llama-3-8B"

# Diretório de saída
OUTPUT_DIR = Path(__file__).parent / "outputs" / "merged_model"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Nome do modelo para Ollama
OLLAMA_MODEL_NAME = "biobyia"

# ============================================================================
# FUNÇÕES
# ============================================================================

def check_requirements():
    """Verifica se todas as dependências estão instaladas"""
    print("=" * 80)
    print("VERIFICANDO REQUISITOS")
    print("=" * 80)
    
    required_packages = {
        'transformers': 'transformers',
        'peft': 'peft',
        'accelerate': 'accelerate',
        'huggingface_hub': 'huggingface_hub',
        'torch': 'torch'
    }
    
    missing = []
    for package_name, import_name in required_packages.items():
        try:
            __import__(import_name)
            print(f"✅ {package_name}")
        except ImportError:
            print(f"❌ {package_name} não instalado")
            missing.append(package_name)
    
    if missing:
        print("\n" + "=" * 80)
        print("❌ DEPENDÊNCIAS FALTANDO")
        print("=" * 80)
        print(f"Instale com: pip install {' '.join(missing)}")
        sys.exit(1)
    
    print("\n✅ Todas as dependências estão instaladas!\n")


def login_huggingface():
    """Faz login no HuggingFace"""
    print("=" * 80)
    print("AUTENTICAÇÃO HUGGINGFACE")
    print("=" * 80)
    
    token = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
    
    if token:
        print("✅ Token encontrado nas variáveis de ambiente")
        login(token=token)
    else:
        print("⚠️  Token não encontrado. Você será solicitado a fazer login.")
        print("💡 Você pode definir HUGGINGFACE_API_KEY ou HF_TOKEN no .env")
        login()
    
    print("✅ Autenticado no HuggingFace!\n")


def download_lora_model():
    """Baixa o modelo LoRA do HuggingFace"""
    print("=" * 80)
    print("BAIXANDO MODELO LoRA")
    print("=" * 80)
    print(f"Modelo: {LORA_MODEL_ID}")
    
    lora_path = OUTPUT_DIR / "lora_model"
    lora_path.mkdir(parents=True, exist_ok=True)
    
    try:
        print("📥 Baixando modelo LoRA...")
        snapshot_download(
            repo_id=LORA_MODEL_ID,
            local_dir=str(lora_path),
            local_dir_use_symlinks=False
        )
        print(f"✅ Modelo LoRA baixado em: {lora_path}\n")
        return lora_path
    except Exception as e:
        print(f"❌ Erro ao baixar modelo LoRA: {e}")
        print(f"💡 Verifique se você aceitou as condições do modelo: https://huggingface.co/{LORA_MODEL_ID}")
        sys.exit(1)


def load_base_model():
    """Carrega o modelo base"""
    print("=" * 80)
    print("CARREGANDO MODELO BASE")
    print("=" * 80)
    print(f"Modelo: {BASE_MODEL_ID}")
    print("⚠️  Isso pode demorar e requer bastante memória RAM...")
    
    try:
        print("📥 Carregando modelo base...")
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_ID,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True
        )
        tokenizer = AutoTokenizer.from_pretrained(
            BASE_MODEL_ID,
            trust_remote_code=True
        )
        
        print("✅ Modelo base carregado!\n")
        return model, tokenizer
    except Exception as e:
        print(f"❌ Erro ao carregar modelo base: {e}")
        print(f"💡 Verifique se você tem acesso ao modelo: https://huggingface.co/{BASE_MODEL_ID}")
        sys.exit(1)


def merge_lora_with_base(base_model, tokenizer, lora_path):
    """Faz merge do LoRA com o modelo base"""
    print("=" * 80)
    print("FAZENDO MERGE DO LoRA COM MODELO BASE")
    print("=" * 80)
    
    try:
        print("📥 Carregando adaptadores LoRA...")
        lora_model = PeftModel.from_pretrained(
            base_model,
            str(lora_path),
            torch_dtype=torch.float16
        )
        
        print("🔄 Fazendo merge dos adaptadores...")
        merged_model = lora_model.merge_and_unload()
        
        print("💾 Salvando modelo merged...")
        merged_output = OUTPUT_DIR / "merged_model"
        merged_output.mkdir(parents=True, exist_ok=True)
        
        merged_model.save_pretrained(
            str(merged_output),
            safe_serialization=True
        )
        tokenizer.save_pretrained(str(merged_output))
        
        print(f"✅ Modelo merged salvo em: {merged_output}\n")
        return merged_output
    except Exception as e:
        print(f"❌ Erro ao fazer merge: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def create_ollama_modelfile(merged_path):
    """Cria Modelfile para Ollama"""
    print("=" * 80)
    print("CRIANDO MODELFILE PARA OLLAMA")
    print("=" * 80)
    
    modelfile_path = OUTPUT_DIR / "Modelfile"
    
    modelfile_content = f"""# Modelfile para {OLLAMA_MODEL_NAME}
# Modelo base: {BASE_MODEL_ID}
# LoRA: {LORA_MODEL_ID}

FROM {merged_path}

# Template do sistema
SYSTEM \"\"\"Você é um assistente médico especializado em question-answering baseado em evidências científicas.
Você responde perguntas médicas baseando-se em contextos fornecidos, sempre citando evidências.
Seja preciso, claro e baseado em evidências científicas.\"\"\"

# Parâmetros
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 2048

# Template de prompt (Alpaca format)
TEMPLATE \"\"\"{{{{ if .System }}}}System: {{{{ .System }}}}
{{{{ end }}}}{{{{ if .Prompt }}}}Instruction: {{{{ .Prompt }}}}
{{{{ end }}}}Response:\"\"\"
"""
    
    with open(modelfile_path, 'w') as f:
        f.write(modelfile_content)
    
    print(f"✅ Modelfile criado em: {modelfile_path}\n")
    return modelfile_path


def print_instructions(merged_path, modelfile_path):
    """Imprime instruções finais"""
    print("=" * 80)
    print("✅ MERGE CONCLUÍDO COM SUCESSO!")
    print("=" * 80)
    print("\n📋 PRÓXIMOS PASSOS PARA USAR NO OLLAMA:\n")
    print("=" * 80)
    print("OPÇÃO 1: Usar modelo merged diretamente (se Ollama suportar)")
    print("=" * 80)
    print(f"1. Certifique-se que o Ollama está rodando:")
    print("   ollama serve")
    print("\n2. Importe o modelo:")
    print(f"   ollama create {OLLAMA_MODEL_NAME} -f {modelfile_path}")
    print("\n3. Teste o modelo:")
    print(f"   ollama run {OLLAMA_MODEL_NAME} 'Qual é o papel das mitocôndrias na apoptose?'")
    print("\n" + "=" * 80)
    print("OPÇÃO 2: Converter para GGUF e importar (recomendado)")
    print("=" * 80)
    print("1. Instale llama.cpp:")
    print("   git clone https://github.com/ggerganov/llama.cpp")
    print("   cd llama.cpp && make")
    print("\n2. Converta para GGUF:")
    print(f"   python llama.cpp/convert_hf_to_gguf.py {merged_path} --outdir {OUTPUT_DIR}/gguf")
    print("\n3. Quantize (opcional, reduz tamanho):")
    print(f"   ./llama.cpp/quantize {OUTPUT_DIR}/gguf/model.gguf {OUTPUT_DIR}/gguf/model_q4_0.gguf q4_0")
    print("\n4. Importe no Ollama:")
    print(f"   ollama create {OLLAMA_MODEL_NAME} -f {modelfile_path}")
    print("\n" + "=" * 80)
    print("CONFIGURAÇÃO NO .ENV")
    print("=" * 80)
    print("Adicione ao seu .env:")
    print(f"BIOBYIA_MODEL={OLLAMA_MODEL_NAME}")
    print("BIOBYIA_BASE_URL=http://localhost:11434")
    print("LLM_PROVIDER=biobyia")
    print("\n" + "=" * 80)
    print("LOCALIZAÇÃO DOS ARQUIVOS")
    print("=" * 80)
    print(f"Modelo merged: {merged_path}")
    print(f"Modelfile: {modelfile_path}")
    print(f"Diretório completo: {OUTPUT_DIR}")
    print("\n" + "=" * 80)


def main():
    """Pipeline principal"""
    try:
        # 1. Verifica requisitos
        check_requirements()
        
        # 2. Login no HuggingFace
        login_huggingface()
        
        # 3. Baixa modelo LoRA
        lora_path = download_lora_model()
        
        # 4. Carrega modelo base
        base_model, tokenizer = load_base_model()
        
        # 5. Faz merge
        merged_path = merge_lora_with_base(base_model, tokenizer, lora_path)
        
        # 6. Cria Modelfile
        modelfile_path = create_ollama_modelfile(merged_path)
        
        # 7. Instruções finais
        print_instructions(merged_path, modelfile_path)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Processo interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro durante o processo: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

