"""
Teste de Modelo Médico Fine-Tunado

Este script permite testar o modelo médico fine-tunado com exemplos
de perguntas médicas e visualizar as respostas geradas.
"""

import sys
from pathlib import Path

# Adiciona diretório raiz ao path
sys.path.append(str(Path(__file__).parent.parent))

from unsloth import FastLanguageModel
from transformers import TextStreamer
from training.model_config import get_model_config, get_inference_config
from utils.prompts import get_medical_alpaca_prompt, get_instruction_only
import torch


def load_trained_model(model_path: Path):
    """
    Carrega modelo treinado do diretório especificado
    
    Args:
        model_path: Caminho para o diretório do modelo salvo
        
    Returns:
        Tupla (model, tokenizer)
    """
    if not model_path.exists():
        raise FileNotFoundError(f"Modelo não encontrado: {model_path}")
    
    print(f"📦 Carregando modelo de: {model_path}")
    
    model_config = get_model_config()
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=str(model_path),
        max_seq_length=model_config['max_seq_length'],
        dtype=model_config['dtype'],
        load_in_4bit=model_config['load_in_4bit'],
    )
    
    # Prepara modelo para inferência (otimizações)
    FastLanguageModel.for_inference(model)
    
    print("✅ Modelo carregado com sucesso!")
    
    return model, tokenizer


def generate_response(
    model,
    tokenizer,
    instruction: str,
    input_text: str,
    use_streamer: bool = True
) -> str:
    """
    Gera resposta do modelo para uma pergunta médica
    
    Args:
        model: Modelo carregado
        tokenizer: Tokenizer
        instruction: Instrução médica
        input_text: Contexto + pergunta
        use_streamer: Se True, mostra geração em tempo real
        
    Returns:
        Texto gerado pelo modelo
    """
    # Formata prompt (sem resposta, queremos que o modelo gere)
    prompt = get_medical_alpaca_prompt(instruction, input_text, "")
    
    # Tokeniza
    inputs = tokenizer([prompt], return_tensors="pt")
    
    # Move para GPU se disponível
    if torch.cuda.is_available():
        inputs = inputs.to("cuda")
    
    # Configuração de inferência
    inference_cfg = get_inference_config()
    
    if use_streamer:
        # Usa TextStreamer para visualizar geração em tempo real
        text_streamer = TextStreamer(tokenizer, skip_prompt=True)
        outputs = model.generate(
            **inputs,
            streamer=text_streamer,
            max_new_tokens=inference_cfg['max_new_tokens'],
            use_cache=inference_cfg['use_cache'],
            temperature=inference_cfg.get('temperature', 0.7),
            top_p=inference_cfg.get('top_p', 0.9),
        )
    else:
        outputs = model.generate(
            **inputs,
            max_new_tokens=inference_cfg['max_new_tokens'],
            use_cache=inference_cfg['use_cache'],
            temperature=inference_cfg.get('temperature', 0.7),
            top_p=inference_cfg.get('top_p', 0.9),
        )
    
    # Decodifica tokens para texto
    generated_text = tokenizer.batch_decode(outputs)[0]
    
    return generated_text


def test_examples(model, tokenizer):
    """
    Testa modelo com exemplos médicos pré-definidos
    
    Args:
        model: Modelo carregado
        tokenizer: Tokenizer
    """
    instruction = get_instruction_only()
    
    # Exemplos de perguntas médicas
    examples = [
        {
            "context": "Programmed cell death (PCD) is the regulated death of cells within an organism. The lace plant produces perforations in its leaves through PCD. Mitochondria play a critical role in developmentally regulated PCD.",
            "question": "Do mitochondria play a role in remodelling plant leaves during programmed cell death?"
        },
        {
            "context": "Assessment of visual acuity depends on the optotypes used for measurement. The ability to recognize different optotypes differs even if their critical details appear under the same visual angle.",
            "question": "What are the differences between Landolt C and Snellen E acuity in strabismus amblyopia?"
        },
        {
            "context": "Hypertension is a common cardiovascular condition. Treatment typically involves lifestyle modifications and pharmacological interventions including ACE inhibitors, beta-blockers, and diuretics.",
            "question": "What is the recommended treatment protocol for hypertension?"
        }
    ]
    
    print("=" * 80)
    print("TESTANDO MODELO COM EXEMPLOS MÉDICOS")
    print("=" * 80)
    
    for i, example in enumerate(examples, 1):
        print(f"\n{'='*80}")
        print(f"EXEMPLO {i} de {len(examples)}")
        print(f"{'='*80}")
        print(f"\nContexto:")
        print(f"  {example['context'][:200]}...")
        print(f"\nPergunta:")
        print(f"  {example['question']}")
        print(f"\n{'─'*80}")
        print("Resposta do modelo:")
        print(f"{'─'*80}")
        
        input_text = f"Contexto: {example['context']}\nPergunta: {example['question']}"
        
        response = generate_response(
            model, tokenizer, instruction, input_text, use_streamer=False
        )
        
        # Extrai apenas a resposta gerada (remove o prompt)
        if "### Response:" in response:
            answer = response.split("### Response:")[-1].strip()
        else:
            answer = response
        
        print(answer)
        print(f"{'='*80}\n")


def interactive_mode(model, tokenizer):
    """
    Modo interativo para testar o modelo com perguntas customizadas
    
    Args:
        model: Modelo carregado
        tokenizer: Tokenizer
    """
    instruction = get_instruction_only()
    
    print("=" * 80)
    print("MODO INTERATIVO")
    print("=" * 80)
    print("Digite suas perguntas médicas (ou 'sair' para encerrar)")
    print("-" * 80)
    
    while True:
        print("\n📝 Digite o contexto médico (ou 'sair'):")
        context = input("> ").strip()
        
        if context.lower() == 'sair':
            break
        
        if not context:
            continue
        
        print("\n❓ Digite a pergunta:")
        question = input("> ").strip()
        
        if not question:
            continue
        
        print("\n🤖 Gerando resposta...")
        print("-" * 80)
        
        input_text = f"Contexto: {context}\nPergunta: {question}"
        
        try:
            response = generate_response(
                model, tokenizer, instruction, input_text, use_streamer=True
            )
            print("\n" + "-" * 80)
        except Exception as e:
            print(f"❌ Erro ao gerar resposta: {e}")


def main():
    """
    Função principal
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Testa modelo médico fine-tunado")
    parser.add_argument(
        "--model_path",
        type=str,
        default="../lora_model_medical",
        help="Caminho para o modelo treinado"
    )
    parser.add_argument(
        "--mode",
        type=str,
        choices=["examples", "interactive"],
        default="examples",
        help="Modo de teste: 'examples' ou 'interactive'"
    )
    
    args = parser.parse_args()
    
    model_path = Path(__file__).parent.parent / args.model_path
    
    try:
        # Carrega modelo
        model, tokenizer = load_trained_model(model_path)
        
        # Executa testes
        if args.mode == "examples":
            test_examples(model, tokenizer)
        else:
            interactive_mode(model, tokenizer)
        
        print("\n✅ Testes concluídos!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

