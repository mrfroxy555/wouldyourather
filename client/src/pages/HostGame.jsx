import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const HostGame = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [pin, setPin] = useState(state?.pin || localStorage.getItem('gamePin'));
    const [question, setQuestion] = useState(state?.initialData?.question);
    const [qIndex, setQIndex] = useState(state?.initialData?.index || 0);
    const [total, setTotal] = useState(state?.initialData?.total || 0);
    const [timer, setTimer] = useState(30);
    const [gameState, setGameState] = useState('QUESTION'); // QUESTION, RESULTS, ENDED
    const [stats, setStats] = useState(null);
    const [scores, setScores] = useState([]);

    useEffect(() => {
        if (!pin) {
            navigate('/');
            return;
        }

        // Timer Logic
        let interval;
        if (gameState === 'QUESTION' && timer > 0) {
            interval = setInterval(() => {
                setTimer(t => t - 1);
            }, 1000);
        } else if (timer === 0 && gameState === 'QUESTION') {
            handleShowResults();
        }

        return () => clearInterval(interval);
    }, [timer, gameState, pin]);

    useEffect(() => {
        socket.on('new_question', (data) => {
            setQuestion(data.question);
            setQIndex(data.index);
            setTotal(data.total);
            setTimer(data.time);
            setGameState('QUESTION');
            setStats(null);
        });

        socket.on('round_results', (data) => {
            setStats(data.stats);
            setScores(data.scores);
            setGameState('RESULTS');
        });

        socket.on('game_over', (data) => {
            setScores(data.leaderboard);
            setGameState('ENDED');
        });

        socket.on('vote_received', ({ username }) => {
            // Optional: Show who voted?
        });

        return () => {
            socket.off('new_question');
            socket.off('round_results');
            socket.off('game_over');
            socket.off('vote_received');
        };
    }, []);

    const handleShowResults = () => {
        socket.emit('show_results', { pin });
    };

    const handleNext = () => {
        socket.emit('next_question', { pin });
    };

    // Helper to split "Inkább A, vagy B?"
    // Assumes format "Inkább [A], vagy [B]?"
    const splitQuestionText = (text) => {
        const parts = text.split(', vagy ');
        if (parts.length === 2) {
            return {
                a: parts[0].replace(/^Inkább\s+/i, ''),
                b: parts[1].replace(/\?$/, '')
            };
        }
        return { a: text, b: '' }; // Fallback
    };

    const { a, b } = question ? splitQuestionText(question.text) : { a: '', b: '' };

    if (gameState === 'ENDED') {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full w-full">
                <h1 className="text-5xl font-black text-gradient mb-8">Eredmények</h1>
                <div className="w-full max-w-2xl bg-black/30 rounded-xl p-4 overflow-y-auto">
                    {scores.map((p, i) => (
                        <div key={i} className={`flex justify-between items-center p-4 mb-2 rounded glass-panel ${i === 0 ? 'border-yellow-500 border-2' : ''}`}>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold w-8">{i + 1}.</span>
                                <span className="text-xl">{p.username}</span>
                            </div>
                            <span className="text-2xl font-bold text-purple-400">{p.score} pts</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => navigate('/')} className="glass-btn mt-8 px-8 py-3 rounded-full">Főmenü</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center h-full w-full px-4 py-6 relative">
            {/* Header */}
            <div className="flex justify-between w-full max-w-6xl mb-8 items-center">
                <div className="glass-panel px-4 py-2 text-sm font-bold text-gray-400">
                    {qIndex + 1} / {total}
                </div>
                <div className="text-3xl font-black font-mono">
                    {timer}s
                </div>
                <div className="glass-panel px-4 py-2 text-sm font-bold text-gray-400">
                    PIN: {pin}
                </div>
            </div>

            {gameState === 'QUESTION' && (
                <div className="flex-1 w-full max-w-6xl flex flex-col md:flex-row gap-8 items-center justify-center">
                    {/* Option A */}
                    <div className="flex-1 h-full max-h-96 glass-panel flex items-center justify-center p-8 text-center bg-blue-600/20 border-blue-500/30">
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight">{a}</h2>
                    </div>

                    <div className="text-2xl font-bold text-gray-500">VAGY</div>

                    {/* Option B */}
                    <div className="flex-1 h-full max-h-96 glass-panel flex items-center justify-center p-8 text-center bg-red-600/20 border-red-500/30">
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight">{b}</h2>
                    </div>
                </div>
            )}

            {gameState === 'RESULTS' && stats && (
                <div className="flex-1 w-full max-w-6xl flex flex-col justify-center items-center gap-8">
                    <h2 className="text-4xl font-bold mb-8">{question?.text}</h2>

                    <div className="w-full flex gap-12 h-80 items-end justify-center">
                        {/* Bar A */}
                        <div className="w-1/3 flex flex-col items-center gap-3">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-blue-400">{stats.A}%</span>
                                <span className="text-sm font-bold text-blue-300 uppercase tracking-tighter">{stats.countA} szavazat</span>
                            </div>
                            <div className="w-full flex-1 flex flex-col justify-end bg-blue-900/10 rounded-t-xl overflow-hidden min-h-[250px]">
                                <div
                                    style={{ height: `${Math.max(stats.A, 2)}%` }}
                                    className="w-full bg-blue-500 transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                />
                            </div>
                            <div className="p-4 bg-blue-900/30 rounded-xl w-full text-center text-sm font-medium border border-blue-500/20">{a}</div>
                        </div>

                        {/* Bar B */}
                        <div className="w-1/3 flex flex-col items-center gap-3">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-red-400">{stats.B}%</span>
                                <span className="text-sm font-bold text-red-300 uppercase tracking-tighter">{stats.countB} szavazat</span>
                            </div>
                            <div className="w-full flex-1 flex flex-col justify-end bg-red-900/10 rounded-t-xl overflow-hidden min-h-[250px]">
                                <div
                                    style={{ height: `${Math.max(stats.B, 2)}%` }}
                                    className="w-full bg-red-500 transition-all duration-1000 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                                />
                            </div>
                            <div className="p-4 bg-red-900/30 rounded-xl w-full text-center text-sm font-medium border border-red-500/20">{b}</div>
                        </div>
                    </div>

                    <button onClick={handleNext} className="glass-btn px-12 py-4 text-xl font-bold rounded-full mt-8 bg-white/20">
                        Következő Kérdés
                    </button>
                </div>
            )}

            {/* Progress Bar (Timer) */}
            {gameState === 'QUESTION' && (
                <div className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 w-full progress-bar"
                    style={{ width: `${(timer / 30) * 100}%` }}
                />
            )}
        </div>
    );
};

export default HostGame;
