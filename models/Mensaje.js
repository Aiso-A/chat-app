const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  text: { type: String, default: '' }, 
  fileUrl: { type: String, default: null }, 
  fileType: { type: String, default: null }, 
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensaje', MensajeSchema);
