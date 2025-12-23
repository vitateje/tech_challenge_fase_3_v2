"""
Módulo para carregamento de dados médicos do arquivo ori_pqal.json.

Este módulo fornece funções para carregar e validar a estrutura
dos dados médicos do dataset PubMedQA.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional


def load_medical_dataset(file_path: str) -> Dict[str, Any]:
    """
    Carrega o dataset médico do arquivo JSON.
    
    O arquivo ori_pqal.json contém dados estruturados do PubMedQA
    com a seguinte estrutura:
    {
        "article_id": {
            "QUESTION": "...",
            "CONTEXTS": ["...", "..."],
            "LONG_ANSWER": "...",
            "MESHES": ["...", "..."],
            "YEAR": "...",
            ...
        },
        ...
    }
    
    Args:
        file_path: Caminho relativo ou absoluto para o arquivo ori_pqal.json.
        
    Returns:
        Dicionário Python com estrutura: {article_id: {QUESTION, CONTEXTS, ...}}
        
    Raises:
        FileNotFoundError: Se o arquivo não for encontrado.
        json.JSONDecodeError: Se o arquivo não for um JSON válido.
        ValueError: Se a estrutura do JSON não for a esperada.
    
    Examples:
        >>> data = load_medical_dataset('../context/pubmedqa-master/data/ori_pqal.json')
        >>> print(f"Total de artigos: {len(data)}")
        Total de artigos: 1000
    """
    # Converte para Path para facilitar manipulação
    path = Path(file_path)
    
    # Verifica se o arquivo existe
    if not path.exists():
        raise FileNotFoundError(
            f"Arquivo não encontrado: {file_path}\n"
            f"Caminho absoluto tentado: {path.absolute()}"
        )
    
    # Carrega o arquivo JSON
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(
            f"Erro ao decodificar JSON: {e.msg}",
            e.doc,
            e.pos
        )
    
    # Valida estrutura básica
    if not isinstance(data, dict):
        raise ValueError(
            f"O arquivo JSON deve conter um objeto (dict), "
            f"mas recebeu: {type(data).__name__}"
        )
    
    # Valida estrutura de pelo menos uma entrada
    if len(data) > 0:
        sample_key = list(data.keys())[0]
        sample_entry = data[sample_key]
        
        if not isinstance(sample_entry, dict):
            raise ValueError(
                f"Cada entrada deve ser um objeto (dict), "
                f"mas recebeu: {type(sample_entry).__name__}"
            )
        
        # Verifica campos esperados (não obrigatórios, mas avisa se ausentes)
        expected_fields = ['QUESTION', 'CONTEXTS', 'LONG_ANSWER', 'MESHES']
        missing_fields = [
            field for field in expected_fields
            if field not in sample_entry
        ]
        
        if missing_fields:
            print(
                f"⚠️  Aviso: Campos esperados não encontrados na primeira entrada: "
                f"{', '.join(missing_fields)}"
            )
    
    return data


def validate_dataset_structure(data: Dict[str, Any]) -> tuple[bool, list[str]]:
    """
    Valida a estrutura do dataset carregado.
    
    Args:
        data: Dicionário com dados médicos carregados.
        
    Returns:
        Tuple com (is_valid, lista_de_avisos)
    """
    warnings = []
    
    if not data:
        warnings.append("Dataset vazio")
        return False, warnings
    
    # Conta entradas com campos esperados
    total_entries = len(data)
    entries_with_question = sum(
        1 for entry in data.values()
        if isinstance(entry, dict) and 'QUESTION' in entry
    )
    entries_with_contexts = sum(
        1 for entry in data.values()
        if isinstance(entry, dict) and 'CONTEXTS' in entry
    )
    entries_with_answer = sum(
        1 for entry in data.values()
        if isinstance(entry, dict) and 'LONG_ANSWER' in entry
    )
    
    # Gera avisos se houver inconsistências
    if entries_with_question < total_entries * 0.9:
        warnings.append(
            f"Apenas {entries_with_question}/{total_entries} entradas têm QUESTION"
        )
    
    if entries_with_contexts < total_entries * 0.9:
        warnings.append(
            f"Apenas {entries_with_contexts}/{total_entries} entradas têm CONTEXTS"
        )
    
    if entries_with_answer < total_entries * 0.9:
        warnings.append(
            f"Apenas {entries_with_answer}/{total_entries} entradas têm LONG_ANSWER"
        )
    
    is_valid = len(warnings) == 0 or all(
        'apenas' not in w.lower() for w in warnings
    )
    
    return is_valid, warnings


def get_dataset_stats(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Retorna estatísticas sobre o dataset carregado.
    
    Args:
        data: Dicionário com dados médicos carregados.
        
    Returns:
        Dicionário com estatísticas do dataset.
    """
    if not data:
        return {
            'total_entries': 0,
            'entries_with_question': 0,
            'entries_with_contexts': 0,
            'entries_with_answer': 0,
            'avg_contexts_per_entry': 0,
            'avg_answer_length': 0,
        }
    
    total_entries = len(data)
    entries_with_question = 0
    entries_with_contexts = 0
    entries_with_answer = 0
    total_contexts = 0
    total_answer_length = 0
    
    for entry in data.values():
        if isinstance(entry, dict):
            if 'QUESTION' in entry:
                entries_with_question += 1
            
            if 'CONTEXTS' in entry:
                contexts = entry['CONTEXTS']
                if isinstance(contexts, list):
                    entries_with_contexts += 1
                    total_contexts += len(contexts)
            
            if 'LONG_ANSWER' in entry:
                answer = entry['LONG_ANSWER']
                if isinstance(answer, str):
                    entries_with_answer += 1
                    total_answer_length += len(answer)
    
    return {
        'total_entries': total_entries,
        'entries_with_question': entries_with_question,
        'entries_with_contexts': entries_with_contexts,
        'entries_with_answer': entries_with_answer,
        'avg_contexts_per_entry': (
            total_contexts / entries_with_contexts
            if entries_with_contexts > 0 else 0
        ),
        'avg_answer_length': (
            total_answer_length / entries_with_answer
            if entries_with_answer > 0 else 0
        ),
    }

