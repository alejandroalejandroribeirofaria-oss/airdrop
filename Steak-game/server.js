const express = require('express');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// CORS restrito pro teu domínio em produção
const allowedOrigins = process.env.NODE_ENV === 'production'
 ? ['https://airdrop-fppi.onrender.com']
  : ['http://localhost:3000', 'https://airdrop-ua2d.onrender.com/'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Limita tamanho do body
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit global: 60 req/min por IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Muitas requisições. Aguarda 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Rate limit agressivo pra login/register: 5 tentativas por 15min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas. Tenta de novo em 15min.' },
  skipSuccessfulRequests: true,
});

// Cooldown de spin: 1s por user
const lastSpin = {};
const spinLimiter = rateLimit({
  windowMs: 1000,
  max: 1,
  keyGenerator: (req) => req.userId || req.ip,
  message: { error: 'Calma aí. 1 spin por segundo.' },
  standardHeaders: false,
  legacyHeaders: false,
});

// In-memory store (replace with DB in production)
const sessions = new Map();
const users = new Map();

const CARD_SYMBOLS = ['SOL', 'BTC', 'STK', 'BNB', 'ADA', 'DOT', 'AVAX', 'MATIC'];
const JOKER = 'JOKER';
const SPIN_COST = 10;
const WIN_REWARD_Stk = 10.00;
const LOGIN_BONUS = 100;
const MIN_WITHDRAW_USD = 10;
const JOKER_PENALTY_PERCENT = 1000.0;
const BONUS_RENEWAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const WIN_CHANCE = 0.30; // 30% chance of winning
const LOSE_CHANCE = 0.70; // 70% chance of losing

// Secure RNG
function secureRandom(max) {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) % max;
}

function secureRandomFloat() {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0xFFFFFFFF;
}

// Check and renew daily bonus
function checkBonusRenewal(user) {
  const now = Date.now();
  const lastBonus = user.lastBonusAt || user.createdAt;
  const elapsed = now - lastBonus;
  if (elapsed >= BONUS_RENEWAL_MS) {
    user.bonusBalance = LOGIN_BONUS;
    user.lastBonusAt = now;
    return true;
  }
  return false;
}

function getBonusTimeLeft(user) {
  const lastBonus = user.lastBonusAt || user.createdAt;
  const nextBonus = lastBonus + BONUS_RENEWAL_MS;
  const remaining = nextBonus - Date.now();
  if (remaining <= 0) return null;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return { hours: h, minutes: m, totalMs: remaining };
}

// Generate server-side game result with 30% win / 70% loss
function generateGameResult() {
  const shouldWin = secureRandomFloat() < WIN_CHANCE;

  if (shouldWin) {
    return generateWinningGrid();
  } else {
    return generateLosingGrid();
  }
}

function generateWinningGrid() {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push(CARD_SYMBOLS[secureRandom(CARD_SYMBOLS.length)]);
  }
  // Pick a random line and force 3-of-a-kind
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const line = lines[secureRandom(lines.length)];
  const winSymbol = CARD_SYMBOLS[secureRandom(CARD_SYMBOLS.length)];
  line.forEach(idx => { grid[idx] = winSymbol; });
  return grid;
}

function generateLosingGrid() {
  // Generate grid ensuring NO 3-of-a-kind on any line
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let attempts = 0;
  while (attempts < 100) {
    const grid = [];
    for (let i = 0; i < 9; i++) {
      // ~6% chance of joker in losing grid
      if (secureRandom(100) < 6) {
        grid.push(JOKER);
      } else {
        grid.push(CARD_SYMBOLS[secureRandom(CARD_SYMBOLS.length)]);
      }
    }
    // Verify no line has 3 matching
    let hasMatch = false;
    for (const [a, b, c] of lines) {
      if (grid[a] === grid[b] && grid[b] === grid[c]) {
        hasMatch = true;
        break;
      }
    }
    if (!hasMatch) return grid;
    attempts++;
  }
  // Fallback: force different symbols
  return ['SOL','BTC','ETH','BNB','ADA','DOT','AVAX','MATIC','SOL'];
}

// Check for 3-of-a-kind (rows, cols, diags)
function checkWins(grid) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6] // diags
  ];
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

// Middleware: validate session
function auth(req, res, next) {
  const token = req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token ||!sessions.has(token)) {
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

// Create Account
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

  // Check if username already exists
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
    solBalance: 0,
    totalSpins: 0,
    totalWins: 0,
    createdAt: Date.now(),
    lastBonusAt: Date.now()
  });

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);
  const user = users.get(userId);
  const timeLeft = getBonusTimeLeft(user);

  res.json({
    token,
    user: {
      username: user.username,
      bonusBalance: user.bonusBalance,
      solBalance: user.solBalance,
      totalSpins: user.totalSpins,
      totalWins: user.totalWins
    },
    isNew: true,
    loginBonus: LOGIN_BONUS,
    bonusRenewed: false,
    bonusTimeLeft: timeLeft
  });
});

// Login
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  let userId = null;

  // Find existing user
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
  if (user.password && user.password!== passHash) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);

  // Check daily bonus renewal
  const bonusRenewed = checkBonusRenewal(user);
  const timeLeft = getBonusTimeLeft(user);

  res.json({
    token,
    user: {
      username: user.username,
      bonusBalance: user.bonusBalance,
      solBalance: user.solBalance,
      totalSpins: user.totalSpins,
      totalWins: user.totalWins
    },
    isNew: false,
    loginBonus: 0,
    bonusRenewed,
    bonusTimeLeft: timeLeft
  });
});

// Get user state
app.get('/api/user', auth, (req, res) => {
  const u = req.user;
  checkBonusRenewal(u);
  const timeLeft = getBonusTimeLeft(u);
  res.json({
    username: u.username,
    bonusBalance: u.bonusBalance,
    solBalance: u.solBalance,
    totalSpins: u.totalSpins,
    totalWins: u.totalWins,
    bonusTimeLeft: timeLeft
  });
});

// SPIN - core game logic (all server-side)
app.post('/api/game/spin', auth, spinLimiter, (req, res) => {
  const user = req.user;

  // Check if bonus renewed
  checkBonusRenewal(user);

  // Validação crítica: não deixa saldo negativo
  if (user.bonusBalance < SPIN_COST) {
    const timeLeft = getBonusTimeLeft(user);
    return res.status(400).json({
      error: 'Insufficient bonus balance',
      code: 'NO_BALANCE',
      bonusTimeLeft: timeLeft
    });
  }

  // Deduct spin cost
  user.bonusBalance -= SPIN_COST;
  user.totalSpins++;

  // Generate result server-side
  const grid = generateGameResult();
  const result = checkWins(grid);

  let solWon = 0;
  let bonusLost = 0;
  let message = '';

  if (result.jokerLoss) {
    // Joker penalty: lose 50% of bonus balance
    bonusLost = Math.floor(user.bonusBalance * JOKER_PENALTY_PERCENT);
    user.bonusBalance = Math.max(0, user.bonusBalance - bonusLost);
    message = `JOKER! You lost ${bonusLost} bonus hash!`;
  }

  if (result.wins.length > 0) {
    solWon = result.wins.length * WIN_REWARD_SOL;
    user.solBalance = parseFloat((user.solBalance + solWon).toFixed(8));
    user.totalWins += result.wins.length;
    message += (message? ' | ' : '') + `WIN! +${solWon} SOL`;
  }

  if (!result.jokerLoss && result.wins.length === 0) {
    message = 'No match. Try again!';
  }

  // Create verification hash so client can't tamper
  const resultHash = crypto
   .createHmac('sha256', process.env.GAME_SECRET || 'coinhat-secret-key-2024')
   .update(JSON.stringify({ grid, userId: req.userId, spin: user.totalSpins, ts: Date.now() }))
   .digest('hex');

  res.json({
    grid,
    result: {
      wins: result.wins,
      jokerLoss: result.jokerLoss,
      solWon,
      bonusLost
    },
    message,
    balance: {
      bonusBalance: user.bonusBalance,
      solBalance: user.solBalance
    },
    verification: resultHash
  });
});

// Withdraw request
app.post('/api/wallet/withdraw', auth, (req, res) => {
  const { walletAddress, amount } = req.body;
  const user = req.user;

  // Validação forte de wallet
  if (!walletAddress || typeof walletAddress!== 'string') {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }
  const cleanWallet = walletAddress.trim();
  if (cleanWallet.length < 32 || cleanWallet.length > 44) {
    return res.status(400).json({ error: 'Wallet must be 32-44 characters' });
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(cleanWallet)) {
    return res.status(400).json({ error: 'Invalid wallet format' });
  }

  // Validação de amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const solPrice = 170; // Mock SOL price in USD
  const usdValue = numAmount * solPrice;

  if (usdValue < MIN_WITHDRAW_USD) {
    return res.status(400).json({
      error: `Minimum withdrawal is $${MIN_WITHDRAW_USD} USD (≈${(MIN_WITHDRAW_USD / solPrice).toFixed(4)} SOL)`
    });
  }

  if (numAmount > user.solBalance) {
    return res.status(400).json({ error: 'Insufficient SOL balance' });
  }

  // Deduct and queue (in production, integrate with Solana RPC)
  user.solBalance = parseFloat((user.solBalance - numAmount).toFixed(8));

  res.json({
    success: true,
    message: `Withdrawal of ${numAmount} SOL to ${cleanWallet.slice(0, 8)}... queued`,
    txId: crypto.randomBytes(32).toString('hex'),
    newBalance: user.solBalance
  });
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const lb = [];
  for (const [, user] of users.entries()) {
    lb.push({
      username: user.username,
      solBalance: user.solBalance,
      totalWins: user.totalWins
    });
  }
  lb.sort((a, b) => b.solBalance - a.solBalance);
  res.json(lb.slice(0, 10));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Coinhat-feeds Game Server running on port ${PORT}`);
});
