# 📡 Documentação da API - quimicAI

## Base URL

```
http://localhost:4000/api
```

## Autenticação

A maioria das rotas requer autenticação via **Session-ID** no header:

```
Session-ID: <session_id>
```

### Criar Sessão (Login)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@quimicai.com",
  "password": "demo@123"
}
```

**Resposta:**
```json
{
  "sessionId": "session_123",
  "user": {
    "_id": "user_id",
    "name": "Admin",
    "email": "admin@quimicai.com",
    "level": "beginner"
  }
}
```

### Logout

```http
POST /api/auth/logout
Session-ID: <session_id>

{
  "sessionId": "session_123"
}
```

### Usuário Atual

```http
GET /api/auth/current-user
Session-ID: <session_id>
```

## Chat

### Criar Conversa

```http
POST /api/chat/conversations/:userId
Session-ID: <session_id>

{
  "title": "Nova Conversa" // opcional
}
```

### Listar Conversas

```http
GET /api/chat/conversations/:userId
Session-ID: <session_id>
```

### Obter Histórico

```http
GET /api/chat/history/:userId?conversationId=<conversation_id>
Session-ID: <session_id>
```

### Enviar Mensagem

```http
POST /api/chat/send/:userId
Session-ID: <session_id>
Content-Type: application/json

{
  "message": "O que é a água?",
  "conversationId": "conversation_id" // opcional
}
```

**Resposta:**
```json
{
  "message": {
    "_id": "msg_id",
    "userId": "user_id",
    "content": "O que é a água?",
    "role": "user",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "response": {
    "_id": "response_id",
    "userId": "user_id",
    "content": "A água (H₂O) é uma molécula...",
    "role": "assistant",
    "timestamp": "2024-01-01T00:00:01.000Z"
  },
  "conversation": {
    "_id": "conversation_id",
    "title": "Nova Conversa",
    "messageCount": 2
  }
}
```

### Deletar Conversa

```http
DELETE /api/chat/conversations/:userId/:conversationId
Session-ID: <session_id>
```

### Limpar Histórico

```http
DELETE /api/chat/history/:userId
Session-ID: <session_id>
```

## Atividades do Aluno

### Listar Atividades

```http
GET /api/student-activities/user/:userId
Session-ID: <session_id>
```

### Criar Atividade

```http
POST /api/student-activities
Session-ID: <session_id>
Content-Type: application/json

{
  "userId": "user_id",
  "activityId": "activity_id",
  "status": "pending"
}
```

### Atualizar Atividade

```http
PUT /api/student-activities/:id
Session-ID: <session_id>
Content-Type: application/json

{
  "status": "completed",
  "score": 85
}
```

### Deletar Atividade

```http
DELETE /api/student-activities/:id
Session-ID: <session_id>
```

### Progresso do Aluno

```http
GET /api/student-activities/user/:userId/progress
Session-ID: <session_id>
```

## Usuários

### Listar Usuários

```http
GET /api/users
Session-ID: <session_id>
```

### Obter Usuário

```http
GET /api/users/:id
Session-ID: <session_id>
```

### Atualizar Usuário

```http
PUT /api/users/:id
Session-ID: <session_id>
Content-Type: application/json

{
  "name": "Novo Nome",
  "level": "intermediate",
  "interests": ["química orgânica", "tabela periódica"]
}
```

## Trilha de Aprendizado

### Obter Progresso

```http
GET /api/trail/progress/:userId
Session-ID: <session_id>
```

### Atualizar Progresso

```http
POST /api/trail/progress/:userId
Session-ID: <session_id>
Content-Type: application/json

{
  "areaId": "area_id",
  "videoId": "video_id",
  "completed": true
}
```

## Simulados

### Listar Simulados

```http
GET /api/simulados?category=enem
Session-ID: <session_id>
```

### Obter Simulado

```http
GET /api/simulados/:id
Session-ID: <session_id>
```

### Submeter Resposta

```http
POST /api/simulados/:id/submit
Session-ID: <session_id>
Content-Type: application/json

{
  "answers": {
    "question_1": "A",
    "question_2": "B"
  }
}
```

## RAG (Vector Store)

### Informações do RAG

```http
GET /api/rag/info
Session-ID: <session_id>
```

### Listar Documentos

```http
GET /api/rag/documents
Session-ID: <session_id>
```

### Remover Documento

```http
DELETE /api/rag/documents/:id
Session-ID: <session_id>
```

## Health Check

```http
GET /health
```

**Resposta:**
```json
{
  "status": "ok"
}
```

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Não autorizado
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Exemplos com cURL

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@quimicai.com","password":"demo@123"}'
```

### Enviar Mensagem

```bash
curl -X POST http://localhost:4000/api/chat/send/user_id \
  -H "Content-Type: application/json" \
  -H "Session-ID: session_123" \
  -d '{"message":"O que é a água?"}'
```

