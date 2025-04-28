import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Post from './models/post.js';  // Asegúrate de usar .js
import User from './models/user.js';  // Asegúrate de usar .js

// Cargar y verificar variables de entorno
dotenv.config();
console.log('Variables de entorno cargadas:', {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? 'Definida' : 'No definida'
});

if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI no está definida en el archivo .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Verificar conexión a MongoDB
const checkMongoConnection = async () => {
  try {
    const state = mongoose.connection.readyState;
    console.log('Estado de conexión MongoDB:', state);
    return state === 1;
  } catch (error) {
    console.error('Error al verificar conexión MongoDB:', error);
    return false;
  }
};

// Ruta para verificar estado del servidor
app.get('/api/health', async (req, res) => {
  const mongoConnected = await checkMongoConnection();
  res.json({
    status: 'ok',
    mongoConnected,
    timestamp: new Date().toISOString(),
    env: {
      PORT: process.env.PORT,
      MONGO_URI: process.env.MONGO_URI ? 'Definida' : 'No definida'
    }
  });
});

// Ruta para crear usuario
app.post('/api/users', async (req, res) => {
  try {
    console.log('=== Iniciando creación de usuario ===');
    console.log('Datos recibidos:', req.body);
    
    const { username, email, password } = req.body;
    
    // Validar campos
    if (!username || !email || !password) {
      console.log('Error: Campos faltantes');
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos',
        error: 'Campos faltantes',
        receivedData: req.body
      });
    }

    // Verificar usuario existente
    console.log('Buscando usuario existente...');
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('Error: Usuario ya existe');
      return res.status(400).json({ 
        message: 'El usuario o email ya existe',
        error: 'Usuario duplicado'
      });
    }

    // Crear nuevo usuario
    console.log('Creando nuevo usuario...');
    const newUser = new User({ 
      username, 
      email, 
      password 
    });
    
    console.log('Usuario a guardar:', {
      username: newUser.username,
      email: newUser.email,
      password: '***' // No mostramos la contraseña en los logs
    });

    // Guardar usuario
    console.log('Guardando usuario...');
    await newUser.save();
    console.log('Usuario guardado exitosamente');

    // Responder con el usuario creado (sin la contraseña)
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
    
    console.log('=== Usuario creado exitosamente ===');
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('=== Error al crear usuario ===');
    console.error('Error completo:', error);
    console.error('Mensaje de error:', error.message);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({ 
      message: 'Error al crear el usuario',
      error: error.message,
      details: error.stack
    });
  }
});

// Ruta para crear post
app.post('/api/posts', async (req, res) => {
  try {
    console.log('Intentando crear post con datos:', req.body);
    
    const { title, description, userId } = req.body;

    // Validar campos requeridos
    if (!title || !description || !userId) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos',
        error: 'Campos faltantes',
        receivedData: req.body
      });
    }

    // Verificar si el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado',
        error: 'Usuario no existe'
      });
    }

    const newPost = new Post({ title, description, userId });
    console.log('Nuevo post a guardar:', newPost);
    
    await newPost.save();
    console.log('Post guardado exitosamente');
    
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error detallado al crear post:', error);
    res.status(500).json({ 
      message: 'Error al crear el post',
      error: error.message,
      stack: error.stack
    });
  }
});

// Configuración de Mongoose
mongoose.set('debug', true);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexión a MongoDB exitosa');
    // Verificar la conexión
    checkMongoConnection();
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Ruta para obtener todos los posts
app.get('/api/posts', async (req, res) => {
  try {
    // Trae todos los posts ordenados por fecha de creación descendente
    const posts = await Post.find().sort({ createdAt: -1 }).populate('userId', 'username email');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error al obtener los posts:', error);
    res.status(500).json({
      message: 'Error al obtener los posts',
      error: error.message
    });
  }
});

// Ruta para dar like a un post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body; // El ID del usuario que da like

    if (!userId) {
      return res.status(400).json({ message: 'Falta el userId' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }

    // Si el usuario ya dio like, lo quitamos (toggle)
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Error al dar like', error: error.message });
  }
});