const userService = require('../services/userService');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      // Usar userId do usuário autenticado (garantido pelo middleware)
      const userId = req.userId || req.params.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID é obrigatório' });
      }

      const user = await userService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      // Usar userId do usuário autenticado (garantido pelo middleware)
      const userId = req.userId || req.params.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID é obrigatório' });
      }

      // Não permitir atualização de email e senha diretamente
      const { password, email, ...userData } = req.body;
      
      const user = await userService.updateUser(userId, userData);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      // Usar userId do usuário autenticado (garantido pelo middleware)
      const userId = req.userId || req.params.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID é obrigatório' });
      }

      await userService.deleteUser(userId);
      res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async updateUserLevel(req, res, next) {
    try {
      // Usar userId do usuário autenticado (garantido pelo middleware)
      const userId = req.userId || req.params.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID é obrigatório' });
      }

      const { level } = req.body;
      const user = await userService.updateUserLevel(userId, level);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserInterests(req, res, next) {
    try {
      // Usar userId do usuário autenticado (garantido pelo middleware)
      const userId = req.userId || req.params.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID é obrigatório' });
      }

      const { interests } = req.body;
      const user = await userService.updateUserInterests(userId, interests);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
