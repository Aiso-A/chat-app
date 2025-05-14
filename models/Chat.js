const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['individual', 'grupo'], required: true },
  participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  nombre: { type: String },
  mensajes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mensaje' }]
});

module.exports = mongoose.model('Chat', chatSchema);
