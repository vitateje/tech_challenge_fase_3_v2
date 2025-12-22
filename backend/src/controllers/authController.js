const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      }

      const result = await authService.register(name, email, password);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID é obrigatório' });
      }

      const success = await authService.logout(sessionId);
      if (success) {
        res.json({ message: 'Logout realizado com sucesso' });
      } else {
        res.status(404).json({ error: 'Sessão não encontrada' });
      }
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const { sessionId } = req.headers;
      
      if (!sessionId) {
        return res.status(401).json({ error: 'Session ID é obrigatório' });
      }

      const user = await authService.getCurrentUser(sessionId);
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: 'Sessão inválida ou expirada' });
      }
    } catch (error) {
      next(error);
    }
  }

  async getSessionInfo(req, res, next) {
    try {
      const { sessionId } = req.headers;
      
      if (!sessionId) {
        return res.status(401).json({ error: 'Session ID é obrigatório' });
      }

      const session = await authService.getSession(sessionId);
      if (session) {
        res.json({
          valid: true,
          userId: session.userId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        });
      } else {
        res.status(401).json({ error: 'Sessão inválida ou expirada' });
      }
    } catch (error) {
      next(error);
    }
  }

  async getActiveSessions(req, res, next) {
    try {
      const sessions = authService.getActiveSessions();
      res.json({
        total: sessions.length,
        sessions: sessions.map(session => ({
          userId: session.userId,
          user: session.user,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
