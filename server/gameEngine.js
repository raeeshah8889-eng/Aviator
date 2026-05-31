const crypto = require('crypto');

class GameEngine {
  constructor() {
    this.state = {
      phase: 'waiting',
      multiplier: 1.00,
      crashPoint: null,
      elapsed: 0,
      hash: null,
      startTime: null
    };

    this.growthRate = 0.1;
    this.currentRoundSecret = null;
  }

  generateCrashPoint() {
    // Generate random crash point (provably fair)
    // House edge of ~1%

    const max_multiplier = 1000000;
    const house_edge = 0.01; // 1% house edge

    this.currentRoundSecret = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(this.currentRoundSecret).digest('hex');

    // Use first 8 bytes of hash for random number
    const random = parseInt(hash.substring(0, 8), 16);

    // Calculate crash point (increasing chance at lower multipliers)
    const h = Math.floor(random % 65535);
    const crashPoint = Math.max(1, (65535 / (65535 - h)) * (1 - house_edge));

    this.state.crashPoint = Math.min(crashPoint, max_multiplier);
    this.state.hash = hash;

    return this.state.crashPoint;
  }

  getCrashHash() {
    return this.state.hash;
  }

  startGame(crashPoint) {
    this.state.phase = 'flying';
    this.state.multiplier = 1.00;
    this.state.crashPoint = crashPoint;
    this.state.elapsed = 0;
    this.state.startTime = Date.now();
  }

  update() {
    if (this.state.phase !== 'flying') {
      return this.state;
    }

    this.state.elapsed = (Date.now() - this.state.startTime) / 1000;

    // Calculate current multiplier using exponential growth
    this.state.multiplier = Math.pow(Math.E, this.growthRate * this.state.elapsed);

    // Check if crashed
    if (this.state.multiplier >= this.state.crashPoint) {
      this.state.phase = 'crashed';
      this.state.multiplier = this.state.crashPoint;
    }

    return this.state;
  }

  getState() {
    return this.state;
  }
}

module.exports = { GameEngine };
