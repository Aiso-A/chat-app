const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  nombreUsuario: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '/img/PerfilD.png' }
});

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario;