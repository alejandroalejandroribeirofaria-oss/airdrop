const LANGS = {
  en: {
    flag: '🇺🇸',
    tagline: 'PLAY. WIN. RECEIVE.',
    subtitle: 'Play and win real <strong>Steak (Stk)</strong>!',
    inputPlaceholder: 'Enter your username',
    playNow: 'PLAY NOW',
    bonusNotice: '🎁 Receive <strong>100 Hash Bonus</strong> every 24 hours!',
    cardMatch: 'CARD MATCH',
    matchDesc: 'Match 3 cards to win <strong>10 Stk</strong> | Avoid the JOKER!',
    spinBtn: 'SPIN - 10 HASH',
    spinCost: 'Each spin costs 10 Hash from your bonus',
    spins: 'Spins',
    wins: 'Wins',
    withdrawSol: 'WITHDRAW Stk',
    logout: 'Logout',
    available: 'Available:',
    minWithdraw: 'Minimum: 1000 Stk ($10 USD)',
    walletLabel: 'Steak Wallet Address',
    walletPlaceholder: 'Enter your Stk wallet address',
    amountLabel: 'Amount (Stk)',
    confirmWithdraw: 'Confirm Withdrawal',
    rulesTitle: 'Game Rules',
    rule1: 'Receive <strong>100 Hash</strong> bonus every 24 hours',
    rule2: 'Each spin costs <strong>10 Hash</strong>',
    rule3: 'Match 3 cards in a row/column/diagonal to win <strong>10 Stk</strong>',
    rule4: '3 JOKER cards = lose <strong>50%</strong> of your Hash bonus',
    rule5: 'Minimum withdrawal: <strong>1000 Stk</strong>',
    rule6: 'All results are calculated server-side for fairness',
    noHashLeft: 'NO HASH LEFT',
    connecting: 'Connecting...',
    welcomeBonus: 'Welcome! You received {amount} Hash bonus!',
    bonusRenewed: 'Your bonus has been renewed! +100 Hash',
    bonusTimer: 'Bonus renews in {h}h {m}m',
    noMatch: 'No match. Try again!',
    noHashDepleted: 'No Hash left! Bonus renews in {h}h {m}m',
    jokerMsg: 'JOKER! You lost {amount} bonus hash!',
    winMsg: 'WIN! +{amount} Stk',
    invalidWallet: 'Enter a valid Solana wallet address',
    invalidAmount: 'Enter a valid amount',
    loginTab: 'Login',
    registerTab: 'Create Account',
    loginBtn2: 'LOGIN',
    registerBtn: 'CREATE ACCOUNT',
    passwordPlaceholder: 'Enter your password',
    accountNotFound: 'Account not found. Create an account first.',
    wrongPassword: 'Incorrect password',
    usernameTaken: 'Username already taken',
    accountCreated: 'Account created! You received {amount} Hash bonus!'
  },

  pt: {
    flag: '🇧🇷',
    tagline: 'JOGUE. GANHE. RECEBA.',
    subtitle: 'Jogue e ganhe <strong>Steak (Stk)</strong> de verdade!',
    inputPlaceholder: 'Digite seu nome de usuário',
    playNow: 'JOGAR AGORA',
    bonusNotice: '🎁 Receba <strong>100 Hash Bonus</strong> a cada 24 horas!',
    cardMatch: 'COMBINE CARTAS',
    matchDesc: 'Combine 3 cartas para ganhar <strong>10 Stk</strong> | Evite o CORINGA!',
    spinBtn: 'GIRAR - 10 HASH',
    spinCost: 'Cada giro custa 10 Hash do seu bonus',
    spins: 'Giros',
    wins: 'Vitórias',
    withdrawSol: 'SACAR Stk',
    logout: 'Sair',
    available: 'Disponível:',
    minWithdraw: 'Mínimo: 1000 Stk ($10 USD)',
    walletLabel: 'Endereço da Carteira Stk',
    walletPlaceholder: 'Digite o endereço da sua carteira Stk',
    amountLabel: 'Valor (Stk)',
    confirmWithdraw: 'Confirmar Saque',
    rulesTitle: 'Regras do Jogo',
    rule1: 'Receba <strong>100 Hash</strong> de bonus a cada 24 horas',
    rule2: 'Cada giro custa <strong>10 Hash</strong>',
    rule3: 'Combine 3 cartas em linha/coluna/diagonal para ganhar <strong>10 Stk</strong>',
    rule4: '3 cartas CORINGA = perde <strong>50%</strong> do seu bonus Hash',
    rule5: 'Saque mínimo: <strong>1000 Stk</strong>',
    rule6: 'Todos os resultados são calculados no servidor para garantir a justiça',
    noHashLeft: 'SEM HASH',
    connecting: 'Conectando...',
    welcomeBonus: 'Bem-vindo! Você recebeu {amount} Hash de bonus!',
    bonusRenewed: 'Seu bonus foi renovado! +100 Hash',
    bonusTimer: 'Bonus renova em {h}h {m}m',
    noMatch: 'Sem combinação. Tente novamente!',
    noHashDepleted: 'Sem Hash! Bonus renova em {h}h {m}m',
    jokerMsg: 'CORINGA! Você perdeu {amount} hash de bonus!',
    winMsg: 'VITÓRIA! +{amount} Stk',
    invalidWallet: 'Digite um endereço de carteira válido',
    invalidAmount: 'Digite um valor válido',
    loginTab: 'Entrar',
    registerTab: 'Criar Conta',
    loginBtn2: 'ENTRAR',
    registerBtn: 'CRIAR CONTA',
    passwordPlaceholder: 'Digite sua senha',
    accountNotFound: 'Conta não encontrada. Crie uma conta primeiro.',
    wrongPassword: 'Senha incorreta',
    usernameTaken: 'Nome de usuário já em uso',
    accountCreated: 'Conta criada! Você recebeu {amount} Hash de bonus!'
  },

  es: {
    flag: '🇪🇸',
    tagline: 'JUEGA. GANA. RECIBE.',
    subtitle: '¡Juega y gana <strong>Steak (Stk)</strong> de verdad!',
    inputPlaceholder: 'Ingresa tu nombre de usuario',
    playNow: 'JUGAR AHORA',
    bonusNotice: '🎁 Recibe <strong>100 Hash Bonus</strong> cada 24 horas!',
    cardMatch: 'COMBINA CARTAS',
    matchDesc: 'Combina 3 cartas para ganar <strong>10 Stk</strong> | ¡Evita el COMODÍN!',
    spinBtn: 'GIRAR - 10 HASH',
    spinCost: 'Cada giro cuesta 10 Hash de tu bono',
    spins: 'Giros',
    wins: 'Victorias',
    withdrawSol: 'RETIRAR Stk',
    logout: 'Cerrar sesión',
    available: 'Disponible:',
    minWithdraw: 'Mínimo: 1000 Stk ($10 USD)',
    walletLabel: 'Dirección de Billetera Stk',
    walletPlaceholder: 'Ingresa tu dirección de billetera Stk',
    amountLabel: 'Monto (Stk)',
    confirmWithdraw: 'Confirmar Retiro',
    rulesTitle: 'Reglas del Juego',
    rule1: 'Recibe <strong>100 Hash</strong> de bono cada 24 horas',
    rule2: 'Cada giro cuesta <strong>10 Hash</strong>',
    rule3: 'Combina 3 cartas en fila/columna/diagonal para ganar <strong>10 Stk</strong>',
    rule4: '3 cartas COMODÍN = pierdes <strong>50%</strong> de tu bono Hash',
    rule5: 'Retiro mínimo: <strong>1000 Stk</strong>',
    rule6: 'Todos los resultados se calculan en el servidor para garantizar la justicia',
    noHashLeft: 'SIN HASH',
    connecting: 'Conectando...',
    welcomeBonus: '¡Bienvenido! Recibiste {amount} Hash de bono!',
    bonusRenewed: '¡Tu bono se ha renovado! +100 Hash',
    bonusTimer: 'Bono se renueva en {h}h {m}m',
    noMatch: 'Sin coincidencia. ¡Intenta de nuevo!',
    noHashDepleted: '¡Sin Hash! Bono se renueva en {h}h {m}m',
    jokerMsg: '¡COMODÍN! Perdiste {amount} hash de bono!',
    winMsg: '¡VICTORIA! +{amount} Stk',
    invalidWallet: 'Ingresa una dirección de billetera válida',
    invalidAmount: 'Ingresa un monto válido',
    loginTab: 'Iniciar Sesión',
    registerTab: 'Crear Cuenta',
    loginBtn2: 'INICIAR SESIÓN',
    registerBtn: 'CREAR CUENTA',
    passwordPlaceholder: 'Ingresa tu contraseña',
    accountNotFound: 'Cuenta no encontrada. Crea una cuenta primero.',
    wrongPassword: 'Contraseña incorrecta',
    usernameTaken: 'Nombre de usuario ya en uso',
    accountCreated: '¡Cuenta creada! Recibiste {amount} Hash de bono!'
  },

  ja: {
    flag: '🇯🇵',
    tagline: 'PLAY. WIN. RECEIVE.',
    subtitle: '<strong>Steak (Stk)</strong>を獲得しよう！',
    inputPlaceholder: 'ユーザー名を入力',
    playNow: '今すぐプレイ',
    bonusNotice: '🎁 24時間ごとに<strong>100 Hashボーナス</strong>を獲得！',
    cardMatch: 'カードマッチ',
    matchDesc: '3枚揃えて<strong>10 Stk</strong>を獲得 | JOKERに注意！',
    spinBtn: 'スピン - 10 HASH',
    spinCost: '1回のスピンにつき10 Hashを消費',
    spins: 'スピン',
    wins: '勝利',
    withdrawSol: 'Stkを引き出す',
    logout: 'ログアウト',
    available: '残高:',
    minWithdraw: '最低引出額: 1000 Stk ($10 USD)',
    walletLabel: 'Steakウォレットアドレス',
    walletPlaceholder: 'Stkウォレットアドレスを入力',
    amountLabel: '金額 (Stk)',
    confirmWithdraw: '引き出しを確認',
    rulesTitle: 'ゲームルール',
    rule1: '24時間ごとに<strong>100 Hash</strong>ボーナスを獲得',
    rule2: '1回のスピンに<strong>10 Hash</strong>必要',
    rule3: '行/列/対角線に3枚揃えて<strong>10 Stk</strong>を獲得',
    rule4: 'JOKER3枚 = Hashボーナスの<strong>50%</strong>を失う',
    rule5: '最低引出額: <strong>1000 Stk</strong>',
    rule6: '全ての結果はサーバー側で計算され公平性を保証',
    noHashLeft: 'HASH不足',
    connecting: '接続中...',
    welcomeBonus: 'ようこそ！{amount} Hashボーナスを獲得しました！',
    bonusRenewed: 'ボーナスが更新されました！+100 Hash',
    bonusTimer: 'ボーナス更新まで {h}時間{m}分',
    noMatch: 'マッチなし。もう一度！',
    noHashDepleted: 'Hash不足！ボーナス更新まで {h}時間{m}分',
    jokerMsg: 'JOKER！{amount} Hashボーナスを失いました！',
    winMsg: '勝利！+{amount} Stk',
    invalidWallet: '有効なSolanaウォレットアドレスを入力してください',
    invalidAmount: '有効な金額を入力してください',
    loginTab: 'ログイン',
    registerTab: 'アカウント作成',
    loginBtn2: 'ログイン',
    registerBtn: 'アカウント作成',
    passwordPlaceholder: 'パスワードを入力',
    accountNotFound: 'アカウントが見つかりません。先にアカウントを作成してください。',
    wrongPassword: 'パスワードが間違っています',
    usernameTaken: 'ユーザー名は既に使用されています',
    accountCreated: 'アカウント作成完了！{amount} Hashボーナスを獲得しました！'
  },

  zh: {
    flag: '🇨🇳',
    tagline: '玩耍。赢取。领取。',
    subtitle: '游戏赢取真正的<strong>Steak (Stk)</strong>！',
    inputPlaceholder: '输入您的用户名',
    playNow: '立即开始',
    bonusNotice: '🎁 每24小时获得<strong>100 Hash奖励</strong>！',
    cardMatch: '卡牌匹配',
    matchDesc: '匹配3张卡牌赢取<strong>10 Stk</strong> | 小心小丑牌！',
    spinBtn: '旋转 - 10 HASH',
    spinCost: '每次旋转消耗10 Hash奖励',
    spins: '旋转',
    wins: '胜利',
    withdrawSol: '提取 Stk',
    logout: '退出登录',
    available: '可用余额:',
    minWithdraw: '最低提取: 1000 Stk ($10 USD)',
    walletLabel: 'Steak钱包地址',
    walletPlaceholder: '输入您的Stk钱包地址',
    amountLabel: '金额 (Stk)',
    confirmWithdraw: '确认提取',
    rulesTitle: '游戏规则',
    rule1: '每24小时获得<strong>100 Hash</strong>奖励',
    rule2: '每次旋转消耗<strong>10 Hash</strong>',
    rule3: '行/列/对角线匹配3张卡牌赢取<strong>10 Stk</strong>',
    rule4: '3张小丑牌 = 失去<strong>50%</strong>的Hash奖励',
    rule5: '最低提取: <strong>1000 Stk</strong>',
    rule6: '所有结果均由服务器计算以确保公平',
    noHashLeft: 'HASH不足',
    connecting: '连接中...',
    welcomeBonus: '欢迎！您获得了{amount} Hash奖励！',
    bonusRenewed: '您的奖励已更新！+100 Hash',
    bonusTimer: '奖励将在{h}小时{m}分钟后更新',
    noMatch: '未匹配。再试一次！',
    noHashDepleted: 'Hash不足！奖励将在{h}小时{m}分钟后更新',
    jokerMsg: '小丑牌！您失去了{amount}个Hash奖励！',
    winMsg: '胜利！+{amount} Stk',
    invalidWallet: '请输入有效的Solana钱包地址',
    invalidAmount: '请输入有效金额',
    loginTab: '登录',
    registerTab: '创建账户',
    loginBtn2: '登录',
    registerBtn: '创建账户',
    passwordPlaceholder: '输入您的密码',
    accountNotFound: '未找到账户。请先创建账户。',
    wrongPassword: '密码错误',
    usernameTaken: '用户名已被使用',
    accountCreated: '账户已创建！您获得了{amount}个Hash奖励！'
  }
};

// ==================== FUNÇÕES DE IDIOMA (mantidas iguais) ====================

let currentLang = localStorage.getItem('coinhat-lang') || 'en';

function t(key, params = {}) {
  let text = (LANGS[currentLang] && LANGS[currentLang][key]) || LANGS.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  const flagEl = document.getElementById('currentLangFlag');
  if (flagEl) flagEl.textContent = LANGS[currentLang].flag;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('coinhat-lang', lang);
  applyLang();
  document.getElementById('langDropdown').classList.add('hidden');
}

function toggleLangMenu() {
  document.getElementById('langDropdown').classList.toggle('hidden');
}

// Close lang menu on outside click
document.addEventListener('click', (e) => {
  const sel = document.getElementById('langSelector');
  if (sel && !sel.contains(e.target)) {
    document.getElementById('langDropdown').classList.add('hidden');
  }
});

// Apply on load
document.addEventListener('DOMContentLoaded', applyLang);
