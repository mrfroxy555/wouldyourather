import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const HostLobby = () => {
    const [pin, setPin] = useState(null);
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        socket.connect();
        socket.emit('create_game');

        socket.on('game_created', ({ pin }) => {
            setPin(pin);
            localStorage.setItem('gamePin', pin);
        });

        socket.on('player_joined', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('new_question', (data) => {
            navigate('/host-game', { state: { pin, initialData: data } });
        });

        return () => {
            socket.off('game_created');
            socket.off('player_joined');
            socket.off('new_question');
        };
    }, [navigate]);

    const handleStart = () => {
        if (players.length === 0) {
            alert("Várj legalább egy játékost!");
            return;
        }
        socket.emit('start_game', { pin });
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-8 h-full">
            <h1 className="text-4xl font-bold text-gray-400 mb-2">Csatlakozzatok!</h1>
            <p className="text-xl mb-8">Írd be a PIN kódot a telefonodon.</p>

            <div className="glass-panel px-12 py-6 mb-12">
                <span className="text-xl text-gray-400 mr-4">PIN KÓD:</span>
                <span className="text-6xl font-black text-gradient tracking-widest">
                    {pin || '------'}
                </span>
            </div>

            <div className="flex-1 w-full overflow-y-auto mb-8">
                <div className="flex flex-wrap justify-center gap-4">
                    {players.map((p, i) => (
                        <div key={i} className="glass-panel px-6 py-3 rounded-full flex items-center animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center mr-3 text-sm">
                                👤
                            </div>
                            <span className="font-bold">{p.username}</span>
                        </div>
                    ))}
                    {players.length === 0 && (
                        <p className="text-gray-500 italic">Várakozás játékosokra...</p>
                    )}
                </div>
            </div>

            <div className="w-full flex justify-center pb-8">
                <button
                    onClick={handleStart}
                    className="glass-btn px-12 py-4 rounded-full text-xl font-bold bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!pin || players.length === 0}
                >
                    Játék Indítása ({players.length})
                </button>
            </div>
        </div>
    );
};

export default HostLobby;
