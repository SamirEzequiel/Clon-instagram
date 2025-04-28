import mongoose from 'mongoose';

// Definimos el esquema de un post
const PostSchema = new mongoose.Schema({
    // ...otros campos...
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }],
    // ...otros campos...
  });

const Post = mongoose.model('Post', postSchema);

const posts = await Post.find()
  .sort({ createdAt: -1 })
  .populate('userId', 'username avatarUrl')
  .populate('comments.user', 'username');
  
export default Post;

