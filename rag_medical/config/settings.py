"""
Configurações centralizadas para o pipeline RAG.

Este módulo carrega e valida todas as variáveis de ambiente necessárias
para o funcionamento do pipeline de ingestão e RAG.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()


class Settings:
    """
    Classe para gerenciar todas as configurações do pipeline RAG.
    
    Valida variáveis obrigatórias e fornece valores padrão para opcionais.
    """
    
    # ========================================================================
    # CONFIGURAÇÕES DO PINECONE
    # ========================================================================
    PINECONE_API_KEY: str = os.getenv('PINECONE_API_KEY', '')
    PINECONE_INDEX_NAME: str = os.getenv('PINECONE_INDEX_NAME', 'biobyia')
    PINECONE_NAMESPACE: Optional[str] = os.getenv('PINECONE_NAMESPACE') or None
    
    # ========================================================================
    # CONFIGURAÇÕES DE EMBEDDINGS
    # ========================================================================
    GEMINI_API_KEY: str = os.getenv('GEMINI_API_KEY', '')
    EMBEDDING_MODEL: str = os.getenv('EMBEDDING_MODEL', 'text-embedding-004')
    
    # Configuração Ollama (opcional)
    OLLAMA_BASE_URL: str = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    
    # ========================================================================
    # CONFIGURAÇÕES DE DADOS
    # ========================================================================
    MEDICAL_DATA_PATH: str = os.getenv(
        'MEDICAL_DATA_PATH',
        '../context/pubmedqa-master/data/ori_pqal.json'
    )
    
    # ========================================================================
    # CONFIGURAÇÕES DE CHUNKING
    # ========================================================================
    CHUNK_SIZE: int = int(os.getenv('CHUNK_SIZE', '512'))
    CHUNK_OVERLAP: int = int(os.getenv('CHUNK_OVERLAP', '50'))
    
    # ========================================================================
    # CONFIGURAÇÕES OPCIONAIS
    # ========================================================================
    BATCH_SIZE: int = int(os.getenv('BATCH_SIZE', '100'))
    TOP_K_RESULTS: int = int(os.getenv('TOP_K_RESULTS', '5'))
    
    @classmethod
    def validate(cls) -> tuple[bool, list[str]]:
        """
        Valida se todas as configurações obrigatórias estão presentes.
        
        Returns:
            Tuple com (is_valid, lista_de_erros)
        """
        errors = []
        
        # Valida Pinecone
        if not cls.PINECONE_API_KEY:
            errors.append('PINECONE_API_KEY não configurada')
        
        # Valida Embeddings (pelo menos um provider deve estar configurado)
        if not cls.GEMINI_API_KEY and not cls.OLLAMA_BASE_URL:
            errors.append(
                'Nenhum provider de embeddings configurado. '
                'Configure GEMINI_API_KEY ou OLLAMA_BASE_URL'
            )
        
        # Valida caminho dos dados
        if not os.path.exists(cls.MEDICAL_DATA_PATH):
            errors.append(
                f'Arquivo de dados não encontrado: {cls.MEDICAL_DATA_PATH}'
            )
        
        return len(errors) == 0, errors
    
    @classmethod
    def get_embedding_provider(cls) -> str:
        """
        Retorna o provider de embeddings a ser usado (prioridade: Gemini > Ollama).
        
        Returns:
            'gemini' ou 'ollama'
        """
        if cls.GEMINI_API_KEY:
            return 'gemini'
        elif cls.OLLAMA_BASE_URL:
            return 'ollama'
        else:
            raise ValueError('Nenhum provider de embeddings configurado')
    
    @classmethod
    def print_config(cls):
        """
        Imprime a configuração atual (sem expor chaves secretas).
        """
        print("=" * 80)
        print("⚙️  CONFIGURAÇÃO DO PIPELINE RAG")
        print("=" * 80)
        print(f"Pinecone Index: {cls.PINECONE_INDEX_NAME}")
        print(f"Pinecone Namespace: {cls.PINECONE_NAMESPACE or '(padrão)'}")
        print(f"Embedding Provider: {cls.get_embedding_provider()}")
        print(f"Embedding Model: {cls.EMBEDDING_MODEL}")
        print(f"Data Path: {cls.MEDICAL_DATA_PATH}")
        print(f"Chunk Size: {cls.CHUNK_SIZE}")
        print(f"Chunk Overlap: {cls.CHUNK_OVERLAP}")
        print(f"Batch Size: {cls.BATCH_SIZE}")
        print(f"Top K Results: {cls.TOP_K_RESULTS}")
        print("=" * 80)


# Instância global de configurações
_settings_instance: Optional[Settings] = None


def get_settings() -> Settings:
    """
    Retorna a instância global de configurações (singleton).
    
    Returns:
        Instância de Settings
    """
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance

