const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  tipo: { type: String, required: true },
  nombre: { type: String },
  usuarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
