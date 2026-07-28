const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const hubScreen = document.getElementById("hub-screen");
const gameOverScreen = document.getElementById("gameover-screen");

const startBtn = document.getElementById("start-btn");
const openHubBtn = document.getElementById("open-hub-btn");
const closeHubBtn = document.getElementById("close-hub-btn");
const restartBtn = document.getElementById("restart-btn");
const homeBtn = document.getElementById("home-btn");

const scoreDisplay = document.getElementById("score-display");
const highScoreDisplay = document.getElementById("high-score-display");
const statusBar = document.getElementById("status-bar");
const finalStatsText = document.getElementById("final-stats");
const hubCoinDisplay = document.getElementById("hub-coin-display");
const diffButtons = document.querySelectorAll(".diff-btn");
const tabButtons = document.querySelectorAll(".tab-btn");

const buyShieldBtn = document.getElementById("buy-shield");
const buyMagnetBtn = document.getElementById("buy-magnet");
const buyBoostBtn = document.getElementById("buy-boost");
const descShield = document.getElementById("desc-shield");
const descMagnet = document.getElementById("desc-magnet");
const descBoost = document.getElementById("desc-boost");

const buySkin1 = document.getElementById("buy-skin-1");
const buyTrail1 = document.getElementById("buy-trail-1");
const buyTrail2 = document.getElementById("buy-trail-2");
const buyPet1 = document.getElementById("buy-pet-1");
const buyPet2 = document.getElementById("buy-pet-2");

const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const dataTextarea = document.getElementById("data-textarea");

let gameRunning = false;
let score = 0;
let totalCoins = parseInt(localStorage.getItem("neon_dash_coins")) || 150;
let sessionCoins = 0;
let highScore = localStorage.getItem("neon_dash_arcade_hi") || 0;
let currentDifficulty = "easy";
let gameSpeed = 4;
let gravity = 0.6;
let activeConsequenceText = "";
let consequenceTimer = 0;
let screenShakeTimer = 0;

let upgrades = {
  shield: parseInt(localStorage.getItem("up_shield")) || 0,
  magnet: parseInt(localStorage.getItem("up_magnet")) || 0,
  boost: parseInt(localStorage.getItem("up_boost")) || 0
};

let customization = {
  activeSkin: localStorage.getItem("active_skin") || "cyber",
  rainbowTrail: localStorage.getItem("trail_rainbow") === "true",
  fireTrail: localStorage.getItem("trail_fire") === "true",
  activeTrail: localStorage.getItem("active_trail") || "none",
  coinDrone: localStorage.getItem("pet_drone") === "true",
  shieldBot: localStorage.getItem("pet_bot") === "true"
};

let quests = [
  { id: 'q1', desc: 'Collect 30 Total Coins', target: 30, progress: parseInt(localStorage.getItem('q1_prog')) || 0, claimed: localStorage.getItem('q1_claim') === 'true', reward: 75 },
  { id: 'q2', desc: 'Reach Score 300', target: 300, progress: parseInt(localStorage.getItem('q2_prog')) || 0, claimed: localStorage.getItem('q2_claim') === 'true', reward: 150 }
];

let achievements = [
  { id: 'a1', desc: 'First Run: Complete your first dash', unlocked: localStorage.getItem('ach_1') === 'true' },
  { id: 'a2', desc: 'High Flyer: Score over 500 points', unlocked: localStorage.getItem('ach_2') === 'true' }
];

let leaderboardData = JSON.parse(localStorage.getItem('neon_dash_arcade_lb')) || [
  { name: "NEON_KING", score: 1840 },
  { name: "CYBER_NINJA", score: 1420 },
  { name: "SYNTH_WAVE", score: 950 }
];

highScoreDisplay.innerText = "HI: " + highScore;

const difficulties = {
  easy: { speed: 4, gravity: 0.5, obstacleFreq: 85, speedInc: 0.0005 },
  normal: { speed: 6, gravity: 0.65, obstacleFreq: 60, speedInc: 0.001 },
  hard: { speed: 9, gravity: 0.9, obstacleFreq: 42, speedInc: 0.002 },
  arcade: { speed: 11, gravity: 1.1, obstacleFreq: 30, speedInc: 0.0035 }
};

diffButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    diffButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDifficulty = btn.getAttribute("data-diff");
  });
});

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    let tab = btn.getAttribute("data-tab");
    document.getElementById("tab-shop").classList.add("hidden");
    document.getElementById("tab-skins").classList.add("hidden");
    document.getElementById("tab-pets").classList.add("hidden");
    document.getElementById("tab-quests").classList.add("hidden");
    document.getElementById("tab-ach").classList.add("hidden");
    document.getElementById("tab-lb").classList.add("hidden");
    document.getElementById("tab-data").classList.add("hidden");
    document.getElementById("tab-" + tab).classList.remove("hidden");
    if (tab === "quests") renderQuests();
    if (tab === "ach") renderAchievements();
    if (tab === "lb") renderLeaderboard();
  });
});

let player = {
  x: 80,
  y: 280,
  width: 30,
  height: 40,
  vy: 0,
  jumpForce: -11.5,
  isJumping: false,
  isDuck: false,
  normalHeight: 40,
  duckHeight: 20,
  color: "#0ff",
  shieldActive: false,
  magnetActive: false,
  speedBoostActive: false,
  slowMoActive: false,
  ghostActive: false,
  shieldTimer: 0,
  magnetTimer: 0,
  speedBoostTimer: 0,
  slowMoTimer: 0,
  ghostTimer: 0
};

let obstacles = [];
let collectibleItems = [];
let particleEffects = [];
let spawnTimer = 0;
let worldTheme = 0;

function updateHubUI() {
  hubCoinDisplay.innerText = "Total Coins: " + totalCoins;

  let shieldCost = 50 * (upgrades.shield + 1);
  let magnetCost = 50 * (upgrades.magnet + 1);
  let boostCost = 50 * (upgrades.boost + 1);

  descShield.innerText = `Shield Duration (Lvl ${upgrades.shield})`;
  buyShieldBtn.innerText = upgrades.shield >= 5 ? "MAX" : `Cost: ${shieldCost}`;
  buyShieldBtn.disabled = upgrades.shield >= 5 || totalCoins < shieldCost;

  descMagnet.innerText = `Magnet Range (Lvl ${upgrades.magnet})`;
  buyMagnetBtn.innerText = upgrades.magnet >= 5 ? "MAX" : `Cost: ${magnetCost}`;
  buyMagnetBtn.disabled = upgrades.magnet >= 5 || totalCoins < magnetCost;

  descBoost.innerText = `Speed Boost Duration (Lvl ${upgrades.boost})`;
  buyBoostBtn.innerText = upgrades.boost >= 5 ? "MAX" : `Cost: ${boostCost}`;
  buyBoostBtn.disabled = upgrades.boost >= 5 || totalCoins < boostCost;

  buySkin1.innerText = customization.activeSkin === "cyber" ? "Equipped" : "Equip";
  buyTrail1.innerText = customization.activeTrail === "rainbow" ? "Equipped" : (customization.rainbowTrail ? "Equip" : "Cost: 150");
  buyTrail2.innerText = customization.activeTrail === "fire" ? "Equipped" : (customization.fireTrail ? "Equip" : "Cost: 150");
  
  buyPet1.innerText = customization.coinDrone ? "Owned" : "Cost: 300";
  buyPet1.disabled = customization.coinDrone || totalCoins < 300;

  buyPet2.innerText = customization.shieldBot ? "Owned" : "Cost: 500";
  buyPet2.disabled = customization.shieldBot || totalCoins < 500;
}

function renderQuests() {
  let container = document.getElementById("tab-quests");
  container.innerHTML = "";
  quests.forEach(q => {
    let isDone = q.progress >= q.target;
    container.innerHTML += `
      <div class="hub-item">
        <span>${q.desc} (${Math.min(q.progress, q.target)}/${q.target})</span>
        <button class="action-btn" ${q.claimed || !isDone ? 'disabled' : ''} onclick="claimQuest('${q.id}')">
          ${q.claimed ? 'Claimed' : (isDone ? 'Claim ' + q.reward : 'Active')}
        </button>
      </div>`;
  });
}

window.claimQuest = function(id) {
  let q = quests.find(item => item.id === id);
  if (q && !q.claimed && q.progress >= q.target) {
    q.claimed = true;
    totalCoins += q.reward;
    localStorage.setItem("neon_dash_coins", totalCoins);
    localStorage.setItem(id + '_claim', 'true');
    updateHubUI();
    renderQuests();
  }
};

function renderAchievements() {
  let container = document.getElementById("tab-ach");
  container.innerHTML = "";
  achievements.forEach(ach => {
    container.innerHTML += `
      <div class="hub-item">
        <span>${ach.desc}</span>
        <span style="color: ${ach.unlocked ? '#0ff' : '#777'}">${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
      </div>`;
  });
}

function renderLeaderboard() {
  let container = document.getElementById("tab-lb");
  container.innerHTML = "";
  leaderboardData.sort((a, b) => b.score - a.score);
  leaderboardData.forEach((entry, idx) => {
    container.innerHTML += `
      <div class="hub-item">
        <span>#${idx+1} ${entry.name}</span>
        <span>${entry.score} pts</span>
      </div>`;
  });
}

exportBtn.addEventListener("click", () => {
  let saveData = {
    coins: totalCoins,
    hi: highScore,
    upgrades: upgrades,
    customization: customization,
    quests: quests.map(q => ({ id: q.id, progress: q.progress, claimed: q.claimed })),
    achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
    lb: leaderboardData
  };
  dataTextarea.value = btoa(JSON.stringify(saveData));
  dataTextarea.select();
});

importBtn.addEventListener("click", () => {
  try {
    let decoded = JSON.parse(atob(dataTextarea.value.trim()));
    if (decoded.coins !== undefined) { totalCoins = decoded.coins; localStorage.setItem("neon_dash_coins", totalCoins); }
    if (decoded.hi !== undefined) { highScore = decoded.hi; localStorage.setItem("neon_dash_arcade_hi", highScore); highScoreDisplay.innerText = "HI: " + highScore; }
    if (decoded.upgrades) { upgrades = decoded.upgrades; localStorage.setItem("up_shield", upgrades.shield); localStorage.setItem("up_magnet", upgrades.magnet); localStorage.setItem("up_boost", upgrades.boost); }
    if (decoded.customization) { customization = decoded.customization; localStorage.setItem("active_skin", customization.activeSkin); localStorage.setItem("trail_rainbow", customization.rainbowTrail); localStorage.setItem("trail_fire", customization.fireTrail); localStorage.setItem("active_trail", customization.activeTrail); localStorage.setItem("pet_drone", customization.coinDrone); localStorage.setItem("pet_bot", customization.shieldBot); }
    updateHubUI();
    alert("Arcade profile synchronized successfully!");
  } catch (err) {
    alert("Invalid save code string!");
  }
});

buyShieldBtn.addEventListener("click", () => {
  let cost = 50 * (upgrades.shield + 1);
  if (totalCoins >= cost && upgrades.shield < 5) { totalCoins -= cost; upgrades.shield++; localStorage.setItem("neon_dash_coins", totalCoins); localStorage.setItem("up_shield", upgrades.shield); updateHubUI(); }
});
buyMagnetBtn.addEventListener("click", () => {
  let cost = 50 * (upgrades.magnet + 1);
  if (totalCoins >= cost && upgrades.magnet < 5) { totalCoins -= cost; upgrades.magnet++; localStorage.setItem("neon_dash_coins", totalCoins); localStorage.setItem("up_magnet", upgrades.magnet); updateHubUI(); }
});
buyBoostBtn.addEventListener("click", () => {
  let cost = 50 * (upgrades.boost + 1);
  if (totalCoins >= cost && upgrades.boost < 5) { totalCoins -= cost; upgrades.boost++; localStorage.setItem("neon_dash_coins", totalCoins); localStorage.setItem("up_boost", upgrades.boost); updateHubUI(); }
});

buySkin1.addEventListener("click", () => { customization.activeSkin = "cyber"; localStorage.setItem("active_skin", "cyber"); updateHubUI(); });
buyTrail1.addEventListener("click", () => {
  if (!customization.rainbowTrail) { if (totalCoins >= 150) { totalCoins -= 150; customization.rainbowTrail = true; localStorage.setItem("neon_dash_coins", totalCoins); localStorage.setItem("trail_rainbow", "true"); } else return; }
  customization.activeTrail = customization.activeTrail === "rainbow" ? "none" : "rainbow"; localStorage.setItem("active_trail", customization.activeTrail); updateHubUI();
});
buyTrail2.addEventListener("click", () => {
  if (!customization.fireTrail) { if (totalCoins >= 150) { totalCoins -= 150; customization.fireTrail = true; localStorage.setItem("neon_dash_coins", totalCoins); localStorage.setItem("trail_fire", "true"); } else return; }
  customization.activeTrail = customization.activeTrail === "fire" ? "none" : "fire"; localStorage.setItem("active_trail", customization.activeTrail); updateHubUI();
});
buyPet1.addEventListener("click", () => {
  if (totalCoins >= 300 && !customization.coinDrone) { totalCoins -= 300; customization.coinDrone = true; localStorage.setItem("neon_dash_coins", totalCoins); localStorage.setItem("pet_drone", "true"); updateHubUI(); }
});
buyPet2.addEventListener("click", () => {
  if (totalCoins >= 500 && !customization.shieldBot) { totalCoins -= 500; customization.shieldBot = true; localStorage.setItem("neon_dash_coins", totalCoins); localStorage.setItem("pet_bot", "true"); updateHubUI(); }
});

openHubBtn.addEventListener("click", () => { startScreen.classList.add("hidden"); updateHubUI(); hubScreen.classList.remove("hidden"); });
closeHubBtn.addEventListener("click", () => { hubScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); });
homeBtn.addEventListener("click", () => { gameOverScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); });
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

function handleAction(action) {
  if (!gameRunning) return;
  if (action === "up") {
    if (!player.isJumping) {
      player.vy = currentDifficulty === "hard" || currentDifficulty === "arcade" ? -13 : player.jumpForce;
      player.isJumping = true;
      player.isDuck = false;
      player.height = player.normalHeight;
      createParticles(player.x, player.y + player.height, "#0ff", 6);
    }
  } else if (action === "down") {
    if (player.isJumping) { player.vy += 14; } 
    else { player.isDuck = true; player.height = player.duckHeight; }
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === " ") handleAction("up");
  if (e.key === "ArrowDown") handleAction("down");
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowDown") { player.isDuck = false; player.height = player.normalHeight; }
});

document.getElementById("btn-up").addEventListener("touchstart", (e) => { e.preventDefault(); handleAction("up"); });
document.getElementById("btn-down").addEventListener("touchstart", (e) => { e.preventDefault(); handleAction("down"); });
document.getElementById("btn-down").addEventListener("touchend", (e) => { e.preventDefault(); player.isDuck = false; player.height = player.normalHeight; });
document.getElementById("btn-up").addEventListener("click", () => handleAction("up"));
document.getElementById("btn-down").addEventListener("mousedown", () => handleAction("down"));
document.getElementById("btn-down").addEventListener("mouseup", () => { player.isDuck = false; player.height = player.normalHeight; });

function startGame() {
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  hubScreen.classList.add("hidden");

  let config = difficulties[currentDifficulty];
  gameSpeed = config.speed;
  gravity = config.gravity;

  obstacles = [];
  collectibleItems = [];
  particleEffects = [];
  score = 0;
  sessionCoins = 0;
  spawnTimer = 0;
  worldTheme = 0;
  activeConsequenceText = "";
  consequenceTimer = 0;
  screenShakeTimer = 0;

  player.y = 280;
  player.vy = 0;
  player.isJumping = false;
  player.isDuck = false;
  player.height = player.normalHeight;
  player.shieldActive = customization.shieldBot;
  player.magnetActive = false;
  player.speedBoostActive = false;
  player.slowMoActive = false;
  player.ghostActive = false;
  player.shieldTimer = customization.shieldBot ? 9999 : 0;
  player.magnetTimer = 0;
  player.speedBoostTimer = 0;
  player.slowMoTimer = 0;
  player.ghostTimer = 0;

  gameRunning = true;
  loop();
}

function triggerRandomConsequence() {
  const consequences = [
    { text: "GHOST PHASER: Phase right through obstacles!", action: () => { player.ghostTimer = 320; } },
    { text: "HYPER SUN SPEED: Insane arcade rush!", action: () => { gameSpeed += 7; setTimeout(() => { gameSpeed = Math.max(5, gameSpeed - 7); }, 3000); } },
    { text: "GRAVITY INVERSION: Upside-down flip!", action: () => { gravity = -gravity; setTimeout(() => { gravity = difficulties[currentDifficulty].gravity; }, 3500); } },
    { text: "COIN TAX: Lost 10 coins!", action: () => { sessionCoins = Math.max(0, sessionCoins - 10); } },
    { text: "JACKPOT BONUS: +30 instant coins!", action: () => { sessionCoins += (customization.coinDrone ? 33 : 30); } },
    { text: "SLUG DRIFT: Heavy slow-motion time!", action: () => { player.slowMoTimer = 260; } },
    { text: "SCORE SURGE: +200 bonus points!", action: () => { score += 200; } },
    { text: "SCREEN SHAKE EVENT!", action: () => { screenShakeTimer = 45; } }
  ];
  let chosen = consequences[Math.floor(Math.random() * consequences.length)];
  activeConsequenceText = chosen.text;
  consequenceTimer = 220;
  chosen.action();
}

function gameOver() {
  gameRunning = false;
  let coinMultiplier = customization.coinDrone ? Math.floor(sessionCoins * 1.1) : sessionCoins;
  totalCoins += coinMultiplier;
  localStorage.setItem("neon_dash_coins", totalCoins);

  quests.forEach(q => {
    if (q.id === 'q1') { q.progress += coinMultiplier; localStorage.setItem('q1_prog', q.progress); }
    if (q.id === 'q2' && Math.floor(score) > q.progress) { q.progress = Math.floor(score); localStorage.setItem('q2_prog', q.progress); }
  });

  achievements.forEach(ach => {
    if (ach.id === 'a1') { ach.unlocked = true; localStorage.setItem('ach_1', 'true'); }
    if (ach.id === 'a2' && score >= 500) { ach.unlocked = true; localStorage.setItem('ach_2', 'true'); }
  });

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem("neon_dash_arcade_hi", highScore);
    highScoreDisplay.innerText = "HI: " + highScore;
    leaderboardData.push({ name: "YOU", score: highScore });
    localStorage.setItem('neon_dash_arcade_lb', JSON.stringify(leaderboardData));
  }

  finalStatsText.innerHTML = `Score: ${Math.floor(score)}<br>Coins Collected: +${coinMultiplier}`;
  gameOverScreen.classList.remove("hidden");
}

function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particleEffects.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      radius: Math.random() * 3.5 + 1,
      color: color, life: 30
    });
  }
}

function spawnObjects() {
  let config = difficulties[currentDifficulty];
  let type = Math.random() < 0.52 ? "ground" : "air";
  let obsWidth = 25 + Math.random() * 18;
  let obsHeight = type === "ground" ? (32 + Math.random() * 26) : 25;
  let obsY = type === "ground" ? (320 - obsHeight) : 205;
  let isMoving = Math.random() < 0.35;
  
  obstacles.push({
    x: canvas.width, width: obsWidth, height: obsHeight, y: obsY,
    type: type, isMoving: isMoving, moveDir: 1,
    color: type === "ground" ? "#ff2a5f" : "#ffbb00"
  });

  let itemRand = Math.random();
  if (itemRand < 0.35) {
    let coinY = Math.random() > 0.5 ? 260 : 175;
    for (let i = 0; i < 3; i++) {
      collectibleItems.push({ x: canvas.width + 90 + (i * 26), y: coinY, width: 16, height: 16, type: "coin" });
    }
  } else if (itemRand < 0.55) {
    let powerTypes = ["shield", "magnet", "boost", "slowmo", "ghost"];
    let chosenPower = powerTypes[Math.floor(Math.random() * powerTypes.length)];
    collectibleItems.push({ x: canvas.width + 80, y: 220, width: 20, height: 20, type: chosenPower });
  } else if (itemRand < 0.68) {
    collectibleItems.push({ x: canvas.width + 80, y: 220, width: 20, height: 20, type: "mystery" });
  }
}

function loop() {
  if (!gameRunning) return;

  let config = difficulties[currentDifficulty];
  worldTheme = Math.floor(score / 450) % 3;

  ctx.save();
  if (screenShakeTimer > 0) {
    screenShakeTimer--;
    let shakeX = (Math.random() - 0.5) * 8;
    let shakeY = (Math.random() - 0.5) * 8;
    ctx.translate(shakeX, shakeY);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (worldTheme === 1) {
    ctx.fillStyle = "rgba(255, 0, 128, 0.06)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (worldTheme === 2) {
    ctx.fillStyle = "rgba(0, 255, 255, 0.06)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 320); ctx.stroke();
  }

  ctx.fillStyle = worldTheme === 1 ? "#ff0080" : (worldTheme === 2 ? "#00ffff" : "#ffcc00");
  ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle;
  ctx.fillRect(0, 320, canvas.width, 4);
  ctx.shadowBlur = 0;

  let activePowersList = [];
  if (player.shieldTimer > 0 && !customization.shieldBot) { player.shieldTimer--; player.shieldActive = true; activePowersList.push("SHIELD"); } 
  else if (customization.shieldBot) { player.shieldActive = true; activePowersList.push("AUTO-BOT SHIELD"); }
  else { player.shieldActive = false; }

  if (player.magnetTimer > 0) { player.magnetTimer--; player.magnetActive = true; activePowersList.push("MAGNET"); } else { player.magnetActive = false; }
  if (player.speedBoostTimer > 0) { player.speedBoostTimer--; player.speedBoostActive = true; activePowersList.push("BOOST"); } else { player.speedBoostActive = false; }
  if (player.slowMoTimer > 0) { player.slowMoTimer--; player.slowMoActive = true; activePowersList.push("SLOW-MO"); } else { player.slowMoActive = false; }
  if (player.ghostTimer > 0) { player.ghostTimer--; player.ghostActive = true; activePowersList.push("GHOST"); } else { player.ghostActive = false; }

  if (consequenceTimer > 0) {
    consequenceTimer--;
    activePowersList.push(activeConsequenceText);
  }

  let activePowerText = activePowersList.length > 0 ? activePowersList.join(" | ") : "READY";
  statusBar.innerText = `COINS: ${totalCoins + sessionCoins} | STATUS: ${activePowerText}`;

  if (customization.activeTrail === "rainbow" && Math.random() < 0.5) {
    createParticles(player.x, player.y + player.height / 2, `hsl(${Math.random() * 360}, 100%, 50%)`, 1);
  } else if (customization.activeTrail === "fire" && Math.random() < 0.5) {
    createParticles(player.x, player.y + player.height / 2, "#ff3300", 1);
  }

  player.vy += gravity;
  player.y += player.vy;

  let groundLevel = 320 - player.height;
  let ceilingLevel = 0;

  if (gravity > 0) {
    if (player.y > groundLevel) { player.y = groundLevel; player.vy = 0; player.isJumping = false; }
  } else {
    if (player.y < ceilingLevel) { player.y = ceilingLevel; player.vy = 0; player.isJumping = false; }
  }

  let playerColor = player.ghostActive ? "rgba(0, 255, 255, 0.5)" : (player.shieldActive ? "#00ffcc" : player.color);
  ctx.fillStyle = playerColor;
  ctx.shadowBlur = 16; ctx.shadowColor = playerColor;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.shadowBlur = 0;

  spawnTimer++;
  let effectiveSpawnRate = Math.max(16, config.obstacleFreq - Math.floor(score / 35));
  if (spawnTimer > effectiveSpawnRate) {
    spawnObjects();
    spawnTimer = 0;
  }

  let speedMultiplier = player.slowMoActive ? 0.55 : (player.speedBoostActive ? 1.55 : 1);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= gameSpeed * speedMultiplier;

    if (obs.isMoving) {
      obs.y += obs.moveDir * 1.8;
      if (obs.y < 140 || obs.y > 280) obs.moveDir *= -1;
    }

    ctx.fillStyle = obs.color;
    ctx.shadowBlur = 10; ctx.shadowColor = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    ctx.shadowBlur = 0;

    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      if (player.ghostActive) {
        obstacles.splice(i, 1);
        continue;
      } else if (player.shieldActive) {
        player.shieldActive = false;
        player.shieldTimer = 0;
        if (customization.shieldBot) { customization.shieldBot = false; }
        createParticles(obs.x, obs.y, "#00ffcc", 18);
        obstacles.splice(i, 1);
        continue;
      } else {
        createParticles(player.x, player.y, "#ff2a5f", 25);
        screenShakeTimer = 25;
        gameOver();
        ctx.restore();
        return;
      }
    }

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
      score += 20;
    }
  }

  for (let i = collectibleItems.length - 1; i >= 0; i--) {
    let item = collectibleItems[i];
    item.x -= gameSpeed * speedMultiplier;

    if (player.magnetActive && item.type === "coin") {
      let dx = player.x - item.x;
      let dy = player.y - item.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      let baseRange = 130 + (upgrades.magnet * 35);
      if (dist < baseRange) { item.x += dx * 0.14; item.y += dy * 0.14; }
    }

    if (item.type === "coin") {
      ctx.fillStyle = "#ffcc00"; ctx.shadowBlur = 10; ctx.shadowColor = "#ffcc00";
      ctx.beginPath(); ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
      ctx.fill(); ctx.shadowBlur = 0;
    } else if (item.type === "shield") {
      ctx.fillStyle = "#00ffcc"; ctx.fillRect(item.x, item.y, item.width, item.height);
    } else if (item.type === "magnet") {
      ctx.fillStyle = "#ff33ff"; ctx.fillRect(item.x, item.y, item.width, item.height);
    } else if (item.type === "boost") {
      ctx.fillStyle = "#33ffff"; ctx.fillRect(item.x, item.y, item.width, item.height);
    } else if (item.type === "slowmo") {
      ctx.fillStyle = "#00ff00"; ctx.fillRect(item.x, item.y, item.width, item.height);
    } else if (item.type === "ghost") {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(item.x, item.y, item.width, item.height);
    } else if (item.type === "mystery") {
      ctx.fillStyle = "#ff00ff"; ctx.fillRect(item.x, item.y, item.width, item.height);
    }

    if (
      player.x < item.x + item.width &&
      player.x + player.width > item.x &&
      player.y < item.y + item.height &&
      player.y + player.height > item.y
    ) {
      if (item.type === "coin") {
        sessionCoins++;
        score += 30;
        createParticles(item.x, item.y, "#ffcc00", 5);
      } else if (item.type === "shield") {
        player.shieldTimer = 260 + (upgrades.shield * 60);
        createParticles(player.x, player.y, "#00ffcc", 12);
      } else if (item.type === "magnet") {
        player.magnetTimer = 260 + (upgrades.magnet * 60);
        createParticles(player.x, player.y, "#ff33ff", 12);
      } else if (item.type === "boost") {
        player.speedBoostTimer = 220 + (upgrades.boost * 50);
        createParticles(player.x, player.y, "#33ffff", 12);
      } else if (item.type === "slowmo") {
        player.slowMoTimer = 200;
        createParticles(player.x, player.y, "#00ff00", 12);
      } else if (item.type === "ghost") {
        player.ghostTimer = 160;
        createParticles(player.x, player.y, "#ffffff", 12);
      } else if (item.type === "mystery") {
        triggerRandomConsequence();
        createParticles(player.x, player.y, "#ff00ff", 18);
      }
      collectibleItems.splice(i, 1);
      continue;
    }

    if (item.x + item.width < 0) { collectibleItems.splice(i, 1); }
  }

  for (let i = particleEffects.length - 1; i >= 0; i--) {
    let p = particleEffects[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.radius, p.radius);
    if (p.life <= 0) { particleEffects.splice(i, 1); }
  }

  gameSpeed += config.speedInc;
  score += 0.18;
  scoreDisplay.innerText = "SCORE: " + Math.floor(score);

  ctx.restore();
  requestAnimationFrame(loop);
}
