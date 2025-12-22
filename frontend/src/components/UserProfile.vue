<template>
  <div class="user-profile">
    <PastelDots variant="subtle" :dotCount="15" />
    <div class="profile-header">
      <h3>Meu Perfil</h3>
      <div class="header-actions">
        <button @click="toggleTheme" class="theme-toggle-btn" :title="isDarkMode ? 'Modo claro' : 'Modo escuro'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <button @click="toggleEdit" class="edit-btn">
          {{ isEditing ? 'Cancelar' : 'Editar' }}
        </button>
      </div>
    </div>
    
    <div v-if="!isEditing" class="profile-view">
      <div class="profile-info">
        <div class="info-item">
          <label>Nome:</label>
          <span>{{ user.name || 'Não informado' }}</span>
        </div>
        <div class="info-item">
          <label>Email:</label>
          <span>{{ user.email || 'Não informado' }}</span>
        </div>
        <div class="info-item">
          <label>Nível:</label>
          <span class="level-badge" :class="user.level">{{ getLevelText(user.level) }}</span>
        </div>
        <div class="info-item">
          <label>Interesses:</label>
          <div class="interests">
            <span v-for="interest in user.interests" :key="interest" class="interest-tag">
              {{ interest }}
            </span>
            <span v-if="!user.interests || user.interests.length === 0" class="no-interests">
              Nenhum interesse definido
            </span>
          </div>
        </div>
      </div>
      
      <div class="profile-stats">
        <h4>Estatísticas</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ chatStats.totalMessages || 0 }}</div>
            <div class="stat-label">Mensagens no Chat</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ activityProgress.completed || 0 }}</div>
            <div class="stat-label">Atividades Concluídas</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ Math.round(activityProgress.averageScore || 0) }}%</div>
            <div class="stat-label">Nota Média</div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="profile-edit">
      <form @submit.prevent="saveProfile">
        <div class="form-group">
          <label>Nome:</label>
          <input v-model="editForm.name" type="text" required />
        </div>
        
        <div class="form-group">
          <label>Email:</label>
          <input 
            :value="user.email || ''" 
            type="email" 
            disabled 
            class="disabled-input"
            title="O email não pode ser alterado"
          />
          <small class="form-hint">O email não pode ser alterado</small>
        </div>
        
        <div class="form-group">
          <label>Nível:</label>
          <select v-model="editForm.level">
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Interesses (separados por vírgula):</label>
          <input 
            v-model="interestsInput" 
            type="text" 
            placeholder="Ex: química orgânica, tabela periódica, reações"
          />
        </div>
        
        <div class="form-actions">
          <button type="submit" class="save-btn" :disabled="isSaving">
            {{ isSaving ? 'Salvando...' : 'Salvar' }}
          </button>
          <button type="button" @click="cancelEdit" class="cancel-btn" :disabled="isSaving">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import PastelDots from './PastelDots.vue';
import { useTheme } from '../composables/useTheme.js';

export default {
  name: 'UserProfile',
  components: {
    PastelDots
  },
  props: {
    userId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { isDarkMode, toggleTheme } = useTheme();
    return {
      isDarkMode,
      toggleTheme
    };
  },
  data() {
    return {
      user: {},
      chatStats: {},
      activityProgress: {},
      isEditing: false,
      isSaving: false,
      editForm: {
        name: '',
        level: 'beginner',
        interests: []
      },
      interestsInput: ''
    }
  },
  async mounted() {
    await this.loadUserData();
  },
  watch: {
    // Preencher formulário quando entrar em modo de edição e dados estiverem disponíveis
    isEditing(newVal) {
      if (newVal && this.user && Object.keys(this.user).length > 0) {
        this.populateEditForm();
      }
    },
    // Preencher formulário quando dados do usuário forem atualizados
    user: {
      handler(newVal) {
        if (this.isEditing && newVal && Object.keys(newVal).length > 0) {
          this.populateEditForm();
        }
      },
      deep: true
    }
  },
  methods: {
    populateEditForm() {
      // Preencher formulário com dados do usuário
      console.log('Populating edit form with user data:', this.user);
      this.editForm = {
        name: this.user.name || '',
        level: this.user.level || 'beginner',
        interests: [...(this.user.interests || [])]
      };
      this.interestsInput = (this.editForm.interests && this.editForm.interests.length > 0) 
        ? this.editForm.interests.join(', ') 
        : '';
      console.log('Edit form populated:', this.editForm);
      console.log('Interests input:', this.interestsInput);
    },
    async loadUserData() {
      try {
        const sessionId = localStorage.getItem('sessionId');
        const headers = sessionId ? { 'Session-ID': sessionId } : {};
        
        // Load user profile
        const userResponse = await axios.get(`/api/users/${this.userId}`, { headers });
        if (userResponse.data) {
          this.user = userResponse.data;
          console.log('User data loaded:', this.user);
        }
        
        // Load chat stats (pode falhar silenciosamente)
        try {
          const chatResponse = await axios.get(`/api/chat/stats/${this.userId}`, { headers });
          if (chatResponse.data) {
            this.chatStats = chatResponse.data;
          }
        } catch (chatError) {
          console.warn('Chat stats not available:', chatError);
          this.chatStats = {};
        }
        
        // Load activity progress (pode falhar silenciosamente)
        try {
          const activityResponse = await axios.get(`/api/student-activities/user/${this.userId}/progress`, { headers });
          if (activityResponse.data) {
            this.activityProgress = activityResponse.data;
          }
        } catch (activityError) {
          console.warn('Activity progress not available:', activityError);
          this.activityProgress = {};
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        // If user doesn't exist, create a default one
        if (error.response?.status === 404) {
          await this.createDefaultUser();
        } else {
          // Se houver outro erro, garantir que user tenha pelo menos estrutura básica
          if (!this.user || Object.keys(this.user).length === 0) {
            this.user = {
              name: '',
              email: '',
              level: 'beginner',
              interests: []
            };
          }
        }
      }
    },
    
    async createDefaultUser() {
      try {
        const response = await axios.post('/api/users', {
          name: 'Usuário',
          email: `user${this.userId}@example.com`,
          level: 'beginner',
          interests: []
        });
        this.user = response.data;
      } catch (error) {
        console.error('Error creating user:', error);
      }
    },
    
    async toggleEdit() {
      if (!this.isEditing) {
        // Recarregar dados do usuário antes de entrar em modo de edição
        await this.loadUserData();
        
        // Aguardar próximo ciclo do Vue para garantir que os dados foram atualizados
        await this.$nextTick();
        
        // Preencher formulário com dados atualizados
        this.populateEditForm();
        
        // Ativar modo de edição após preencher o formulário
        this.isEditing = true;
      } else {
        // Se já está editando, apenas desativa
        this.isEditing = false;
      }
    },
    
    async saveProfile() {
      if (this.isSaving) return;
      
      try {
        this.isSaving = true;
        
        // Processar interesses
        const interests = this.interestsInput
          .split(',')
          .map(i => i.trim())
          .filter(i => i.length > 0);
        
        // Preparar dados para envio (sem email)
        const updateData = {
          name: this.editForm.name,
          level: this.editForm.level,
          interests: interests
        };
        
        // Fazer requisição de atualização
        const sessionId = localStorage.getItem('sessionId');
        const headers = sessionId ? { 'Session-ID': sessionId } : {};
        const response = await axios.put(`/api/users/${this.userId}`, updateData, { headers });
        
        // Atualizar dados do usuário
        this.user = response.data;
        this.isEditing = false;
        
        // Recarregar todos os dados para garantir sincronização
        await this.loadUserData();
      } catch (error) {
        console.error('Error saving profile:', error);
        const errorMessage = error.response?.data?.error || 'Erro ao salvar perfil. Tente novamente.';
        alert(errorMessage);
      } finally {
        this.isSaving = false;
      }
    },
    
    cancelEdit() {
      if (this.isSaving) return;
      this.isEditing = false;
      // Resetar formulário
      this.editForm = {
        name: '',
        level: 'beginner',
        interests: []
      };
      this.interestsInput = '';
    },
    
    getLevelText(level) {
      const levels = {
        beginner: 'Iniciante',
        intermediate: 'Intermediário',
        advanced: 'Avançado'
      };
      return levels[level] || 'Iniciante';
    }
  }
}
</script>

<style scoped>
.user-profile {
  background: #FFFFFF;
  border: 1px solid #D4E4D4;
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #D4E4D4;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.theme-toggle-btn {
  background: #E8F0E8;
  color: #4A5D4E;
  border: 1px solid #D4E4D4;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 36px;
}

.theme-toggle-btn:hover {
  background: #D4E4D4;
  transform: scale(1.1);
}

.profile-header h3 {
  margin: 0;
  color: #4A5D4E;
  font-weight: 600;
}

.edit-btn {
  background: #8BB28B;
  color: #2D3A2D;
  border: 1px solid #7AA27A;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #7AA27A;
  color: #1F2A1F;
}

.profile-info {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.info-item label {
  font-weight: 500;
  color: #6B8E6B;
  margin-bottom: 4px;
  font-size: 14px;
}

.info-item span {
  color: #4A5D4E;
  font-size: 16px;
}

.level-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.level-badge.beginner {
  background: #28a745;
  color: white;
}

.level-badge.intermediate {
  background: #ffc107;
  color: #000;
}

.level-badge.advanced {
  background: #dc3545;
  color: white;
}

.interests {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.interest-tag {
  background: #E8F0E8;
  color: #6B8E6B;
  border: 1px solid #D4E4D4;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.no-interests {
  color: #8A9A8A;
  font-style: italic;
}

.profile-stats h4 {
  color: #4A5D4E;
  margin-bottom: 16px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #F5F9F5;
  border-radius: 12px;
  border: 1px solid #D4E4D4;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #6B8E6B;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #8A9A8A;
}

.profile-edit {
  background: #F5F9F5;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #D4E4D4;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #4A5D4E;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #D4E4D4;
  border-radius: 8px;
  background: #FFFFFF;
  color: #4A5D4E;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #8BB28B;
  box-shadow: 0 0 0 3px rgba(139, 178, 139, 0.1);
}

.form-group input::placeholder {
  color: #B4C4B4;
}

.form-group input.disabled-input {
  background: #F5F9F5;
  color: #8A9A8A;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #8A9A8A;
  font-style: italic;
}

.save-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.save-btn {
  background: #8BB28B;
  color: #2D3A2D;
  border: 1px solid #7AA27A;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #7AA27A;
  color: #1F2A1F;
}

.cancel-btn {
  background: #E8F0E8;
  color: #6B8E6B;
  border: 1px solid #D4E4D4;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #D4E4D4;
  color: #5A7A5A;
}

/* Dark mode styles */
:global(.dark-mode) .user-profile {
  background: #1E2A1E;
  border-color: #3A4A3A;
  color: #E8F0E8;
}

:global(.dark-mode) .profile-header {
  border-bottom-color: #3A4A3A;
}

:global(.dark-mode) .profile-header h3 {
  color: #E8F0E8;
}

:global(.dark-mode) .theme-toggle-btn {
  background: #2D3A2D;
  color: #E8F0E8;
  border-color: #4A5D4A;
}

:global(.dark-mode) .theme-toggle-btn:hover {
  background: #3A4A3A;
}

:global(.dark-mode) .edit-btn {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .edit-btn:hover {
  background: #5A7A5A;
  color: #FFFFFF;
}

:global(.dark-mode) .info-item label {
  color: #A8C4A8;
}

:global(.dark-mode) .info-item span {
  color: #E8F0E8;
}

:global(.dark-mode) .interest-tag {
  background: #2D3A2D;
  color: #A8C4A8;
  border-color: #4A5D4A;
}

:global(.dark-mode) .no-interests {
  color: #6B8E6B;
}

:global(.dark-mode) .profile-stats h4 {
  color: #E8F0E8;
}

:global(.dark-mode) .stat-item {
  background: #2D3A2D;
  border-color: #4A5D4A;
}

:global(.dark-mode) .stat-value {
  color: #A8C4A8;
}

:global(.dark-mode) .stat-label {
  color: #8A9A8A;
}

:global(.dark-mode) .profile-edit {
  background: #2D3A2D;
  border-color: #4A5D4A;
}

:global(.dark-mode) .form-group label {
  color: #E8F0E8;
}

:global(.dark-mode) .form-group input,
:global(.dark-mode) .form-group select {
  background: #1E2A1E;
  border-color: #4A5D4A;
  color: #E8F0E8;
}

:global(.dark-mode) .form-group input:focus,
:global(.dark-mode) .form-group select:focus {
  border-color: #6B8E6B;
  box-shadow: 0 0 0 3px rgba(107, 142, 107, 0.2);
}

:global(.dark-mode) .form-group input.disabled-input {
  background: #2D3A2D;
  color: #6B8E6B;
}

:global(.dark-mode) .form-hint {
  color: #6B8E6B;
}

:global(.dark-mode) .save-btn {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .save-btn:hover {
  background: #5A7A5A;
  color: #FFFFFF;
}

:global(.dark-mode) .cancel-btn {
  background: #2D3A2D;
  color: #A8C4A8;
  border-color: #4A5D4A;
}

:global(.dark-mode) .cancel-btn:hover {
  background: #3A4A3A;
  color: #C4D4C4;
}
</style>
