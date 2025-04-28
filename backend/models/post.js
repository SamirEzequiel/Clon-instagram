import mongoose from 'mongoose';

// Definimos el esquema de un post
const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Referencia al modelo de usuario (esto relaciona el post con un usuario)
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 500
  },
  imageUrl: {
    type: String,  // Si vas a almacenar una URL de imagen
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model('Post', postSchema);

export default Post;
