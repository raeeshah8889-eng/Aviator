import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useWallet } from './WalletContext';

interface Player {
  id: string;
  username: string;
  betAmount: number;
  status: 'waiting' | 'active' | 'cashedOut' | 'lost';
  cashoutMultiplier: number | null;
  winAmount?: number;
}

interface Bot {
  id: string;
  username: string;
  betAmount: number;
  targetMultiplier?: number;
  status: 'waiting' | 'active' | 'cashedOut' | 'lost';
  cashoutMultiplier: number | null;
}

interface GameState {
  phase: 'waiting' | 'countdown' | 'flying' | 'crashed';
  multiplier: number;
  countdown: number;
  crashPoint: number | null;
  crashHash: string | null;
  currentBet: number | null;
  autoCashout: number | null;
  hasCashedOut: boolean;
  players: Player[];
  bots: Bot[];
  history: Array<{ crashPoint: number; timestamp: number }>;
  lastWinAmount: number | null;
  lastMultiplier: number | null;
}

type GameAction =
  | { type: 'SET_COUNTDOWN'; payload: number }
  | { type: 'START_GAME'; payload: { crashHash: string; bots: Bot[] } }
  | { type: 'UPDATE_MULTIPLIER'; payload: { multiplier: number } }
  | { type: 'CRASH'; payload: { crashPoint: number; hash: string } }
  | { type: 'PLACE_BET'; payload: { amount: number; autoCashout: number | null } }
  | { type: 'CASHOUT'; payload: { multiplier: number; winAmount: number } }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] }
  | { type: 'UPDATE_BOT'; payload: { botId: string; multiplier: number; winAmount: number } }
  | { type: 'SET_HISTORY'; payload: Array<{ crashPoint: number; timestamp: number }> }
  | { type: 'RESET_ROUND' };

const initialState: GameState = {
  phase: 'waiting',
  multiplier: 1.00,
  countdown: 5,
  crashPoint: null,
  crashHash: null,
  currentBet: null,
  autoCashout: null,
  hasCashedOut: false,
  players: [],
  bots: [],
  history: [],
  lastWinAmount: null,
  lastMultiplier: null
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_COUNTDOWN':
      return { ...state, phase: 'countdown', countdown: action.payload };

    case 'START_GAME':
      return {
        ...state,
        phase: 'flying',
        multiplier: 1.00,
        crashHash: action.payload.crashHash,
        bots: action.payload.bots.map(b => ({ ...b, status: 'active' as const })),
        hasCashedOut: false,
        lastWinAmount: null,
        lastMultiplier: null
      };

    case 'UPDATE_MULTIPLIER':
      return { ...state, multiplier: action.payload.multiplier };

    case 'CRASH':
      return {
        ...state,
        phase: 'crashed',
        crashPoint: action.payload.crashPoint,
        multiplier: action.payload.crashPoint,
        bots: state.bots.map(bot => ({
          ...bot,
          status: bot.status === 'active' ? 'lost' as const : bot.status
        })),
        currentBet: state.currentBet && !state.hasCashedOut ? null : state.currentBet
      };

    case 'PLACE_BET':
      return {
        ...state,
        currentBet: action.payload.amount,
        autoCashout: action.payload.autoCashout
      };

    case 'CASHOUT':
      return {
        ...state,
        hasCashedOut: true,
        lastWinAmount: action.payload.winAmount,
        lastMultiplier: action.payload.multiplier
      };

    case 'UPDATE_PLAYERS':
      return { ...state, players: action.payload };

    case 'UPDATE_BOT':
      return {
        ...state,
        bots: state.bots.map(bot =>
          bot.id === action.payload.botId
            ? { ...bot, status: 'cashedOut' as const, cashoutMultiplier: action.payload.multiplier }
            : bot
        )
      };

    case 'SET_HISTORY':
      return { ...state, history: action.payload };

    case 'RESET_ROUND':
      return { ...state, phase: 'waiting', countdown: 5, multiplier: 1.00 };

    default:
      return state;
  }
};

interface GameContextType {
  state: GameState;
  placeBet: (amount: number, autoCashout: number | null) => boolean;
  cashout: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket, connected } = useSocket();
  const { deductBet, addWinnings, balance } = useWallet();

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('game:init', (data: { balance: number; gameState: any; history: any[] }) => {
      dispatch({ type: 'SET_HISTORY', payload: data.history });
    });

    socket.on('game:countdown', (data: { countdown: number }) => {
      dispatch({ type: 'SET_COUNTDOWN', payload: data.countdown });
    });

    socket.on('game:start', (data: { crashHash: string; bots: Bot[] }) => {
      dispatch({ type: 'START_GAME', payload: data });
    });

    socket.on('game:multiplier', (data: { multiplier: number }) => {
      dispatch({ type: 'UPDATE_MULTIPLIER', payload: data });

      // Auto cashout logic
      if (state.autoCashout && state.currentBet && !state.hasCashedOut) {
        if (data.multiplier >= state.autoCashout) {
          cashout();
        }
      }
    });

    socket.on('game:crash', (data: { crashPoint: number; hash: string }) => {
      dispatch({ type: 'CRASH', payload: data });

      // Reset after 3 seconds
      setTimeout(() => {
        dispatch({ type: 'RESET_ROUND' });
      }, 3000);
    });

    socket.on('game:playerUpdate', (players: Player[]) => {
      dispatch({ type: 'UPDATE_PLAYERS', payload: players });
    });

    socket.on('bot:cashedOut', (data: { botId: string; multiplier: number; winAmount: number }) => {
      dispatch({ type: 'UPDATE_BOT', payload: data });
    });

    socket.on('player:betPlaced', (data: { betAmount: number; balance: number }) => {
      // Bet confirmed
    });

    socket.on('player:cashedOut', (data: { multiplier: number; winAmount: number; balance: number }) => {
      addWinnings(data.winAmount);
      dispatch({ type: 'CASHOUT', payload: data });
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Game error:', data.message);
    });

    return () => {
      socket.off('game:init');
      socket.off('game:countdown');
      socket.off('game:start');
      socket.off('game:multiplier');
      socket.off('game:crash');
      socket.off('game:playerUpdate');
      socket.off('bot:cashedOut');
      socket.off('player:betPlaced');
      socket.off('player:cashedOut');
      socket.off('error');
    };
  }, [socket, connected, state.autoCashout, state.currentBet, state.hasCashedOut]);

  const placeBet = (amount: number, autoCashout: number | null): boolean => {
    if (state.phase !== 'countdown' && state.phase !== 'waiting') return false;
    if (amount > balance) return false;

    const success = deductBet(amount);
    if (success) {
      socket?.emit('player:bet', { amount, autoCashout });
      dispatch({ type: 'PLACE_BET', payload: { amount, autoCashout } });
      return true;
    }
    return false;
  };

  const cashout = () => {
    if (state.phase !== 'flying' || !state.currentBet || state.hasCashedOut) return;

    socket?.emit('player:cashout');
  };

  return (
    <GameContext.Provider value={{ state, placeBet, cashout }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
