const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const userAuthorization = require('../middleware/userAuthorization');

// Rotas públicas
router.post('/', userController.createUser); // Registro (já implementado em authRoutes)

// Rotas protegidas - requerem autenticação e autorização
router.use(authMiddleware);
router.use(userAuthorization);

// User routes
router.get('/', userController.getAllUsers);
router.get('/:id?', userController.getUserById);
router.put('/:id?', userController.updateUser);
router.delete('/:id?', userController.deleteUser);

// User specific routes
router.put('/:id?/level', userController.updateUserLevel);
router.put('/:id?/interests', userController.updateUserInterests);

module.exports = router;
