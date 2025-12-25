"""
Módulo para processamento de dados médicos.

Este módulo processa entradas do dataset PubMedQA, combinando contextos,
formatando metadados e preparando dados para embedding e ingestão.
"""

from typing import Dict, Any, List, Optional
from utils.anonymizer import anonymize_text


def process_medical_entry(
    article_id: str,
    entry: Dict[str, Any],
    anonymize: bool = True
) -> Dict[str, Any]:
    """
    Processa uma entrada do dataset médico para formato adequado ao RAG.
    
    Esta função:
    1. Extrai QUESTION, CONTEXTS, LONG_ANSWER e MESHES do conteúdo
    2. Une múltiplos contextos em um único bloco de texto
    3. Aplica anonimização em contextos e respostas (se habilitado)
    4. Formata metadados estruturados
    
    Args:
        article_id: ID único do artigo PubMed (chave do dicionário original).
        entry: Dicionário com QUESTION, CONTEXTS, LONG_ANSWER, MESHES, etc.
        anonymize: Se True, aplica anonimização nos textos.
        
    Returns:
        Dicionário com:
            - "article_id": ID do artigo
            - "text": Texto combinado (contextos + pergunta + resposta)
            - "question": Pergunta médica original
            - "answer": Resposta longa
            - "metadata": Metadados estruturados para Pinecone
    
    Examples:
        >>> entry = {
        ...     "QUESTION": "Do mitochondria play a role?",
        ...     "CONTEXTS": ["Context 1", "Context 2"],
        ...     "LONG_ANSWER": "Yes, mitochondria...",
        ...     "MESHES": ["Mitochondria", "Apoptosis"],
        ...     "YEAR": "2011"
        ... }
        >>> processed = process_medical_entry("21645374", entry)
        >>> print(processed["article_id"])
        21645374
    """
    # Extrai campos principais
    question = entry.get("QUESTION", "").strip()
    contexts = entry.get("CONTEXTS", [])
    long_answer = entry.get("LONG_ANSWER", "").strip()
    meshes = entry.get("MESHES", [])
    year = entry.get("YEAR", "")
    labels = entry.get("LABELS", [])
    
    # Valida que temos pelo menos uma pergunta ou contexto
    if not question and not contexts:
        raise ValueError(
            f"Entrada {article_id} não tem QUESTION nem CONTEXTS"
        )
    
    # Processa contextos
    # Se contexts é uma lista, junta todos em um único texto
    if isinstance(contexts, list):
        context_text = " ".join(
            str(ctx).strip() for ctx in contexts if ctx
        )
    elif isinstance(contexts, str):
        context_text = contexts.strip()
    else:
        context_text = ""
    
    # Aplica anonimização se habilitado
    if anonymize:
        question = anonymize_text(question) or ""
        context_text = anonymize_text(context_text) or ""
        long_answer = anonymize_text(long_answer) or ""
    
    # Formata termos MESH como string separada por vírgulas
    if isinstance(meshes, list):
        meshes_str = ", ".join(str(m) for m in meshes if m)
    elif isinstance(meshes, str):
        meshes_str = meshes
    else:
        meshes_str = ""
    
    # Formata labels
    if isinstance(labels, list):
        labels_str = ", ".join(str(l) for l in labels if l)
    elif isinstance(labels, str):
        labels_str = labels
    else:
        labels_str = ""
    
    # Constrói texto completo combinando todos os elementos
    # Este texto será usado para embedding e busca
    text_parts = []
    
    if context_text:
        text_parts.append(f"Context: {context_text}")
    
    if question:
        text_parts.append(f"Question: {question}")
    
    if long_answer:
        text_parts.append(f"Answer: {long_answer}")
    
    if meshes_str:
        text_parts.append(f"Medical Terms: {meshes_str}")
    
    combined_text = " ".join(text_parts)
    
    # Prepara metadados estruturados para Pinecone
    metadata = {
        "article_id": str(article_id),
        "question": question,
        "source": "pubmedqa",
        "type": "medical_qa",
    }
    
    # Adiciona campos opcionais apenas se existirem
    if year:
        metadata["year"] = str(year)
    
    if meshes_str:
        metadata["meshes"] = meshes_str
    
    if labels_str:
        metadata["labels"] = labels_str
    
    # Adiciona flags de decisão se existirem
    if "final_decision" in entry:
        metadata["final_decision"] = str(entry["final_decision"])
    
    if "reasoning_required_pred" in entry:
        metadata["reasoning_required"] = str(entry["reasoning_required_pred"])
    
    return {
        "article_id": article_id,
        "text": combined_text,
        "question": question,
        "answer": long_answer,
        "context": context_text,
        "metadata": metadata,
    }


def process_batch(
    data: Dict[str, Any],
    anonymize: bool = True,
    show_progress: bool = True
) -> List[Dict[str, Any]]:
    """
    Processa múltiplas entradas do dataset em lote.
    
    Args:
        data: Dicionário com todas as entradas do dataset.
        anonymize: Se True, aplica anonimização nos textos.
        show_progress: Se True, exibe barra de progresso.
        
    Returns:
        Lista de dicionários processados.
    """
    processed_entries = []
    
    # Usa tqdm para barra de progresso se disponível
    try:
        from tqdm import tqdm
        iterator = tqdm(data.items(), desc="Processando dados") if show_progress else data.items()
    except ImportError:
        iterator = data.items()
    
    for article_id, entry in iterator:
        try:
            processed = process_medical_entry(
                article_id,
                entry,
                anonymize=anonymize
            )
            processed_entries.append(processed)
        except Exception as e:
            print(f"⚠️  Erro ao processar entrada {article_id}: {e}")
            continue
    
    return processed_entries


def filter_valid_entries(
    processed_entries: List[Dict[str, Any]],
    min_text_length: int = 50
) -> List[Dict[str, Any]]:
    """
    Filtra entradas processadas removendo as inválidas ou muito curtas.
    
    Args:
        processed_entries: Lista de entradas processadas.
        min_text_length: Tamanho mínimo do texto para considerar válido.
        
    Returns:
        Lista filtrada de entradas válidas.
    """
    valid_entries = []
    
    for entry in processed_entries:
        text = entry.get("text", "")
        
        # Verifica se o texto tem tamanho mínimo
        if len(text) >= min_text_length:
            valid_entries.append(entry)
    
    return valid_entries

