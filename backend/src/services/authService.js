const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');

class AuthService {
  constructor() {
    // Não precisa mais de Map em memória - usando MongoDB
  }

  async createDefaultUser() {
    try {
      // Check if default user exists
      const existingUser = await userRepository.getByEmail('doctor@hospital.com');
      if (!existingUser) {
        await userRepository.create({
          name: 'Dr. Admin',
          email: 'doctor@hospital.com',
          password: 'demo@123', // Será hasheado automaticamente
          level: 'beginner',
          interests: ['medical protocols', 'patient care']
        });
        console.log('✅ Usuário padrão criado: doctor@hospital.com / senha: demo@123');
      }
    } catch (error) {
      console.error('Erro ao criar usuário padrão:', error);
    }
  }

  async register(name, email, password) {
    try {
      // Verificar se usuário já existe
      const existingUser = await userRepository.getByEmail(email);
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      // Criar usuário (senha será hasheada automaticamente pelo modelo)
      const user = await userRepository.create({
        name,
        email,
        password,
        level: 'beginner',
        interests: []
      });

      // Criar sessão automaticamente após registro
      const sessionId = this.generateSessionId();
      await sessionRepository.create({
        userId: user._id,
        sessionId,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      return {
        sessionId,
        user: user.toJSON ? user.toJSON() : user
      };
    } catch (error) {
      throw new Error('Erro no registro: ' + error.message);
    }
  }

  async login(email, password) {
    try {
      // Buscar usuário com senha (select: false no modelo, então usar select('+password'))
      const user = await userRepository.getByEmail(email);
      if (!user) {
        throw new Error('Email ou senha incorretos');
      }

      // Verificar senha
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Email ou senha incorretos');
      }

      // Criar sessão
      const sessionId = this.generateSessionId();
      await sessionRepository.create({
        userId: user._id,
        sessionId,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      return {
        sessionId,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          level: user.level,
          interests: user.interests
        }
      };
    } catch (error) {
      throw new Error('Erro no login: ' + error.message);
    }
  }

  async logout(sessionId) {
    try {
      return await sessionRepository.deleteBySessionId(sessionId);
    } catch (error) {
      throw new Error('Erro no logout: ' + error.message);
    }
  }

  async getSession(sessionId) {
    try {
      const session = await sessionRepository.getBySessionId(sessionId);
      if (!session) {
        return null;
      }

      // Verificar se userId está populado (objeto User) ou é apenas ObjectId
      const userId = session.userId?._id || session.userId;

      // Se userId não está populado, buscar o usuário separadamente
      if (!session.userId || typeof session.userId !== 'object' || !session.userId.name) {
        const userRepository = require('../repositories/userRepository');
        const user = await userRepository.getById(userId);

        if (!user) {
          return null;
        }

        return {
          userId: user._id,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            level: user.level,
            interests: user.interests
          },
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        };
      }

      // userId está populado corretamente
      return {
        userId: session.userId._id || session.userId,
        user: {
          _id: session.userId._id || session.userId,
          name: session.userId.name || '',
          email: session.userId.email || '',
          level: session.userId.level || 'beginner',
          interests: session.userId.interests || []
        },
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      };
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      return null;
    }
  }

  async getCurrentUser(sessionId) {
    const session = await this.getSession(sessionId);
    return session ? session.user : null;
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      const deletedCount = await sessionRepository.cleanupExpired();
      if (deletedCount > 0) {
        console.log(`🧹 Limpeza: ${deletedCount} sessões expiradas removidas`);
      }
    } catch (error) {
      console.error('Erro ao limpar sessões expiradas:', error);
    }
  }

  // Get all active sessions (for debugging)
  async getActiveSessions() {
    try {
      // Não implementado ainda, pode ser adicionado se necessário
      return [];
    } catch (error) {
      return [];
    }
  }
}

module.exports = new AuthService();
