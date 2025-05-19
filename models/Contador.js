const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequence(name) {
  const ret = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return ret.seq;
}

module.exports = getNextSequence;
