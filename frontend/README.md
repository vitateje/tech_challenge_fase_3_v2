# quimicAI - Frontend

Interface web para a plataforma de aprendizado de química com IA.

## 🚀 Tecnologias

- **Vue.js 3** - Framework JavaScript reativo
- **Vite** - Build tool e servidor de desenvolvimento
- **Axios** - Cliente HTTP para comunicação com API
- **CSS3** - Estilização moderna e responsiva

## 📁 Estrutura

```
frontend/
├── src/
│   ├── components/      # Componentes Vue
│   │   ├── ChatInterface.vue
│   │   ├── UserProfile.vue
│   │   ├── StudentActivities.vue
│   │   ├── ActivityCard.vue
│   │   ├── ActivityForm.vue
│   │   └── LoginForm.vue
│   ├── App.vue          # Componente principal
│   └── main.js         # Ponto de entrada
├── index.html
├── .env.example        # Exemplo de configuração
├── package.json
└── README.md
```

## 🛠️ Instalação

### 1. Pré-requisitos
- Node.js 18+
- npm ou yarn

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar configurações
nano .env
```

### 4. Configurar API Backend
```bash
# URL do backend (padrão: http://localhost:4000)
VITE_API_BASE_URL=http://localhost:4000

# Configurações da aplicação
VITE_APP_NAME=quimicAI
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Build para Produção
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

## 🎨 Funcionalidades

### 💬 Chat Inteligente
- Interface de chat moderna e responsiva
- Histórico de conversas persistente
- Integração com agente de IA especializado
- Sistema RAG para contexto aprimorado

### 📚 Sistema de Atividades
- Criação de atividades personalizadas
- Diferentes tipos: exercícios, quizzes, experimentos
- Sistema de progresso e pontuação
- Recomendações inteligentes

### 👤 Perfil do Usuário
- Informações pessoais editáveis
- Níveis de dificuldade
- Interesses personalizáveis
- Estatísticas de aprendizado

### 📖 Histórico e Analytics
- Visualização de progresso
- Tópicos estudados
- Estatísticas de performance
- Análise de aprendizado

## 🎯 Componentes Principais

### ChatInterface.vue
- Interface de chat em tempo real
- Histórico persistente
- Integração com backend

### UserProfile.vue
- Gerenciamento de perfil
- Configurações de usuário
- Estatísticas de aprendizado

### StudentActivities.vue
- Listagem de atividades
- Criação de novas atividades
- Progresso e estatísticas

### ActivityCard.vue
- Card de atividade individual
- Status e progresso
- Ações rápidas

### ActivityForm.vue
- Formulário de criação/edição
- Validação de dados
- Tipos de atividade

### LoginForm.vue
- Autenticação de usuário
- Validação de credenciais
- Gerenciamento de sessão

## 🔧 Configuração da API

### Variáveis de Ambiente
O frontend usa variáveis de ambiente para configurar a URL da API:

```bash
# .env
VITE_API_BASE_URL=http://localhost:4000
```

### Configuração Automática
- **Desenvolvimento**: Usa proxy do Vite para redirecionar `/api/*` para o backend
- **Produção**: Usa a URL configurada em `VITE_API_BASE_URL`
- **Fallback**: Se não configurado, usa `http://localhost:4000`

### ⚠️ Importante: Configuração do Vite
O `vite.config.js` usa `loadEnv()` para carregar variáveis do arquivo `.env`:

```javascript
// ✅ Correto - Carrega variáveis do .env
const env = loadEnv(mode, process.cwd(), '')
target: env.VITE_API_BASE_URL

// ❌ Incorreto - Não carrega do .env
target: process.env.VITE_API_BASE_URL
```

### Arquivo de Configuração
O arquivo `src/config/api.js` centraliza todas as configurações da API:

```javascript
// Configuração automática da URL base
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Endpoints organizados por categoria
export default {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: { login: '/api/auth/login', logout: '/api/auth/logout' },
    chat: { history: (userId) => `/api/chat/history/${userId}` },
    // ... outros endpoints
  }
};
```

## 🎨 Design System

### Cores
- **Primária**: Azul químico (#1e40af)
- **Secundária**: Verde científico (#059669)
- **Acento**: Laranja reativo (#ea580c)
- **Neutro**: Cinza técnico (#6b7280)

### Tipografia
- **Títulos**: Inter, sans-serif
- **Corpo**: Inter, sans-serif
- **Código**: JetBrains Mono, monospace

### Layout
- **Responsivo**: Mobile-first
- **Grid**: CSS Grid + Flexbox
- **Espaçamento**: Sistema de 8px

## 🚀 Deploy

### Variáveis de Ambiente para Produção
```bash
VITE_API_BASE_URL=https://api.quimicai.com
VITE_APP_NAME=quimicAI
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

### Build para Produção
```bash
npm run build
```

### Deploy Estático
```bash
# Copiar arquivos da pasta dist/ para seu servidor web
cp -r dist/* /var/www/html/
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Configuração Avançada

### Proxy para Desenvolvimento
```javascript
// vite.config.js
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:4000',
          changeOrigin: true
        }
      }
    }
  }
})
```

### Variáveis de Ambiente Customizadas
```bash
# .env
VITE_CUSTOM_FEATURE=true
VITE_API_TIMEOUT=15000
```

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

## 🔍 Troubleshooting

### Erro: "API não encontrada"
- Verifique se o backend está rodando
- Confirme a URL no `.env`

### Erro: "CORS"
- Verifique configuração CORS no backend
- Confirme origem permitida

### Build falha
- Limpe cache: `npm run build -- --force`
- Verifique dependências: `npm audit`

## 📊 Performance

### Otimizações Implementadas
- **Code Splitting**: Carregamento sob demanda
- **Tree Shaking**: Remoção de código não usado
- **Minificação**: JavaScript e CSS otimizados
- **Compressão**: Gzip/Brotli para assets

### Métricas
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## 📄 Licença

Este projeto está sob a licença MIT.