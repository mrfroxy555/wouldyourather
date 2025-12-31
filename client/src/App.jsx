import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HostLobby from './pages/HostLobby';
import PlayerJoin from './pages/PlayerJoin';
import HostGame from './pages/HostGame';
import PlayerGame from './pages/PlayerGame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/host" element={<HostLobby />} />
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/host-game" element={<HostGame />} />
        <Route path="/game" element={<PlayerGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
