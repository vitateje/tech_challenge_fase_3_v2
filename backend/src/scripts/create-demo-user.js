require('dotenv').config();
const { connectDB } = require('../config/database');
const userRepository = require('../repositories/userRepository');

async function createDemoUser() {
  try {
    // Conectar ao MongoDB
    await connectDB();
    console.log('✅ Conectado ao MongoDB');

    // Verificar se usuário padrão já existe
    const existingUser = await userRepository.getByEmail('admin@quimicai.com');
    
    if (existingUser) {
      console.log('ℹ️ Usuário padrão já existe:');
      console.log(`   Email: admin@quimicai.com`);
      console.log(`   Senha: demo@123`);
      console.log(`   ID: ${existingUser._id}`);
      process.exit(0);
    }

    // Criar usuário padrão
    const user = await userRepository.create({
      name: 'Usuário Admin',
      email: 'admin@quimicai.com',
      password: 'demo@123', // Será hasheado automaticamente
      level: 'beginner',
      interests: ['química geral', 'tabela periódica']
    });

    console.log('✅ Usuário padrão criado com sucesso!');
    console.log(`   Email: admin@quimicai.com`);
    console.log(`   Senha: demo@123`);
    console.log(`   ID: ${user._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário demo:', error);
    process.exit(1);
  }
}

createDemoUser();

