const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['individual', 'grupo'], required: true },
  miembros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], 
  nombre: { type: String, required: function() { return this.tipo === 'grupo'; } }, 
  mensajes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mensaje' }]
}, { timestamps: true }); 

module.exports = mongoose.model('Chat', chatSchema);
