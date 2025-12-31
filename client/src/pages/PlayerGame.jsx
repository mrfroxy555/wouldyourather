import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const PlayerGame = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [question, setQuestion] = useState(null);
    const [voted, setVoted] = useState(null); // 'A' or 'B'
    const [waiting, setWaiting] = useState(true);
    const [resultMsg, setResultMsg] = useState('');

    useEffect(() => {
        if (!state?.pin) {
            navigate('/');
        }

        // Since player might join mid-game or be redirected from Lobby
        // We listen for new_question
        socket.on('new_question', (data) => {
            setQuestion(data.question);
            setVoted(null);
            setWaiting(false);
            setResultMsg('');
        });

        socket.on('round_results', (data) => {
            setWaiting(true);
            // Determine if we were in the majority
            // We need to know what we voted. `voted` state has it.
            // But `voted` might be state stale inside closure? 
            // useEffect deps will help, but `voted` changes. 
            // Actually simpler: just display "Results on screen".
            setResultMsg("Eredmények a kivetítőn!");
        });

        socket.on('game_over', () => {
            setResultMsg("Játék Vége! Nézd a táblát!");
        });

        return () => {
            socket.off('new_question');
            socket.off('round_results');
            socket.off('game_over');
        };
    }, [state, navigate]);

    const handleVote = (choice) => {
        setVoted(choice);
        setWaiting(true);
        socket.emit('submit_vote', { pin: state.pin, answer: choice });
    };

    // Split text helper (same as Host)
    const splitQuestionText = (text) => {
        if (!text) return { a: '', b: '' };
        const parts = text.split(', vagy ');
        if (parts.length === 2) {
            return {
                a: parts[0].replace(/^Inkább\s+/i, ''),
                b: parts[1].replace(/\?$/, '')
            };
        }
        return { a: text, b: '' };
    };

    const { a, b } = question ? splitQuestionText(question.text) : { a: '', b: '' };

    if (waiting && !question && !resultMsg) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold">Várakozás a játékmesterre...</h2>
                <p className="mt-4 text-gray-400">Nézz a kivetítőre!</p>
            </div>
        );
    }

    if (resultMsg) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-3xl font-bold text-gradient mb-4">{resultMsg}</h2>
                {voted && <p>Te ezt választottad: {voted === 'A' ? 'A (Kék)' : 'B (Piros)'}</p>}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 text-center pb-2">
                <h1 className="text-xl font-bold text-gray-300">Dönts most!</h1>
            </div>

            <button
                onClick={() => handleVote('A')}
                disabled={waiting}
                className={`flex-1 m-4 rounded-2xl flex flex-col items-center justify-center p-6 active:scale-95 transition-all shadow-lg ${voted === 'A'
                        ? 'bg-blue-500 scale-105 ring-4 ring-white shadow-blue-500/50'
                        : voted === 'B'
                            ? 'bg-blue-900/40 grayscale opacity-40'
                            : 'bg-blue-600 shadow-blue-900/50'
                    }`}
            >
                <span className="text-6xl mb-4">🔵</span>
                <span className="text-xl font-bold uppercase">{a}</span>
                {voted === 'A' && <span className="mt-2 font-bold text-white bg-white/20 px-4 py-1 rounded-full text-sm">KIVÁLASZTVA</span>}
            </button>

            <button
                onClick={() => handleVote('B')}
                disabled={waiting}
                className={`flex-1 m-4 mt-0 rounded-2xl flex flex-col items-center justify-center p-6 active:scale-95 transition-all shadow-lg ${voted === 'B'
                        ? 'bg-red-500 scale-105 ring-4 ring-white shadow-red-500/50'
                        : voted === 'A'
                            ? 'bg-red-900/40 grayscale opacity-40'
                            : 'bg-red-600 shadow-red-900/50'
                    }`}
            >
                <span className="text-6xl mb-4">🔴</span>
                <span className="text-xl font-bold uppercase">{b}</span>
                {voted === 'B' && <span className="mt-2 font-bold text-white bg-white/20 px-4 py-1 rounded-full text-sm">KIVÁLASZTVA</span>}
            </button>
        </div>
    );
};

export default PlayerGame;
