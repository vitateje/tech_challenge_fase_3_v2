# Deploy no Vercel

Este projeto foi configurado para funcionar como função serverless no Vercel.

## Estrutura

- `api/index.js` - Handler serverless que exporta o app Express
- `vercel.json` - Configuração do Vercel para roteamento

## Variáveis de Ambiente Necessárias

Certifique-se de configurar as seguintes variáveis de ambiente no Vercel:

- `MONGODB_URI` - URI de conexão do MongoDB
- `NODE_ENV` - Ambiente (production/development)
- Outras variáveis específicas do projeto (verificar `docs/ENV_VARIABLES.md`)

## Como Fazer Deploy

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. No diretório `backend`, execute:
```bash
vercel
```

4. Para produção:
```bash
vercel --prod
```

## Configuração no Dashboard do Vercel

1. Acesse o projeto no dashboard do Vercel
2. Vá em Settings > Environment Variables
3. Adicione todas as variáveis de ambiente necessárias
4. Certifique-se de que o Root Directory está configurado como `backend` (se aplicável)

## Notas Importantes

- A conexão MongoDB é gerenciada automaticamente e reutilizada entre requisições
- O handler serverless garante conexão antes de processar cada requisição
- Não há inicialização automática de usuário padrão na função serverless (isso deve ser feito manualmente ou via script)

### ⚠️ Upload de Arquivos (PDFs) no Vercel

O sistema detecta automaticamente quando está rodando no Vercel e usa o diretório `/tmp/uploads/pdfs` para uploads de arquivos, já que o sistema de arquivos é somente leitura exceto para `/tmp`.

**Características importantes:**
- Os arquivos em `/tmp` são temporários e são limpos após cada execução
- PDFs devem ser processados imediatamente após o upload
- O sistema automaticamente detecta o ambiente Vercel através da variável `VERCEL`
- Não é necessário configurar nada - funciona automaticamente

