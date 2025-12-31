import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const PlayerJoin = () => {
    const [pin, setPin] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        socket.connect();

        socket.on('joined_success', ({ pin, username }) => {
            // Store info locally in case of refresh? Or just navigate.
            // Better to pass state via router or context.
            navigate('/game', { state: { pin, username } });
        });

        socket.on('error', (msg) => {
            setError(msg);
        });

        return () => {
            socket.off('joined_success');
            socket.off('error');
        };
    }, [navigate]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (!pin || !username) {
            setError('Kérlek tölts ki minden mezőt!');
            return;
        }
        socket.emit('join_game', { pin, username });
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
            <div className="glass-panel p-8 w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-gradient">Csatlakozás</h2>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleJoin} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">PIN Kód</label>
                        <input
                            type="text"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 text-center text-2xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Felhasználónév</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                            placeholder="Írd be a neved..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="glass-btn mt-4 py-3 rounded-lg font-bold text-lg bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                        Belépés
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PlayerJoin;
