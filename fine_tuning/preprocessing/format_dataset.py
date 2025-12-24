"""
Formatação de Dataset Médico para Formato Alpaca

Este módulo converte o dataset médico processado (medical_tuning_data.json)
para o formato Alpaca necessário para fine-tuning com modelos LLM.

Formato Alpaca:
  - instruction: Instrução geral da tarefa
  - input: Contexto e pergunta combinados
  - output: Resposta esperada

O formato Alpaca é amplamente usado em fine-tuning de modelos LLM porque:
  1. Estrutura padronizada que modelos como LLaMA, Mistral entendem bem
  2. Separação clara entre instrução, entrada e saída
  3. Compatível com bibliotecas como Unsloth, TRL, etc.
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Tuple


def separate_medical_text(full_text: str) -> Tuple[str, str, str]:
    """
    Separa o texto formatado em instrução, input (contexto + pergunta) e output (resposta)
    
    O texto de entrada segue o formato:
        INSTRUÇÃO MÉDICA: ...
        [|Contexto|] ... [|eContexto|]
        [|Termos|] ... [|eTermos|]  (opcional)
        [|Pergunta|] ... [|ePergunta|]
        [|Resposta|] ... [|eResposta|]
    
    Args:
        full_text: Texto completo formatado com delimitadores
        
    Returns:
        Tupla com (instruction, input_text, response)
        - instruction: Primeira linha (instrução geral)
        - input_text: Contexto + Termos (se houver) + Pergunta
        - response: Resposta extraída
    """
    # PASSO 1: Extrai a instrução (primeira linha do texto)
    # A instrução está sempre na primeira linha antes do primeiro delimitador
    instruction = full_text.split('\n')[0].replace('INSTRUÇÃO MÉDICA: ', '')
    
    # PASSO 2: Extrai o contexto médico
    # Procura pelos delimitadores [|Contexto|] e [|eContexto|]
    context_start = full_text.find("[|Contexto|]")
    context_end = full_text.find("[|eContexto|]")
    
    if context_start != -1 and context_end != -1:
        # Extrai o texto entre os delimitadores e remove espaços extras
        context_text = full_text[context_start + len("[|Contexto|]"):context_end].strip()
    else:
        context_text = ""
    
    # PASSO 3: Extrai termos MESH (opcional)
    # Os termos MESH enriquecem o contexto com vocabulário técnico médico
    terms_start = full_text.find("[|Termos|]")
    terms_end = full_text.find("[|eTermos|]")
    
    terms_text = ""
    if terms_start != -1 and terms_end != -1:
        terms_text = full_text[terms_start + len("[|Termos|]"):terms_end].strip()
    
    # PASSO 4: Extrai a pergunta médica
    question_start = full_text.find("[|Pergunta|]")
    question_end = full_text.find("[|ePergunta|]")
    
    if question_start != -1 and question_end != -1:
        question_text = full_text[question_start + len("[|Pergunta|]"):question_end].strip()
    else:
        question_text = ""
    
    # PASSO 5: Extrai a resposta esperada
    response_start = full_text.find("[|Resposta|]")
    response_end = full_text.find("[|eResposta|]")
    
    if response_start != -1 and response_end != -1:
        response = full_text[response_start + len("[|Resposta|]"):response_end].strip()
    else:
        response = ""
    
    # PASSO 6: Combina contexto e pergunta no campo 'input'
    # O input do formato Alpaca contém tudo que o modelo precisa para gerar a resposta
    input_parts = []
    
    if context_text:
        input_parts.append(f"Contexto: {context_text}")
    
    if terms_text:
        input_parts.append(f"Termos técnicos: {terms_text}")
    
    if question_text:
        input_parts.append(f"Pergunta: {question_text}")
    
    # Une todas as partes do input com quebras de linha
    input_text = "\n".join(input_parts)
    
    return instruction, input_text, response


def format_medical_to_alpaca(
    input_file: str,
    output_file: str
) -> Dict[str, int]:
    """
    Converte dataset médico processado para formato Alpaca
    
    Esta função é essencial porque:
    1. O formato inicial (medical_tuning_data.json) usa delimitadores customizados
    2. O formato Alpaca é o padrão aceito por bibliotecas de fine-tuning
    3. Facilita a integração com Unsloth, TRL, Hugging Face, etc.
    
    Args:
        input_file: Caminho para medical_tuning_data.json
        output_file: Caminho para salvar formatted_medical_dataset.json
        
    Returns:
        Dicionário com estatísticas:
        - total_entries: Total de entradas processadas
        - successful: Entradas convertidas com sucesso
        - failed: Entradas que falharam na conversão
    """
    # Verifica se o arquivo de entrada existe
    if not Path(input_file).exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {input_file}")
    
    print("=" * 80)
    print("FORMATAÇÃO DE DATASET MÉDICO PARA FORMATO ALPACA")
    print("=" * 80)
    print(f"Arquivo de entrada: {input_file}")
    print(f"Arquivo de saída: {output_file}")
    print("-" * 80)
    
    # Carrega o dataset processado
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total de entradas no dataset: {len(data)}")
    
    # Inicializa lista para armazenar dados formatados
    # O formato correto é uma lista de objetos, não um objeto com arrays
    formatted_data = []
    failed_entries = []
    
    # Processa cada entrada do dataset
    for i, entry in enumerate(data):
        try:
            # Obtém o texto formatado da entrada
            full_text = entry.get("input", "")
            
            if not full_text:
                failed_entries.append(i)
                continue
            
            # Separa o texto em componentes usando a função helper
            instruction, input_text, response = separate_medical_text(full_text)
            
            # Valida que todos os componentes foram extraídos
            if not instruction or not input_text or not response:
                failed_entries.append(i)
                continue
            
            # Adiciona objeto formatado à lista
            # Este formato é compatível com load_dataset("json", ...) do Hugging Face
            formatted_data.append({
                "instruction": instruction,
                "input": input_text,
                "output": response
            })
            
        except Exception as e:
            print(f"⚠️  Erro ao processar entrada {i} (ID: {entry.get('id', 'N/A')}): {e}")
            failed_entries.append(i)
            continue
    
    # Salva o dataset formatado
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(formatted_data, f, indent=2, ensure_ascii=False)
    
    # Estatísticas finais
    total_entries = len(data)
    successful = len(formatted_data)
    failed = len(failed_entries)
    
    print("-" * 80)
    print("✅ Formatação concluída!")
    print(f"   Entradas processadas com sucesso: {successful}/{total_entries}")
    print(f"   Entradas com erro: {failed}")
    print(f"   Taxa de sucesso: {(successful/total_entries)*100:.2f}%")
    print(f"   Arquivo salvo em: {output_file}")
    print("=" * 80)
    
    return {
        "total_entries": total_entries,
        "successful": successful,
        "failed": failed
    }


if __name__ == "__main__":
    # Caminhos padrão
    # Assume que medical_tuning_data.json está no diretório raiz de fine_tuning
    input_file = '../medical_tuning_data.json'
    output_file = '../formatted_medical_dataset.json'
    
    # Ajusta caminhos se executado de dentro do diretório preprocessing
    import os
    if os.path.exists('medical_tuning_data.json'):
        input_file = 'medical_tuning_data.json'
        output_file = 'formatted_medical_dataset.json'
    
    try:
        stats = format_medical_to_alpaca(input_file, output_file)
        print(f"\n📊 Estatísticas finais: {stats}")
    except Exception as e:
        print(f"❌ Erro durante formatação: {e}")
        exit(1)

