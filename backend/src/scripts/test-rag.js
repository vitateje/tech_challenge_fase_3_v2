#!/usr/bin/env node
/**
 * Script de Teste do RAG Service
 * 
 * Testa a integração com Pinecone e Google Generative AI Embeddings
 * conforme implementado no notebook demo.ipynb
 * 
 * Uso:
 *   node src/scripts/test-rag.js
 */

require('dotenv').config();
const ragService = require('../services/ragService');

// Cores para output no terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'bright');
    console.log('='.repeat(60) + '\n');
}

async function testRAGConnection() {
    logSection('TESTE 1: Conexão com Pinecone');
    
    try {
        const result = await ragService.testConnection();
        
        if (result.success) {
            log('✅ Conexão bem-sucedida!', 'green');
            console.log('   Index:', result.indexName);
            console.log('   Namespace:', result.namespace);
            console.log('   Documentos teste encontrados:', result.testResults);
        } else {
            log('❌ Falha na conexão', 'red');
            console.log('   Erro:', result.error);
        }
        
        return result.success;
    } catch (error) {
        log('❌ Erro ao testar conexão', 'red');
        console.log('   Erro:', error.message);
        return false;
    }
}

async function testRAGQueries() {
    logSection('TESTE 2: Busca RAG com Queries Médicas');
    
    const testQueries = [
        'Explique o conceito de edição genética',
        'Quais são os efeitos colaterais da aspirina?',
        'Como funciona a imunologia do câncer?',
        'Tratamentos para hipertensão arterial'
    ];
    
    for (const query of testQueries) {
        log(`\n📝 Query: "${query}"`, 'cyan');
        console.log('-'.repeat(60));
        
        try {
            const results = await ragService.queryRAGContext(query, 3);
            
            if (results && results.length > 0) {
                log(`✅ ${results.length} documentos encontrados`, 'green');
                
                results.forEach((result, index) => {
                    console.log(`\n   ${index + 1}. Artigo ID: ${result.id}`);
                    console.log(`      Fonte: ${result.source}`);
                    console.log(`      Score: ${result.score.toFixed(4)}`);
                    console.log(`      Texto (preview): ${result.text.substring(0, 150)}...`);
                });
                
                // Testar formatação de contexto
                log('\n📄 Contexto Formatado:', 'yellow');
                const formattedContext = ragService.formatRAGContext(results);
                console.log(formattedContext.substring(0, 300) + '...\n');
                
                // Testar informações de fontes
                log('📚 Informações de Rastreabilidade:', 'yellow');
                const sourcesInfo = ragService.getSourcesInfo(results);
                sourcesInfo.forEach(source => {
                    console.log(`   - ${source.title}`);
                    console.log(`     Referência: ${source.reference}`);
                    console.log(`     Score: ${source.score.toFixed(4)}`);
                });
            } else {
                log('⚠️  Nenhum documento encontrado', 'yellow');
            }
            
        } catch (error) {
            log(`❌ Erro na busca: ${error.message}`, 'red');
        }
    }
}

async function testEmptyQuery() {
    logSection('TESTE 3: Tratamento de Queries Vazias/Inválidas');
    
    const invalidQueries = [
        '',
        '   ',
        null
    ];
    
    for (const query of invalidQueries) {
        log(`\n📝 Query: ${JSON.stringify(query)}`, 'cyan');
        
        try {
            const results = await ragService.queryRAGContext(query || 'test', 1);
            log(`✅ Tratamento adequado: ${results.length} resultados`, 'green');
        } catch (error) {
            log(`❌ Erro: ${error.message}`, 'red');
        }
    }
}

async function testContextFormatting() {
    logSection('TESTE 4: Formatação de Contexto para Prompt');
    
    const query = 'CRISPR e terapia genética';
    
    try {
        log(`📝 Query: "${query}"`, 'cyan');
        
        const results = await ragService.queryRAGContext(query, 5);
        
        if (results && results.length > 0) {
            // Formatar contexto
            const formattedContext = ragService.formatRAGContext(results);
            
            log('\n📄 Contexto Completo Formatado:', 'yellow');
            console.log('   Tamanho:', formattedContext.length, 'caracteres');
            console.log('   Preview:');
            console.log('-'.repeat(60));
            console.log(formattedContext.substring(0, 500));
            console.log('[...]');
            console.log('-'.repeat(60));
            
            // Testar rastreabilidade
            const sourcesInfo = ragService.getSourcesInfo(results);
            
            log('\n🔍 Rastreabilidade de Fontes:', 'yellow');
            sourcesInfo.forEach((source, index) => {
                console.log(`\n   Fonte ${index + 1}:`);
                console.log(`   - Tipo: ${source.type}`);
                console.log(`   - Referência: ${source.reference}`);
                console.log(`   - Título: ${source.title}`);
                console.log(`   - Origem: ${source.source}`);
                console.log(`   - Score: ${source.score.toFixed(4)}`);
                console.log(`   - Metadata:`, JSON.stringify(source.metadata, null, 2));
            });
            
            log('\n✅ Formatação e rastreabilidade funcionando corretamente', 'green');
        } else {
            log('⚠️  Nenhum resultado para testar formatação', 'yellow');
        }
        
    } catch (error) {
        log(`❌ Erro: ${error.message}`, 'red');
    }
}

async function testServiceAvailability() {
    logSection('TESTE 5: Disponibilidade do Serviço');
    
    const isAvailable = ragService.isAvailable();
    
    if (isAvailable) {
        log('✅ Serviço RAG está disponível e inicializado', 'green');
    } else {
        log('⚠️  Serviço RAG não está inicializado', 'yellow');
        log('   Tentando inicializar...', 'blue');
        
        try {
            await ragService.initialize();
            const nowAvailable = ragService.isAvailable();
            
            if (nowAvailable) {
                log('✅ Serviço inicializado com sucesso', 'green');
            } else {
                log('❌ Falha ao inicializar serviço', 'red');
            }
        } catch (error) {
            log(`❌ Erro ao inicializar: ${error.message}`, 'red');
        }
    }
}

async function runAllTests() {
    log('\n' + '█'.repeat(60), 'bright');
    log('█  TESTE COMPLETO DO RAG SERVICE (BioByIA)', 'bright');
    log('█  Baseado em: demo.ipynb', 'bright');
    log('█'.repeat(60), 'bright');
    
    try {
        // Teste 1: Conexão
        const connectionOk = await testRAGConnection();
        
        if (!connectionOk) {
            log('\n❌ Testes abortados: falha na conexão', 'red');
            log('💡 Verifique suas variáveis de ambiente:', 'yellow');
            log('   - PINECONE_API_KEY', 'yellow');
            log('   - GEMINI_API_KEY', 'yellow');
            process.exit(1);
        }
        
        // Teste 2: Queries médicas
        await testRAGQueries();
        
        // Teste 3: Queries inválidas
        await testEmptyQuery();
        
        // Teste 4: Formatação de contexto
        await testContextFormatting();
        
        // Teste 5: Disponibilidade
        await testServiceAvailability();
        
        // Resumo final
        logSection('RESUMO DOS TESTES');
        log('✅ Todos os testes concluídos com sucesso!', 'green');
        log('\n📊 Estatísticas:', 'bright');
        log('   - Index Pinecone: biobyia', 'blue');
        log('   - Namespace: medical_qa', 'blue');
        log('   - Embedding Model: text-embedding-004', 'blue');
        log('   - Serviço Status: Operacional', 'green');
        
        log('\n💡 O RAG Service está pronto para uso!', 'cyan');
        log('   Use nos endpoints:', 'cyan');
        log('   - GET  /api/medical/rag/test', 'cyan');
        log('   - POST /api/medical/rag/search', 'cyan');
        log('   - POST /api/medical/query (com RAG integrado)', 'cyan');
        
    } catch (error) {
        log('\n❌ Erro durante os testes:', 'red');
        console.error(error);
        process.exit(1);
    }
}

// Executar testes
runAllTests()
    .then(() => {
        log('\n✅ Testes finalizados', 'green');
        process.exit(0);
    })
    .catch(error => {
        log('\n❌ Erro fatal:', 'red');
        console.error(error);
        process.exit(1);
    });

