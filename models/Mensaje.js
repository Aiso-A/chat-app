const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String, required: false, default: "" },
  archivoUrl: { type: String, required: false, default: null }, // Se agrega esta propiedad para mensajes con archivos
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensaje', mensajeSchema);