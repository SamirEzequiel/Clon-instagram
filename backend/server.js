import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Post from './models/post.js';  // Asegúrate de usar .js
import User from './models/user.js';  // Asegúrate de usar .js

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Verificar variables de entorno
if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI no está definida en el archivo .env');
  process.exit(1);
}

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, userId } = req.body;
    const newPost = new Post({ title, content, userId });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el post' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
