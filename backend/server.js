import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../front-end')));

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

// Login de usuario
app.post('/api/login', (req, res) => {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.find(u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password);
  if (!user) {
    return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });
  }
  res.json({ message: 'Login exitoso', userId: user.id, username: user.username });
});

// Obtener posts
app.get('/api/posts', (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
  res.json(posts);
});

// Crear post
app.post('/api/posts', (req, res) => {
  const { description, userId, username, imageUrl } = req.body;
  if (!userId || !username) {
    return res.status(400).json({ message: 'Faltan datos del usuario.' });
  }
  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
  const newPost = {
    id: Date.now().toString(),
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
});

// Like a post
app.post('/api/posts/:id/like', (req, res) => {
  const { userId, username } = req.body;
  const postId = req.params.id;
  if (!userId) {
    return res.status(400).json({ message: 'Falta el userId' });
  }
  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
  const post = posts.find(p => p.id === postId);
  if (!post) {
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
  res.json({ likes: post.likes.length });
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});