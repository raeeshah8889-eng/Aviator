const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { GameEngine } = require('./gameEngine');
const { BotEngine } = require('./botEngine');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const gameEngine = new GameEngine();
const botEngine = new BotEngine();

// Store connected players
const players = new Map();
const roundHistory = [];
const leaderboard = new Map();

// API Routes
app.get('/api/history', (req, res) => {
  res.json(roundHistory.slice(-50));
});

app.get('/api/leaderboard', (req, res) => {
  const leaderboardData = Array.from(leaderboard.entries())
    .map(([username, data]) => ({
      username,
      totalProfit: data.totalProfit,
      biggestWin: data.biggestWin,
      wins: data.wins
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 20);

  res.json(leaderboardData);
});

app.post('/api/deposit', (req, res) => {
  const { playerId, amount } = req.body;
  const player = players.get(playerId);

  if (player) {
    player.balance += amount;
    players.set(playerId, player);
    res.json({ success: true, balance: player.balance });
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Initialize player with $10,000
  players.set(socket.id, {
    id: socket.id,
    username: `Player_${socket.id.substr(0, 6)}`,
    balance: 10000,
    currentBet: null,
    hasCashedOut: false,
    autoCashout: null
  });

  // Send initial game state
  socket.emit('game:init', {
    balance: 10000,
    gameState: gameEngine.getState(),
    history: roundHistory.slice(-10)
  });

  // Handle player bet
  socket.on('player:bet', (data) => {
    const player = players.get(socket.id);

    if (!player) return;

    if (gameEngine.getState().phase !== 'waiting') {
      socket.emit('error', { message: 'Can only bet during countdown phase' });
      return;
    }

    if (data.amount < 1) {
      socket.emit('error', { message: 'Minimum bet is $1' });
      return;
    }

    if (data.amount > player.balance) {
      socket.emit('error', { message: 'Insufficient balance' });
      return;
    }

    player.balance -= data.amount;
    player.currentBet = data.amount;
    player.hasCashedOut = false;
    player.autoCashout = data.autoCashout || null;

    players.set(socket.id, player);

    socket.emit('player:betPlaced', {
      betAmount: data.amount,
      balance: player.balance
    });

    // Broadcast updated player list
    broadcastPlayerList();
  });

  // Handle player cashout
  socket.on('player:cashout', () => {
    const player = players.get(socket.id);

    if (!player || !player.currentBet || player.hasCashedOut) return;

    if (gameEngine.getState().phase !== 'flying') {
      socket.emit('error', { message: 'Can only cashout during flying phase' });
      return;
    }

    const currentMultiplier = gameEngine.getState().multiplier;
    const winAmount = player.currentBet * currentMultiplier;

    player.balance += winAmount;
    player.hasCashedOut = true;

    // Update leaderboard
    updateLeaderboard(player.username, winAmount - player.currentBet, currentMultiplier);

    players.set(socket.id, player);

    socket.emit('player:cashedOut', {
      multiplier: currentMultiplier,
      winAmount,
      balance: player.balance
    });

    broadcastPlayerList();
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    players.delete(socket.id);
    broadcastPlayerList();
  });

  function broadcastPlayerList() {
    const playerList = Array.from(players.values()).map(p => ({
      id: p.id,
      username: p.username,
      betAmount: p.currentBet || 0,
      status: p.currentBet ? (p.hasCashedOut ? 'cashedOut' : 'active') : 'waiting',
      cashoutMultiplier: p.hasCashedOut ? gameEngine.getState().lastCashoutMultiplier : null
    }));

    io.emit('game:playerUpdate', playerList);
  }
});

// Game loop
function startGameLoop() {
  // Start countdown
  let countdown = 5;

  const countdownInterval = setInterval(() => {
    io.emit('game:countdown', { countdown });

    countdown--;

    if (countdown < 0) {
      clearInterval(countdownInterval);
      startRound();
    }
  }, 1000);
}

function startRound() {
  // Generate crash point
  const crashPoint = gameEngine.generateCrashPoint();

  // Generate bots for this round
  const bots = botEngine.generateBots(100 + Math.floor(Math.random() * 21)); // 100-120 bots

  // Start the game
  gameEngine.startGame(crashPoint);

  io.emit('game:start', {
    crashHash: gameEngine.getCrashHash(),
    bots: bots.map(b => ({
      id: b.id,
      username: b.username,
      betAmount: b.betAmount,
      targetMultiplier: b.targetMultiplier
    }))
  });

  // Reset player bets
  players.forEach((player, id) => {
    player.currentBet = null;
    player.hasCashedOut = false;
    player.autoCashout = null;
    players.set(id, player);
  });

  // Multiplier update loop
  const multiplierInterval = setInterval(() => {
    const state = gameEngine.update();

    io.emit('game:multiplier', {
      multiplier: state.multiplier,
      elapsed: state.elapsed
    });

    // Handle auto cashout for players
    players.forEach((player, id) => {
      if (player.currentBet && !player.hasCashedOut && player.autoCashout) {
        if (state.multiplier >= player.autoCashout) {
          const winAmount = player.currentBet * state.multiplier;
          player.balance += winAmount;
          player.hasCashedOut = true;

          updateLeaderboard(player.username, winAmount - player.currentBet, state.multiplier);

          players.set(id, player);

          io.to(id).emit('player:cashedOut', {
            multiplier: state.multiplier,
            winAmount,
            balance: player.balance
          });
        }
      }
    });

    // Handle bot cashouts
    bots.forEach(bot => {
      if (!bot.hasCashedOut && state.multiplier >= bot.targetMultiplier) {
        bot.hasCashedOut = true;
        bot.cashoutMultiplier = state.multiplier;

        updateLeaderboard(bot.username, bot.betAmount * (state.multiplier - 1), state.multiplier);

        io.emit('bot:cashedOut', {
          botId: bot.id,
          multiplier: state.multiplier,
          winAmount: bot.betAmount * state.multiplier
        });
      }
    });

    if (state.phase === 'crashed') {
      clearInterval(multiplierInterval);

      // Handle players who didn't cash out
      players.forEach((player, id) => {
        if (player.currentBet && !player.hasCashedOut) {
          updateLeaderboard(player.username, -player.currentBet, 0);
        }
      });

      // Record history
      roundHistory.push({
        crashPoint: state.crashPoint,
        timestamp: Date.now(),
        hash: state.hash
      });

      io.emit('game:crash', {
        crashPoint: state.crashPoint,
        hash: state.hash
      });

      // Start next round after 3 seconds
      setTimeout(startGameLoop, 3000);
    }
  }, 100);
}

function updateLeaderboard(username, profit, multiplier) {
  const current = leaderboard.get(username) || {
    totalProfit: 0,
    biggestWin: 0,
    wins: 0
  };

  current.totalProfit += profit;
  if (multiplier > current.biggestWin) {
    current.biggestWin = multiplier;
  }
  if (profit > 0) {
    current.wins++;
  }

  leaderboard.set(username, current);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startGameLoop();
});
