"""
Script para validar o dataset processado
Verifica a qualidade e integridade dos dados preparados para fine-tuning
"""

import json
from pathlib import Path
from typing import Dict, List, Any


def validate_dataset(file_path: str) -> Dict[str, Any]:
    """
    Valida o dataset processado
    
    Args:
        file_path: Caminho para o arquivo medical_tuning_data.json
        
    Returns:
        Dicionário com estatísticas e validações
    """
    if not Path(file_path).exists():
        return {"error": f"Arquivo não encontrado: {file_path}"}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    stats = {
        "total_entries": len(data),
        "entries_with_id": 0,
        "entries_with_input": 0,
        "avg_input_length": 0,
        "min_input_length": float('inf'),
        "max_input_length": 0,
        "entries_with_context": 0,
        "entries_with_question": 0,
        "entries_with_answer": 0,
        "errors": []
    }
    
    total_length = 0
    
    for i, entry in enumerate(data):
        # Valida estrutura básica
        if "id" in entry:
            stats["entries_with_id"] += 1
        else:
            stats["errors"].append(f"Entrada {i}: falta campo 'id'")
        
        if "input" in entry:
            stats["entries_with_input"] += 1
            input_text = entry["input"]
            input_length = len(input_text)
            total_length += input_length
            
            stats["min_input_length"] = min(stats["min_input_length"], input_length)
            stats["max_input_length"] = max(stats["max_input_length"], input_length)
            
            # Valida presença de componentes
            if "[|Contexto|]" in input_text:
                stats["entries_with_context"] += 1
            if "[|Pergunta|]" in input_text:
                stats["entries_with_question"] += 1
            if "[|Resposta|]" in input_text:
                stats["entries_with_answer"] += 1
        else:
            stats["errors"].append(f"Entrada {i}: falta campo 'input'")
    
    if stats["total_entries"] > 0:
        stats["avg_input_length"] = total_length / stats["total_entries"]
    
    if stats["min_input_length"] == float('inf'):
        stats["min_input_length"] = 0
    
    return stats


def print_validation_report(stats: Dict[str, Any]) -> None:
    """
    Imprime relatório de validação formatado
    
    Args:
        stats: Estatísticas de validação
    """
    if "error" in stats:
        print(f"❌ Erro: {stats['error']}")
        return
    
    print("=" * 80)
    print("RELATÓRIO DE VALIDAÇÃO DO DATASET")
    print("=" * 80)
    print(f"\n📊 Estatísticas Gerais:")
    print(f"  Total de entradas: {stats['total_entries']}")
    print(f"  Entradas com ID: {stats['entries_with_id']}")
    print(f"  Entradas com input: {stats['entries_with_input']}")
    
    print(f"\n📏 Estatísticas de Tamanho:")
    print(f"  Tamanho médio do input: {stats['avg_input_length']:.0f} caracteres")
    print(f"  Tamanho mínimo: {stats['min_input_length']} caracteres")
    print(f"  Tamanho máximo: {stats['max_input_length']} caracteres")
    
    print(f"\n✅ Componentes Presentes:")
    print(f"  Entradas com contexto: {stats['entries_with_context']}")
    print(f"  Entradas com pergunta: {stats['entries_with_question']}")
    print(f"  Entradas com resposta: {stats['entries_with_answer']}")
    
    if stats['errors']:
        print(f"\n⚠️  Erros encontrados: {len(stats['errors'])}")
        for error in stats['errors'][:10]:  # Mostra apenas os primeiros 10
            print(f"  - {error}")
        if len(stats['errors']) > 10:
            print(f"  ... e mais {len(stats['errors']) - 10} erros")
    else:
        print(f"\n✅ Nenhum erro encontrado!")
    
    print("=" * 80)


if __name__ == "__main__":
    output_file = 'medical_tuning_data.json'
    
    if not Path(output_file).exists():
        print(f"❌ Arquivo não encontrado: {output_file}")
        print("Execute primeiro o script data_processor.py ou o notebook prepare-medical-data.ipynb")
        exit(1)
    
    stats = validate_dataset(output_file)
    print_validation_report(stats)

