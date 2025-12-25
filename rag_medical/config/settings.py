"""
Configurações centralizadas para o pipeline RAG.

Este módulo carrega e valida todas as variáveis de ambiente necessárias
para o funcionamento do pipeline de ingestão e RAG.
"""

import os
from typing import Optional

# Tenta carregar variáveis de ambiente do arquivo .env (opcional)
# O arquivo .env deve estar no diretório raiz do projeto (rag_medical/)
try:
    from dotenv import load_dotenv
    # Define o diretório raiz do projeto (onde está config/)
    _project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Tenta carregar .env do diretório raiz do projeto
    env_path = os.path.join(_project_root, '.env')
    load_dotenv(dotenv_path=env_path)
except ImportError:
    # Se python-dotenv não estiver instalado, continua sem carregar .env
    # As variáveis de ambiente do sistema ainda funcionarão
    pass


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
    # Modelo de embedding: use 'text-embedding-004' (sem prefixo models/)
    # A biblioteca langchain_google_genai prefere o nome sem prefixo
    # O código tentará ambos os formatos automaticamente se necessário
    EMBEDDING_MODEL: str = os.getenv('EMBEDDING_MODEL', 'text-embedding-004')
    
    # Configuração Ollama (opcional)
    OLLAMA_BASE_URL: str = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    
    # ========================================================================
    # CONFIGURAÇÕES DE DADOS
    # ========================================================================
    # Tenta encontrar o arquivo de dados
    _project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    _data_path = os.getenv('MEDICAL_DATA_PATH', '')
    
    # Se não houver env ou o arquivo do env não existir, tenta caminhos padrão
    if not _data_path or not os.path.exists(_data_path):
        _possible_paths = [
            os.path.join(_project_root, 'ori_pqal.json'),  # Raiz do projeto (Prioridade 1)
            '/Users/vitorteixeira/Developer/projects/tech_challenge_fase_3_v2/rag_medical/ori_pqal.json',  # Caminho absoluto explícito (Prioridade 2)
            os.path.abspath('ori_pqal.json'),              # CWD (Prioridade 3)
        ]
        
        for path in _possible_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                _data_path = abs_path
                break
        
        # Fallback final: usa o caminho padrão no diretório raiz do projeto
        if not _data_path or not os.path.exists(_data_path):
            _data_path = os.path.join(_project_root, 'ori_pqal.json')
    
    # Garante que o caminho seja absoluto e normalizado
    if _data_path:
        _data_path = os.path.abspath(os.path.normpath(_data_path))
    else:
        _data_path = os.path.join(_project_root, 'ori_pqal.json')
    
    MEDICAL_DATA_PATH: str = _data_path
    
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
    def validate(cls, strict: bool = False) -> tuple[bool, list[str]]:
        """
        Valida se todas as configurações obrigatórias estão presentes.
        
        Args:
            strict: Se True, valida todas as configurações (incluindo Pinecone e Embeddings).
                   Se False, valida apenas o arquivo de dados (útil para exploração).
        
        Returns:
            Tuple com (is_valid, lista_de_erros)
        """
        errors = []
        
        # Valida caminho dos dados (sempre obrigatório)
        if not os.path.exists(cls.MEDICAL_DATA_PATH):
            errors.append(
                f'Arquivo de dados não encontrado: {cls.MEDICAL_DATA_PATH}'
            )
        
        # Validações adicionais apenas se strict=True
        if strict:
            # Valida Pinecone
            if not cls.PINECONE_API_KEY:
                errors.append('PINECONE_API_KEY não configurada')
            
            # Valida Embeddings (pelo menos um provider deve estar configurado)
            if not cls.GEMINI_API_KEY and not cls.OLLAMA_BASE_URL:
                errors.append(
                    'Nenhum provider de embeddings configurado. '
                    'Configure GEMINI_API_KEY ou OLLAMA_BASE_URL'
                )
        
        return len(errors) == 0, errors
    
    @classmethod
    def get_embedding_provider(cls) -> Optional[str]:
        """
        Retorna o provider de embeddings a ser usado (prioridade: Gemini > Ollama).
        
        Returns:
            'gemini', 'ollama' ou None se nenhum estiver configurado
        """
        if cls.GEMINI_API_KEY:
            return 'gemini'
        elif cls.OLLAMA_BASE_URL:
            return 'ollama'
        else:
            return None
    
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
        provider = cls.get_embedding_provider()
        print(f"Embedding Provider: {provider or '(não configurado)'}")
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

