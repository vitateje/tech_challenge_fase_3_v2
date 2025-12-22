const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Se já estiver conectado, reutilizar conexão
    if (mongoose.connection.readyState === 1) {
      return;
    }

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_assistant';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI não configurada');
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB conectado com sucesso');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    if (error.message.includes('authentication failed') || error.code === 8000) {
      console.error('❌ Erro de autenticação do MongoDB:');
      console.error('   Verifique se as credenciais no MONGODB_URI estão corretas.');
      console.error('   Formato esperado: mongodb://usuario:senha@host:porta/database');
      console.error('   Para MongoDB Atlas: mongodb+srv://usuario:senha@cluster.mongodb.net/database');
      console.error('   Se sua senha contém caracteres especiais, use aspas no .env:');
      console.error('   MONGODB_URI="mongodb://user:senha#123@host:27017/db"');
    } else {
      console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    }
    throw error;
  }
};

module.exports = { connectDB };

