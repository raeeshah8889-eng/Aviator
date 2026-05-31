import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { WalletProvider } from './context/WalletContext';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import './App.scss';

function App() {
  return (
    <WalletProvider>
      <GameProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </div>
      </GameProvider>
    </WalletProvider>
  );
}

export default App;
