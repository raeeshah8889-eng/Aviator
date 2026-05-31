import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Link } from 'react-router-dom';

interface WalletPanelProps {
  onDepositClick: () => void;
}

const WalletPanel: React.FC<WalletPanelProps> = ({ onDepositClick }) => {
  const { balance } = useWallet();

  return (
    <div className="wallet-panel">
      <div className="wallet-balance">
        <div className="balance-label">Balance</div>
        <div className="balance-amount">${balance.toFixed(2)}</div>
      </div>

      <div className="wallet-actions">
        <button onClick={onDepositClick} className="deposit-btn">
          + Add Funds
        </button>
        <Link to="/leaderboard" className="leaderboard-link">
          🏆 Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default WalletPanel;
