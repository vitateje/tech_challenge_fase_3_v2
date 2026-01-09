"""
Formatação de Dataset Médico para Formato ChatML (JSONL)

Este módulo converte o dataset médico processado (medical_tuning_data.json)
para o formato ChatML necessário para fine-tuning com modelos LLM modernos.

Formato ChatML:
  {"messages": [
    {"role": "system", "content": "Instrução do sistema"},
    {"role": "user", "content": "Pergunta/Contexto"},
    {"role": "assistant", "content": "Resposta"}
  ]}
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Tuple


def separate_medical_text(full_text: str) -> Tuple[str, str, str]:
    """
    Separa o texto formatado em instrução, input (contexto + pergunta) e output (resposta)
    """
    # Mesma lógica do format_dataset.py
    instruction = full_text.split('\n')[0].replace('INSTRUÇÃO MÉDICA: ', '')
    
    context_start = full_text.find("[|Contexto|]")
    context_end = full_text.find("[|eContexto|]")
    context_text = full_text[context_start + len("[|Contexto|]"):context_end].strip() if context_start != -1 and context_end != -1 else ""
    
    terms_start = full_text.find("[|Termos|]")
    terms_end = full_text.find("[|eTermos|]")
    terms_text = full_text[terms_start + len("[|Termos|]"):terms_end].strip() if terms_start != -1 and terms_end != -1 else ""
    
    question_start = full_text.find("[|Pergunta|]")
    question_end = full_text.find("[|ePergunta|]")
    question_text = full_text[question_start + len("[|Pergunta|]"):question_end].strip() if question_start != -1 and question_end != -1 else ""
    
    response_start = full_text.find("[|Resposta|]")
    response_end = full_text.find("[|eResposta|]")
    response = full_text[response_start + len("[|Resposta|]"):response_end].strip() if response_start != -1 and response_end != -1 else ""
    
    input_parts = []
    if context_text:
        input_parts.append(f"Contexto: {context_text}")
    if terms_text:
        input_parts.append(f"Termos técnicos: {terms_text}")
    if question_text:
        input_parts.append(f"Pergunta: {question_text}")
    
    input_text = "\n".join(input_parts)
    
    return instruction, input_text, response


def format_medical_to_chatml(
    input_file: str,
    output_file: str
) -> Dict[str, int]:
    """
    Converte dataset médico processado para formato ChatML JSONL
    """
    if not Path(input_file).exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {input_file}")
    
    print("=" * 80)
    print("FORMATAÇÃO DE DATASET MÉDICO PARA FORMATO CHATML")
    print("=" * 80)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    successful = 0
    failed = 0
    
    with open(output_file, 'w', encoding='utf-8') as f_out:
        for i, entry in enumerate(data):
            try:
                full_text = entry.get("input", "")
                if not full_text:
                    failed += 1
                    continue
                
                instruction, input_text, response = separate_medical_text(full_text)
                
                if not instruction or not input_text or not response:
                    failed += 1
                    continue
                
                # ChatML Structure
                chatml_entry = {
                    "messages": [
                        {"role": "system", "content": instruction},
                        {"role": "user", "content": input_text},
                        {"role": "assistant", "content": response}
                    ]
                }
                
                f_out.write(json.dumps(chatml_entry, ensure_ascii=False) + "\n")
                successful += 1
                
            except Exception as e:
                failed += 1
                continue
    
    print(f"[OK] Formatação concluída!")
    print(f"   Entradas processadas com sucesso: {successful}/{len(data)}")
    print(f"   Arquivo salvo em: {output_file}")
    
    return {
        "total_entries": len(data),
        "successful": successful,
        "failed": failed
    }


if __name__ == "__main__":
    import os
    BASE_DIR = Path(__file__).parent.parent
    input_file = BASE_DIR / 'medical_tuning_data.json'
    output_file = BASE_DIR / 'formatted_medical_dataset.jsonl'
    
    format_medical_to_chatml(str(input_file), str(output_file))
