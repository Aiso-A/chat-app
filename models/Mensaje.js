const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String },
  imagen: { type: String }, // Almacena la ruta de imágenes
  archivo: { type: String }, // Nueva propiedad para almacenar archivos generales
  cifrado: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensaje', MensajeSchema);