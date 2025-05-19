const mongoose = require('mongoose');
const getNextSequence = require('./counter'); // función de autoincremento

const tareaEntegradaSchema = new mongoose.Schema({
  idTareaEntegrada: { type: Number, unique: true },
  fecha_entrega: { type: Date, required: true, default: Date.now },
  archivo: { type: String, default: null, maxlength: 100 },
  usuarioID: { type: Number, ref: 'Usuario', default: null },
  tareaID: { type: Number, ref: 'Tarea', default: null }
});

tareaEntegradaSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.idTareaEntegrada = await getNextSequence('idTareaEntegrada');
  }
  next();
});

module.exports = mongoose.model('TareaEntegrada', tareaEntegradaSchema);
