/**
 * Middleware para garantir que usuário só acesse seus próprios dados
 * Deve ser usado após authMiddleware
 */
const userAuthorization = (req, res, next) => {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId?.toString();

    // Se não há userId nos params, passar direto (pode ser uma rota geral)
    if (!requestedUserId) {
      return next();
    }

    // Verificar se o usuário autenticado está tentando acessar seus próprios dados
    if (authenticatedUserId && requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode acessar seus próprios dados.' 
      });
    }

    // Se não está autenticado mas tem userId na rota, requer autenticação
    if (!authenticatedUserId && requestedUserId) {
      return res.status(401).json({ 
        error: 'Autenticação necessária para acessar este recurso.' 
      });
    }

    // Usar o userId autenticado em vez do da URL para segurança extra
    if (authenticatedUserId) {
      req.params.userId = authenticatedUserId;
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro na autorização: ' + error.message });
  }
};

module.exports = userAuthorization;

