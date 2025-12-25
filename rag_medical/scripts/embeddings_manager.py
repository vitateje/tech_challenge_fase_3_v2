"""
Módulo para gerenciamento de embeddings.

Este módulo gerencia diferentes providers de embeddings (Gemini, Ollama)
e fornece interface unificada para gerar embeddings de textos.
"""

from typing import List, Optional, Union
import time
import numpy as np
from config.settings import Settings


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
            
            # Normaliza o nome do modelo
            # A biblioteca langchain_google_genai geralmente aceita apenas o nome sem prefixo
            model_name = self.model_name.strip()
            
            # Remove prefixo "models/" se presente (a biblioteca adiciona automaticamente)
            if model_name.startswith('models/'):
                model_name = model_name.replace('models/', '').strip()
            
            # Lista de formatos para tentar (em ordem de preferência)
            # A maioria das versões da biblioteca prefere sem prefixo
            model_formats_to_try = [
                model_name,  # Primeiro tenta sem prefixo (mais comum)
                f"models/{model_name}",  # Depois tenta com prefixo
            ]
            
            # Remove duplicatas mantendo ordem
            model_formats_to_try = list(dict.fromkeys(model_formats_to_try))
            
            last_error = None
            successful_format = None
            
            for model_format in model_formats_to_try:
                try:
                    self.embeddings = GoogleGenerativeAIEmbeddings(
                        model=model_format,
                        google_api_key=self.api_key,
                    )
                    # Testa se funciona fazendo uma chamada de teste
                    # Se falhar com erro 500 (temporário), aceita o modelo mesmo assim
                    try:
                        test_result = self.embeddings.embed_query("test")
                        if test_result and len(test_result) > 0:
                            print(f"✅ Embeddings Gemini inicializados: {model_format}")
                            self._gemini_model_format = model_format
                            return  # Sucesso, sai da função
                    except Exception as test_err:
                        error_str = str(test_err).lower()
                        # Se for erro de formato, tenta próximo formato
                        if "unexpected model name format" in error_str or ("model" in error_str and "format" in error_str):
                            last_error = test_err
                            continue
                        # Se for erro 500 (servidor temporário), aceita o modelo mesmo assim
                        elif "500" in error_str or "internal error" in error_str:
                            print(f"⚠️  Aviso: Erro temporário do servidor durante teste (500)")
                            print(f"   Continuando com o modelo - pode funcionar em uso real")
                            print(f"   Se persistir, aguarde alguns minutos e tente novamente")
                            print(f"✅ Embeddings Gemini inicializados: {model_format}")
                            self._gemini_model_format = model_format
                            return
                        # Para outros erros, tenta próximo formato
                        else:
                            last_error = test_err
                            continue
                        
                except Exception as e:
                    last_error = e
                    error_msg = str(e).lower()
                    # Se não for erro de formato, para de tentar
                    if "unexpected model name format" not in error_msg and "model" not in error_msg:
                        break
                    continue
            
            # Se chegou aqui, todos os formatos falharam
            error_msg = str(last_error).lower() if last_error else "erro desconhecido"
            
            # Detecta tipo de erro e fornece mensagem apropriada
            if "500" in error_msg or "internal error" in error_msg:
                raise RuntimeError(
                    f"❌ Erro interno do servidor Google Gemini (500)\n"
                    f"   Erro: {last_error}\n\n"
                    f"💡 SOLUÇÃO:\n"
                    f"   Este é um erro temporário do servidor da Google.\n"
                    f"   1. Aguarde alguns minutos e tente novamente\n"
                    f"   2. Verifique o status da API: https://status.cloud.google.com/\n"
                    f"   3. Verifique se sua API key está válida e tem créditos\n"
                    f"   4. Tente executar a célula novamente\n\n"
                    f"   Se o problema persistir, verifique:\n"
                    f"   - https://developers.generativeai.google/guide/troubleshooting"
                )
            elif "unexpected model name format" in error_msg or ("model" in error_msg and "format" in error_msg):
                raise RuntimeError(
                    f"❌ Formato de nome do modelo inválido: '{self.model_name}'\n"
                    f"   Erro: {last_error}\n\n"
                    f"💡 SOLUÇÃO:\n"
                    f"   Tente usar um dos seguintes formatos no arquivo .env:\n"
                    f"   - EMBEDDING_MODEL=text-embedding-004 (RECOMENDADO)\n"
                    f"   - EMBEDDING_MODEL=models/text-embedding-004\n"
                    f"   - EMBEDDING_MODEL=embedding-001\n\n"
                    f"   Modelos de embedding disponíveis do Gemini:\n"
                    f"   - text-embedding-004 (768 dimensões) - RECOMENDADO\n"
                    f"   - embedding-001 (768 dimensões)\n\n"
                    f"   A biblioteca geralmente prefere o nome sem o prefixo 'models/'.\n"
                    f"   Verifique a documentação: https://ai.google.dev/models/gemini"
                )
            elif "api key" in error_msg or "authentication" in error_msg or "401" in error_msg or "403" in error_msg:
                raise RuntimeError(
                    f"❌ Erro de autenticação com Google Gemini API\n"
                    f"   Erro: {last_error}\n\n"
                    f"💡 SOLUÇÃO:\n"
                    f"   1. Verifique se GEMINI_API_KEY está configurada no arquivo .env\n"
                    f"   2. Verifique se a API key é válida e não expirou\n"
                    f"   3. Verifique se a API key tem permissões para usar embeddings\n"
                    f"   4. Obtenha uma nova API key em: https://makersuite.google.com/app/apikey"
                )
            else:
                raise RuntimeError(
                    f"❌ Erro ao inicializar Gemini embeddings\n"
                    f"   Erro: {last_error}\n\n"
                    f"💡 SOLUÇÃO:\n"
                    f"   1. Verifique sua conexão com a internet\n"
                    f"   2. Verifique se a API key está configurada corretamente\n"
                    f"   3. Aguarde alguns minutos e tente novamente (pode ser erro temporário)\n"
                    f"   4. Verifique o status da API: https://status.cloud.google.com/\n"
                    f"   5. Consulte a documentação: https://developers.generativeai.google/guide/troubleshooting"
                )
            
        except ImportError:
            raise ImportError(
                "langchain-google-genai não instalado. "
                "Instale com: pip install langchain-google-genai"
            )
        except RuntimeError:
            # Re-raise RuntimeError que já tem mensagem formatada
            raise
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
    
    def _is_retryable_error(self, error: Exception) -> bool:
        """
        Verifica se um erro é retryable (erro temporário do servidor).
        
        Args:
            error: Exceção a verificar.
            
        Returns:
            True se o erro é retryable, False caso contrário.
        """
        error_str = str(error).lower()
        # Erros 500, 503, 429 são geralmente temporários
        # Também verifica o tipo de exceção
        error_type_str = type(error).__name__.lower()
        
        retryable_indicators = [
            "500",
            "503",
            "429",
            "internal error",
            "service unavailable",
            "rate limit",
            "too many requests",
            "temporarily unavailable",
            "internalservererror",  # Tipo de exceção
            "serviceunavailable",
        ]
        
        # Verifica tanto na string do erro quanto no tipo
        is_retryable = any(indicator in error_str for indicator in retryable_indicators) or \
                      any(indicator in error_type_str for indicator in retryable_indicators)
        
        return is_retryable
    
    def embed_text(self, text: str, max_retries: int = 5) -> List[float]:
        """
        Gera embedding para um único texto com retry automático para erros temporários.
        
        Args:
            text: Texto para gerar embedding.
            max_retries: Número máximo de tentativas (padrão: 5).
            
        Returns:
            Lista de floats representando o vetor de embedding.
        """
        if not text or not text.strip():
            raise ValueError("Texto não pode ser vazio")
        
        last_error = None
        for attempt in range(max_retries):
            try:
                result = self.embeddings.embed_query(text)
                return result
            except KeyboardInterrupt:
                # Re-raise KeyboardInterrupt para permitir tratamento no nível superior
                raise
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                
                # Verifica se é erro retryable
                is_retryable = self._is_retryable_error(e)
                
                # Se não for erro retryable, para imediatamente
                if not is_retryable:
                    raise RuntimeError(f"Erro ao gerar embedding: {e}")
                
                # Se for erro retryable e ainda há tentativas, aguarda e tenta novamente
                if attempt < max_retries - 1:
                    # Backoff exponencial com tempo mínimo maior: 3s, 6s, 12s, 24s, 48s
                    wait_time = min(3 * (2 ** attempt), 60)  # Máximo de 60 segundos
                    print(f"\n   ⚠️  Erro temporário do servidor (tentativa {attempt + 1}/{max_retries})")
                    print(f"   Tipo de erro: {type(e).__name__}")
                    print(f"   Mensagem: {str(e)[:100]}...")
                    print(f"   Aguardando {wait_time}s antes de tentar novamente...\n")
                    time.sleep(wait_time)
                    continue
                else:
                    # Última tentativa falhou
                    raise RuntimeError(
                        f"Erro ao gerar embedding após {max_retries} tentativas: {e}\n"
                        f"   Este é um erro temporário do servidor Google Gemini (500).\n"
                        f"   Aguarde alguns minutos e tente novamente.\n"
                        f"   Status da API: https://status.cloud.google.com/"
                    )
        
        # Não deveria chegar aqui, mas por segurança
        raise RuntimeError(f"Erro ao gerar embedding: {last_error}")
    
    def embed_documents(self, texts: List[str], max_retries: int = 5) -> List[List[float]]:
        """
        Gera embeddings para múltiplos textos com retry automático para erros temporários.
        
        Args:
            texts: Lista de textos para gerar embeddings.
            max_retries: Número máximo de tentativas (padrão: 5).
            
        Returns:
            Lista de listas de floats (um embedding por texto).
        """
        if not texts:
            return []
        
        # Filtra textos vazios
        valid_texts = [t for t in texts if t and t.strip()]
        
        if not valid_texts:
            raise ValueError("Nenhum texto válido fornecido")
        
        last_error = None
        for attempt in range(max_retries):
            try:
                results = self.embeddings.embed_documents(valid_texts)
                return results
            except KeyboardInterrupt:
                # Re-raise KeyboardInterrupt para permitir tratamento no nível superior
                raise
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                
                # Se não for erro retryable, para imediatamente
                if not self._is_retryable_error(e):
                    raise RuntimeError(f"Erro ao gerar embeddings em lote: {e}")
                
                # Se for erro retryable e ainda há tentativas, aguarda e tenta novamente
                if attempt < max_retries - 1:
                    # Backoff exponencial com tempo mínimo maior: 3s, 6s, 12s, 24s, 48s
                    wait_time = min(3 * (2 ** attempt), 60)  # Máximo de 60 segundos
                    print(f"   ⚠️  Erro temporário do servidor (tentativa {attempt + 1}/{max_retries})")
                    print(f"   Aguardando {wait_time}s antes de tentar novamente...")
                    time.sleep(wait_time)
                    continue
                else:
                    # Última tentativa falhou
                    raise RuntimeError(
                        f"Erro ao gerar embeddings em lote após {max_retries} tentativas: {e}\n"
                        f"   Este é um erro temporário do servidor Google Gemini.\n"
                        f"   Aguarde alguns minutos e tente novamente."
                    )
        
        # Não deveria chegar aqui, mas por segurança
        raise RuntimeError(f"Erro ao gerar embeddings em lote: {last_error}")
    
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

