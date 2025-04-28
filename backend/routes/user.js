const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Crear un nuevo usuario
router.post('/', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newUser = new User({
      username,
      email,
      password // Este debería ser cifrado con bcrypt antes de almacenarlo
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Hubo un error al crear el usuario', details: err });
  }
});

// Obtener todos los usuarios (solo para pruebas)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Hubo un error al obtener los usuarios', details: err });
  }
});

// Obtener un usuario por su ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Hubo un error al obtener el usuario', details: err });
  }
});

module.exports = router;
