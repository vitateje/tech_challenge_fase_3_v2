require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const authService = require('./services/authService');

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
      console.log(`🚀 quimicAI Backend running on http://localhost:${PORT}`);
      console.log('✅ MongoDB conectado - Persistência habilitada');
      console.log('🔐 Sistema de autenticação habilitado');
      
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
