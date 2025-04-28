const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para registrar usuarios
router.post('/register', authController.register);

// Ruta para login de usuarios
router.post('/login', authController.login);

module.exports = router;
