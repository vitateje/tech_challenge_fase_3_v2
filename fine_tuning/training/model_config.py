"""
Configurações Centralizadas para Fine-Tuning de Modelo Médico

Este módulo centraliza todas as configurações relacionadas ao modelo,
hiperparâmetros de treinamento e configurações LoRA. Isso facilita:
- Ajuste de hiperparâmetros em um único lugar
- Experimentação com diferentes configurações
- Manutenção e versionamento de configurações
"""

# ============================================================================
# CONFIGURAÇÕES DO MODELO BASE
# ============================================================================

# Comprimento máximo de sequência (em tokens)
# Valores comuns: 512, 1024, 2048, 4096
# Maior = mais contexto, mas requer mais memória GPU
MAX_SEQ_LENGTH = 2048

# Tipo de dados para computação
# None = auto-detect (usa bfloat16 se suportado, senão float16)
DTYPE = None

# Quantização 4-bit reduz drasticamente o uso de memória
# Permite treinar modelos grandes em GPUs menores
# True = usa 4-bit quantization (BitsAndBytes)
# False = usa precisão completa (requer muito mais memória)
LOAD_IN_4BIT = True

# ============================================================================
# MODELOS DISPONÍVEIS (4-bit quantizados via Unsloth)
# ============================================================================
# Unsloth fornece modelos pré-quantizados que são otimizados para fine-tuning
# rápido e eficiente. Escolha o modelo baseado em:
# - Tamanho da GPU disponível
# - Qualidade desejada
# - Velocidade de treinamento

AVAILABLE_MODELS = [
    # Modelos Mistral (7B parâmetros)
    "unsloth/mistral-7b-v0.3-bnb-4bit",
    "unsloth/mistral-7b-instruct-v0.3-bnb-4bit",
    "unsloth/mistral-7b-bnb-4bit",
    
    # Modelos LLaMA 3 (8B parâmetros) - RECOMENDADO para começar
    "unsloth/llama-3-8b-bnb-4bit",
    "unsloth/llama-3-8b-Instruct-bnb-4bit",
    
    # Modelos LLaMA 3 (70B parâmetros) - Requer GPU muito grande
    "unsloth/llama-3-70b-bnb-4bit",
    
    # Modelos Phi-3 (Microsoft) - Leves e eficientes
    "unsloth/Phi-3-mini-4k-instruct",
    "unsloth/Phi-3-medium-4k-instruct",
    
    # Modelos Gemma (Google)
    "unsloth/gemma-7b-bnb-4bit",
]

# LLaMA 3 8B oferece bom equilíbrio entre qualidade e requisitos de memória
DEFAULT_MODEL = "unsloth/llama-3-8b-Instruct-bnb-4bit"

# ============================================================================
# CONFIGURAÇÕES LoRA (Low-Rank Adaptation)
# ============================================================================
# LoRA é uma técnica de fine-tuning eficiente que treina apenas uma pequena
# fração dos parâmetros do modelo, reduzindo drasticamente memória e tempo.

LORA_CONFIG = {
    # Rank (r): Dimensão da matriz de baixa classificação
    # Valores comuns: 8, 16, 32, 64
    # Maior = mais parâmetros treináveis = melhor qualidade (mas mais memória)
    "r": 16,
    
    # Alpha (lora_alpha): Fator de escalonamento
    # Geralmente igual ou 2x o rank
    # Controla a força da adaptação LoRA
    "lora_alpha": 16,
    
    # Dropout: Regularização para prevenir overfitting
    # 0 = sem dropout (comum para LoRA)
    # Valores típicos: 0.0, 0.05, 0.1
    "lora_dropout": 0,
    
    # Bias: Como tratar bias durante treinamento
    # "none" = não treina bias (recomendado)
    # "all" = treina todos os bias
    # "lora_only" = treina apenas bias de LoRA
    "bias": "none",
    
    # Módulos alvo: Quais camadas aplicar LoRA
    # Para modelos LLaMA/Mistral, esses são os módulos principais:
    # - q_proj, k_proj, v_proj, o_proj: Attention layers
    # - gate_proj, up_proj, down_proj: MLP layers
    "target_modules": [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    
    # Gradient checkpointing: Economiza memória durante backpropagation
    # "unsloth" = usa otimização específica do Unsloth
    "use_gradient_checkpointing": "unsloth",
    
    # Random state: Para reprodutibilidade
    "random_state": 3407,
    
    # RSLoRA: Rank-Stabilized LoRA (técnica avançada)
    # False = LoRA padrão
    "use_rslora": False,
    
    # LoftQ: Quantização adicional (avançado)
    # None = não usar
    "loftq_config": None,
}

# ============================================================================
# HIPERPARÂMETROS DE TREINAMENTO
# ============================================================================

TRAINING_CONFIG = {
    # Batch size por dispositivo GPU
    # Valores típicos: 1, 2, 4, 8
    # Menor = menos memória, mas treinamento mais lento
    "per_device_train_batch_size": 2,
    
    # Gradient accumulation: Simula batch maior
    # Batch efetivo = per_device_train_batch_size * gradient_accumulation_steps
    # Exemplo: 2 * 4 = batch efetivo de 8
    "gradient_accumulation_steps": 4,
    
    # Warmup steps: Número de steps com learning rate crescente
    # Ajuda na estabilidade do treinamento inicial
    "warmup_steps": 5,
    
    # Max steps: Número máximo de steps de treinamento
    # Alternativa: usar num_train_epochs
    # Para datasets médicos, pode precisar de mais steps
    "max_steps": 100,  # Ajustado para dados médicos (mais complexos)
    
    # Learning rate: Taxa de aprendizado
    # Valores típicos para LoRA: 1e-4 a 5e-4
    # Muito alto = instabilidade, muito baixo = convergência lenta
    "learning_rate": 2e-4,
    
    # Optimizer: Otimizador
    # "adamw_8bit" = AdamW com quantização 8-bit (economiza memória)
    "optim": "adamw_8bit",
    
    # Weight decay: Regularização L2
    # Previne overfitting penalizando pesos grandes
    "weight_decay": 0.01,
    
    # Learning rate scheduler: Como ajustar LR durante treinamento
    # "linear" = decai linearmente até zero
    # Outras opções: "cosine", "constant", "polynomial"
    "lr_scheduler_type": "linear",
    
    # Seed: Para reprodutibilidade
    "seed": 3407,
    
    # Output directory: Onde salvar checkpoints
    "output_dir": "outputs",
    
    # Logging: Frequência de logs
    "logging_steps": 1,
    
    # Precision: Precisão de ponto flutuante
    # fp16 = float16 (mais rápido, menos preciso)
    # bf16 = bfloat16 (melhor para treinamento, se suportado)
    # Será definido automaticamente baseado em is_bfloat16_supported()
}

# ============================================================================
# CONFIGURAÇÕES DE DATASET
# ============================================================================

DATASET_CONFIG = {
    # Número de processos para processamento paralelo do dataset
    # Mais processos = mais rápido, mas mais uso de CPU
    "dataset_num_proc": 2,
    
    # Packing: Empacota múltiplas sequências curtas em uma longa
    # False = uma sequência por exemplo
    # True = otimiza uso de tokens (avançado)
    "packing": False,
}

# ============================================================================
# CONFIGURAÇÕES DE INFERÊNCIA
# ============================================================================

INFERENCE_CONFIG = {
    # Número máximo de novos tokens a gerar
    "max_new_tokens": 256,  # Aumentado para respostas médicas mais completas
    
    # Usar cache de atenção (acelera inferência)
    "use_cache": True,
    
    # Temperature: Controla aleatoriedade
    # 0.0 = determinístico (sempre mesma resposta)
    # 1.0 = criativo
    # Para medicina, valores baixos são preferíveis (mais preciso)
    "temperature": 0.7,
    
    # Top-p (nucleus sampling): Controla diversidade
    # 0.9 = considera top 90% das probabilidades
    "top_p": 0.9,
    
    # Top-k: Considera apenas top K tokens
    # None = sem limite
    "top_k": 50,
}

# ============================================================================
# FUNÇÕES HELPER
# ============================================================================

def get_model_config():
    """
    Retorna configuração completa do modelo
    
    Returns:
        Dicionário com todas as configurações
    """
    return {
        "max_seq_length": MAX_SEQ_LENGTH,
        "dtype": DTYPE,
        "load_in_4bit": LOAD_IN_4BIT,
        "default_model": DEFAULT_MODEL,
        "available_models": AVAILABLE_MODELS,
    }


def get_lora_config():
    """
    Retorna configuração LoRA
    
    Returns:
        Dicionário com configurações LoRA
    """
    return LORA_CONFIG.copy()


def get_training_config():
    """
    Retorna configuração de treinamento
    
    Returns:
        Dicionário com hiperparâmetros de treinamento
    """
    return TRAINING_CONFIG.copy()


def get_dataset_config():
    """
    Retorna configuração de dataset
    
    Returns:
        Dicionário com configurações de dataset
    """
    return DATASET_CONFIG.copy()


def get_inference_config():
    """
    Retorna configuração de inferência
    
    Returns:
        Dicionário com configurações de inferência
    """
    return INFERENCE_CONFIG.copy()

