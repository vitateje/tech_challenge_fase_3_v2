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

from .data_loader import load_medical_dataset
from .data_processor import process_medical_entry
from .text_splitter import MedicalTextSplitter
from .embeddings_manager import EmbeddingsManager
from .pinecone_ingester import PineconeIngester
from .rag_query import query_medical_rag

__all__ = [
    'load_medical_dataset',
    'process_medical_entry',
    'MedicalTextSplitter',
    'EmbeddingsManager',
    'PineconeIngester',
    'query_medical_rag',
]

