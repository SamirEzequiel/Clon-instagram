import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postsFile = path.join(__dirname, '../models/posts.json');

// Asegurarse de que el archivo posts.json existe
if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([]));
}

// Asegurarse de que el directorio uploads existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

function getFeed(req, res) {
    try {
        const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
        res.json(posts);
    } catch (error) {
        console.error('Error al leer los posts:', error);
        res.status(500).json({ message: 'Error al obtener el feed' });
    }
}

function createPost(req, res) {
    try {
        // Log de la solicitud completa
        console.log('=== Nueva solicitud de creación de post ===');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('File:', req.file ? JSON.stringify(req.file, null, 2) : 'No file');

        // Validación del archivo
        if (!req.file) {
            console.log('Error: No se encontró archivo en la solicitud');
            return res.status(400).json({ 
                message: 'No se ha proporcionado ninguna imagen',
                details: 'Se requiere una imagen para crear una publicación'
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        console.log('URL de imagen generada:', imageUrl);
        
        // Validación de datos del usuario
        const { description = '', userId = null, username = null } = req.body;
        console.log('Datos recibidos en el backend:', { description, userId, username });
        
        if (!username) {
            console.log('Error: Nombre de usuario no proporcionado');
            return res.status(400).json({ 
                message: 'El nombre de usuario es requerido',
                details: 'Se necesita un nombre de usuario para crear la publicación'
            });
        }

        // Leer posts existentes
        let posts = [];
        try {
            posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
        } catch (error) {
            console.error('Error al leer el archivo de posts:', error);
        }

        // Crear nuevo post con ID numérico
        const newPost = {
            id: Date.now(),
            imageUrl,
            description,
            createdAt: new Date().toISOString(),
            likes: [],
            comments: [],
            userId: userId || 'anonymous',
            username: username || 'Anónimo'
        };

        // Agregar el nuevo post al principio del array
        posts.unshift(newPost);

        // Guardar posts actualizados
        fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

        res.status(201).json({
            message: 'Post creado exitosamente',
            post: newPost
        });
    } catch (error) {
        console.error('Error al crear el post:', error);
        res.status(500).json({ message: 'Error al crear el post' });
    }
}

function likePost(req, res) {
    try {
        const postId = req.params.id;
        const { userId, username } = req.body;

        if (!postId || !userId) {
            return res.status(400).json({
                message: 'Se requiere el ID del post y del usuario'
            });
        }

        // Leer posts existentes
        let posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
        const postIndex = posts.findIndex(post => post.id == postId);
        
        if (postIndex === -1) {
            return res.status(404).json({
                message: 'Post no encontrado'
            });
        }

        // Inicializar el array de likes si no existe
        if (!posts[postIndex].likes) {
            posts[postIndex].likes = [];
        }

        // Inicializar el array de likeDetails si no existe
        if (!posts[postIndex].likeDetails) {
            posts[postIndex].likeDetails = [];
        }

        // Verificar si el usuario ya dio like
        const userLikeIndex = posts[postIndex].likes.indexOf(userId);
        const userLikeDetailsIndex = posts[postIndex].likeDetails.findIndex(like => like.userId === userId);

        if (userLikeIndex === -1) {
            // Agregar like
            posts[postIndex].likes.push(userId);
            posts[postIndex].likeDetails.push({
                userId,
                username,
                timestamp: new Date().toISOString()
            });
        } else {
            // Quitar like
            posts[postIndex].likes.splice(userLikeIndex, 1);
            posts[postIndex].likeDetails.splice(userLikeDetailsIndex, 1);
        }

        // Guardar cambios
        fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

        res.json({ 
            message: userLikeIndex === -1 ? 'Like agregado' : 'Like removido',
            likes: posts[postIndex].likes.length,
            likeDetails: posts[postIndex].likeDetails
        });

    } catch (error) {
        console.error('Error al procesar like:', error);
        res.status(500).json({ message: 'Error al procesar el like' });
    }
}

export { getFeed, createPost, likePost };
