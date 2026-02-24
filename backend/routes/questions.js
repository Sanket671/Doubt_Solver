const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// Get all unsolved questions (queue)
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find({ solved: false }).sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get solved questions
router.get('/solved', async (req, res) => {
  try {
    const solved = await Question.find({ solved: true }).sort({ solvedAt: -1 }).limit(50);
    res.json(solved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new question
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const question = new Question({ text });
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update question (e.g., add summary, mark solved)
router.patch('/:id', async (req, res) => {
  try {
    const { summary, solved } = req.body;
    const update = {};
    if (summary !== undefined) update.summary = summary;
    if (solved !== undefined) {
      update.solved = solved;
      if (solved) update.solvedAt = new Date();
    }
    const question = await Question.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a question (optional)
router.delete('/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;