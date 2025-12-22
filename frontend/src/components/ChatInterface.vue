<template>
  <div class="chat-interface">
    <PastelDots variant="subtle" :dotCount="12" />
    
    <!-- Área principal do chat -->
    <div class="chat-main">
      <div class="chat-header">
        <div class="chat-header-title">
          <h3>{{ currentConversationTitle || 'Medical Assistant Chat' }}</h3>
          <p class="chat-subtitle">Assistente Médico Virtual Inteligente</p>
        </div>
        <div class="chat-controls">
          <button @click="createNewConversation" class="new-chat-btn-header">
            ➕ Nova Conversa
          </button>
        </div>
      </div>
      
      <div 
        class="chat-messages" 
        ref="messagesContainer"
      >
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <p>Nenhuma mensagem ainda. Comece uma nova conversa!</p>
        </div>
        <div 
          v-for="message in messages" 
          :key="message._id" 
          :class="['message', message.type]"
        >
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.message)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <input 
          ref="messageInput"
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          placeholder="Pergunte sobre medicina e saúde..."
          :disabled="isLoading || !currentConversationId"
        />
        <button @click="sendMessage" :disabled="!newMessage || isLoading || !currentConversationId">
          {{ isLoading ? 'Enviando...' : 'Enviar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import PastelDots from './PastelDots.vue';
import apiConfig from '../config/api';

export default {
  name: 'ChatInterface',
  components: {
    PastelDots
  },
  props: {
    userId: {
      type: String,
      required: true
    },
    // Paciente selecionado no contexto do chat (opcional)
    patientId: {
      type: String,
      default: null
    },
    conversationId: {
      type: String,
      default: null
    }
  },
  emits: ['conversation-created', 'message-sent'],
  data() {
    return {
      currentConversationId: null,
      currentConversationTitle: null,
      messages: [],
      newMessage: '',
      isLoading: false
    }
  },
  watch: {
    conversationId: {
      immediate: false,
      handler(newId) {
        if (newId && newId !== this.currentConversationId) {
          this.currentConversationId = newId;
          this.loadChatHistory(newId);
        }
      }
    }
  },
  async mounted() {
    // Aguardar um pouco para garantir que a autenticação está completa
    await this.$nextTick();
    
    if (this.conversationId) {
      this.currentConversationId = this.conversationId;
      await this.loadChatHistory(this.conversationId);
    } else {
      // Aguardar um pouco antes de inicializar para evitar condições de corrida
      setTimeout(() => {
        this.initializeConversation();
      }, 100);
    }
  },
  methods: {
    async initializeConversation() {
      try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          console.warn('Session ID não encontrado, aguardando autenticação...');
          return;
        }
        
        // Buscar conversas e selecionar a mais recente ou criar uma nova
        const response = await axios.get(
          `${apiConfig.baseURL}${apiConfig.endpoints.chat.conversations.list(this.userId)}`,
          {
            headers: { 'Session-ID': sessionId }
          }
        );
        
        if (response.data && response.data.length > 0) {
          // Selecionar a conversa mais recente
          this.currentConversationId = response.data[0]._id;
          this.currentConversationTitle = response.data[0].title;
          await this.loadChatHistory(this.currentConversationId);
        } else {
          // Criar uma nova conversa apenas se não houver nenhuma
          await this.createNewConversation();
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
        // Não criar conversa automaticamente em caso de erro
        // Deixar o usuário criar manualmente se necessário
        if (error.response?.status === 401) {
          console.warn('Não autenticado, aguardando login...');
        }
      }
    },
    
    async createNewConversation() {
      // Prevenir múltiplas criações simultâneas
      if (this.isLoading) {
        return;
      }
      
      try {
        this.isLoading = true;
        const sessionId = localStorage.getItem('sessionId');
        
        if (!sessionId) {
          throw new Error('Sessão não encontrada. Por favor, faça login novamente.');
        }
        
        if (!this.userId) {
          throw new Error('User ID não encontrado.');
        }
        
        const response = await axios.post(
          `${apiConfig.baseURL}${apiConfig.endpoints.chat.conversations.create(this.userId)}`,
          {},
          {
            headers: { 'Session-ID': sessionId }
          }
        );
        
        const newConversation = response.data;
        this.currentConversationId = newConversation._id;
        this.currentConversationTitle = newConversation.title;
        this.newMessage = '';
        this.messages = [];
        
        // Emitir evento para atualizar o histórico no App.vue
        this.$emit('conversation-created', newConversation);
      } catch (error) {
        console.error('Error creating conversation:', error);
        if (error.response?.status === 401) {
          alert('Sessão expirada. Por favor, faça login novamente.');
          window.location.reload();
        } else {
          const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
          alert(`Erro ao criar nova conversa: ${errorMessage}`);
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadChatHistory(conversationId) {
      try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          console.warn('Session ID não encontrado');
          return;
        }
        
        const response = await axios.get(
          `${apiConfig.baseURL}${apiConfig.endpoints.chat.history(this.userId, conversationId)}`,
          {
            headers: { 'Session-ID': sessionId }
          }
        );
        this.messages = response.data || [];
        
        // Buscar título da conversa
        if (conversationId) {
          try {
            const convResponse = await axios.get(
              `${apiConfig.baseURL}${apiConfig.endpoints.chat.conversations.get(this.userId, conversationId)}`,
              {
                headers: { 'Session-ID': sessionId }
              }
            );
            this.currentConversationTitle = convResponse.data.title;
          } catch (error) {
            console.error('Error loading conversation title:', error);
          }
        }
        
        this.scrollToBottom();
      } catch (error) {
        console.error('Error loading chat history:', error);
        if (error.response?.status === 401) {
          alert('Sessão expirada. Por favor, faça login novamente.');
          window.location.reload();
        }
      }
    },
    
    async sendMessage() {
      if (!this.newMessage.trim() || this.isLoading || !this.currentConversationId) return;
      
      const message = this.newMessage.trim();
      this.newMessage = '';
      
      this.isLoading = true;
      
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await axios.post(
          `${apiConfig.baseURL}${apiConfig.endpoints.chat.send(this.userId)}`,
          {
            message,
            topic: 'general',
            conversationId: this.currentConversationId,
            // Encaminhar patientId para o backend quando disponível
            patientId: this.patientId || null
          },
          {
            headers: { 'Session-ID': sessionId }
          }
        );
        
        // Add both user and AI messages to the chat
        if (response.data.userMessage) {
          this.messages.push(response.data.userMessage);
        }
        if (response.data.aiMessage) {
          this.messages.push(response.data.aiMessage);
        }
        
        // Atualizar título da conversa se foi gerado automaticamente
        if (response.data.conversation && response.data.conversation.title) {
          this.currentConversationTitle = response.data.conversation.title;
        }
        
        // Emitir evento para atualizar o histórico no App.vue
        this.$emit('message-sent', response.data.conversation);
        
        // Scroll para o final para mostrar as novas mensagens
        this.scrollToBottom();
      } catch (error) {
        console.error('Error sending message:', error);
        if (error.response?.status === 401) {
          alert('Sessão expirada. Por favor, faça login novamente.');
          window.location.reload();
        } else {
          alert('Erro ao enviar mensagem. Tente novamente.');
        }
      } finally {
        this.isLoading = false;
        
        // Após enviar, manter foco no input para continuar digitando
        this.$nextTick(() => {
          if (this.$refs.messageInput) {
            this.$refs.messageInput.focus();
          }
          // Garantir scroll para o final após resposta
          this.scrollToBottom();
        });
      }
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatMessage(text) {
      if (!text) return '';
      
      // Escapar HTML para segurança
      let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Converter Markdown básico para HTML
      // Negrito: **texto** -> <strong>texto</strong>
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      
      // Itálico: *texto* -> <em>texto</em> (apenas se não for parte de **)
      formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
      
      // Converter quebras de linha \n para <br>
      formatted = formatted.replace(/\n/g, '<br>');
      
      return formatted;
    },
    
  }
}
</script>

<style scoped>
.chat-interface {
  display: flex;
  height: 100%;
  background: #FFFFFF;
  border: 1px solid #D4E4D4;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.chat-sidebar {
  width: 300px;
  background: #FFFFFF;
  border-right: 1px solid #D4E4D4;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  z-index: 2;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.02);
}

.chat-sidebar.collapsed {
  width: 50px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px;
  background: #F5F9F5;
  border-bottom: 2px solid #D4E4D4;
}

.sidebar-header h4 {
  margin: 0;
  color: #4A5D4E;
  font-weight: 600;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chat-sidebar.collapsed .sidebar-header h4 {
  display: none;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #4A5D4E;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #E8F0E8;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #8A9A8A;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.chat-sidebar.collapsed .sidebar-content {
  display: none;
}

.new-chat-btn {
  width: 100%;
  padding: 12px;
  background: #8BB28B;
  color: #2D3A2D;
  border: 1px solid #7AA27A;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: #7AA27A;
  color: #1F2A1F;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conversation-item {
  padding: 14px;
  background: #FFFFFF;
  border: 1px solid #E8F0E8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.conversation-item:hover {
  background: #F0F7F0;
  border-color: #8BB28B;
}

.conversation-item.active {
  background: linear-gradient(135deg, #E8F5E9 0%, #F0F7F0 100%);
  border-color: #8BB28B;
  box-shadow: 0 2px 8px rgba(139, 178, 139, 0.25);
  border-width: 2px;
}

.conversation-title {
  font-weight: 600;
  color: #4A5D4E;
  font-size: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #8A9A8A;
  gap: 8px;
}

.message-count {
  background: #E8F0E8;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.delete-conversation-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 4px;
}

.conversation-item:hover .delete-conversation-btn {
  opacity: 1;
}

.delete-conversation-btn:hover {
  transform: scale(1.2);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #F5F9F5;
  border-bottom: 1px solid #D4E4D4;
  position: relative;
  z-index: 1;
}

.chat-header-title {
  flex: 1;
}

.chat-header h3 {
  margin: 0 0 4px 0;
  color: #4A5D4E;
  font-weight: 600;
  font-size: 18px;
}

.chat-subtitle {
  margin: 0;
  color: #8A9A8A;
  font-size: 12px;
  font-weight: 400;
}

.chat-controls {
  display: flex;
  gap: 8px;
}

.new-chat-btn-header {
  background: #8BB28B;
  color: #2D3A2D;
  border: 1px solid #7AA27A;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.new-chat-btn-header:hover {
  background: #7AA27A;
  color: #1F2A1F;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8A9A8A;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.message {
  display: flex;
  margin-bottom: 8px;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.message.user .message-content {
  background: #A8C4A8;
  color: #2D3A2D;
  border-bottom-right-radius: 4px;
  border: 1px solid #8BB28B;
}

.message.assistant .message-content {
  background: #F5F9F5;
  color: #4A5D4E;
  border-bottom-left-radius: 4px;
  border: 1px solid #D4E4D4;
}

.message-text {
  margin-bottom: 4px;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Formatação de elementos dentro da mensagem */
.message-text strong {
  font-weight: 600;
  color: #2D3A2D;
}

.message.assistant .message-text strong {
  color: #4A5D4E;
}

.message-text em {
  font-style: italic;
  opacity: 0.9;
}

/* Espaçamento entre parágrafos (quebras de linha) */
.message-text br + br {
  display: block;
  content: "";
  margin-top: 0.5em;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}

.chat-input {
  display: flex;
  padding: 16px;
  background: #F5F9F5;
  border-top: 1px solid #D4E4D4;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.chat-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #D4E4D4;
  border-radius: 8px;
  background: #FFFFFF;
  color: #4A5D4E;
  font-size: 14px;
  transition: all 0.2s;
}

.chat-input input:focus {
  outline: none;
  border-color: #8BB28B;
  box-shadow: 0 0 0 3px rgba(139, 178, 139, 0.1);
}

.chat-input input:disabled {
  background: #F0F0F0;
  cursor: not-allowed;
}

.chat-input input::placeholder {
  color: #8A9A8A;
}

.chat-input button {
  padding: 12px 20px;
  background: #8BB28B;
  color: #2D3A2D;
  border: 1px solid #7AA27A;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.chat-input button:hover:not(:disabled) {
  background: #7AA27A;
  color: #1F2A1F;
}

.chat-input button:disabled {
  background: #D4E4D4;
  color: #8A9A8A;
  cursor: not-allowed;
  border-color: #D4E4D4;
}

/* Dark mode styles */
:global(.dark-mode) .chat-interface {
  background: #0F1A0F;
  color: #E8F0E8;
}

:global(.dark-mode) .chat-header {
  background: #1E2A1E;
  border-bottom-color: #3A4A3A;
}

:global(.dark-mode) .chat-sidebar {
  background: #1E2A1E;
  border-right-color: #3A4A3A;
}

:global(.dark-mode) .sidebar-header {
  background: #2D3A2D;
  border-bottom-color: #3A4A3A;
}

:global(.dark-mode) .sidebar-header h4 {
  color: #E8F0E8;
}

:global(.dark-mode) .toggle-btn {
  color: #E8F0E8;
}

:global(.dark-mode) .toggle-btn:hover {
  background: #3A4A3A;
}

:global(.dark-mode) .sidebar-content {
  background: #1E2A1E;
}

:global(.dark-mode) .section-title {
  color: #8A9A8A;
}

:global(.dark-mode) .new-chat-btn {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .new-chat-btn:hover {
  background: #5A7A5A;
  color: #FFFFFF;
}

:global(.dark-mode) .conversation-item {
  background: #2D3A2D;
  border-color: #4A5D4A;
}

:global(.dark-mode) .conversation-item:hover {
  background: #3A4A3A;
  border-color: #6B8E6B;
}

:global(.dark-mode) .conversation-item.active {
  background: linear-gradient(135deg, #2D3A2D 0%, #3A4A3A 100%);
  border-color: #6B8E6B;
}

:global(.dark-mode) .conversation-title {
  color: #E8F0E8;
}

:global(.dark-mode) .conversation-meta {
  color: #8A9A8A;
}

:global(.dark-mode) .message-count {
  background: #3A4A3A;
  color: #A8C4A8;
}

:global(.dark-mode) .delete-conversation-btn {
  color: #A8C4A8;
}

:global(.dark-mode) .chat-header-title h3 {
  color: #E8F0E8;
}

:global(.dark-mode) .chat-subtitle {
  color: #A8C4A8;
}

:global(.dark-mode) .new-chat-btn-header {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .new-chat-btn-header:hover {
  background: #5A7A5A;
  color: #FFFFFF;
}

:global(.dark-mode) .chat-messages {
  background: #0F1A0F;
}

:global(.dark-mode) .empty-state {
  color: #8A9A8A;
}

:global(.dark-mode) .message.user .message-content {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .message.assistant .message-content {
  background: #2D3A2D;
  color: #E8F0E8;
  border-color: #4A5D4A;
}

:global(.dark-mode) .message-text strong {
  color: #C4D4C4;
}

:global(.dark-mode) .message.assistant .message-text strong {
  color: #C4D4C4;
}

:global(.dark-mode) .chat-input {
  background: #1E2A1E;
  border-top-color: #3A4A3A;
}

:global(.dark-mode) .chat-input input {
  background: #2D3A2D;
  border-color: #4A5D4A;
  color: #E8F0E8;
}

:global(.dark-mode) .chat-input input:focus {
  border-color: #6B8E6B;
  box-shadow: 0 0 0 3px rgba(107, 142, 107, 0.2);
}

:global(.dark-mode) .chat-input input:disabled {
  background: #2D3A2D;
  color: #6B8E6B;
}

:global(.dark-mode) .chat-input input::placeholder {
  color: #6B8E6B;
}

:global(.dark-mode) .chat-input button {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .chat-input button:hover:not(:disabled) {
  background: #5A7A5A;
  color: #FFFFFF;
}

:global(.dark-mode) .chat-input button:disabled {
  background: #2D3A2D;
  color: #6B8E6B;
  border-color: #3A4A3A;
}

</style>
