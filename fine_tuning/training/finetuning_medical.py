"""
Fine-Tuning de Modelo LLM para Domínio Médico

Este script implementa o pipeline completo de fine-tuning de um modelo LLM
para tarefas de question-answering médico baseado em evidências científicas.

O pipeline utiliza:
- Unsloth: Para fine-tuning rápido e eficiente
- LoRA: Para treinar apenas uma fração dos parâmetros (economiza memória)
- ChatML Format: Formato padronizado de conversas para modelos LLM modernos

Requisitos:
- GPU com pelo menos 8GB VRAM (recomendado 16GB+)
- CUDA instalado
- Bibliotecas: unsloth, transformers, datasets, trl
"""

import sys
import os
from pathlib import Path

# Adiciona o diretório raiz ao path para imports
sys.path.append(str(Path(__file__).parent.parent))

# ============================================================================
# ETAPA 1: IMPORTAÇÕES E SETUP
# ============================================================================

try:
    # Unsloth: Biblioteca otimizada para fine-tuning rápido de LLMs
    # Fornece modelos pré-quantizados e otimizações de treinamento
    from unsloth import FastLanguageModel, is_bfloat16_supported
    
    # PyTorch: Framework de deep learning
    import torch
    
    # Transformers: Biblioteca da Hugging Face para modelos de linguagem
    from transformers import TrainingArguments, TextStreamer
    
    # Datasets: Para carregar e processar datasets
    from datasets import load_dataset
    
    # TRL: Biblioteca para Reinforcement Learning e fine-tuning
    # SFTTrainer = Supervised Fine-Tuning Trainer
    from trl import SFTTrainer
    
    # JSON: Para manipulação de arquivos JSON
    import json
    
except ImportError as e:
    print("❌ Erro ao importar bibliotecas necessárias.")
    print(f"   Detalhes: {e}")
    print("\n📦 Instale as dependências com:")
    print("   pip install 'unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git'")
    print("   pip install --no-deps xformers 'trl<0.9.0' peft accelerate bitsandbytes")
    print("   pip install transformers datasets")
    sys.exit(1)

# Importa configurações e utilitários locais
from training.model_config import (
    get_model_config, get_lora_config, get_training_config,
    get_dataset_config, get_inference_config
)
from unsloth import get_chat_template

# ============================================================================
# ETAPA 2: CONFIGURAÇÕES E CAMINHOS
# ============================================================================

# Obtém configurações centralizadas
model_config = get_model_config()
lora_config = get_lora_config()
training_config = get_training_config()
dataset_config = get_dataset_config()
inference_config = get_inference_config()

# Caminhos dos arquivos
# Ajuste estes caminhos conforme sua estrutura de diretórios
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR

# Dataset formatado no formato ChatML JSONL (gerado por run_pipeline.py)
FORMATTED_DATASET_PATH = DATA_DIR / "formatted_medical_dataset.jsonl"

# Diretório para salvar o modelo treinado
MODEL_OUTPUT_DIR = BASE_DIR / "lora_model_medical"

# Diretório para outputs de treinamento (checkpoints, logs)
TRAINING_OUTPUT_DIR = BASE_DIR / "outputs"

print("=" * 80)
print("CONFIGURAÇÕES DE FINE-TUNING MÉDICO")
print("=" * 80)
print(f"Modelo: {model_config['default_model']}")
print(f"Max sequence length: {model_config['max_seq_length']}")
print(f"4-bit quantization: {model_config['load_in_4bit']}")
print(f"LoRA rank: {lora_config['r']}")
print(f"LoRA alpha: {lora_config['lora_alpha']}")
print(f"Learning rate: {training_config['learning_rate']}")
print(f"Max steps: {training_config['max_steps']}")
print("=" * 80)

# ============================================================================
# ETAPA 3: CARREGAMENTO DO DATASET FORMATADO
# ============================================================================

def load_formatted_dataset(dataset_path: Path):
    """
    Carrega o dataset formatado no formato ChatML JSONL
    
    O dataset deve ter a estrutura:
    {
        "messages": [
            {"role": "system", "content": "..."},
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
    }
    
    Args:
        dataset_path: Caminho para formatted_medical_dataset.json
        
    Returns:
        Dataset carregado e pronto para treinamento
    """
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset não encontrado: {dataset_path}\n"
            f"Execute primeiro: python run_pipeline.py --format"
        )
    
    print(f"\n📦 Carregando dataset de: {dataset_path}")
    
    # load_dataset do Hugging Face pode carregar JSON diretamente
    # split="train" cria um dataset de treinamento
    dataset = load_dataset("json", data_files=str(dataset_path), split="train")
    
    print(f"✅ Dataset carregado: {len(dataset)} exemplos")
    print(f"   Estrutura: {dataset.features}")
    
    return dataset


# ============================================================================
# ETAPA 4: FUNÇÃO DE FORMATAÇÃO DE PROMPTS
# ============================================================================

def formatting_prompts_func(examples, tokenizer):
    """
    Formata exemplos do dataset para o formato de prompt ChatML
    """
    convos = examples["messages"]
    texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
    return {"text": texts}


# ============================================================================
# ETAPA 5: CARREGAMENTO DO MODELO BASE
# ============================================================================

def load_model():
    """
    Carrega o modelo base pré-quantizado do Unsloth
    
    Unsloth fornece modelos pré-quantizados em 4-bit que:
    - Reduzem uso de memória em ~75%
    - Mantêm qualidade próxima ao modelo original
    - Permitem fine-tuning em GPUs menores
    
    Returns:
        Tupla (model, tokenizer) prontos para fine-tuning
    """
    print("\n" + "=" * 80)
    print("CARREGANDO MODELO BASE")
    print("=" * 80)
    print(f"Modelo: {model_config['default_model']}")
    print(f"Quantização 4-bit: {model_config['load_in_4bit']}")
    print(f"Max sequence length: {model_config['max_seq_length']}")
    print("-" * 80)
    
    # FastLanguageModel.from_pretrained carrega o modelo otimizado
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_config['default_model'],
        max_seq_length=model_config['max_seq_length'],
        dtype=model_config['dtype'],
        load_in_4bit=model_config['load_in_4bit'],
    )
    
    # Configura template ChatML
    tokenizer = get_chat_template(
        tokenizer,
        chat_template="chatml",
        mapping={"role": "role", "content": "content", "user": "user", "assistant": "assistant"},
    )
    
    print("✅ Modelo carregado com sucesso!")
    print(f"   Parâmetros totais: {sum(p.numel() for p in model.parameters()):,}")
    
    return model, tokenizer


# ============================================================================
# ETAPA 6: CONFIGURAÇÃO LoRA
# ============================================================================

def setup_lora(model):
    """
    Configura LoRA (Low-Rank Adaptation) no modelo
    
    LoRA é uma técnica de fine-tuning eficiente que:
    - Treina apenas uma pequena fração dos parâmetros (~1-5%)
    - Adiciona matrizes de baixa classificação nas camadas selecionadas
    - Reduz drasticamente memória e tempo de treinamento
    - Mantém qualidade próxima ao fine-tuning completo
    
    Args:
        model: Modelo base carregado
        
    Returns:
        Modelo configurado com LoRA
    """
    print("\n" + "=" * 80)
    print("CONFIGURANDO LoRA")
    print("=" * 80)
    print(f"Rank (r): {lora_config['r']}")
    print(f"Alpha: {lora_config['lora_alpha']}")
    print(f"Dropout: {lora_config['lora_dropout']}")
    print(f"Módulos alvo: {len(lora_config['target_modules'])} camadas")
    print("-" * 80)
    
    # get_peft_model adiciona adaptadores LoRA ao modelo
    # r: Rank da matriz de baixa classificação (controla capacidade)
    # lora_alpha: Fator de escalonamento (controla força da adaptação)
    # target_modules: Quais camadas receberão LoRA
    model = FastLanguageModel.get_peft_model(
        model,
        r=lora_config['r'],
        target_modules=lora_config['target_modules'],
        lora_alpha=lora_config['lora_alpha'],
        lora_dropout=lora_config['lora_dropout'],
        bias=lora_config['bias'],
        use_gradient_checkpointing=lora_config['use_gradient_checkpointing'],
        random_state=lora_config['random_state'],
        use_rslora=lora_config['use_rslora'],
        loftq_config=lora_config['loftq_config'],
    )
    
    # Conta apenas parâmetros treináveis (LoRA)
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    
    print(f"✅ LoRA configurado!")
    print(f"   Parâmetros treináveis: {trainable_params:,}")
    print(f"   Parâmetros totais: {total_params:,}")
    print(f"   Fração treinável: {(trainable_params/total_params)*100:.2f}%")
    
    return model


# ============================================================================
# ETAPA 7: PREPARAÇÃO DO DATASET PARA TREINAMENTO
# ============================================================================

def prepare_training_dataset(dataset, tokenizer):
    """
    Prepara o dataset aplicando formatação de prompts
    
    Args:
        dataset: Dataset carregado do Hugging Face
        
    Returns:
        Dataset formatado pronto para treinamento
    """
    print("\n" + "=" * 80)
    print("PREPARANDO DATASET PARA TREINAMENTO")
    print("=" * 80)
    print(f"Exemplos antes da formatação: {len(dataset)}")
    
    # map() aplica a função de formatação a cada exemplo
    # batched=True processa em batches (mais eficiente)
    # remove_columns remove colunas originais, mantém apenas "text"
    formatted_dataset = dataset.map(
        lambda x: formatting_prompts_func(x, tokenizer),
        batched=True,
        remove_columns=dataset.column_names
    )
    
    print(f"✅ Dataset formatado: {len(formatted_dataset)} exemplos")
    print(f"   Estrutura final: {formatted_dataset.features}")
    
    return formatted_dataset


# ============================================================================
# ETAPA 8: CONFIGURAÇÃO DO TRAINER
# ============================================================================

def create_trainer(model, tokenizer, train_dataset):
    """
    Cria o trainer para fine-tuning supervisionado
    
    SFTTrainer (Supervised Fine-Tuning Trainer) é especializado em
    treinar modelos para seguir instruções e gerar respostas.
    
    Args:
        model: Modelo com LoRA configurado
        tokenizer: Tokenizer do modelo
        train_dataset: Dataset formatado para treinamento
        
    Returns:
        Trainer configurado e pronto para treinamento
    """
    print("\n" + "=" * 80)
    print("CONFIGURANDO TRAINER")
    print("=" * 80)
    
    # TrainingArguments define hiperparâmetros de treinamento
    training_args = TrainingArguments(
        per_device_train_batch_size=training_config['per_device_train_batch_size'],
        gradient_accumulation_steps=training_config['gradient_accumulation_steps'],
        warmup_steps=training_config['warmup_steps'],
        max_steps=training_config['max_steps'],
        learning_rate=training_config['learning_rate'],
        fp16=not is_bfloat16_supported(),  # Usa fp16 se bf16 não suportado
        bf16=is_bfloat16_supported(),       # Usa bf16 se suportado (melhor)
        logging_steps=training_config['logging_steps'],
        optim=training_config['optim'],
        weight_decay=training_config['weight_decay'],
        lr_scheduler_type=training_config['lr_scheduler_type'],
        seed=training_config['seed'],
        output_dir=str(TRAINING_OUTPUT_DIR),
    )
    
    print(f"Batch size por dispositivo: {training_args.per_device_train_batch_size}")
    print(f"Gradient accumulation: {training_args.gradient_accumulation_steps}")
    print(f"Batch efetivo: {training_args.per_device_train_batch_size * training_args.gradient_accumulation_steps}")
    print(f"Max steps: {training_args.max_steps}")
    print(f"Learning rate: {training_args.learning_rate}")
    print(f"Output directory: {training_args.output_dir}")
    
    # SFTTrainer configura o treinamento supervisionado
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        dataset_text_field="text",  # Campo do dataset que contém o texto formatado
        max_seq_length=model_config['max_seq_length'],
        dataset_num_proc=dataset_config['dataset_num_proc'],
        packing=dataset_config['packing'],
        args=training_args,
    )
    
    print("✅ Trainer configurado!")
    
    return trainer


# ============================================================================
# ETAPA 9: TREINAMENTO
# ============================================================================

def train_model(trainer):
    """
    Executa o treinamento do modelo
    
    Args:
        trainer: Trainer configurado
        
    Returns:
        Estatísticas de treinamento
    """
    print("\n" + "=" * 80)
    print("INICIANDO TREINAMENTO")
    print("=" * 80)
    print("⚠️  Este processo pode levar vários minutos ou horas dependendo:")
    print("   - Tamanho do dataset")
    print("   - Número de steps configurado")
    print("   - Performance da GPU")
    print("-" * 80)
    
    # train() executa o loop de treinamento
    # Retorna estatísticas como loss, learning rate, etc.
    trainer_stats = trainer.train()
    
    print("\n" + "=" * 80)
    print("✅ TREINAMENTO CONCLUÍDO")
    print("=" * 80)
    print(f"Loss final: {trainer_stats.training_loss:.4f}")
    print(f"Steps completados: {trainer_stats.global_step}")
    
    return trainer_stats


# ============================================================================
# ETAPA 10: SALVAMENTO DO MODELO
# ============================================================================

def save_model(model, tokenizer, output_dir):
    """
    Salva o modelo treinado e o tokenizer
    
    Apenas os adaptadores LoRA são salvos (não o modelo completo),
    economizando espaço. Para usar, carregue o modelo base e os adaptadores.
    
    Args:
        model: Modelo treinado
        tokenizer: Tokenizer
        output_dir: Diretório para salvar
    """
    print("\n" + "=" * 80)
    print("SALVANDO MODELO TREINADO")
    print("=" * 80)
    print(f"Diretório: {output_dir}")
    
    # Cria diretório se não existir
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Salva apenas os adaptadores LoRA (muito menor que modelo completo)
    model.save_pretrained(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))
    
    print(f"✅ Modelo salvo em: {output_dir}")
    print("   Para carregar depois, use:")
    print(f"   model, tokenizer = FastLanguageModel.from_pretrained('{output_dir}')")


# ============================================================================
# ETAPA 11: TESTE DO MODELO TREINADO
# ============================================================================

def test_model(model, tokenizer, example_instruction, example_input):
    """
    Testa o modelo treinado com um exemplo
    
    Args:
        model: Modelo treinado
        tokenizer: Tokenizer
    """
    print("\n" + "=" * 80)
    print("TESTANDO MODELO TREINADO")
    print("=" * 80)
    
    # Prepara modelo para inferência (otimizações)
    FastLanguageModel.for_inference(model)
    
    messages = [
        {"role": "system", "content": "Responda à pergunta baseando-se nos contextos fornecidos."},
        {"role": "user", "content": "Contexto: Programmed cell death (PCD) is the regulated death of cells.\nPergunta: Do mitochondria play a role in remodelling plant leaves during PCD?"},
    ]
    
    # Formata usando chat template
    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to("cuda")
    
    # Gera resposta
    inference_cfg = get_inference_config()
    outputs = model.generate(
        input_ids=inputs,
        max_new_tokens=inference_cfg['max_new_tokens'],
        use_cache=inference_cfg['use_cache'],
    )
    
    # Decodifica tokens para texto
    generated_text = tokenizer.batch_decode(outputs)[0]
    
    print("Messages de entrada:")
    print("-" * 80)
    print(messages)
    print("-" * 80)
    print("\nResposta gerada:")
    print("-" * 80)
    print(generated_text)
    print("-" * 80)


# ============================================================================
# PIPELINE PRINCIPAL
# ============================================================================

def main():
    """
    Executa o pipeline completo de fine-tuning
    """
    try:
        # 1. Carrega dataset
        dataset = load_formatted_dataset(FORMATTED_DATASET_PATH)
        
        # 2. Carrega modelo
        model, tokenizer = load_model()
        
        # 3. Configura LoRA
        model = setup_lora(model)
        
        # 4. Prepara dataset
        train_dataset = prepare_training_dataset(dataset, tokenizer)
        
        # 5. Cria trainer
        trainer = create_trainer(model, tokenizer, train_dataset)
        
        # 6. Treina modelo
        train_model(trainer)
        
        # 7. Salva modelo
        save_model(model, tokenizer, MODEL_OUTPUT_DIR)
        
        # 8. Testa modelo (exemplo)
        test_model(model, tokenizer)
        
        print("\n" + "=" * 80)
        print("✅ PIPELINE COMPLETO FINALIZADO COM SUCESSO!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Erro durante fine-tuning: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

