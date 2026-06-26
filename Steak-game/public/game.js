const API = window.location.origin;
let sessionToken = null;
let isSpinning = false;
let bonusTimerInterval = null;
let authMode = 'login'; // 'login' or 'register'
let lastSpinTime = 0;

const SYMBOL_MAP = {
  SOL: { emoji: '≋', color: '#00ff88' },
  BTC: { emoji: '₿', color: '#f7931a' },
  STK: { emoji: '🥩', color: '#627eea' },
  BNB: { emoji: '🔶', color: '#f3ba2f' },
  ADA: { emoji: '🥏', color: '#0033ad' },
  DOT: { emoji: '💢', color: '#e6007a' },
  AVAX: { emoji: '🔺', color: '#e84142' },
  MATIC: { emoji: '⬡', color: '#8247e5' },
  JOKER: { emoji: '🃏', color: '#ef4444' }
};

// ===================== SOUND ENGINE (Web Audio API) =====================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq, duration, type, vol, delay) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime + (delay || 0));
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (delay || 0) + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + (delay || 0));
  osc.stop(ctx.currentTime + (delay || 0) + duration);
}

// Suspense sound: rising tension notes
function playSuspense() {
  const notes = [200, 220, 250, 280, 320, 360, 400, 450, 500];
  notes.forEach((freq, i) => {
    playTone(freq, 0.15, 'triangle', 0.08, i * 0.12);
  });
}

// Win sound: happy ascending fanfare
function playWinSound() {
  const melody = [523, 659, 784, 1047]; // C5 E5 G5 C6
  melody.forEach((freq, i) => {
    playTone(freq, 0.3, 'sine', 0.18, i * 0.15);
    playTone(freq * 1.5, 0.3, 'triangle', 0.06, i * 0.15); // harmony
  });
  // Sparkle
  [1200, 1400, 1600, 1800, 2000].forEach((f, i) => {
    playTone(f, 0.1, 'sine', 0.05, 0.6 + i * 0.06);
  });
}

// Lose sound: descending sad tones
function playLoseSound() {
  const melody = [400, 350, 300, 220];
  melody.forEach((freq, i) => {
    playTone(freq, 0.35, 'sawtooth', 0.07, i * 0.2);
  });
  playTone(150, 0.6, 'sine', 0.1, 0.8);
}

// Joker sound: dramatic sting
function playJokerSound() {
  playTone(600, 0.15, 'square', 0.12, 0);
  playTone(300, 0.15, 'square', 0.12, 0.15);
  playTone(150, 0.5, 'sawtooth', 0.15, 0.3);
  playTone(100, 0.8, 'sine', 0.1, 0.5);
}

// Card flip sound
function playFlipSound(delay) {
  playTone(800 + Math.random() * 400, 0.06, 'sine', 0.06, delay || 0);
}

// Click sound
function playClickSound() {
  playTone(600, 0.05, 'sine', 0.08, 0);
}

// Error beep
function playErrorSound() {
  playTone(200, 0.2, 'square', 0.1, 0);
  playTone(200, 0.2, 'square', 0.1, 0.25);
}

// ===================== API =====================
async function api(endpoint, method, body) {
  method = method || 'GET';
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (sessionToken) opts.headers['X-Session-Token'] = sessionToken;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

// ===================== AUTH TABS =====================
function switchTab(mode) {
  authMode = mode;
  playClickSound();
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
  document.getElementById('authError').textContent = '';
  const btnText = document.getElementById('authBtnText');
  if (mode === 'login') {
    btnText.textContent = t('loginBtn2');
  } else {
    btnText.textContent = t('registerBtn');
  }
}

// ===================== AUTH =====================
async function doAuth() {
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const errEl = document.getElementById('authError');
  errEl.textContent = '';

  if (!username || username.length < 3) {
    shakeElement(document.getElementById('usernameInput'));
    return;
  }
  if (!password || password.length < 4) {
    shakeElement(document.getElementById('passwordInput'));
    errEl.textContent = t('passwordPlaceholder');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  playClickSound();

  try {
    let data;
    if (authMode === 'register') {
      data = await api('/api/auth/register', 'POST', { username, password });
    } else {
      data = await api('/api/auth/login', 'POST', { username, password });
    }

    sessionToken = data.token;
    updateUI(data.user);
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    if (data.isNew) {
      showResult(t('accountCreated', { amount: data.loginBonus }), 'win');
      playWinSound();
    } else if (data.bonusRenewed) {
      showResult(t('bonusRenewed'), 'win');
      playWinSound();
    }

    startBonusTimer(data.bonusTimeLeft);
  } catch (e) {
    if (e.status === 429) {
      errEl.textContent = 'Muitas tentativas. Aguarda 15min.';
      playErrorSound();
    } else {
      errEl.textContent = e.message;
    }
    shakeElement(btn);
  } finally {
    btn.disabled = false;
  }
}

// Enter key
document.getElementById('usernameInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('passwordInput').focus();
});
document.getElementById('passwordInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doAuth();
});

// ===================== BONUS TIMER =====================
function startBonusTimer(timeLeft) {
  if (bonusTimerInterval) clearInterval(bonusTimerInterval);
  var banner = document.getElementById('bonusBanner');
  var bannerText = document.getElementById('bonusBannerText');

  if (!timeLeft) {
    banner.classList.add('hidden');
    return;
  }

  var remaining = timeLeft.totalMs;
  banner.classList.remove('hidden');

  function updateTimer() {
    if (remaining <= 0) {
      clearInterval(bonusTimerInterval);
      bannerText.textContent = t('bonusRenewed');
      banner.className = 'bonus-banner renewed';
      refreshUser();
      return;
    }
    var h = Math.floor(remaining / 3600000);
    var m = Math.floor((remaining % 3600000) / 60000);
    bannerText.textContent = t('bonusTimer', { h: h, m: m });
    remaining -= 60000;
  }

  updateTimer();
  bonusTimerInterval = setInterval(updateTimer, 60000);
}

async function refreshUser() {
  try {
    var user = await api('/api/user');
    updateUI(user);
    startBonusTimer(user.bonusTimeLeft);
  } catch (e) { /* ignore */ }
}

// ===================== UI UPDATE =====================
function updateUI(user) {
  document.getElementById('bonusDisplay').textContent = user.bonusBalance;
  document.getElementById('solDisplay').textContent = user.solBalance.toFixed(4);
  document.getElementById('menuUsername').textContent = user.username;
  document.getElementById('menuSpins').textContent = user.totalSpins;
  document.getElementById('menuWins').textContent = user.totalWins;
  document.getElementById('menuSol').textContent = user.solBalance.toFixed(4);
  document.getElementById('wdSolBalance').textContent = user.solBalance.toFixed(4) + ' SOL';

  var spinBtn = document.getElementById('spinBtn');
  if (user.bonusBalance < 10) {
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<span class="spin-icon">🎰</span> ' + t('noHashLeft');
  } else if (!isSpinning) {
    spinBtn.disabled = false;
    spinBtn.innerHTML = '<span class="spin-icon">🎰</span> ' + t('spinBtn');
  }
}

// ===================== SPIN =====================
async function doSpin() {
  if (isSpinning) return;

  // Cooldown visual: bloqueia por 1s
  const now = Date.now();
  if (now - lastSpinTime < 1000) {
    showResult('Aguarda 1s entre spins', 'neutral');
    playErrorSound();
    return;
  }
  lastSpinTime = now;

  isSpinning = true;
  var spinBtn = document.getElementById('spinBtn');
  spinBtn.disabled = true;
  spinBtn.innerHTML = '<span class="spin-icon">⏳</span> SPINNING...';
  hideResult();
  playClickSound();

  var cards = document.querySelectorAll('.card');
  cards.forEach(function(c) {
    c.className = 'card';
    c.querySelector('.card-back').innerHTML = '';
  });

  // Start suspense sound
  playSuspense();

  cards.forEach(function(c, i) {
    setTimeout(function() { c.classList.add('spinning'); }, i * 80);
  });

  try {
    var data = await api('/api/game/spin', 'POST');

    await sleep(800);

    // Reveal cards with flip sound
    cards.forEach(function(c, i) {
      setTimeout(function() {
        c.classList.remove('spinning');
        var sym = data.grid[i];
        var info = SYMBOL_MAP[sym] || { emoji: '?', color: '#fff' };
        var back = c.querySelector('.card-back');
        back.innerHTML = '<span class="card-emoji">' + info.emoji + '</span><span class="card-label" style="color:' + info.color + '">' + sym + '</span>';
        back.style.borderColor = sym === 'JOKER'? '#ef4444' : '#374151';
        c.classList.add('flipped');
        if (sym === 'JOKER') c.classList.add('joker');
        playFlipSound(0);
      }, 200 + i * 150);
    });

    await sleep(200 + 9 * 150 + 400);

    // Highlight wins
    if (data.result.wins.length > 0) {
      data.result.wins.forEach(function(w) {
        w.line.forEach(function(idx) {
          cards[idx].classList.add('win-highlight');
        });
      });
    }

    // Update balance
    updateUI({
      bonusBalance: data.balance.bonusBalance,
      solBalance: data.balance.solBalance,
      username: document.getElementById('menuUsername').textContent,
      totalSpins: parseInt(document.getElementById('menuSpins').textContent) + 1,
      totalWins: parseInt(document.getElementById('menuWins').textContent) + data.result.wins.length
    });

    // Result + Sound
    var msg = '';
    var msgType = 'neutral';

    if (data.result.jokerLoss) {
      msg = t('jokerMsg', { amount: data.result.bonusLost });
      msgType = 'lose';
      playJokerSound();
    } else if (data.result.wins.length > 0) {
      var winText = t('winMsg', { amount: data.result.solWon });
      msg = winText;
      msgType = 'win';
      playWinSound();
    } else {
      msg = t('noMatch');
      playLoseSound();
    }

    showResult(msg, msgType);

  } catch (e) {
    if (e.status === 429) {
      showResult('Calma! 1 spin por segundo', 'neutral');
      playErrorSound();
    } else if (e.message.indexOf('Insufficient') >= 0 || e.message.indexOf('NO_BALANCE') >= 0) {
      showResult(t('noHashDepleted', { h: '?', m: '?' }), 'lose');
      playLoseSound();
      refreshUser();
    } else {
      showResult('Error: ' + e.message, 'lose');
      playErrorSound();
    }
  } finally {
    isSpinning = false;
    // Re-enable após 1s de cooldown
    setTimeout(() => {
      const user = {
        bonusBalance: parseInt(document.getElementById('bonusDisplay').textContent),
        solBalance: parseFloat(document.getElementById('solDisplay').textContent)
      };
      updateUI(user);
    }, 1000);
  }
}

// ===================== MENU =====================
function toggleMenu() {
  playClickSound();
  document.getElementById('menuOverlay').classList.toggle('hidden');
}

function showWithdraw() {
  document.getElementById('menuOverlay').classList.add('hidden');
  document.getElementById('withdrawOverlay').classList.remove('hidden');
  document.getElementById('wdMessage').textContent = '';
  document.getElementById('wdMessage').className = 'wd-msg';
}

function closeWithdraw() {
  document.getElementById('withdrawOverlay').classList.add('hidden');
}

async function doWithdraw() {
  var wallet = document.getElementById('wdWallet').value.trim();
  var amount = parseFloat(document.getElementById('wdAmount').value);
  var msgEl = document.getElementById('wdMessage');
  const btn = document.querySelector('#withdrawOverlay.btn-primary');
  btn.disabled = true;

  // Validação forte no frontend
  if (!wallet || wallet.length < 32 || wallet.length > 44) {
    msgEl.textContent = t('invalidWallet');
    msgEl.className = 'wd-msg error';
    btn.disabled = false;
    return;
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(wallet)) {
    msgEl.textContent = 'Wallet contém caracteres inválidos';
    msgEl.className = 'wd-msg error';
    btn.disabled = false;
    return;
  }
  if (!amount || amount <= 0 || amount > 999) {
    msgEl.textContent = t('invalidAmount');
    msgEl.className = 'wd-msg error';
    btn.disabled = false;
    return;
  }

  try {
    var data = await api('/api/wallet/withdraw', 'POST', { walletAddress: wallet, amount: amount });
    msgEl.textContent = data.message;
    msgEl.className = 'wd-msg success';
    playWinSound();
    var user = await api('/api/user');
    updateUI(user);
  } catch (e) {
    msgEl.textContent = e.message;
    msgEl.className = 'wd-msg error';
    playErrorSound();
  } finally {
    btn.disabled = false;
  }
}

// ===================== LOGOUT =====================
function doLogout() {
  sessionToken = null;
  if (bonusTimerInterval) clearInterval(bonusTimerInterval);
  document.getElementById('gameScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('menuOverlay').classList.add('hidden');
  document.getElementById('usernameInput').value = '';
  document.getElementById('passwordInput').value = '';
  document.getElementById('authError').textContent = '';
  switchTab('login');
  applyLang();
}

// ===================== HELPERS =====================
function showResult(text, type) {
  var el = document.getElementById('resultMessage');
  el.textContent = text;
  el.className = 'result-msg ' + type;
}

function hideResult() {
  document.getElementById('resultMessage').className = 'result-msg hidden';
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  setTimeout(function() { el.style.animation = ''; }, 400);
}

var shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }';
document.head.appendChild(shakeStyle);
