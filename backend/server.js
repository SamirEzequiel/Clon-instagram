import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Configuración de CORS más específica
app.use(cors({
  origin: '*', // Permitir todas las origenes durante el desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../front-end')));

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// Archivo de usuarios y posts
const usersFile = path.join(__dirname, 'models/users.json');
const postsFile = path.join(__dirname, 'models/posts.json');

// Asegurar archivos
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));
if (!fs.existsSync(postsFile)) fs.writeFileSync(postsFile, JSON.stringify([]));

// Registro de usuario
app.post('/api/users', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  if (users.find(u => u.email === email || u.username === username)) {
    return res.status(400).json({ message: 'El usuario o email ya existe' });
  }
  const newUser = { id: Date.now().toString(), username, email, password };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.status(201).json({ message: 'Usuario registrado exitosamente.' });
});

// Login de usuario mejorado
app.post('/api/login', (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const user = users.find(u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }
    
    res.json({ 
      message: 'Login exitoso', 
      userId: user.id, 
      username: user.username 
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al procesar el login' });
  }
});

// Obtener posts
app.get('/api/posts', (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
  res.json(posts);
});

// Obtener un post específico
app.get('/api/posts/:postId', (req, res) => {
  try {
    const postId = req.params.postId;
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
    const post = posts.find(p => String(p.id) === String(postId));
    
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error al obtener post:', error);
    res.status(500).json({ message: 'Error al obtener el post' });
  }
});

// Crear post
app.post('/api/posts', (req, res) => {
  try {
    const { description, userId, username, imageUrl } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ message: 'Faltan datos del usuario.' });
    }
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
    const newPost = {
      id: String(Date.now()),
      imageUrl: imageUrl || '',
      description: description || '',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      userId,
      username
    };
    posts.unshift(newPost);
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
    res.status(201).json({ message: 'Post creado exitosamente', post: newPost });
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({ message: 'Error al crear el post' });
  }
});

// Actualizar un post
app.put('/api/posts/:postId', (req, res) => {
  try {
    const postId = req.params.postId;
    const { description } = req.body;
    
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
    const postIndex = posts.findIndex(p => String(p.id) === String(postId));
    
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    
    // Verificar que el usuario sea el propietario del post
    if (posts[postIndex].userId !== req.body.userId) {
      return res.status(403).json({ message: 'No tienes permiso para editar este post' });
    }
    
    posts[postIndex].description = description;
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
    
    res.json({ message: 'Post actualizado exitosamente', post: posts[postIndex] });
  } catch (error) {
    console.error('Error al actualizar post:', error);
    res.status(500).json({ message: 'Error al actualizar el post' });
  }
});

// Eliminar un post
app.delete('/api/posts/:postId', (req, res) => {
  try {
    const postId = req.params.postId;
    const { userId } = req.body;
    
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
    const postIndex = posts.findIndex(p => String(p.id) === String(postId));
    
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    
    // Verificar que el usuario sea el propietario del post
    if (posts[postIndex].userId !== userId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este post' });
    }
    
    // Eliminar la imagen si existe
    if (posts[postIndex].imageUrl) {
      const imagePath = path.join(__dirname, posts[postIndex].imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    posts.splice(postIndex, 1);
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
    
    res.json({ message: 'Post eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({ message: 'Error al eliminar el post' });
  }
});

// Like a post
app.post('/api/posts/:postId/like', (req, res) => {
  try {
    const { userId, username } = req.body;
    const postId = req.params.postId;
    
    if (!userId) {
      return res.status(400).json({ message: 'Falta el userId' });
    }
    
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
    // Convertir el postId a string para la comparación
    const post = posts.find(p => String(p.id) === String(postId));
    
    if (!post) {
      console.error('Post no encontrado:', { 
        postId, 
        postIdType: typeof postId,
        availableIds: posts.map(p => ({ id: p.id, type: typeof p.id }))
      });
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    
    if (!post.likes) post.likes = [];
    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }
    
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
    
    // Obtener los detalles de los likes
    const likeDetails = post.likes.map(likeId => {
      const user = JSON.parse(fs.readFileSync(usersFile, 'utf-8')).find(u => u.id === likeId);
      return {
        userId: likeId,
        username: user ? user.username : 'Usuario desconocido'
      };
    });
    
    res.json({ 
      likes: post.likes.length,
      likeDetails: likeDetails
    });
  } catch (error) {
    console.error('Error al procesar like:', error);
    res.status(500).json({ message: 'Error al procesar el like' });
  }
});

// Agregar comentario
app.post('/api/posts/:id/comments', (req, res) => {
  const { userId, text } = req.body;
  const postId = req.params.id;
  if (!userId || !text) {
    return res.status(400).json({ message: 'Faltan datos para el comentario' });
  }
  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post no encontrado' });
  }
  if (!post.comments) post.comments = [];
  post.comments.push({ user: { id: userId }, text, createdAt: new Date().toISOString() });
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
  res.json({ message: 'Comentario agregado', comments: post.comments });
});

// Ruta para subir imágenes
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }
    
    const imageUrl = '/uploads/' + req.file.filename;
    res.json({ 
      message: 'Imagen subida exitosamente',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});