const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String, required: function() { return !this.archivoUrl; } }, 
  archivoUrl: { type: String }, 
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensaje', mensajeSchema);


