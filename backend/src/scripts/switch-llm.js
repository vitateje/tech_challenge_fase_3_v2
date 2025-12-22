#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');

function switchLLM(provider) {
  // Aceita qualquer provider configurado (gemini, openai, ollama, etc.)
  if (!provider) {
    console.error('❌ Por favor, informe o provider (ex: gemini, openai, ollama)');
    process.exit(1);
  }

  try {
    let envContent = '';
    
    // Ler arquivo .env se existir
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Atualizar ou adicionar LLM_PROVIDER
    const lines = envContent.split('\n');
    let found = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('LLM_PROVIDER=')) {
        lines[i] = `LLM_PROVIDER=${provider}`;
        found = true;
        break;
      }
    }
    
    if (!found) {
      lines.push(`LLM_PROVIDER=${provider}`);
    }
    
    // Escrever arquivo atualizado
    fs.writeFileSync(envPath, lines.join('\n'));
    
    console.log(`✅ quimicAI LLM provider alterado para: ${provider.toUpperCase()}`);
    console.log('🔄 Reinicie o servidor para aplicar as mudanças');
    
  } catch (error) {
    console.error('❌ Erro ao alterar provider:', error.message);
    process.exit(1);
  }
}

// Verificar argumentos
const provider = process.argv[2];

if (!provider) {
  console.log('📋 Uso: node switch-llm.js <provider>');
  console.log('📋 Provedores disponíveis: gemini, openai, ollama');
  console.log('');
  console.log('📋 Exemplos:');
  console.log('  node switch-llm.js gemini');
  console.log('  node switch-llm.js openai');
  console.log('  node switch-llm.js ollama');
  process.exit(1);
}

switchLLM(provider);
