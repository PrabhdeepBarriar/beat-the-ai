// game.js — Updated for AI HUD, Game Over Overlay, AI Restart Per Generation

import { AIAgent, evolveNextGeneration, aiAgents, updateAI, drawAI, resetAI, aiDistance, aiAliveCount } from './ai.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const backgroundImg = new Image();
backgroundImg.src = 'assets/background_fade_trees.svg';

let player = {
  x: 100, y: 240, width: 90, height: 90,
  velocityY: 0, gravity: 0.8, jumpForce: -16,
  grounded: true, blink: false, blinkTimer: 0
};

let obstacle = {}, obstacleImgs = [], gameTimer = 120, lives = 3, distance = 0, speedMultiplier = 1;
let gameOver = false, gameStarted = false, playerDead = false, lastTimestamp = null, aiScore = 0;
window.generation = 1;

let waitingOverlay = null;

const frameSources = [
  'assets/character/character_yellow_idle.png',
  'assets/character/character_yellow_walk_a.png',
  'assets/character/character_yellow_walk_b.png'
];
const playerFrames = [], frameInterval = 12;
let currentFrame = 0, frameTimer = 0, imagesLoaded = 0;

let countryCode = '';
fetch('https://ipapi.co/json/')
  .then(res => res.json()).then(data => countryCode = data.country_code?.toLowerCase());

function preload() {
  obstacleImgs = ['assets/cactus.svg','assets/block_spikes.svg','assets/bomb.svg'].map(src => {
    const img = new Image(); img.src = src; return img;
  });
  frameSources.forEach(src => {
    const img = new Image(); img.src = src; img.onload = () => {
      playerFrames.push(img);
      if (++imagesLoaded === frameSources.length) showStartButton();
    };
  });
}

function update(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (!gameOver) {
    gameTimer -= delta;
    if (gameTimer <= 0) {
      gameOver = true;
      aiScore = Math.max(...aiAgents.map(a => a.score));
      showEndScreen();
      return;
    }

    if (!playerDead) {
      distance += 10 * speedMultiplier * delta;
      speedMultiplier = 1 + Math.floor(distance / 100) * 0.15;

      if (!player.grounded) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
        if (player.y >= 240) { player.y = 240; player.velocityY = 0; player.grounded = true; }
      }

      obstacle.x -= obstacle.speed * speedMultiplier;
      if (obstacle.x + obstacle.width < 0) resetObstacle();
      if (collision(player, obstacle) && !player.blink) {
        if (--lives <= 0) {
          lives = 0;
          playerDead = true;
          showWaitingOverlay();
        }
        player.blink = true; player.blinkTimer = 3;
      }
    }

    updateAI(delta, speedMultiplier, gameTimer);

    if (aiAliveCount() === 0) {
      aiScore = Math.max(...aiAgents.map(a => a.score));
      resetAI();
    }
  }

  draw();
  drawAI();

  if (!gameOver && gameStarted) requestAnimationFrame(update);
}

function showWaitingOverlay() {
  if (waitingOverlay) return;
  waitingOverlay = document.createElement('div');
  Object.assign(waitingOverlay.style, {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', color: '#fff', display: 'flex',
    justifyContent: 'center', alignItems: 'center', fontSize: '28px', zIndex: 1000
  });
  waitingOverlay.innerText = `Game Over – Waiting for AI to complete (${Math.ceil(gameTimer)}s left)`;
  document.body.appendChild(waitingOverlay);

  const timerUpdater = setInterval(() => {
    if (gameOver) clearInterval(timerUpdater);
    if (waitingOverlay) waitingOverlay.innerText = `Game Over – Waiting for AI to complete (${Math.ceil(gameTimer)}s left)`;
  }, 1000);
}

function resetObstacle() {
  obstacle = {
    x: canvas.width + Math.random() * 200,
    width: 60, height: 60, y: 270,
    speed: 6,
    img: obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)]
  };
}

function collision(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  frameTimer++;
  if (frameTimer >= frameInterval) {
    currentFrame = currentFrame === 1 ? 2 : 1;
    frameTimer = 0;
  }

  if (player.blink) {
    player.blinkTimer -= 1 / 60;
    if (Math.floor(player.blinkTimer * 10) % 2 === 0) {
      ctx.drawImage(playerFrames[currentFrame], player.x, player.y, player.width, player.height);
    }
    if (player.blinkTimer <= 0) player.blink = false;
  } else {
    ctx.drawImage(playerFrames[currentFrame], player.x, player.y, player.width, player.height);
  }

  ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

  ctx.fillStyle = '#000';
  ctx.fillRect(10, 10, 260, 110);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Lives: ${Math.max(0, lives)}`, 20, 35);
  ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 65);
  ctx.fillText(`Time Left: ${Math.ceil(gameTimer)}s`, 20, 95);
}

function showStartButton() {
  const button = document.createElement('button');
  button.textContent = 'Start Game';
  Object.assign(button.style, {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    fontSize: '20px', padding: '10px 20px', cursor: 'pointer'
  });
  document.body.appendChild(button);
  button.addEventListener('click', () => {
    document.body.removeChild(button);
    gameStarted = true;
    resetObstacle();
    requestAnimationFrame(update);
  });
}

function showEndScreen() {
  if (waitingOverlay) document.body.removeChild(waitingOverlay);
  waitingOverlay = null;

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center'
  });

  const won = distance > aiScore;
  overlay.innerHTML = `
    <div style="color:#fff;font-size:32px;margin-bottom:20px">${won ? 'You Won!' : 'AI Won!'}</div>
    <div style="color:#fff;font-size:24px;margin-bottom:20px">
      Your score: ${Math.floor(distance)}<br/>AI score: ${Math.floor(aiScore)}
    </div>
    ${won ? `<img src="https://flagcdn.com/w80/${countryCode}.png" style="width:60px;margin-bottom:20px" />` : '<div style="font-size:48px;margin-bottom:20px">🤖</div>'}
  `;

  const button = document.createElement('button');
  button.textContent = won ? 'Play Again' : 'Try Again';
  button.style.fontSize = '20px';
  button.style.padding = '10px 20px';
  button.style.cursor = 'pointer';
  button.addEventListener('click', () => {
    document.body.removeChild(overlay);
    restartGame();
  });
  overlay.appendChild(button);
  document.body.appendChild(overlay);
}

function restartGame() {
  gameTimer = 120;
  lives = 3;
  distance = 0;
  aiScore = 0;
  gameOver = false;
  playerDead = false;
  speedMultiplier = 1;
  player.y = 240;
  player.velocityY = 0;
  player.grounded = true;
  player.blink = false;
  lastTimestamp = null;
  window.generation++;
  resetObstacle();
  resetAI();
  requestAnimationFrame(update);
}

preload();