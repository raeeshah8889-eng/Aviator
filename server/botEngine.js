const crypto = require('crypto');

class BotEngine {
  constructor() {
    this.botNames = [
      'CryptoKing', 'LuckyAce', 'Maverick_X', 'DiamondHands', 'MoonShot',
      'RiskTaker', 'SafeBet', 'HighRoller', 'FortuneHunter', 'JackpotJoy',
      'BetMaster', 'CoinFlip', 'WinStreak', 'GoldenEagle', 'SilverFox',
      'QuickCash', 'SlowBurn', 'BigSpender', 'CautiousCarl', 'BoldBetty',
      'WiseWager', 'LuckyLucy', 'RichRichard', 'WealthyWanda', 'ProfitPaul',
      'MoneyMike', 'CashCathy', 'FortuneFrank', 'SuccessSara', 'WinWalt'
    ];

    this.suffixes = ['99', '88', '77', '2024', 'Pro', 'X', 'VIP', 'HD', '007', '21'];
  }

  generateBots(count) {
    const bots = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
      const bot = this.generateBot(usedNames);
      bots.push(bot);
    }

    return bots;
  }

  generateBot(usedNames) {
    const name = this.generateUniqueName(usedNames);
    const behavior = this.assignBehavior();
    const betAmount = this.generateBetAmount(behavior);

    return {
      id: crypto.randomBytes(8).toString('hex'),
      username: name,
      betAmount: betAmount,
      targetMultiplier: this.generateTargetMultiplier(behavior),
      hasCashedOut: false,
      cashoutMultiplier: null,
      behavior: behavior
    };
  }

  generateUniqueName(usedNames) {
    let name;
    let attempts = 0;

    do {
      const baseName = this.botNames[Math.floor(Math.random() * this.botNames.length)];
      const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
      name = `${baseName}${suffix}`;
      attempts++;
    } while (usedNames.has(name) && attempts < 100);

    usedNames.add(name);
    return name;
  }

  assignBehavior() {
    const rand = Math.random();
    if (rand < 0.30) return 'safe';      // 30% safe
    if (rand < 0.70) return 'moderate';   // 40% moderate
    if (rand < 0.90) return 'risky';      // 20% risky
    return 'loser';                       // 10% lose
  }

  generateBetAmount(behavior) {
    const weights = {
      safe: { min: 5, max: 100 },
      moderate: { min: 10, max: 500 },
      risky: { min: 50, max: 2000 },
      loser: { min: 20, max: 300 }
    };

    const range = weights[behavior];

    // Most bots bet small, few bet large
    const skew = Math.pow(Math.random(), 2);
    return Math.floor(range.min + skew * (range.max - range.min));
  }

  generateTargetMultiplier(behavior) {
    switch (behavior) {
      case 'safe':
        // 1.1x to 1.9x
        return 1.1 + Math.random() * 0.8;

      case 'moderate':
        // 2.0x to 5.0x
        return 2.0 + Math.random() * 3.0;

      case 'risky':
        // 5.0x to 20.0x
        return 5.0 + Math.random() * 15.0;

      case 'loser':
        // Never cashout (set target extremely high)
        return 10000;

      default:
        return 2.0 + Math.random() * 3.0;
    }
  }
}

module.exports = { BotEngine };
