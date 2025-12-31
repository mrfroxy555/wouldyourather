const Game = require('../models/Game');
const Question = require('../models/Question');

const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = (io, socket) => {
    // HOST: Create Game
    socket.on('create_game', async () => {
        try {
            let pin = generatePin();
            // Ensure unique PIN (simplified)
            const existing = await Game.findOne({ pin });
            if (existing) pin = generatePin();

            const game = new Game({
                pin,
                hostSocketId: socket.id,
                state: 'LOBBY'
            });
            await game.save();

            socket.join(pin);
            socket.emit('game_created', { pin });
            console.log(`Game created: ${pin}`);
        } catch (err) {
            console.error(err);
            socket.emit('error', 'Could not create game');
        }
    });

    // PLAYER: Join Game
    socket.on('join_game', async ({ pin, username }) => {
        try {
            const game = await Game.findOne({ pin });
            if (!game) {
                return socket.emit('error', 'Game not found');
            }
            if (game.state !== 'LOBBY') {
                return socket.emit('error', 'Game already started');
            }

            const existingPlayer = game.players.find(p => p.username === username);
            if (existingPlayer) {
                return socket.emit('error', 'Username taken');
            }

            game.players.push({
                socketId: socket.id,
                username,
                score: 0
            });
            await game.save();

            socket.join(pin);
            // Tell player they joined
            socket.emit('joined_success', { pin, username });
            // Update Host
            io.to(game.hostSocketId).emit('player_joined', game.players);
            console.log(`${username} joined ${pin}`);
        } catch (err) {
            console.error(err);
            socket.emit('error', 'Could not join game');
        }
    });

    // HOST: Start Game
    socket.on('start_game', async ({ pin }) => {
        try {
            const game = await Game.findOne({ pin });
            if (!game) return;

            const questions = await Question.find();
            if (questions.length === 0) return socket.emit('error', 'No questions found');

            game.state = 'QUESTION';
            game.currentQuestionIndex = 0;
            await game.save();

            // Send first question
            const question = questions[0];
            io.to(pin).emit('new_question', {
                question,
                index: 0,
                total: questions.length,
                time: 30
            });
        } catch (err) {
            console.error(err);
        }
    });

    // PLAYER: Submit Vote
    socket.on('submit_vote', async ({ pin, answer }) => { // answer: "A" or "B"
        try {
            const game = await Game.findOne({ pin });
            if (!game) return;

            const player = game.players.find(p => p.socketId === socket.id);
            if (!player) return;

            // Use `set` for Map types in Mongoose or just update the object
            // But we defined answers as a Map. 
            // Actually simpler to just track votes in a temporary object if we don't need persistent detailed history.
            // But prompt asks for valid logic.

            // We need to know which question we are on.
            const qIndex = game.currentQuestionIndex.toString();

            // Update player's answer for this question
            // Mongoose Map update
            if (!player.answers) player.answers = new Map();
            player.answers.set(qIndex, answer);

            await game.save();

            io.to(game.hostSocketId).emit('vote_received', { username: player.username });
        } catch (err) {
            console.error(err);
        }
    });

    // HOST: Show Results (or Timer End)
    socket.on('show_results', async ({ pin }) => {
        try {
            const game = await Game.findOne({ pin });
            if (!game) return;

            const qIndex = game.currentQuestionIndex;

            // Calculate stats
            let countA = 0;
            let countB = 0;
            let totalVotes = 0;

            for (const p of game.players) {
                const ans = p.answers ? p.answers.get(qIndex.toString()) : null;
                if (ans === 'A') countA++;
                if (ans === 'B') countB++;
            }
            totalVotes = countA + countB;

            // Calculate Scores
            // "Majority vote = more points" -> "kevesebb pontot kap", "nem kiesik"
            // Let's give: Majority winner gets 100 pts, Minority gets 50 pts using logic?
            // Or percentage based? "percentage of the winning vote".
            // Prompt: "szezalekosan irja ki az eredmenyeket... a vegen pedig egy leaderboard... kevesebb pontot kap"
            // Suggestion: Points = Percentage of people who agreed with you.
            // If 80% chose A, and you chose A, you get 80 points.
            // If 20% chose B, and you chose B, you get 20 points.

            const pctA = totalVotes === 0 ? 0 : Math.round((countA / totalVotes) * 100);
            const pctB = totalVotes === 0 ? 0 : Math.round((countB / totalVotes) * 100);

            game.players.forEach(p => {
                const ans = p.answers ? p.answers.get(qIndex.toString()) : null;
                if (ans === 'A') p.score += pctA;
                if (ans === 'B') p.score += pctB;
            });

            game.state = 'RESULTS';
            await game.save();

            io.to(pin).emit('round_results', {
                stats: { A: pctA, B: pctB, countA, countB },
                scores: game.players.map(p => ({ username: p.username, score: p.score }))
            });

        } catch (err) {
            console.error(err);
        }
    });

    // HOST: Next Question
    socket.on('next_question', async ({ pin }) => {
        try {
            const game = await Game.findOne({ pin });
            if (!game) return;

            const questions = await Question.find();
            const nextIndex = game.currentQuestionIndex + 1;

            if (nextIndex >= questions.length) {
                // End Game
                game.state = 'ENDED';
                await game.save();
                io.to(pin).emit('game_over', {
                    leaderboard: game.players.sort((a, b) => b.score - a.score)
                });
            } else {
                game.currentQuestionIndex = nextIndex;
                game.state = 'QUESTION';
                await game.save();

                io.to(pin).emit('new_question', {
                    question: questions[nextIndex],
                    index: nextIndex,
                    total: questions.length,
                    time: 30
                });
            }
        } catch (err) {
            console.error(err);
        }
    });
};
