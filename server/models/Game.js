const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    socketId: { type: String, required: true },
    username: { type: String, required: true },
    score: { type: Number, default: 0 },
    answers: { type: Map, of: String } // questionIndex -> "A" or "B"
});

const GameSchema = new mongoose.Schema({
    pin: { type: String, required: true, unique: true },
    hostSocketId: { type: String, required: true },
    players: [PlayerSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    state: {
        type: String,
        enum: ['LOBBY', 'QUESTION', 'RESULTS', 'LEADERBOARD', 'ENDED'],
        default: 'LOBBY'
    },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24h
});

module.exports = mongoose.model('Game', GameSchema);
