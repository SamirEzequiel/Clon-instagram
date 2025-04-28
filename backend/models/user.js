import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar la contraseña antes de guardarla en la base de datos
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Encriptar la contraseña con un "sal" de 10 rondas
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
