const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  summary: { type: String, default: '' },
  solved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  solvedAt: { type: Date }
});

module.exports = mongoose.model('Question', questionSchema);