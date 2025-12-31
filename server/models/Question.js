const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    optionA: { type: String, required: false }, // Use if splitting text, or just store full text
    optionB: { type: String, required: false }
});

// The prompt gives questions as "Inkább A, vagy B?"
// I will store the full text, but also try to split them for easier display if possible.
// "Inkább X, vagy Y?" -> Option A: X, Option B: Y
// I'll make a helper to split them during seeding.

module.exports = mongoose.model('Question', QuestionSchema);
