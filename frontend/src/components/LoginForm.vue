<template>
  <div class="login-container">
    <PastelDots variant="scattered" :dotCount="25" />
    <div class="login-card">
      <div class="login-header">
        <h2>🏥 Medical Assistant</h2>
        <p>Faça login para continuar</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            required 
            placeholder="seu@email.com"
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Senha:</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            required
            placeholder="Digite sua senha"
            :disabled="isLoading"
          />
        </div>
        
        <button 
          type="submit" 
          :disabled="!email || !password || isLoading"
          class="login-btn"
        >
          {{ isLoading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
      
      <div class="login-footer">
        <p>
          Não tem uma conta? 
          <a href="#" @click.prevent="$emit('go-to-register')" class="register-link">
            Cadastre-se
          </a>
        </p>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import PastelDots from './PastelDots.vue';

export default {
  name: 'LoginForm',
  components: {
    PastelDots
  },
  emits: ['login-success', 'go-to-register'],
  data() {
    return {
      email: 'doctor@hospital.com',
      password: '',
      isLoading: false,
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.error = '';
      
      try {
        const response = await axios.post('/api/auth/login', {
          email: this.email,
          password: this.password
        });
        
        // Store session info
        localStorage.setItem('sessionId', response.data.sessionId);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Emit success event
        this.$emit('login-success', response.data);
        
      } catch (error) {
        console.error('Login error:', error);
        this.error = error.response?.data?.error || 'Erro ao fazer login. Tente novamente.';
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #E8F0E8 0%, #F0F7F0 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-card {
  background: #FFFFFF;
  border: 1px solid #D4E4D4;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  color: #6B8E6B;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #8A9A8A;
  margin: 0;
  font-size: 16px;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #4A5D4E;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D4E4D4;
  border-radius: 8px;
  background: #FFFFFF;
  color: #4A5D4E;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #8BB28B;
  box-shadow: 0 0 0 3px rgba(139, 178, 139, 0.1);
}

.form-group input::placeholder {
  color: #B4C4B4;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #8BB28B;
  color: #2D3A2D;
  border: 1px solid #7AA27A;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: #7AA27A;
  color: #1F2A1F;
  transform: translateY(-1px);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #D4E4D4;
}

.login-footer p {
  color: #6B8E6B;
  margin: 0;
  font-size: 14px;
}

.register-link {
  color: #8BB28B;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
}

.register-link:hover {
  text-decoration: underline;
}

.error-message {
  background: #F5D4D4;
  color: #8A4A4A;
  border: 1px solid #E4C4C4;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-card {
    padding: 24px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
}

/* Dark mode styles */
:global(.dark-mode) .login-container {
  background: #0F1A0F;
}

:global(.dark-mode) .login-card {
  background: #1E2A1E;
  border-color: #3A4A3A;
}

:global(.dark-mode) .login-header h2 {
  color: #E8F0E8;
}

:global(.dark-mode) .login-header p {
  color: #A8C4A8;
}

:global(.dark-mode) .form-group label {
  color: #E8F0E8;
}

:global(.dark-mode) .form-group input {
  background: #2D3A2D;
  border-color: #4A5D4A;
  color: #E8F0E8;
}

:global(.dark-mode) .form-group input:focus {
  border-color: #6B8E6B;
  box-shadow: 0 0 0 3px rgba(107, 142, 107, 0.2);
}

:global(.dark-mode) .form-group input::placeholder {
  color: #6B8E6B;
}

:global(.dark-mode) .login-btn {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .login-btn:hover:not(:disabled) {
  background: #5A7A5A;
  color: #FFFFFF;
}

:global(.dark-mode) .login-footer {
  border-top-color: #3A4A3A;
}

:global(.dark-mode) .login-footer p {
  color: #A8C4A8;
}

:global(.dark-mode) .register-link {
  color: #8BB28B;
}

:global(.dark-mode) .error-message {
  background: #4A2A2A;
  color: #F5D4D4;
  border-color: #6A3A3A;
}
</style>
