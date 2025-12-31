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
                <div className="flex-1 w-full max-w-6xl flex flex-col justify-center items-center gap-6 animate-in fade-in zoom-in duration-500">
                    <h2 className="text-3xl font-bold mb-4 text-center px-4 glass-panel py-3">{question?.text}</h2>

                    <div className="w-full flex flex-col md:flex-row gap-8 h-[50vh] min-h-[400px]">
                        {/* Option A Result */}
                        <div className="flex-1 glass-panel relative overflow-hidden flex flex-col items-center justify-center p-8 group">
                            {/* Fill Background */}
                            <div
                                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600/60 to-blue-400/20 transition-all duration-1000 ease-out z-0 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
                                style={{ height: `${Math.max(stats.A, 5)}%` }}
                            />

                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <span className="text-7xl font-black text-white drop-shadow-lg">{stats.A}%</span>
                                <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                    <span className="text-lg font-bold uppercase tracking-widest text-blue-200">
                                        {stats.countA} Szavazat
                                    </span>
                                </div>
                                <p className="text-2xl font-bold mt-4 text-center leading-tight max-w-xs">{a}</p>
                            </div>

                            {/* Winner Badge */}
                            {stats.A > stats.B && (
                                <div className="absolute top-4 right-4 bg-yellow-500 text-black font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest shadow-lg animate-bounce">
                                    Népszerűbb
                                </div>
                            )}
                        </div>

                        {/* Option B Result */}
                        <div className="flex-1 glass-panel relative overflow-hidden flex flex-col items-center justify-center p-8 group">
                            {/* Fill Background */}
                            <div
                                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-600/60 to-red-400/20 transition-all duration-1000 ease-out z-0 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
                                style={{ height: `${Math.max(stats.B, 5)}%` }}
                            />

                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <span className="text-7xl font-black text-white drop-shadow-lg">{stats.B}%</span>
                                <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                    <span className="text-lg font-bold uppercase tracking-widest text-red-200">
                                        {stats.countB} Szavazat
                                    </span>
                                </div>
                                <p className="text-2xl font-bold mt-4 text-center leading-tight max-w-xs">{b}</p>
                            </div>

                            {/* Winner Badge */}
                            {stats.B > stats.A && (
                                <div className="absolute top-4 right-4 bg-yellow-500 text-black font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest shadow-lg animate-bounce">
                                    Népszerűbb
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleNext}
                        className="glass-btn px-16 py-5 text-2xl font-black rounded-full mt-4 hover:scale-110 active:scale-95 transition-all shadow-2xl"
                    >
                        Folytatás
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
