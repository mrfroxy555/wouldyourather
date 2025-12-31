import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h1 className="text-6xl font-bold mb-4 text-gradient py-2">Szilveszteri Játék</h1>
            <p className="text-xl text-gray-300 mb-12">Ifi Közösség 2025</p>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="glass-panel p-8 w-64 flex flex-col items-center hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl mb-4">🎮</div>
                    <h2 className="text-2xl font-bold mb-2">Játékos vagyok</h2>
                    <p className="text-gray-400 text-sm mb-6">Csatlakozz egy meglévő játékhoz a telefonoddal.</p>
                    <button
                        onClick={() => navigate('/join')}
                        className="glass-btn w-full py-3 rounded-lg font-bold text-white bg-brand-purple/50 bg-opacity-50"
                    >
                        Csatlakozás
                    </button>
                </div>

                <div className="glass-panel p-8 w-64 flex flex-col items-center hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl mb-4">👑</div>
                    <h2 className="text-2xl font-bold mb-2">Játékmester vagyok</h2>
                    <p className="text-gray-400 text-sm mb-6">Indíts új játékot és vezesd le a kvízt.</p>
                    <button
                        onClick={() => navigate('/host')}
                        className="glass-btn w-full py-3 rounded-lg font-bold text-white bg-gray-700/50"
                    >
                        Játék indítása
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
