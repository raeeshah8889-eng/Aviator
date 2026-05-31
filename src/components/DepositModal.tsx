import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import toast from 'react-hot-toast';

interface DepositModalProps {
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const { addFunds } = useWallet();
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const presetAmounts = [1000, 5000, 10000];

  const handleDeposit = () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    addFunds(amount);
    toast.success(`Added $${amount.toFixed(2)} to your wallet!`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Funds</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="preset-amounts">
            {presetAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`preset-btn ${selectedAmount === amount ? 'selected' : ''}`}
              >
                +${amount.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label>Or enter custom amount:</label>
            <div className="custom-input-wrapper">
              <span>$</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                min="1"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="deposit-total">
            Amount to add: ${(selectedAmount || parseFloat(customAmount) || 0).toFixed(2)}
          </div>

          <button onClick={handleDeposit} className="deposit-confirm-btn">
            Add Funds
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
