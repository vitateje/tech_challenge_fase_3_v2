"""
Módulo para gerenciamento de embeddings.

Este módulo gerencia diferentes providers de embeddings (Gemini, Ollama)
e fornece interface unificada para gerar embeddings de textos.
"""

from typing import List, Optional, Union
import numpy as np
from ..config.settings import Settings


class EmbeddingsManager:
    """
    Gerenciador de embeddings com suporte para múltiplos providers.
    
    Suporta:
    - Gemini (text-embedding-004) - RECOMENDADO
    - Ollama (modelos locais)
    """
    
    def __init__(
        self,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        """
        Inicializa o gerenciador de embeddings.
        
        Args:
            provider: 'gemini' ou 'ollama'. Se None, detecta automaticamente.
            model_name: Nome do modelo de embedding.
            api_key: API key (necessária para Gemini).
            base_url: URL base (necessária para Ollama).
        """
        self.settings = Settings()
        
        # Determina provider
        if provider is None:
            provider = self.settings.get_embedding_provider()
        
        self.provider = provider.lower()
        
        # Configura modelo e credenciais
        if self.provider == 'gemini':
            self.model_name = model_name or self.settings.EMBEDDING_MODEL
            self.api_key = api_key or self.settings.GEMINI_API_KEY
            
            if not self.api_key:
                raise ValueError(
                    "GEMINI_API_KEY não configurada. "
                    "Configure no arquivo .env ou passe como parâmetro."
                )
            
            self._init_gemini()
            
        elif self.provider == 'ollama':
            self.model_name = model_name or self.settings.EMBEDDING_MODEL
            self.base_url = base_url or self.settings.OLLAMA_BASE_URL
            
            if not self.model_name:
                raise ValueError(
                    "EMBEDDING_MODEL não configurado para Ollama. "
                    "Configure no arquivo .env ou passe como parâmetro."
                )
            
            self._init_ollama()
            
        else:
            raise ValueError(
                f"Provider não suportado: {provider}. "
                "Use 'gemini' ou 'ollama'."
            )
    
    def _init_gemini(self):
        """Inicializa embeddings do Gemini."""
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=self.model_name,
                google_api_key=self.api_key,
            )
            
            print(f"✅ Embeddings Gemini inicializados: {self.model_name}")
            
        except ImportError:
            raise ImportError(
                "langchain-google-genai não instalado. "
                "Instale com: pip install langchain-google-genai"
            )
        except Exception as e:
            raise RuntimeError(f"Erro ao inicializar Gemini embeddings: {e}")
    
    def _init_ollama(self):
        """Inicializa embeddings do Ollama."""
        try:
            from langchain_community.embeddings import OllamaEmbeddings
            
            self.embeddings = OllamaEmbeddings(
                model=self.model_name,
                base_url=self.base_url,
            )
            
            print(f"✅ Embeddings Ollama inicializados: {self.model_name}")
            print(f"   Base URL: {self.base_url}")
            
        except ImportError:
            raise ImportError(
                "langchain-community não instalado. "
                "Instale com: pip install langchain-community"
            )
        except Exception as e:
            raise RuntimeError(f"Erro ao inicializar Ollama embeddings: {e}")
    
    def embed_text(self, text: str) -> List[float]:
        """
        Gera embedding para um único texto.
        
        Args:
            text: Texto para gerar embedding.
            
        Returns:
            Lista de floats representando o vetor de embedding.
        """
        if not text or not text.strip():
            raise ValueError("Texto não pode ser vazio")
        
        try:
            result = self.embeddings.embed_query(text)
            return result
        except Exception as e:
            raise RuntimeError(f"Erro ao gerar embedding: {e}")
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Gera embeddings para múltiplos textos (mais eficiente que embed_text em loop).
        
        Args:
            texts: Lista de textos para gerar embeddings.
            
        Returns:
            Lista de listas de floats (um embedding por texto).
        """
        if not texts:
            return []
        
        # Filtra textos vazios
        valid_texts = [t for t in texts if t and t.strip()]
        
        if not valid_texts:
            raise ValueError("Nenhum texto válido fornecido")
        
        try:
            results = self.embeddings.embed_documents(valid_texts)
            return results
        except Exception as e:
            raise RuntimeError(f"Erro ao gerar embeddings em lote: {e}")
    
    def get_embedding_dimension(self) -> int:
        """
        Retorna a dimensão dos embeddings gerados.
        
        Returns:
            Número de dimensões do vetor de embedding.
        """
        # Para Gemini text-embedding-004: 768 dimensões
        # Para Ollama (depende do modelo): geralmente 1024 ou 768
        
        if self.provider == 'gemini':
            if 'text-embedding-004' in self.model_name:
                return 768
            else:
                # Testa com um texto pequeno para descobrir a dimensão
                test_embedding = self.embed_text("test")
                return len(test_embedding)
        
        elif self.provider == 'ollama':
            # Testa com um texto pequeno para descobrir a dimensão
            test_embedding = self.embed_text("test")
            return len(test_embedding)
        
        return 768  # Padrão
    
    def validate_index_compatibility(self, index_dimension: int) -> bool:
        """
        Valida se a dimensão dos embeddings é compatível com o índice Pinecone.
        
        Args:
            index_dimension: Dimensão esperada pelo índice Pinecone.
            
        Returns:
            True se compatível, False caso contrário.
        """
        embedding_dim = self.get_embedding_dimension()
        
        if embedding_dim != index_dimension:
            print(
                f"⚠️  Aviso: Dimensão do embedding ({embedding_dim}) "
                f"diferente da dimensão do índice ({index_dimension})."
            )
            print(
                "   Isso pode funcionar devido à similaridade de cosseno, "
                "mas não é ideal."
            )
            return False
        
        return True


def create_embeddings_manager(
    provider: Optional[str] = None
) -> EmbeddingsManager:
    """
    Função auxiliar para criar um gerenciador de embeddings.
    
    Args:
        provider: 'gemini' ou 'ollama'. Se None, detecta automaticamente.
        
    Returns:
        Instância de EmbeddingsManager configurada.
    """
    return EmbeddingsManager(provider=provider)

