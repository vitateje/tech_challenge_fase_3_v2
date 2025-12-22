"""
Módulo de Treinamento
"""

from .model_config import (
    get_model_config,
    get_lora_config,
    get_training_config,
    get_dataset_config,
    get_inference_config
)

__all__ = [
    'get_model_config',
    'get_lora_config',
    'get_training_config',
    'get_dataset_config',
    'get_inference_config',
]

