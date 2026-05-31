import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  balance: number;
  addFunds: (amount: number) => void;
  deductBet: (amount: number) => boolean;
  addWinnings: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('walletBalance');
    return saved ? parseFloat(saved) : 10000;
  });

  useEffect(() => {
    localStorage.setItem('walletBalance', balance.toString());
  }, [balance]);

  const addFunds = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  const deductBet = (amount: number): boolean => {
    if (amount > balance || amount < 1) return false;
    setBalance(prev => prev - amount);
    return true;
  };

  const addWinnings = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  return (
    <WalletContext.Provider value={{ balance, addFunds, deductBet, addWinnings }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
