require('dotenv').config();
const llmService = require('./services/llmService');

async function testLLM() {
  console.log('🧪 Testando quimicAI LLM Service...');
  console.log(`📋 Provider configurado: ${process.env.LLM_PROVIDER || 'gemini'}`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  
  const testQuestions = [
    'O que é hidrogênio?',
    'Explique a tabela periódica',
    'Como funciona a ligação química?'
  ];
  
  for (const question of testQuestions) {
    console.log(`\n❓ Pergunta: ${question}`);
    try {
      const response = await llmService.generateResponse(question);
      console.log(`✅ Resposta: ${response.substring(0, 100)}...`);
    } catch (error) {
      console.error(`❌ Erro: ${error.message}`);
    }
  }
}

testLLM().catch(console.error);
