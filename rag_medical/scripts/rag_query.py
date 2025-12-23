"""
Módulo para queries RAG no Pinecone.

Este módulo fornece funções para buscar contexto relevante no Pinecone
e formatar resultados para uso em geração de respostas com LLM.
"""

from typing import List, Dict, Any, Optional
import numpy as np

from ..config.settings import Settings
from .embeddings_manager import EmbeddingsManager


def query_medical_rag(
    query: str,
    embeddings_manager: Optional[EmbeddingsManager] = None,
    index_name: Optional[str] = None,
    namespace: Optional[str] = None,
    api_key: Optional[str] = None,
    top_k: Optional[int] = None,
    filters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Busca contexto médico relevante no Pinecone usando RAG.
    
    Args:
        query: Pergunta ou texto de busca.
        embeddings_manager: Gerenciador de embeddings. Se None, cria um novo.
        index_name: Nome do índice Pinecone. Se None, usa das configurações.
        namespace: Namespace do Pinecone. Se None, usa das configurações.
        api_key: API key do Pinecone. Se None, usa das configurações.
        top_k: Número de resultados a retornar. Se None, usa das configurações.
        filters: Filtros de metadados (ex: {"year": "2011"}).
        
    Returns:
        Lista de dicionários com resultados:
            {
                "text": str,           # Texto do chunk
                "score": float,        # Score de similaridade
                "metadata": Dict,      # Metadados do chunk
                "article_id": str,      # ID do artigo
            }
    
    Examples:
        >>> results = query_medical_rag("Do mitochondria play a role?")
        >>> print(f"Encontrados {len(results)} resultados")
        Encontrados 5 resultados
    """
    settings = Settings()
    
    # Configurações padrão
    index_name = index_name or settings.PINECONE_INDEX_NAME
    namespace = namespace or settings.PINECONE_NAMESPACE
    api_key = api_key or settings.PINECONE_API_KEY
    top_k = top_k or settings.TOP_K_RESULTS
    
    if not api_key:
        raise ValueError(
            "PINECONE_API_KEY não configurada. "
            "Configure no arquivo .env ou passe como parâmetro."
        )
    
    # Inicializa embeddings manager se necessário
    if embeddings_manager is None:
        embeddings_manager = EmbeddingsManager()
    
    # Inicializa Pinecone
    try:
        from pinecone import Pinecone
        
        pinecone_client = Pinecone(api_key=api_key)
        index = pinecone_client.Index(index_name)
        
    except ImportError:
        raise ImportError(
            "pinecone-client não instalado. "
            "Instale com: pip install pinecone-client"
        )
    except Exception as e:
        raise RuntimeError(f"Erro ao conectar com Pinecone: {e}")
    
    # Gera embedding da query
    query_embedding = embeddings_manager.embed_text(query)
    
    # Prepara filtros para Pinecone
    pinecone_filter = None
    if filters:
        pinecone_filter = _prepare_pinecone_filter(filters)
    
    # Busca no Pinecone
    try:
        if namespace:
            results = index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                namespace=namespace,
                filter=pinecone_filter
            )
        else:
            results = index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=pinecone_filter
            )
    except Exception as e:
        raise RuntimeError(f"Erro ao buscar no Pinecone: {e}")
    
    # Formata resultados
    formatted_results = []
    
    for match in results.get("matches", []):
        metadata = match.get("metadata", {})
        
        formatted_results.append({
            "text": metadata.get("text", ""),
            "score": match.get("score", 0.0),
            "metadata": metadata,
            "article_id": metadata.get("article_id", ""),
            "chunk_index": metadata.get("chunk_index", 0),
        })
    
    return formatted_results


def _prepare_pinecone_filter(filters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepara filtros no formato esperado pelo Pinecone.
    
    Pinecone usa formato específico para filtros:
    {
        "field": {"$eq": value},      # Igual
        "field": {"$ne": value},       # Diferente
        "field": {"$in": [values]},   # Em lista
        "field": {"$gt": value},       # Maior que
        "field": {"$gte": value},     # Maior ou igual
        "field": {"$lt": value},       # Menor que
        "field": {"$lte": value},     # Menor ou igual
    }
    
    Args:
        filters: Dicionário com filtros simples (ex: {"year": "2011"}).
        
    Returns:
        Dicionário com filtros no formato Pinecone.
    """
    pinecone_filter = {}
    
    for key, value in filters.items():
        # Se o valor já está no formato Pinecone, usa diretamente
        if isinstance(value, dict) and any(
            op in value for op in ["$eq", "$ne", "$in", "$gt", "$gte", "$lt", "$lte"]
        ):
            pinecone_filter[key] = value
        else:
            # Converte para formato $eq (igual)
            pinecone_filter[key] = {"$eq": value}
    
    return pinecone_filter


def format_context_for_llm(results: List[Dict[str, Any]]) -> str:
    """
    Formata resultados de busca em contexto para LLM.
    
    Args:
        results: Lista de resultados de query_medical_rag.
        
    Returns:
        String formatada com contexto para prompt do LLM.
    """
    if not results:
        return "Nenhum contexto relevante encontrado."
    
    context_parts = []
    
    for i, result in enumerate(results, 1):
        text = result.get("text", "")
        article_id = result.get("article_id", "")
        score = result.get("score", 0.0)
        
        context_parts.append(
            f"[Contexto {i}] (Artigo: {article_id}, Score: {score:.3f})\n"
            f"{text}\n"
        )
    
    return "\n".join(context_parts)


def get_unique_articles(results: List[Dict[str, Any]]) -> List[str]:
    """
    Extrai IDs únicos de artigos dos resultados.
    
    Args:
        results: Lista de resultados de query_medical_rag.
        
    Returns:
        Lista de IDs de artigos únicos.
    """
    article_ids = set()
    
    for result in results:
        article_id = result.get("article_id", "")
        if article_id:
            article_ids.add(article_id)
    
    return list(article_ids)


def filter_by_score(
    results: List[Dict[str, Any]],
    min_score: float = 0.7
) -> List[Dict[str, Any]]:
    """
    Filtra resultados por score mínimo de similaridade.
    
    Args:
        results: Lista de resultados de query_medical_rag.
        min_score: Score mínimo para incluir resultado (0.0 a 1.0).
        
    Returns:
        Lista filtrada de resultados.
    """
    return [
        result for result in results
        if result.get("score", 0.0) >= min_score
    ]

