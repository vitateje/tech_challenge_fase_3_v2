"""
Módulo para ingestão de dados no Pinecone.

Este módulo gerencia a conexão com Pinecone e a ingestão de documentos
com embeddings e metadados estruturados.
"""

from typing import List, Dict, Any, Optional
import time
import json
import os
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential

from config.settings import Settings
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
        
        # Diretório para checkpoints (usa o diretório raiz do projeto)
        # Tenta usar MEDICAL_DATA_PATH se disponível, senão usa o diretório do módulo
        if hasattr(self.settings, 'MEDICAL_DATA_PATH') and self.settings.MEDICAL_DATA_PATH:
            checkpoint_base = Path(self.settings.MEDICAL_DATA_PATH).parent
        else:
            # Fallback: usa o diretório raiz do projeto (onde está config/)
            checkpoint_base = Path(__file__).parent.parent
        
        self.checkpoint_dir = checkpoint_base / "checkpoints"
        self.checkpoint_dir.mkdir(exist_ok=True)
    
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
                "pinecone não instalado. "
                "Instale com: pip install pinecone"
            )
        except Exception as e:
            raise RuntimeError(f"Erro ao inicializar Pinecone: {e}")
    
    def _validate_dimensions(self):
        """Valida compatibilidade de dimensões entre embeddings e índice."""
        try:
            # Obtém estatísticas do índice
            stats = self.index.describe_index_stats()
            
            # Obtém dimensão dos embeddings
            embedding_dim = self.embeddings_manager.get_embedding_dimension()
            
            # Tenta obter a dimensão do índice
            # A dimensão pode estar em diferentes lugares dependendo da versão da API
            index_dimension = None
            
            # Tenta obter do stats (formato mais recente)
            if hasattr(stats, 'dimension'):
                index_dimension = stats.dimension
            elif isinstance(stats, dict) and 'dimension' in stats:
                index_dimension = stats['dimension']
            # Tenta obter do index_info (formato alternativo)
            elif hasattr(self.index, 'describe_index'):
                try:
                    index_info = self.index.describe_index()
                    if hasattr(index_info, 'dimension'):
                        index_dimension = index_info.dimension
                    elif isinstance(index_info, dict) and 'dimension' in index_info:
                        index_dimension = index_info['dimension']
                except:
                    pass
            
            print(f"   Dimensão dos embeddings: {embedding_dim}")
            
            # Se conseguiu obter a dimensão do índice, valida compatibilidade
            if index_dimension is not None:
                print(f"   Dimensão do índice Pinecone: {index_dimension}")
                
                if embedding_dim != index_dimension:
                    print("\n" + "=" * 80)
                    print("⚠️  INCOMPATIBILIDADE DE DIMENSÕES DETECTADA!")
                    print("=" * 80)
                    print(f"   Dimensão dos embeddings: {embedding_dim}")
                    print(f"   Dimensão do índice Pinecone: {index_dimension}")
                    print("\n💡 SOLUÇÕES:")
                    print("   1. Use um modelo de embedding compatível:")
                    if index_dimension == 1024:
                        print("      - Configure Ollama com modelo de 1024 dimensões")
                        print("      - Ou recrie o índice Pinecone com 768 dimensões")
                    elif index_dimension == 768:
                        print("      - O modelo atual (Gemini text-embedding-004) está correto")
                    print("\n   2. Se o índice foi criado com 'llama-text-embed-v2' (1024 dims):")
                    print("      - Use Ollama com modelo compatível (ex: mxbai-embed-large)")
                    print("      - Ou recrie o índice com 768 dimensões para usar Gemini")
                    print("=" * 80)
                    print("\n⚠️  Continuando, mas resultados podem ser subótimos.")
                    print("   Recomenda-se usar embeddings com a mesma dimensão do índice.\n")
                else:
                    print("   ✅ Dimensões compatíveis!")
            else:
                print("   ⚠️  Não foi possível obter a dimensão do índice automaticamente")
                print("   Verifique manualmente se as dimensões são compatíveis")
            
        except Exception as e:
            print(f"⚠️  Aviso: Não foi possível validar dimensões: {e}")
            print(f"   Dimensão dos embeddings: {self.embeddings_manager.get_embedding_dimension()}")
    
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
    
    def _get_checkpoint_path(self) -> Path:
        """Retorna o caminho do arquivo de checkpoint."""
        checkpoint_name = f"ingestion_checkpoint_{self.index_name}_{self.namespace or 'default'}.json"
        return self.checkpoint_dir / checkpoint_name
    
    def _save_checkpoint(self, processed_indices: List[int], total_chunks: int):
        """Salva checkpoint do progresso."""
        checkpoint_data = {
            "processed_indices": processed_indices,
            "total_chunks": total_chunks,
            "index_name": self.index_name,
            "namespace": self.namespace,
            "timestamp": time.time()
        }
        checkpoint_path = self._get_checkpoint_path()
        with open(checkpoint_path, 'w') as f:
            json.dump(checkpoint_data, f, indent=2)
    
    def _load_checkpoint(self) -> Optional[Dict[str, Any]]:
        """Carrega checkpoint do progresso."""
        checkpoint_path = self._get_checkpoint_path()
        if checkpoint_path.exists():
            try:
                with open(checkpoint_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Erro ao carregar checkpoint: {e}")
        return None
    
    def _clear_checkpoint(self):
        """Remove checkpoint."""
        checkpoint_path = self._get_checkpoint_path()
        if checkpoint_path.exists():
            checkpoint_path.unlink()
    
    def ingest_chunks(
        self,
        chunks: List[Dict[str, Any]],
        batch_size: Optional[int] = None,
        show_progress: bool = True,
        resume_from_checkpoint: bool = True,
        checkpoint_interval: int = 10
    ) -> Dict[str, Any]:
        """
        Ingere chunks no Pinecone em lotes com suporte a checkpointing.
        
        Args:
            chunks: Lista de chunks para ingerir.
            batch_size: Tamanho do lote. Se None, usa das configurações.
            show_progress: Se True, exibe barra de progresso.
            resume_from_checkpoint: Se True, tenta retomar de checkpoint existente.
            checkpoint_interval: Intervalo (em lotes) para salvar checkpoint.
            
        Returns:
            Dicionário com estatísticas da ingestão:
                - total_chunks: Total de chunks processados
                - total_vectors: Total de vetores inseridos
                - batches: Número de lotes
                - errors: Lista de erros (se houver)
                - interrupted: Se True, processo foi interrompido
        """
        if not chunks:
            return {
                "total_chunks": 0,
                "total_vectors": 0,
                "batches": 0,
                "errors": [],
                "interrupted": False,
            }
        
        batch_size = batch_size or self.settings.BATCH_SIZE
        total_chunks = len(chunks)
        total_vectors = 0
        errors = []
        processed_indices = []
        start_index = 0
        interrupted = False
        
        # Tenta carregar checkpoint
        if resume_from_checkpoint:
            checkpoint = self._load_checkpoint()
            if checkpoint:
                if (checkpoint.get("total_chunks") == total_chunks and
                    checkpoint.get("index_name") == self.index_name and
                    checkpoint.get("namespace") == self.namespace):
                    processed_indices = checkpoint.get("processed_indices", [])
                    start_index = max(processed_indices) + 1 if processed_indices else 0
                    total_vectors = len(processed_indices)
                    print(f"\n📋 Checkpoint encontrado! Retomando de índice {start_index}")
                    print(f"   Já processados: {total_vectors}/{total_chunks} chunks")
                else:
                    print("⚠️  Checkpoint incompatível (diferentes chunks/índice). Ignorando...")
                    self._clear_checkpoint()
        
        print(f"\n🚀 Iniciando ingestão de {total_chunks} chunks no Pinecone...")
        print(f"   Batch size: {batch_size}")
        print(f"   Índice: {self.index_name}")
        if self.namespace:
            print(f"   Namespace: {self.namespace}")
        if start_index > 0:
            print(f"   Retomando de: {start_index}/{total_chunks}")
        
        # Processa em lotes
        try:
            from tqdm import tqdm
            iterator = range(start_index, total_chunks, batch_size)
            if show_progress:
                iterator = tqdm(iterator, desc="Ingerindo chunks", initial=start_index, total=total_chunks)
        except ImportError:
            iterator = range(start_index, total_chunks, batch_size)
        
        try:
            batch_num = 0
            for i in iterator:
                batch_chunks = chunks[i:i + batch_size]
                batch_num += 1
                
                try:
                    # Prepara vetores do lote
                    vectors = self._prepare_vectors(batch_chunks)
                    
                    # Insere no Pinecone
                    self._upsert_batch(vectors)
                    
                    # Marca índices como processados
                    batch_indices = list(range(i, min(i + batch_size, total_chunks)))
                    processed_indices.extend(batch_indices)
                    total_vectors += len(vectors)
                    
                    # Salva checkpoint periodicamente
                    if batch_num % checkpoint_interval == 0:
                        self._save_checkpoint(processed_indices, total_chunks)
                        if show_progress:
                            print(f"\n💾 Checkpoint salvo: {total_vectors}/{total_chunks} chunks processados")
                    
                    # Pequena pausa para evitar rate limiting
                    if i + batch_size < total_chunks:
                        time.sleep(0.1)
                        
                except KeyboardInterrupt:
                    # Salva checkpoint antes de interromper
                    print(f"\n\n⚠️  Interrupção detectada! Salvando checkpoint...")
                    self._save_checkpoint(processed_indices, total_chunks)
                    interrupted = True
                    raise
                except Exception as e:
                    error_msg = f"Erro no lote {i//batch_size + 1}: {e}"
                    errors.append(error_msg)
                    print(f"⚠️  {error_msg}")
                    # Continua com próximo lote mesmo em caso de erro
                    continue
            
            # Salva checkpoint final
            self._save_checkpoint(processed_indices, total_chunks)
            
            # Remove checkpoint se concluído com sucesso
            if not interrupted:
                self._clear_checkpoint()
                print(f"\n✅ Ingestão concluída!")
            else:
                print(f"\n⏸️  Ingestão interrompida!")
            
            print(f"   Vetores inseridos: {total_vectors}/{total_chunks}")
            if errors:
                print(f"   Erros: {len(errors)}")
            
        except KeyboardInterrupt:
            # Salva checkpoint antes de sair
            if not interrupted:  # Evita salvar duas vezes
                print(f"\n\n⚠️  Interrupção detectada! Salvando checkpoint...")
                self._save_checkpoint(processed_indices, total_chunks)
                interrupted = True
            print(f"\n⏸️  Processo interrompido pelo usuário")
            print(f"   Progresso salvo: {total_vectors}/{total_chunks} chunks")
            print(f"   Para retomar, execute novamente com resume_from_checkpoint=True")
        
        return {
            "total_chunks": total_chunks,
            "total_vectors": total_vectors,
            "batches": (total_chunks + batch_size - 1) // batch_size,
            "errors": errors,
            "interrupted": interrupted,
            "checkpoint_path": str(self._get_checkpoint_path()) if interrupted else None,
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

