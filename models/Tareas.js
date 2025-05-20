const mongoose = require('mongoose');
const getNextSequence = require('./Counter'); // asumiendo que exportas la función
// no necesitas importar Grupo aquí si solo usas ref

const tareaSchema = new mongoose.Schema({
  idTarea: { type: Number, unique: true },
  titulo: { type: String, required: true, maxlength: 100 },
  descripcion: { type: String, default: null },
  fecha_creacion: { type: Date, default: Date.now },
  fecha_entrega: { type: Date, required: true, default: Date.now },
  estatus: { type: Boolean, default: true },
  grupoID: { type: Number, ref: 'Grupo', default: null },
  puntos: { type: Number, default: null }
});

tareaSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.idTarea = await getNextSequence('idTarea');
  }
  next();
});

module.exports = mongoose.model('Tarea', tareaSchema);
