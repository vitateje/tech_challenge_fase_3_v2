require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const authService = require('./services/authService');
const langchainConfig = require('./langchain/config');

const PORT = process.env.BACKEND_PORT || 4000;

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Criar usuário demo se não existir
    await authService.createDefaultUser();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log('Medical Assistant Backend - Sistema Iniciado');
      console.log(`${'='.repeat(60)}`);
      console.log(`[OK] Servidor rodando em http://localhost:${PORT}`);
      console.log('[OK] MongoDB conectado - Persistência habilitada');
      console.log('[OK] Sistema de autenticação habilitado');
      
      // Mostrar configuração do LLM
      const currentProvider = langchainConfig.provider;
      const providerConfig = langchainConfig.getProviderConfig();
      
      console.log(`\n${'='.repeat(60)}`);
      console.log('Configuração do LLM');
      console.log(`${'='.repeat(60)}`);
      console.log(`[INFO] Provider Ativo: ${currentProvider}`);
      
      if (providerConfig) {
        console.log(`[INFO] Modelo: ${providerConfig.model || providerConfig.modelId || 'N/A'}`);
        
        if (providerConfig.baseUrl) {
          console.log(`[INFO] Base URL: ${providerConfig.baseUrl}`);
        }
        
        console.log(`[INFO] Temperature: ${providerConfig.temperature}`);
        console.log(`[INFO] Max Tokens: ${providerConfig.maxTokens}`);
        
        // Dica específica para Ollama
        if (currentProvider === 'ollama' || currentProvider === 'biobyia') {
          console.log(`\n[INFO] Certifique-se de que o Ollama está rodando:`);
          console.log(`       ollama serve`);
          console.log(`[INFO] Verifique se o modelo está instalado:`);
          console.log(`       ollama list`);
        }
      } else {
        console.log(`[AVISO] Provider ${currentProvider} não está configurado corretamente`);
      }
      
      console.log(`${'='.repeat(60)}\n`);
      
      // Clean up expired sessions every hour
      setInterval(() => {
        authService.cleanupExpiredSessions();
      }, 60 * 60 * 1000); // 1 hour
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
