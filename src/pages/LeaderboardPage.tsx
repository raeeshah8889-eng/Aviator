import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/leaderboard.scss';

interface LeaderboardEntry {
  username: string;
  totalProfit: number;
  biggestWin: number;
  wins: number;
}

const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/leaderboard');
      setLeaderboard(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  const formatProfit = (profit: number) => {
    const prefix = profit >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(profit).toFixed(2)}`;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <Link to="/" className="back-button">← Back to Game</Link>
        <h1>🏆 Leaderboard</h1>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Total Profit</th>
                <th>Biggest Win</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.username}
                  className={index < 3 ? 'top-three' : ''}
                >
                  <td className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index >= 3 && `#${index + 1}`}
                  </td>
                  <td className="username">{entry.username}</td>
                  <td className={entry.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                    {formatProfit(entry.totalProfit)}
                  </td>
                  <td className="multiplier">
                    {entry.biggestWin > 0 ? `${entry.biggestWin.toFixed(2)}x` : '-'}
                  </td>
                  <td className="wins">{entry.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
