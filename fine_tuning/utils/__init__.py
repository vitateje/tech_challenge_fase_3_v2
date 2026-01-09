"""
Módulo de Utilitários
"""

from .prompts import (
    get_medical_prompt,
    get_instruction_only,
    MEDICAL_CHATML_PROMPT
)

__all__ = [
    'get_medical_prompt',
    'get_instruction_only',
    'MEDICAL_CHATML_PROMPT',
]
