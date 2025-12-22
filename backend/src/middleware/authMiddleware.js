const authService = require('../services/authService');

const authMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.headers['session-id'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!sessionId) {
      return res.status(401).json({ error: 'Token de sessão é obrigatório' });
    }

    const session = await authService.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    // Add user info to request
    req.user = session.user;
    req.userId = session.userId;
    req.sessionId = sessionId;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Erro na autenticação: ' + error.message });
  }
};

const authenticateSession = authMiddleware;
const protect = authMiddleware; // Alias for compatibility

module.exports = { authenticateSession, authMiddleware, protect };
