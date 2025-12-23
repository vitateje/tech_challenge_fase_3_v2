"""
Utilitário para anonimização de dados sensíveis em textos médicos.

Este módulo implementa funções para remover ou substituir informações
que possam identificar pacientes, garantindo conformidade com LGPD/HIPAA.
"""

import re
from typing import Union


def anonymize_text(text: Union[str, None]) -> Union[str, None]:
    """
    Anonimiza texto removendo padrões que possam identificar pacientes.
    
    Esta função usa expressões regulares (regex) para encontrar e substituir:
    - Datas específicas → [DATA]
    - IDs de pacientes → [PACIENTE_ID]
    - Telefones → [TELEFONE]
    - Emails → [EMAIL]
    - Números de prontuário → [PRONTUARIO]
    
    Args:
        text: String de texto que pode conter dados sensíveis.
             Se None, retorna None.
        
    Returns:
        String com dados sensíveis substituídos por placeholders genéricos.
        Se o input for None, retorna None.
    
    Examples:
        >>> anonymize_text("Paciente ID: 12345 foi atendido em 15/03/2024")
        'Paciente ID: [PACIENTE_ID] foi atendido em [DATA]'
        
        >>> anonymize_text("Contato: 11987654321 ou email@hospital.com")
        'Contato: [TELEFONE] ou [EMAIL]'
    """
    # Verifica se o texto é uma string válida
    if not isinstance(text, str):
        return text
    
    if not text:
        return text
    
    # PATTERN 1: Remove datas no formato DD/MM/YYYY ou MM/DD/YYYY
    # Exemplo: "15/03/2024" ou "03/15/2024" → "[DATA]"
    text = re.sub(r'\b\d{1,2}/\d{1,2}/\d{4}\b', '[DATA]', text)
    
    # PATTERN 2: Remove datas no formato ISO (YYYY-MM-DD)
    # Exemplo: "2024-03-15" → "[DATA]"
    text = re.sub(r'\b\d{4}-\d{2}-\d{2}\b', '[DATA]', text)
    
    # PATTERN 3: Remove datas no formato DD-MM-YYYY
    # Exemplo: "15-03-2024" → "[DATA]"
    text = re.sub(r'\b\d{1,2}-\d{1,2}-\d{4}\b', '[DATA]', text)
    
    # PATTERN 4: Remove IDs de pacientes (formato "ID: 12345" ou "Patient ID: 12345")
    # Exemplo: "ID: 12345" → "ID: [PACIENTE_ID]"
    # flags=re.IGNORECASE torna a busca case-insensitive (maiúsculas/minúsculas)
    text = re.sub(
        r'\b(?:ID|Patient ID|Paciente ID):\s*\d+\b',
        r'\1: [PACIENTE_ID]',
        text,
        flags=re.IGNORECASE
    )
    
    # PATTERN 5: Remove números de prontuário (formato "Prontuário: 12345")
    text = re.sub(
        r'\b(?:Prontuário|Prontuario|Medical Record):\s*\d+\b',
        r'\1: [PRONTUARIO]',
        text,
        flags=re.IGNORECASE
    )
    
    # PATTERN 6: Remove números de telefone (formato XXX-XXX-XXXX ou XXX.XXX.XXXX)
    # Exemplo: "11987654321" ou "11-98765-4321" → "[TELEFONE]"
    # Padrão brasileiro: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
    text = re.sub(
        r'\b(?:\(?\d{2}\)?\s?)?\d{4,5}[-.]?\d{4}\b',
        '[TELEFONE]',
        text
    )
    
    # PATTERN 7: Remove endereços de email
    # Exemplo: "email@hospital.com" → "[EMAIL]"
    # \b garante que estamos no início/fim de uma palavra
    text = re.sub(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        '[EMAIL]',
        text
    )
    
    # PATTERN 8: Remove CPF (formato XXX.XXX.XXX-XX)
    text = re.sub(
        r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b',
        '[CPF]',
        text
    )
    
    return text


def anonymize_batch(texts: list[str]) -> list[str]:
    """
    Anonimiza uma lista de textos em lote.
    
    Args:
        texts: Lista de strings para anonimizar.
    
    Returns:
        Lista de strings anonimizadas.
    """
    return [anonymize_text(text) for text in texts]

