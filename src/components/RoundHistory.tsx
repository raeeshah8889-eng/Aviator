import React from 'react';

interface RoundHistoryProps {
  history: Array<{ crashPoint: number; timestamp: number }>;
}

const RoundHistory: React.FC<RoundHistoryProps> = ({ history }) => {
  const getCrashColor = (crashPoint: number) => {
    if (crashPoint < 2) return 'red';
    if (crashPoint < 5) return 'orange';
    if (crashPoint < 10) return 'green';
    return 'gold';
  };

  return (
    <div className="round-history">
      <div className="history-label">Last Crashes:</div>
      <div className="history-badges">
        {history.slice(-10).reverse().map((round, index) => (
          <div
            key={`${round.timestamp}-${index}`}
            className={`crash-badge ${getCrashColor(round.crashPoint)}`}
          >
            {round.crashPoint.toFixed(2)}x
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoundHistory;
