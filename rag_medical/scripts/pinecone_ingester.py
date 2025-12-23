"""
Módulo para ingestão de dados no Pinecone.

Este módulo gerencia a conexão com Pinecone e a ingestão de documentos
com embeddings e metadados estruturados.
"""

from typing import List, Dict, Any, Optional
import time
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config.settings import Settings
from .embeddings_manager import EmbeddingsManager


class PineconeIngester:
    """
    Classe para ingestão de documentos no Pinecone.
    
    Gerencia:
    - Conexão com índice Pinecone
    - Geração de embeddings
    - Ingestão em lotes com retry logic
    - Metadados estruturados
    """
    
    def __init__(
        self,
        embeddings_manager: Optional[EmbeddingsManager] = None,
        index_name: Optional[str] = None,
        namespace: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        """
        Inicializa o ingester do Pinecone.
        
        Args:
            embeddings_manager: Gerenciador de embeddings. Se None, cria um novo.
            index_name: Nome do índice Pinecone. Se None, usa das configurações.
            namespace: Namespace do Pinecone. Se None, usa das configurações.
            api_key: API key do Pinecone. Se None, usa das configurações.
        """
        self.settings = Settings()
        
        # Configurações do Pinecone
        self.index_name = index_name or self.settings.PINECONE_INDEX_NAME
        self.namespace = namespace or self.settings.PINECONE_NAMESPACE
        self.api_key = api_key or self.settings.PINECONE_API_KEY
        
        if not self.api_key:
            raise ValueError(
                "PINECONE_API_KEY não configurada. "
                "Configure no arquivo .env ou passe como parâmetro."
            )
        
        # Inicializa embeddings manager
        if embeddings_manager is None:
            self.embeddings_manager = EmbeddingsManager()
        else:
            self.embeddings_manager = embeddings_manager
        
        # Inicializa cliente Pinecone
        self._init_pinecone()
        
        # Valida compatibilidade de dimensões
        self._validate_dimensions()
    
    def _init_pinecone(self):
        """Inicializa cliente Pinecone."""
        try:
            from pinecone import Pinecone
            
            self.pinecone_client = Pinecone(api_key=self.api_key)
            self.index = self.pinecone_client.Index(self.index_name)
            
            print(f"✅ Pinecone inicializado: índice '{self.index_name}'")
            if self.namespace:
                print(f"   Namespace: {self.namespace}")
            
        except ImportError:
            raise ImportError(
                "pinecone-client não instalado. "
                "Instale com: pip install pinecone-client"
            )
        except Exception as e:
            raise RuntimeError(f"Erro ao inicializar Pinecone: {e}")
    
    def _validate_dimensions(self):
        """Valida compatibilidade de dimensões entre embeddings e índice."""
        try:
            # Obtém estatísticas do índice
            stats = self.index.describe_index_stats()
            
            # A dimensão do índice está no stats (se disponível)
            # Para índices existentes, assumimos que está correta
            # e apenas validamos se o embedding manager consegue gerar embeddings
            
            embedding_dim = self.embeddings_manager.get_embedding_dimension()
            print(f"   Dimensão dos embeddings: {embedding_dim}")
            
        except Exception as e:
            print(f"⚠️  Aviso: Não foi possível validar dimensões: {e}")
    
    def _create_vector_id(self, article_id: str, chunk_index: int) -> str:
        """
        Cria ID único para um vetor no Pinecone.
        
        Args:
            article_id: ID do artigo.
            chunk_index: Índice do chunk.
            
        Returns:
            ID único no formato: article_{article_id}_chunk_{chunk_index}
        """
        return f"article_{article_id}_chunk_{chunk_index}"
    
    def _prepare_vectors(
        self,
        chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Prepara vetores para ingestão no Pinecone.
        
        Args:
            chunks: Lista de chunks com campos "text", "article_id", "metadata".
            
        Returns:
            Lista de dicionários no formato Pinecone:
                {
                    "id": str,
                    "values": List[float],
                    "metadata": Dict[str, Any]
                }
        """
        # Extrai textos dos chunks
        texts = [chunk["text"] for chunk in chunks]
        
        # Gera embeddings em lote
        print(f"   Gerando embeddings para {len(texts)} chunks...")
        embeddings = self.embeddings_manager.embed_documents(texts)
        
        # Prepara vetores
        vectors = []
        
        for chunk, embedding in zip(chunks, embeddings):
            vector_id = self._create_vector_id(
                chunk["article_id"],
                chunk["chunk_index"]
            )
            
            # Prepara metadados (Pinecone requer valores primitivos)
            metadata = self._prepare_metadata(chunk.get("metadata", {}))
            
            # Adiciona texto aos metadados para recuperação
            metadata["text"] = chunk["text"]
            
            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": metadata,
            })
        
        return vectors
    
    def _prepare_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepara metadados para formato compatível com Pinecone.
        
        Pinecone aceita apenas tipos primitivos (str, int, float, bool, list).
        
        Args:
            metadata: Metadados originais.
            
        Returns:
            Metadados formatados.
        """
        prepared = {}
        
        for key, value in metadata.items():
            # Converte tipos não primitivos para string
            if isinstance(value, (str, int, float, bool)):
                prepared[key] = value
            elif isinstance(value, list):
                # Listas são permitidas se contiverem apenas primitivos
                prepared[key] = [
                    str(v) if not isinstance(v, (str, int, float, bool)) else v
                    for v in value
                ]
            else:
                prepared[key] = str(value)
        
        return prepared
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def _upsert_batch(self, vectors: List[Dict[str, Any]]):
        """
        Insere/atualiza um lote de vetores no Pinecone (com retry).
        
        Args:
            vectors: Lista de vetores para inserir.
        """
        try:
            if self.namespace:
                self.index.upsert(vectors=vectors, namespace=self.namespace)
            else:
                self.index.upsert(vectors=vectors)
        except Exception as e:
            print(f"⚠️  Erro ao inserir lote: {e}")
            raise
    
    def ingest_chunks(
        self,
        chunks: List[Dict[str, Any]],
        batch_size: Optional[int] = None,
        show_progress: bool = True
    ) -> Dict[str, Any]:
        """
        Ingere chunks no Pinecone em lotes.
        
        Args:
            chunks: Lista de chunks para ingerir.
            batch_size: Tamanho do lote. Se None, usa das configurações.
            show_progress: Se True, exibe barra de progresso.
            
        Returns:
            Dicionário com estatísticas da ingestão:
                - total_chunks: Total de chunks processados
                - total_vectors: Total de vetores inseridos
                - batches: Número de lotes
                - errors: Lista de erros (se houver)
        """
        if not chunks:
            return {
                "total_chunks": 0,
                "total_vectors": 0,
                "batches": 0,
                "errors": [],
            }
        
        batch_size = batch_size or self.settings.BATCH_SIZE
        total_chunks = len(chunks)
        total_vectors = 0
        errors = []
        
        print(f"\n🚀 Iniciando ingestão de {total_chunks} chunks no Pinecone...")
        print(f"   Batch size: {batch_size}")
        print(f"   Índice: {self.index_name}")
        if self.namespace:
            print(f"   Namespace: {self.namespace}")
        
        # Processa em lotes
        try:
            from tqdm import tqdm
            iterator = range(0, total_chunks, batch_size)
            if show_progress:
                iterator = tqdm(iterator, desc="Ingerindo chunks")
        except ImportError:
            iterator = range(0, total_chunks, batch_size)
        
        for i in iterator:
            batch_chunks = chunks[i:i + batch_size]
            
            try:
                # Prepara vetores do lote
                vectors = self._prepare_vectors(batch_chunks)
                
                # Insere no Pinecone
                self._upsert_batch(vectors)
                
                total_vectors += len(vectors)
                
                # Pequena pausa para evitar rate limiting
                if i + batch_size < total_chunks:
                    time.sleep(0.1)
                    
            except Exception as e:
                error_msg = f"Erro no lote {i//batch_size + 1}: {e}"
                errors.append(error_msg)
                print(f"⚠️  {error_msg}")
                continue
        
        print(f"\n✅ Ingestão concluída!")
        print(f"   Vetores inseridos: {total_vectors}/{total_chunks}")
        if errors:
            print(f"   Erros: {len(errors)}")
        
        return {
            "total_chunks": total_chunks,
            "total_vectors": total_vectors,
            "batches": (total_chunks + batch_size - 1) // batch_size,
            "errors": errors,
        }
    
    def delete_all(self, namespace: Optional[str] = None):
        """
        Deleta todos os vetores do namespace (use com cuidado!).
        
        Args:
            namespace: Namespace a limpar. Se None, usa o namespace configurado.
        """
        namespace = namespace or self.namespace
        
        print(f"⚠️  ATENÇÃO: Deletando todos os vetores do namespace '{namespace}'...")
        response = input("Tem certeza? Digite 'SIM' para confirmar: ")
        
        if response != "SIM":
            print("Operação cancelada.")
            return
        
        try:
            if namespace:
                self.index.delete(delete_all=True, namespace=namespace)
            else:
                self.index.delete(delete_all=True)
            
            print("✅ Todos os vetores foram deletados.")
        except Exception as e:
            print(f"❌ Erro ao deletar vetores: {e}")

