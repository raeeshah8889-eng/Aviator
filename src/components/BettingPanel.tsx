import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';

const BettingPanel: React.FC = () => {
  const { state, placeBet, cashout } = useGame();
  const { balance } = useWallet();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashoutValue, setAutoCashoutValue] = useState<number | null>(null);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);

  const quickAmounts = [10, 50, 100, 500];

  const handlePlaceBet = () => {
    if (betAmount < 1) {
      toast.error('Minimum bet is $1');
      return;
    }

    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    const autoCashout = autoCashoutEnabled ? autoCashoutValue : null;

    const success = placeBet(betAmount, autoCashout);
    if (success) {
      toast.success(`Bet placed: $${betAmount.toFixed(2)}`);
    } else {
      toast.error('Can only bet during countdown phase');
    }
  };

  const handleCashout = () => {
    cashout();
  };

  const canBet = (state.phase === 'countdown' || state.phase === 'waiting') && !state.currentBet;
  const canCashout = state.phase === 'flying' && state.currentBet && !state.hasCashedOut;

  const potentialWin = state.currentBet ? state.currentBet * state.multiplier : 0;

  return (
    <div className="betting-panel">
      <div className="bet-input-section">
        <label>Bet Amount</label>
        <div className="bet-input-wrapper">
          <span className="currency">$</span>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            min="1"
            disabled={state.currentBet !== null}
            className="bet-input"
          />
        </div>
        <div className="quick-amounts">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => setBetAmount(prev => prev + amount)}
              disabled={state.currentBet !== null}
              className="quick-amount-btn"
            >
              +${amount}
            </button>
          ))}
          <button
            onClick={() => setBetAmount(0)}
            disabled={state.currentBet !== null}
            className="quick-amount-btn reset"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="auto-cashout-section">
        <label>
          <input
            type="checkbox"
            checked={autoCashoutEnabled}
            onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
            disabled={state.currentBet !== null}
          />
          Auto Cashout
        </label>
        {autoCashoutEnabled && (
          <div className="auto-cashout-input">
            <input
              type="number"
              value={autoCashoutValue || ''}
              onChange={(e) => setAutoCashoutValue(parseFloat(e.target.value) || null)}
              min="1.01"
              step="0.01"
              disabled={state.currentBet !== null}
            />
            <span>x</span>
          </div>
        )}
      </div>

      {state.currentBet === null ? (
        <button
          onClick={handlePlaceBet}
          disabled={!canBet}
          className={`place-bet-btn ${canBet ? 'active' : 'disabled'}`}
        >
          {state.phase === 'countdown' ? 'PLACE BET' : state.phase === 'waiting' ? 'WAITING...' : 'ROUND IN PROGRESS'}
        </button>
      ) : (
        <div className="bet-status">
          {!state.hasCashedOut ? (
            <>
              <div className="current-bet-info">
                <span className="bet-label">Your Bet:</span>
                <span className="bet-amount">${state.currentBet.toFixed(2)}</span>
              </div>
              <div className="potential-win">
                <span className="potential-label">Potential Win:</span>
                <span className="potential-amount">${potentialWin.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCashout}
                disabled={!canCashout}
                className={`cashout-btn ${canCashout ? 'active' : 'disabled'}`}
              >
                CASH OUT @ {state.multiplier.toFixed(2)}x
              </button>
            </>
          ) : (
            <div className="cashed-out-info">
              <div className="result positive">
                ✓ Cashed Out @ {state.lastMultiplier?.toFixed(2)}x
              </div>
              <div className="win-amount">
                Won: +${state.lastWinAmount?.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BettingPanel;
