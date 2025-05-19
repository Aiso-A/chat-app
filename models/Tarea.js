const mongoose = require('mongoose');

const tareaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  descripcion: { type: String, required: true },
  completada: { type: Boolean, default: false },
  fechaCreacion: { type: Date, default: Date.now }, 
  fechaVencimiento: { type: Date, required: true } 
});

module.exports = mongoose.model('Tarea', tareaSchema);

