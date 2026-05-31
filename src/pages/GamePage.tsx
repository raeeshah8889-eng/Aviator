import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useWallet } from '../context/WalletContext';
import GameGraph from '../components/GameGraph';
import BettingPanel from '../components/BettingPanel';
import WalletPanel from '../components/WalletPanel';
import LivePlayers from '../components/LivePlayers';
import RoundHistory from '../components/RoundHistory';
import CountdownTimer from '../components/CountdownTimer';
import DepositModal from '../components/DepositModal';
import toast from 'react-hot-toast';
import '../styles/game.scss';

const GamePage: React.FC = () => {
  const { state } = useGame();
  const [showDepositModal, setShowDepositModal] = useState(false);

  return (
    <div className="game-page">
      <div className="game-main">
        <div className="game-graph-section">
          {state.phase === 'countdown' && (
            <CountdownTimer countdown={state.countdown} />
          )}
          <GameGraph
            multiplier={state.multiplier}
            phase={state.phase}
            crashPoint={state.crashPoint}
          />
        </div>

        <div className="controls-section">
          <div className="controls-row">
            <WalletPanel onDepositClick={() => setShowDepositModal(true)} />
            <BettingPanel />
          </div>
          <RoundHistory history={state.history} />
        </div>
      </div>

      <div className="live-players-section">
        <LivePlayers
          players={state.players}
          bots={state.bots}
          currentMultiplier={state.multiplier}
        />
      </div>

      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
    </div>
  );
};

export default GamePage;
