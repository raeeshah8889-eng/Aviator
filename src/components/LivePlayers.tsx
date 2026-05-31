import React from 'react';

interface Player {
  id: string;
  username: string;
  betAmount: number;
  status: 'waiting' | 'active' | 'cashedOut' | 'lost';
  cashoutMultiplier: number | null;
}

interface Bot {
  id: string;
  username: string;
  betAmount: number;
  status: 'waiting' | 'active' | 'cashedOut' | 'lost';
  cashoutMultiplier: number | null;
}

interface LivePlayersProps {
  players: Player[];
  bots: Bot[];
  currentMultiplier: number;
}

const LivePlayers: React.FC<LivePlayersProps> = ({ players, bots, currentMultiplier }) => {
  const allParticipants = [...players, ...bots].sort((a, b) => b.betAmount - a.betAmount);

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const getStatusDisplay = (participant: Player | Bot) => {
    switch (participant.status) {
      case 'waiting':
        return <span className="status waiting">Waiting</span>;
      case 'active':
        return (
          <span className="status active">
            Flying (${(participant.betAmount * currentMultiplier).toFixed(2)})
          </span>
        );
      case 'cashedOut':
        return (
          <span className="status cashedOut">
            ✓ {participant.cashoutMultiplier?.toFixed(2)}x (+${(participant.betAmount * (participant.cashoutMultiplier || 1)).toFixed(2)})
          </span>
        );
      case 'lost':
        return <span className="status lost">✗ Lost</span>;
      default:
        return null;
    }
  };

  return (
    <div className="live-players-panel">
      <div className="panel-header">
        <h3>Live Players ({allParticipants.length})</h3>
      </div>

      <div className="players-list">
        {allParticipants.map((participant) => (
          <div
            key={participant.id}
            className={`player-row ${participant.status} ${participant.id.startsWith('Player') ? 'real-player' : ''}`}
          >
            <div className="player-avatar">
              {getInitials(participant.username)}
            </div>
            <div className="player-info">
              <div className="player-name">{participant.username}</div>
              <div className="player-bet">${participant.betAmount.toFixed(2)}</div>
            </div>
            <div className="player-status">
              {getStatusDisplay(participant)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LivePlayers;
