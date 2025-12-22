require('dotenv').config();
const app = require('../src/app');
const { connectDB } = require('../src/config/database');

// Cache da conexão MongoDB para ambiente serverless
let connectionPromise = null;

// Função para garantir conexão com MongoDB
async function ensureDBConnection() {
  const mongoose = require('mongoose');
  
  // Se já está conectado, retornar
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Se já existe uma conexão em andamento, aguardar ela
  if (connectionPromise) {
    return connectionPromise;
  }

  // Criar nova promessa de conexão
  connectionPromise = connectDB()
    .then(() => {
      connectionPromise = null; // Reset após sucesso
    })
    .catch((error) => {
      connectionPromise = null; // Reset após erro para permitir retry
      throw error;
    });

  return connectionPromise;
}

// Wrapper para capturar erros assíncronos não tratados
function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Handler serverless para Vercel
module.exports = async (req, res) => {
  // Timeout para evitar que a função fique rodando indefinidamente
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('Request timeout - resposta não enviada em tempo hábil');
      res.status(504).json({ 
        error: 'Gateway Timeout',
        message: 'A requisição excedeu o tempo limite'
      });
    }
  }, 9000); // 9 segundos (Vercel tem timeout de 10s no plano gratuito)

  try {
    // Garantir conexão com MongoDB antes de processar requisição
    await ensureDBConnection();
    
    // Wrapper para garantir que erros assíncronos sejam capturados e aguardar resposta
    return new Promise((resolve) => {
      let resolved = false;
      
      // Função para marcar como resolvido
      const markResolved = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve();
        }
      };

      // Interceptar o envio da resposta para limpar o timeout
      const originalEnd = res.end;
      res.end = function(...args) {
        markResolved();
        return originalEnd.apply(this, args);
      };

      // Interceptar métodos de envio de resposta
      const originalJson = res.json;
      res.json = function(...args) {
        markResolved();
        return originalJson.apply(this, args);
      };

      const originalSend = res.send;
      res.send = function(...args) {
        markResolved();
        return originalSend.apply(this, args);
      };

      // Processar requisição com Express
      app(req, res, (err) => {
        if (err) {
          console.error('Erro não tratado pelo Express:', err);
          if (!res.headersSent && !resolved) {
            res.status(500).json({ 
              error: 'Internal Server Error',
              message: process.env.NODE_ENV === 'production' 
                ? 'Erro interno do servidor' 
                : err.message 
            });
          }
          markResolved();
        } else if (!resolved) {
          // Se não houve erro mas a resposta ainda não foi enviada, aguardar um pouco
          // Isso pode acontecer em rotas que não enviam resposta imediatamente
          setTimeout(() => {
            if (!res.headersSent) {
              console.warn('Aviso: Resposta não foi enviada pelo Express');
            }
            markResolved();
          }, 100);
        }
      });
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Erro no handler serverless:', error);
    console.error('Stack:', error.stack);
    
    // Se a resposta ainda não foi enviada, enviar erro
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
          ? 'Erro interno do servidor' 
          : error.message 
      });
    }
  }
};

