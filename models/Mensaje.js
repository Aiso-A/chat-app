const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String, required: true },
  estado: { type: String, enum: ['enviado', 'visto'], default: 'enviado' }, // Estado del mensaje
  fecha: { type: Date, default: Date.now }
});

mensajeSchema.index({ fecha: -1 }); 

module.exports = mongoose.model('Mensaje', mensajeSchema);
