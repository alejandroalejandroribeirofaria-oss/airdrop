const express = require('express');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://airdrop-fppi.onrender.com']
  : ['http://localhost:3000', 'https://airdrop-ua2d.onrender.com/'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limits
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Muitas requisições. Aguarda 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas. Tenta de novo em 15min.' },
  skipSuccessfulRequests: true,
});

const spinLimiter = rateLimit({
  windowMs: 1000,
  max: 1,
  keyGenerator: (req) => req.userId || req.ip,
  message: { error: 'Calma aí. 1 spin por segundo.' },
});

// In-memory store
const sessions = new Map();
const users = new Map();

const CARD_SYMBOLS = ['SOL', 'BTC', 'STK', 'BNB', 'ADA', 'DOT', 'AVAX', 'MATIC'];
const JOKER = 'JOKER';
const SPIN_COST = 10;
const WIN_REWARD_STK = 10.00;
const LOGIN_BONUS = 100;
const MIN_WITHDRAW_STK = 1000;
const JOKER_PENALTY_PERCENT = 1000.0;
const BONUS_RENEWAL_MS = 24 * 60 * 60 * 1000;

// Secure RNG
function secureRandom(max) {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) % max;
}

function secureRandomFloat() {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0xFFFFFFFF;
}

// Bonus functions
function checkBonusRenewal(user) {
  const now = Date.now();
  const lastBonus = user.lastBonusAt || user.createdAt;
  if (now - lastBonus >= BONUS_RENEWAL_MS) {
    user.bonusBalance = LOGIN_BONUS;
    user.lastBonusAt = now;
    return true;
  }
  return false;
}

function getBonusTimeLeft(user) {
  const lastBonus = user.lastBonusAt || user.createdAt;
  const remaining = lastBonus + BONUS_RENEWAL_MS - Date.now();
  if (remaining <= 0) return null;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return { hours: h, minutes: m, totalMs: remaining };
}

// Game logic
function generateGameResult() {
  const shouldWin = secureRandomFloat() < 0.30;
  return shouldWin ? generateWinningGrid() : generateLosingGrid();
}

function generateWinningGrid() {
  const grid = [];
  for (let i = 0; i < 9; i++) grid.push(CARD_SYMBOLS[secureRandom(CARD_SYMBOLS.length)]);
  
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const line = lines[secureRandom(lines.length)];
  const winSymbol = CARD_SYMBOLS[secureRandom(CARD_SYMBOLS.length)];
  line.forEach(idx => grid[idx] = winSymbol);
  return grid;
}

function generateLosingGrid() {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let attempts = 0;
  while (attempts < 100) {
    const grid = [];
    for (let i = 0; i < 9; i++) {
      if (secureRandom(100) < 6) {
        grid.push(JOKER);
      } else {
        grid.push(CARD_SYMBOLS[secureRandom(CARD_SYMBOLS.length)]);
      }
    }
    let hasMatch = false;
    for (const [a, b, c] of lines) {
      if (grid[a] === grid[b] && grid[b] === grid[c]) hasMatch = true;
    }
    if (!hasMatch) return grid;
    attempts++;
  }
  return ['SOL','BTC','ETH','BNB','ADA','DOT','AVAX','MATIC','SOL'];
}

function checkWins(grid) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const results = { wins: [], jokerLoss: false };
  for (const line of lines) {
    const [a, b, c] = line;
    if (grid[a] === grid[b] && grid[b] === grid[c]) {
      if (grid[a] === JOKER) {
        results.jokerLoss = true;
      } else {
        results.wins.push({ symbol: grid[a], line });
      }
    }
  }
  return results;
}

// Auth middleware
function auth(req, res, next) {
  const token = req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = sessions.get(token);
  req.user = users.get(req.userId);
  if (!req.user) {
    sessions.delete(token);
    return res.status(401).json({ error: 'User not found' });
  }
  next();
}

// ====================== AUTH ROUTES ======================

// REGISTER
app.post('/api/auth/register', authLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' });
  }
  if (!password || password.length < 4 || password.length > 30) {
    return res.status(400).json({ error: 'Password must be 4-30 characters' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username only letters, numbers and _' });
  }

  for (const [, user] of users.entries()) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      return res.status(409).json({ error: 'Username already taken' });
    }
  }

  const userId = crypto.randomUUID();
  const passHash = crypto.createHash('sha256').update(password).digest('hex');

  users.set(userId, {
    username,
    password: passHash,
    bonusBalance: LOGIN_BONUS,
    stkBalance: 0,
    totalSpins: 0,
    totalWins: 0,
    createdAt: Date.now(),
    lastBonusAt: Date.now()
  });

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);
  const user = users.get(userId);

  res.json({
    token,
    user: {
      username: user.username,
      bonusBalance: user.bonusBalance,
      stkBalance: user.stkBalance,
      totalSpins: user.totalSpins,
      totalWins: user.totalWins
    },
    isNew: true,
    loginBonus: LOGIN_BONUS,
    bonusRenewed: false,
    bonusTimeLeft: getBonusTimeLeft(user)
  });
});

// LOGIN
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  let userId = null;
  for (const [id, user] of users.entries()) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      userId = id;
      break;
    }
  }

  if (!userId) {
    return res.status(404).json({ error: 'Account not found. Please create an account first.' });
  }

  const user = users.get(userId);
  const passHash = crypto.createHash('sha256').update(password).digest('hex');

  if (user.password && user.password !== passHash) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);

  const bonusRenewed = checkBonusRenewal(user);
  const timeLeft = getBonusTimeLeft(user);

  res.json({
    token,
    user: {
      username: user.username,
      bonusBalance: user.bonusBalance,
      stkBalance: user.stkBalance,
      totalSpins: user.totalSpins,
      totalWins: user.totalWins
    },
    isNew: false,
    loginBonus: bonusRenewed ? LOGIN_BONUS : 0,
    bonusRenewed,
    bonusTimeLeft: timeLeft
  });
});

// Get user
app.get('/api/user', auth, (req, res) => {
  const u = req.user;
  checkBonusRenewal(u);
  res.json({
    username: u.username,
    bonusBalance: u.bonusBalance,
    stkBalance: u.stkBalance,
    totalSpins: u.totalSpins,
    totalWins: u.totalWins,
    bonusTimeLeft: getBonusTimeLeft(u)
  });
});

// SPIN, WITHDRAW e LEADERBOARD permanecem iguais ao anterior

// SPIN
app.post('/api/game/spin', auth, spinLimiter, (req, res) => {
  const user = req.user;
  checkBonusRenewal(user);

  if (user.bonusBalance < SPIN_COST) {
    return res.status(400).json({
      error: 'Insufficient bonus balance',
      code: 'NO_BALANCE',
      bonusTimeLeft: getBonusTimeLeft(user)
    });
  }

  user.bonusBalance -= SPIN_COST;
  user.totalSpins++;

  const grid = generateGameResult();
  const result = checkWins(grid);

  let stkWon = 0;
  let bonusLost = 0;
  let message = '';

  if (result.jokerLoss) {
    bonusLost = Math.floor(user.bonusBalance * JOKER_PENALTY_PERCENT);
    user.bonusBalance = Math.max(0, user.bonusBalance - bonusLost);
    message = `JOKER! You lost ${bonusLost} bonus hash!`;
  }

  if (result.wins.length > 0) {
    stkWon = result.wins.length * WIN_REWARD_STK;
    user.stkBalance = parseFloat((user.stkBalance + stkWon).toFixed(8));
    user.totalWins += result.wins.length;
    message += (message ? ' | ' : '') + `WIN! +${stkWon} STK`;
  } else if (!result.jokerLoss) {
    message = 'No match. Try again!';
  }

  const resultHash = crypto
    .createHmac('sha256', process.env.GAME_SECRET || 'coinhat-secret-key-2024')
    .update(JSON.stringify({ grid, userId: req.userId, spin: user.totalSpins, ts: Date.now() }))
    .digest('hex');

  res.json({
    grid,
    result: { wins: result.wins, jokerLoss: result.jokerLoss, stkWon, bonusLost },
    message,
    balance: { bonusBalance: user.bonusBalance, stkBalance: user.stkBalance },
    verification: resultHash
  });
});

// Withdraw
app.post('/api/wallet/withdraw', auth, (req, res) => {
  const { walletAddress, amount } = req.body;
  const user = req.user;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < MIN_WITHDRAW_STK) {
    return res.status(400).json({ error: `Saque mínimo é ${MIN_WITHDRAW_STK} STK` });
  }
  if (numAmount > user.stkBalance) {
    return res.status(400).json({ error: 'Insufficient STK balance' });
  }

  user.stkBalance = parseFloat((user.stkBalance - numAmount).toFixed(8));

  res.json({
    success: true,
    message: `Withdrawal of ${numAmount} STK queued`,
    txId: crypto.randomBytes(32).toString('hex'),
    newBalance: user.stkBalance
  });
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const lb = Array.from(users.values()).map(user => ({
    username: user.username,
    stkBalance: user.stkBalance,
    totalWins: user.totalWins
  }));
  lb.sort((a, b) => b.stkBalance - a.stkBalance);
  res.json(lb.slice(0, 10));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Coin-Steak Game Server running on port ${PORT}`);
});
