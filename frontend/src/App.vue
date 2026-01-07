<template>
  <!-- Login/Register Screen -->
  <div v-if="!isAuthenticated" class="auth-screen">
    <LoginForm 
      v-if="authMode === 'login'"
      @login-success="handleLoginSuccess" 
      @go-to-register="authMode = 'register'"
    />
    <RegisterForm 
      v-else
      @register-success="handleRegisterSuccess"
      @go-to-login="authMode = 'login'"
    />
  </div>
  
  <!-- Main Medical App -->
  <div v-else class="app">
    <PastelDots variant="subtle" :dotCount="15" />
    
    <!-- Sidebar -->
    <aside :class="['sidebar', { collapsed: sidebarCollapsed }]">
      <button @click="toggleSidebar" class="sidebar-toggle" :title="sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'">
        {{ sidebarCollapsed ? '▶' : '◀' }}
      </button>
      
      <div class="sidebar-header">
        <h2 v-if="!sidebarCollapsed">🏥 MedAssist</h2>
        <div class="user-info">
          <div class="user-avatar">{{ userInitials }}</div>
          <div v-if="!sidebarCollapsed" class="user-details">
            <div class="user-name">{{ currentUser.name || 'Usuário' }}</div>
            <div class="user-role">{{ getRoleText(currentUser.role) }}</div>
            <div class="user-specialty" v-if="currentUser.specialty">{{ currentUser.specialty }}</div>
          </div>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <button 
          @click="activeTab = 'dashboard'" 
          :class="['nav-item', { active: activeTab === 'dashboard' }]"
          :title="sidebarCollapsed ? 'Dashboard' : ''"
        >
          <span class="nav-icon">📊</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Dashboard</span>
        </button>
        
        <button 
          @click="activeTab = 'patients'" 
          :class="['nav-item', { active: activeTab === 'patients' }]"
          :title="sidebarCollapsed ? 'Pacientes' : ''"
        >
          <span class="nav-icon">👥</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Pacientes</span>
        </button>
        
        <button 
          @click="activeTab = 'assistant'" 
          :class="['nav-item', { active: activeTab === 'assistant' }]"
          :title="sidebarCollapsed ? 'Assistente' : ''"
        >
          <span class="nav-icon">🤖</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Assistente IA</span>
        </button>
        
        <button 
          @click="activeTab = 'workflows'" 
          :class="['nav-item', { active: activeTab === 'workflows' }]"
          :title="sidebarCollapsed ? 'Workflows' : ''"
        >
          <span class="nav-icon">🔄</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Workflows</span>
        </button>
        
        <button 
          @click="activeTab = 'profile'" 
          :class="['nav-item', { active: activeTab === 'profile' }]"
          :title="sidebarCollapsed ? 'Perfil' : ''"
        >
          <span class="nav-icon">👤</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Perfil</span>
        </button>
      </nav>
      
      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn" :title="sidebarCollapsed ? 'Sair' : ''">
          <span v-if="sidebarCollapsed">🚪</span>
          <span v-else>Sair</span>
        </button>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="content">
      <div class="content-header">
        <h1>{{ getTabTitle() }}</h1>
      </div>
      
      <div class="content-body">
        <!-- Dashboard Tab -->
        <div v-if="activeTab === 'dashboard'" class="tab-content">
          <div class="dashboard-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.activePatients || 0 }}</div>
                <div class="stat-label">Pacientes Ativos</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">💬</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.queriesToday || 0 }}</div>
                <div class="stat-label">Consultas Hoje</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">⚠️</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.pendingReviews || 0 }}</div>
                <div class="stat-label">Aguardando Revisão</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">🔬</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.pendingExams || 0 }}</div>
                <div class="stat-label">Exames Pendentes</div>
              </div>
            </div>
          </div>
          
          <div class="welcome-section">
            <h2>Bem-vindo ao Medical Assistant</h2>
            <p>Sistema de assistente virtual médico com IA para suporte à decisão clínica.</p>
            <div class="quick-actions">
              <button @click="activeTab = 'patients'" class="action-btn">
                <span>👥</span> Ver Pacientes
              </button>
              <button @click="activeTab = 'assistant'" class="action-btn">
                <span>🤖</span> Consultar IA
              </button>
              <button @click="activeTab = 'workflows'" class="action-btn">
                <span>🔄</span> Iniciar Workflow
              </button>
            </div>
          </div>
        </div>
        
        <!-- Patients Tab -->
        <div v-if="activeTab === 'patients'" class="tab-content">
          <div class="patients-header">
            <input 
              v-model="patientSearch" 
              type="text" 
              placeholder="Buscar paciente..." 
              class="search-input"
            />
            <button @click="loadPatients" class="refresh-btn">🔄 Atualizar</button>
          </div>
          
          <div class="patients-list">
            <div v-if="patients.length === 0" class="empty-state">
              <div class="empty-icon">👥</div>
              <p>Nenhum paciente encontrado</p>
              <p class="empty-hint">Execute o script de seed para criar pacientes de exemplo</p>
            </div>
            
            <div 
              v-for="patient in filteredPatients" 
              :key="patient._id"
              class="patient-card"
              @click="selectPatient(patient)"
            >
              <div class="patient-header">
                <div class="patient-id">{{ patient.anonymizedId }}</div>
                <div :class="['patient-status', patient.status]">{{ patient.status }}</div>
              </div>
              <div class="patient-info">
                <div class="patient-name">{{ patient.name }}</div>
                <div class="patient-meta">
                  {{ patient.age }} anos • {{ getGenderText(patient.gender) }}
                </div>
              </div>
              <div class="patient-conditions" v-if="patient.medicalHistory && patient.medicalHistory.length > 0">
                <span 
                  v-for="(condition, idx) in patient.medicalHistory.slice(0, 3)" 
                  :key="idx"
                  class="condition-tag"
                >
                  {{ condition.condition }}
                </span>
                <span v-if="patient.medicalHistory.length > 3" class="condition-more">
                  +{{ patient.medicalHistory.length - 3 }} mais
                </span>
              </div>
              <div class="patient-medications" v-if="patient.currentMedications && patient.currentMedications.length > 0">
                <div class="medications-label">💊 {{ patient.currentMedications.length }} medicamento(s)</div>
              </div>
              <div class="patient-allergies" v-if="patient.allergies && patient.allergies.length > 0">
                <div class="allergies-label">⚠️ {{ patient.allergies.length }} alergia(s)</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Assistant Tab -->
        <div v-if="activeTab === 'assistant'" class="tab-content">
          <div class="assistant-container">
            <div class="assistant-sidebar">
              <h3>Contexto do Paciente</h3>
              <select v-model="selectedPatientId" class="patient-select">
                <option :value="null">Sem paciente selecionado</option>
                <option v-for="patient in patients" :key="patient._id" :value="patient._id">
                  {{ patient.anonymizedId }} - {{ patient.name }}
                </option>
              </select>
              
              <div v-if="selectedPatientId" class="patient-context">
                <h4>Informações do Paciente</h4>
                <div class="context-item">
                  <strong>ID:</strong> {{ getSelectedPatient()?.anonymizedId }}
                </div>
                <div class="context-item">
                  <strong>Idade:</strong> {{ getSelectedPatient()?.age }} anos
                </div>
                <div class="context-item">
                  <strong>Gênero:</strong> {{ getGenderText(getSelectedPatient()?.gender) }}
                </div>
                <div class="context-item" v-if="getSelectedPatient()?.medicalHistory?.length > 0">
                  <strong>Condições Médicas:</strong>
                  <ul class="context-list">
                    <li v-for="(condition, idx) in getSelectedPatient().medicalHistory" :key="idx">
                      {{ condition.condition }} <span class="condition-status">({{ condition.status }})</span>
                    </li>
                  </ul>
                </div>
                <div class="context-item">
                  <strong>Alergias:</strong> 
                  <span v-if="getSelectedPatient()?.allergies?.length > 0">
                    <ul class="context-list">
                      <li v-for="(allergy, idx) in getSelectedPatient().allergies" :key="idx">
                        {{ allergy.allergen }} <span class="allergy-severity">({{ allergy.severity }})</span>
                      </li>
                    </ul>
                  </span>
                  <span v-else>Nenhuma registrada</span>
                </div>
                <div class="context-item" v-if="getSelectedPatient()?.currentMedications?.length > 0">
                  <strong>Medicamentos Atuais:</strong>
                  <ul class="context-list">
                    <li v-for="(med, idx) in getSelectedPatient().currentMedications" :key="idx">
                      {{ med.medication }} <span v-if="med.dosage" class="med-dosage">({{ med.dosage }})</span>
                    </li>
                  </ul>
                </div>
                <div class="context-item" v-if="getSelectedPatient()?.vitalSigns">
                  <strong>Sinais Vitais:</strong>
                  <div class="vital-signs">
                    <span v-if="getSelectedPatient().vitalSigns.bloodPressure">
                      PA: {{ getSelectedPatient().vitalSigns.bloodPressure.systolic }}/{{ getSelectedPatient().vitalSigns.bloodPressure.diastolic }}
                    </span>
                    <span v-if="getSelectedPatient().vitalSigns.heartRate">
                      FC: {{ getSelectedPatient().vitalSigns.heartRate }} bpm
                    </span>
                    <span v-if="getSelectedPatient().vitalSigns.temperature">
                      Temp: {{ getSelectedPatient().vitalSigns.temperature }}°C
                    </span>
                  </div>
                </div>
                <div class="context-item" v-if="getSelectedPatient()?.admissionDate">
                  <strong>Data de Admissão:</strong> {{ formatDate(getSelectedPatient().admissionDate) }}
                </div>
              </div>
            </div>
            
            <div class="assistant-chat">
              <div class="chat-messages" ref="chatMessages">
                <div v-if="messages.length === 0" class="empty-chat">
                  <div class="empty-icon">🤖</div>
                  <p>Faça uma pergunta ao assistente médico</p>
                  <p class="empty-hint">O assistente pode consultar protocolos, sugerir tratamentos e analisar dados de pacientes</p>
                </div>
                
                <div 
                  v-for="(message, idx) in messages" 
                  :key="idx"
                  :class="['message', message.role]"
                >
                  <div class="message-content">
                    <div class="message-text">{{ message.content }}</div>
                    <div v-if="message.sources && message.sources.length > 0" class="message-sources">
                      <strong>Fontes:</strong>
                      <span v-for="(source, sidx) in message.sources" :key="sidx" class="source-tag" :title="source.excerpt">
                        {{ source.title || source.reference }}
                      </span>
                    </div>
                    <div v-if="message.requiresReview" class="review-warning">
                      ⚠️ Requer validação médica
                    </div>
                  </div>
                </div>
                
                <div v-if="isLoading" class="message assistant">
                  <div class="message-content">
                    <div class="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="chat-input-container">
                <textarea 
                  v-model="currentMessage"
                  @keydown.enter.prevent="sendMessage"
                  placeholder="Digite sua pergunta médica..."
                  class="chat-input"
                  rows="3"
                ></textarea>
                <button @click="sendMessage" :disabled="!currentMessage.trim() || isLoading" class="send-btn">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Workflows Tab -->
        <div v-if="activeTab === 'workflows'" class="tab-content">
          <div class="workflows-grid">
            <div class="workflow-card">
              <div class="workflow-icon">🏥</div>
              <h3>Admissão de Paciente</h3>
              <p>Criar registro, verificar exames e gerar avaliação inicial</p>
              <button class="workflow-btn" disabled>Em breve</button>
            </div>
            
            <div class="workflow-card">
              <div class="workflow-icon">💊</div>
              <h3>Sugestão de Tratamento</h3>
              <p>Analisar paciente e sugerir tratamentos baseados em protocolos</p>
              <button class="workflow-btn" disabled>Em breve</button>
            </div>
            
            <div class="workflow-card">
              <div class="workflow-icon">🔬</div>
              <h3>Verificação de Exames</h3>
              <p>Verificar exames pendentes e analisar resultados</p>
              <button class="workflow-btn" disabled>Em breve</button>
            </div>
          </div>
        </div>
        
        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="tab-content">
          <UserProfile :userId="currentUserId" />
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import LoginForm from './components/LoginForm.vue';
import RegisterForm from './components/RegisterForm.vue';
import PastelDots from './components/PastelDots.vue';
import UserProfile from './components/UserProfile.vue';
import apiConfig from './config/api.js';

export default {
  components: { LoginForm, RegisterForm, PastelDots, UserProfile },
  setup() {
    const activeTab = ref('dashboard');
    const isAuthenticated = ref(false);
    const authMode = ref('login');
    const sessionId = ref('');
    const currentUserId = ref('');
    const currentUser = ref({});
    const sidebarCollapsed = ref(false);
    
    // Dashboard stats
    const stats = ref({
      activePatients: 0,
      queriesToday: 0,
      pendingReviews: 0,
      pendingExams: 0
    });
    
    // Patients
    const patients = ref([]);
    const patientSearch = ref('');
    const selectedPatientId = ref(null);
    
    // Assistant
    const messages = ref([]);
    const currentMessage = ref('');
    const isLoading = ref(false);
    const chatMessages = ref(null);

    const userInitials = computed(() => {
      const name = currentUser.value.name || 'Usuário';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    });

    const filteredPatients = computed(() => {
      if (!patientSearch.value) return patients.value;
      const search = patientSearch.value.toLowerCase();
      return patients.value.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.anonymizedId.toLowerCase().includes(search)
      );
    });

    function checkAuth() {
      const storedSessionId = localStorage.getItem('sessionId');
      const storedUser = localStorage.getItem('user');
      
      if (storedSessionId && storedUser) {
        sessionId.value = storedSessionId;
        currentUser.value = JSON.parse(storedUser);
        currentUserId.value = currentUser.value._id;
        isAuthenticated.value = true;
        return true;
      }
      return false;
    }

    async function handleLoginSuccess(loginData) {
      sessionId.value = loginData.sessionId;
      currentUser.value = loginData.user;
      currentUserId.value = loginData.user._id;
      isAuthenticated.value = true;
      
      await loadInitialData();
    }

    async function handleRegisterSuccess(registerData) {
      sessionId.value = registerData.sessionId;
      currentUser.value = registerData.user;
      currentUserId.value = registerData.user._id;
      isAuthenticated.value = true;
      
      await loadInitialData();
    }

    async function handleLogout() {
      try {
        if (sessionId.value) {
          await axios.post(`${apiConfig.baseURL}/api/auth/logout`, {
            sessionId: sessionId.value
          });
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        sessionId.value = '';
        currentUserId.value = '';
        currentUser.value = {};
        isAuthenticated.value = false;
        authMode.value = 'login';
        activeTab.value = 'dashboard';
      }
    }

    async function loadInitialData() {
      await loadPatients();
      await loadStats();
    }

    async function loadPatients() {
      try {
        const response = await axios.get(`${apiConfig.baseURL}/api/patients`, {
          headers: { 'Session-ID': sessionId.value }
        });
        patients.value = response.data.data || [];
        console.log('Loaded patients:', patients.value.length);
      } catch (error) {
        console.error('Error loading patients:', error);
        patients.value = [];
      }
    }

    async function loadStats() {
      // Placeholder - implement when backend stats endpoint is ready
      stats.value = {
        activePatients: patients.value.length,
        queriesToday: 0,
        pendingReviews: 0,
        pendingExams: 0
      };
    }

    function selectPatient(patient) {
      selectedPatientId.value = patient._id;
      activeTab.value = 'assistant';
    }

    function getSelectedPatient() {
      return patients.value.find(p => p._id === selectedPatientId.value);
    }

    async function sendMessage() {
      if (!currentMessage.value.trim() || isLoading.value) return;
      
      const userMessage = currentMessage.value.trim();
      messages.value.push({
        role: 'user',
        content: userMessage
      });
      
      currentMessage.value = '';
      isLoading.value = true;
      
      try {
        const response = await axios.post(
          `${apiConfig.baseURL}/api/medical/query`,
          {
            question: userMessage,
            patientId: selectedPatientId.value,
            queryType: 'general_medical'
          },
          {
            headers: { 'Session-ID': sessionId.value }
          }
        );
        
        messages.value.push({
          role: 'assistant',
          content: response.data.data.answer,
          sources: response.data.data.sources,
          requiresReview: response.data.data.requiresReview
        });
        
        // Scroll to bottom
        setTimeout(() => {
          if (chatMessages.value) {
            chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
          }
        }, 100);
        
      } catch (error) {
        console.error('Error sending message:', error);
        messages.value.push({
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.'
        });
      } finally {
        isLoading.value = false;
      }
    }

    function getTabTitle() {
      const titles = {
        dashboard: 'Dashboard',
        patients: 'Pacientes',
        assistant: 'Assistente Médico IA',
        workflows: 'Workflows Automatizados',
        profile: 'Meu Perfil'
      };
      return titles[activeTab.value] || 'MedAssist';
    }

    function getRoleText(role) {
      const roles = {
        doctor: 'Médico',
        nurse: 'Enfermeiro(a)',
        admin: 'Administrador',
        specialist: 'Especialista',
        student: 'Estudante'
      };
      return roles[role] || 'Profissional';
    }

    function getGenderText(gender) {
      const genders = {
        male: 'Masculino',
        female: 'Feminino',
        other: 'Outro',
        not_specified: 'Não especificado'
      };
      return genders[gender] || 'Não especificado';
    }

    function formatDate(date) {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    function toggleSidebar() {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    }

    onMounted(() => {
      if (checkAuth()) {
        loadInitialData();
      }
    });

    return {
      activeTab,
      isAuthenticated,
      authMode,
      sessionId,
      currentUserId,
      currentUser,
      userInitials,
      sidebarCollapsed,
      stats,
      patients,
      patientSearch,
      filteredPatients,
      selectedPatientId,
      messages,
      currentMessage,
      isLoading,
      chatMessages,
      handleLoginSuccess,
      handleRegisterSuccess,
      handleLogout,
      loadPatients,
      selectPatient,
      getSelectedPatient,
      sendMessage,
      getTabTitle,
      getRoleText,
      getGenderText,
      formatDate,
      toggleSidebar
    };
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F0F4F8;
  color: #2D3748;
}

.app {
  display: flex;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: #FFFFFF;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 2;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  right: -15px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: #FFFFFF;
  border: 2px solid #E2E8F0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #4299E1;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background: #EBF8FF;
  border-color: #4299E1;
  transform: translateY(-50%) scale(1.1);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #E2E8F0;
}

.sidebar.collapsed .sidebar-header {
  padding: 24px 10px;
}

.sidebar-header h2 {
  margin: 0 0 16px 0;
  color: #2B6CB0;
  font-size: 20px;
  font-weight: 600;
}

.sidebar.collapsed .sidebar-header h2 {
  display: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar.collapsed .user-info {
  justify-content: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4299E1;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.sidebar.collapsed .user-details {
  display: none;
}

.user-name {
  color: #2D3748;
  font-weight: 500;
  font-size: 14px;
}

.user-role {
  color: #718096;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-specialty {
  color: #4299E1;
  font-size: 11px;
  margin-top: 2px;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  color: #4A5568;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  gap: 12px;
}

.sidebar.collapsed .nav-item {
  padding: 12px;
  justify-content: center;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.nav-item:hover {
  background: #EBF8FF;
  color: #2B6CB0;
}

.nav-item.active {
  background: #EBF8FF;
  color: #2B6CB0;
  border-left-color: #4299E1;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #E2E8F0;
}

.logout-btn {
  background: linear-gradient(135deg, #FC8181 0%, #F56565 100%);
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.logout-btn:hover {
  background: linear-gradient(135deg, #F56565 0%, #E53E3E 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
}

/* Content */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 24px 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
}

.content-header h1 {
  margin: 0;
  color: #2D3748;
  font-size: 24px;
  font-weight: 600;
}

.content-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

/* Dashboard */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EBF8FF;
  border-radius: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #2B6CB0;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

.welcome-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.welcome-section h2 {
  margin: 0 0 8px 0;
  color: #2D3748;
}

.welcome-section p {
  color: #718096;
  margin: 0 0 24px 0;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  background: #4299E1;
  color: #FFFFFF;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #3182CE;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

/* Patients */
.patients-header {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
}

.refresh-btn {
  padding: 12px 24px;
  background: #4299E1;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.patients-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.patient-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.patient-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.patient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.patient-id {
  font-size: 12px;
  color: #718096;
  font-family: monospace;
}

.patient-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.patient-status.active {
  background: #C6F6D5;
  color: #22543D;
}

.patient-name {
  font-size: 16px;
  font-weight: 600;
  color: #2D3748;
  margin-bottom: 4px;
}

.patient-meta {
  font-size: 13px;
  color: #718096;
}

.patient-conditions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.condition-tag {
  padding: 4px 8px;
  background: #EBF8FF;
  color: #2B6CB0;
  border-radius: 4px;
  font-size: 11px;
}

/* Assistant */
.assistant-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  height: calc(100vh - 200px);
}

.assistant-sidebar {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.assistant-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2D3748;
}

.patient-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.patient-context {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
}

.patient-context h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #2D3748;
}

.context-item {
  margin-bottom: 12px;
  font-size: 13px;
  color: #4A5568;
}

.context-item strong {
  color: #2D3748;
  display: block;
  margin-bottom: 4px;
}

.context-list {
  margin: 4px 0 0 0;
  padding-left: 20px;
  list-style-type: disc;
}

.context-list li {
  margin-bottom: 4px;
}

.condition-status {
  font-size: 11px;
  color: #718096;
  font-style: italic;
}

.allergy-severity {
  font-size: 11px;
  color: #E53E3E;
  font-weight: 600;
}

.med-dosage {
  font-size: 11px;
  color: #718096;
}

.vital-signs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.vital-signs span {
  font-size: 12px;
  color: #4A5568;
}

.condition-more {
  padding: 4px 8px;
  background: #F7FAFC;
  color: #718096;
  border-radius: 4px;
  font-size: 11px;
  font-style: italic;
}

.patient-medications,
.patient-allergies {
  margin-top: 8px;
}

.medications-label,
.allergies-label {
  font-size: 11px;
  color: #718096;
  padding: 4px 8px;
  background: #F7FAFC;
  border-radius: 4px;
  display: inline-block;
}

.assistant-chat {
  background: #FFFFFF;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-chat {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-hint {
  font-size: 13px;
  color: #A0AEC0;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
}

.message.user .message-content {
  background: #4299E1;
  color: #FFFFFF;
}

.message.assistant .message-content {
  background: #F7FAFC;
  color: #2D3748;
}

.message-sources {
  margin-top: 8px;
  font-size: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.source-tag {
  padding: 2px 6px;
  background: #EBF8FF;
  color: #2B6CB0;
  border-radius: 4px;
  font-family: monospace;
}

.review-warning {
  margin-top: 8px;
  padding: 8px;
  background: #FED7D7;
  color: #742A2A;
  border-radius: 4px;
  font-size: 12px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #A0AEC0;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input-container {
  padding: 20px;
  border-top: 1px solid #E2E8F0;
  display: flex;
  gap: 12px;
}

.chat-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
}

.send-btn {
  padding: 12px 24px;
  background: #4299E1;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.send-btn:disabled {
  background: #CBD5E0;
  cursor: not-allowed;
}

/* Workflows */
.workflows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.workflow-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.workflow-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.workflow-card h3 {
  margin: 0 0 8px 0;
  color: #2D3748;
}

.workflow-card p {
  color: #718096;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.workflow-btn {
  padding: 10px 20px;
  background: #4299E1;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.workflow-btn:disabled {
  background: #CBD5E0;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

/* Auth Screen */
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
