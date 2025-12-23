"""
Módulo para divisão de textos médicos em chunks otimizados.

Este módulo implementa estratégias inteligentes de chunking que preservam
o contexto médico e respeitam limites de tokens para embeddings.
"""

from typing import List, Dict, Any, Optional
import re


class MedicalTextSplitter:
    """
    Divisor de texto especializado para dados médicos.
    
    Divide textos longos em chunks menores preservando:
    - Contexto médico (sentenças completas)
    - Estrutura de perguntas e respostas
    - Metadados associados
    """
    
    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        separator: str = " "
    ):
        """
        Inicializa o divisor de texto.
        
        Args:
            chunk_size: Tamanho máximo do chunk em caracteres (aproximado).
            chunk_overlap: Sobreposição entre chunks em caracteres.
            separator: Separador usado para dividir texto (padrão: espaço).
        """
        if chunk_size <= chunk_overlap:
            raise ValueError(
                f"chunk_size ({chunk_size}) deve ser maior que "
                f"chunk_overlap ({chunk_overlap})"
            )
        
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separator = separator
    
    def split_text(self, text: str) -> List[str]:
        """
        Divide um texto em chunks menores.
        
        Estratégia:
        1. Tenta dividir por sentenças primeiro (preserva contexto)
        2. Se necessário, divide por palavras
        3. Garante overlap entre chunks
        
        Args:
            text: Texto a ser dividido.
            
        Returns:
            Lista de chunks de texto.
        """
        if not text or len(text) <= self.chunk_size:
            return [text] if text else []
        
        chunks = []
        
        # Primeiro, tenta dividir por sentenças (preserva melhor o contexto)
        sentences = self._split_by_sentences(text)
        
        current_chunk = ""
        
        for sentence in sentences:
            # Se adicionar esta sentença exceder o tamanho, salva o chunk atual
            potential_chunk = (
                current_chunk + self.separator + sentence
                if current_chunk
                else sentence
            )
            
            if len(potential_chunk) > self.chunk_size and current_chunk:
                # Salva chunk atual
                chunks.append(current_chunk.strip())
                
                # Inicia novo chunk com overlap
                # Pega as últimas palavras do chunk anterior para overlap
                overlap_text = self._get_overlap_text(current_chunk)
                current_chunk = overlap_text + self.separator + sentence
            else:
                current_chunk = potential_chunk
        
        # Adiciona o último chunk se não estiver vazio
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _split_by_sentences(self, text: str) -> List[str]:
        """
        Divide texto em sentenças usando regex.
        
        Args:
            text: Texto a ser dividido.
            
        Returns:
            Lista de sentenças.
        """
        # Padrão para dividir por pontuação de fim de sentença
        # Considera: . ! ? seguidos de espaço ou fim de linha
        sentence_pattern = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_pattern, text)
        
        # Remove sentenças vazias e limpa espaços
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return sentences
    
    def _get_overlap_text(self, text: str) -> str:
        """
        Extrai texto de overlap do final de um chunk.
        
        Args:
            text: Texto do chunk anterior.
            
        Returns:
            Texto de overlap (últimas palavras até chunk_overlap caracteres).
        """
        if len(text) <= self.chunk_overlap:
            return text
        
        # Pega os últimos chunk_overlap caracteres
        overlap = text[-self.chunk_overlap:]
        
        # Tenta começar do início de uma palavra
        # Procura o primeiro espaço após o início do overlap
        first_space = overlap.find(self.separator)
        if first_space > 0:
            overlap = overlap[first_space + 1:]
        
        return overlap
    
    def split_entry(
        self,
        entry: Dict[str, Any],
        preserve_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Divide uma entrada processada em múltiplos chunks.
        
        Args:
            entry: Entrada processada com campos "text", "article_id", "metadata".
            preserve_metadata: Se True, preserva metadados em cada chunk.
            
        Returns:
            Lista de chunks, cada um com:
                - "text": Texto do chunk
                - "article_id": ID do artigo
                - "chunk_index": Índice do chunk no artigo
                - "metadata": Metadados originais + chunk_index
        """
        text = entry.get("text", "")
        article_id = entry.get("article_id", "")
        metadata = entry.get("metadata", {}).copy()
        
        # Divide o texto em chunks
        text_chunks = self.split_text(text)
        
        # Cria lista de chunks com metadados
        chunks = []
        
        for idx, chunk_text in enumerate(text_chunks):
            chunk_metadata = metadata.copy() if preserve_metadata else {}
            chunk_metadata["chunk_index"] = idx
            
            chunks.append({
                "text": chunk_text,
                "article_id": article_id,
                "chunk_index": idx,
                "metadata": chunk_metadata,
            })
        
        return chunks
    
    def split_batch(
        self,
        entries: List[Dict[str, Any]],
        preserve_metadata: bool = True,
        show_progress: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Divide múltiplas entradas em chunks.
        
        Args:
            entries: Lista de entradas processadas.
            preserve_metadata: Se True, preserva metadados em cada chunk.
            show_progress: Se True, exibe barra de progresso.
            
        Returns:
            Lista de todos os chunks de todas as entradas.
        """
        all_chunks = []
        
        # Usa tqdm para barra de progresso se disponível
        try:
            from tqdm import tqdm
            iterator = tqdm(entries, desc="Dividindo em chunks") if show_progress else entries
        except ImportError:
            iterator = entries
        
        for entry in iterator:
            try:
                chunks = self.split_entry(entry, preserve_metadata=preserve_metadata)
                all_chunks.extend(chunks)
            except Exception as e:
                print(f"⚠️  Erro ao dividir entrada {entry.get('article_id', 'unknown')}: {e}")
                continue
        
        return all_chunks


def create_text_splitter(
    chunk_size: int = 512,
    chunk_overlap: int = 50
) -> MedicalTextSplitter:
    """
    Função auxiliar para criar um divisor de texto com configurações padrão.
    
    Args:
        chunk_size: Tamanho máximo do chunk em caracteres.
        chunk_overlap: Sobreposição entre chunks em caracteres.
        
    Returns:
        Instância de MedicalTextSplitter configurada.
    """
    return MedicalTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

