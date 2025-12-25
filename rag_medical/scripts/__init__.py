"""
Scripts modulares para pipeline RAG de dados médicos.

Este pacote contém módulos reutilizáveis para:
- Carregamento de dados médicos
- Processamento e limpeza de texto
- Divisão de textos em chunks
- Gerenciamento de embeddings
- Ingestão no Pinecone
- Queries RAG
"""

# Imports básicos (sempre disponíveis)
from .data_loader import load_medical_dataset
from .data_processor import process_medical_entry

# Imports opcionais (podem falhar se dependências não estiverem instaladas)
try:
    from .text_splitter import MedicalTextSplitter
except ImportError:
    MedicalTextSplitter = None

try:
    from .embeddings_manager import EmbeddingsManager
except ImportError:
    EmbeddingsManager = None

try:
    from .pinecone_ingester import PineconeIngester
except ImportError:
    PineconeIngester = None

try:
    from .rag_query import query_medical_rag
except ImportError:
    query_medical_rag = None

__all__ = [
    'load_medical_dataset',
    'process_medical_entry',
    'MedicalTextSplitter',
    'EmbeddingsManager',
    'PineconeIngester',
    'query_medical_rag',
]

