<template>
  <div class="register-container">
    <PastelDots variant="scattered" :dotCount="25" />
    <div class="register-card">
      <div class="register-header">
        <h2>🏥 Medical Assistant</h2>
        <p>Crie sua conta</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="name">Nome:</label>
          <input 
            id="name"
            v-model="name" 
            type="text" 
            required 
            placeholder="Seu nome completo"
            :disabled="isLoading"
          />
        </div>
        
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
            minlength="6"
            placeholder="Mínimo 6 caracteres"
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirmar Senha:</label>
          <input 
            id="confirmPassword"
            v-model="confirmPassword" 
            type="password" 
            required 
            placeholder="Digite a senha novamente"
            :disabled="isLoading"
          />
        </div>
        
        <button 
          type="submit" 
          :disabled="!isFormValid || isLoading"
          class="register-btn"
        >
          {{ isLoading ? 'Cadastrando...' : 'Cadastrar' }}
        </button>
      </form>
      
      <div class="register-footer">
        <p>
          Já tem uma conta? 
          <a href="#" @click.prevent="$emit('go-to-login')" class="login-link">
            Fazer login
          </a>
        </p>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import PastelDots from './PastelDots.vue';

export default {
  name: 'RegisterForm',
  components: {
    PastelDots
  },
  emits: ['register-success', 'go-to-login'],
  data() {
    return {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      isLoading: false,
      error: '',
      success: ''
    }
  },
  computed: {
    isFormValid() {
      return this.name && 
             this.email && 
             this.password && 
             this.confirmPassword &&
             this.password.length >= 6 &&
             this.password === this.confirmPassword;
    }
  },
  watch: {
    password() {
      if (this.password && this.password.length < 6) {
        this.error = 'Senha deve ter no mínimo 6 caracteres';
      } else if (this.confirmPassword && this.password !== this.confirmPassword) {
        this.error = 'As senhas não coincidem';
      } else {
        this.error = '';
      }
    },
    confirmPassword() {
      if (this.password !== this.confirmPassword) {
        this.error = 'As senhas não coincidem';
      } else {
        this.error = '';
      }
    }
  },
  methods: {
    async handleRegister() {
      if (this.password !== this.confirmPassword) {
        this.error = 'As senhas não coincidem';
        return;
      }

      if (this.password.length < 6) {
        this.error = 'Senha deve ter no mínimo 6 caracteres';
        return;
      }

      this.isLoading = true;
      this.error = '';
      this.success = '';
      
      try {
        const response = await axios.post('/api/auth/register', {
          name: this.name,
          email: this.email,
          password: this.password
        });
        
        // Store session info
        localStorage.setItem('sessionId', response.data.sessionId);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        this.success = 'Conta criada com sucesso! Redirecionando...';
        
        // Emit success event after short delay
        setTimeout(() => {
          this.$emit('register-success', response.data);
        }, 1000);
        
      } catch (error) {
        console.error('Register error:', error);
        this.error = error.response?.data?.error || 'Erro ao cadastrar. Tente novamente.';
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #E8F0E8 0%, #F0F7F0 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.register-card {
  background: #FFFFFF;
  border: 1px solid #D4E4D4;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h2 {
  color: #6B8E6B;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.register-header p {
  color: #8A9A8A;
  margin: 0;
  font-size: 16px;
}

.register-form {
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
  box-sizing: border-box;
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

.register-btn {
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
  margin-top: 8px;
}

.register-btn:hover:not(:disabled) {
  background: #7AA27A;
  color: #1F2A1F;
  transform: translateY(-1px);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.register-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #D4E4D4;
}

.register-footer p {
  color: #6B8E6B;
  margin: 0;
  font-size: 14px;
}

.login-link {
  color: #8BB28B;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
}

.login-link:hover {
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
  margin-top: 16px;
}

.success-message {
  background: #D4F5D4;
  color: #4A8A4A;
  border: 1px solid #C4E4C4;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 480px) {
  .register-container {
    padding: 16px;
  }
  
  .register-card {
    padding: 24px;
  }
  
  .register-header h2 {
    font-size: 24px;
  }
}

/* Dark mode styles */
:global(.dark-mode) .register-container {
  background: #0F1A0F;
}

:global(.dark-mode) .register-card {
  background: #1E2A1E;
  border-color: #3A4A3A;
}

:global(.dark-mode) .register-header h2 {
  color: #E8F0E8;
}

:global(.dark-mode) .register-header p {
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

:global(.dark-mode) .register-btn {
  background: #4A6A4A;
  color: #E8F0E8;
  border-color: #5A7A5A;
}

:global(.dark-mode) .register-btn:hover:not(:disabled) {
  background: #5A7A5A;
  color: #FFFFFF;
}

:global(.dark-mode) .register-footer {
  border-top-color: #3A4A3A;
}

:global(.dark-mode) .register-footer p {
  color: #A8C4A8;
}

:global(.dark-mode) .login-link {
  color: #8BB28B;
}

:global(.dark-mode) .error-message {
  background: #4A2A2A;
  color: #F5D4D4;
  border-color: #6A3A3A;
}
</style>

