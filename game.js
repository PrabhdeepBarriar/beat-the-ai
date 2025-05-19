// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const aiCanvas = document.getElementById('aiCanvas');
const aiCtx = aiCanvas.getContext('2d');

// Load background image
const backgroundImg = new Image();
backgroundImg.src = 'assets/background_fade_trees.svg';

// Player setup
let player = {
  x: 100,
  y: 240,
  width: 90,
  height: 90,
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -16,
  grounded: true,
  blink: false,
  blinkTimer: 0
};

// AIAgent class
class AIAgent {
  constructor(weights = [Math.random(), Math.random(), Math.random()]) {
    this.x = 100;
    this.y = 240;
    this.width = 20;
    this.height = 20;
    this.velocityY = 0;
    this.gravity = 0.8;
    this.jumpForce = -16;
    this.grounded = true;
    this.alive = true;
    this.score = 0;
    this.weights = weights;
  }

  update(inputs) {
    if (!this.alive) return;
    const [dist, speed, timeLeft] = inputs;
    const decision = this.think(dist, speed, timeLeft);
    if (decision > 0.5) this.jump();
    this.applyPhysics();
    this.score += 1;
  }

  think(dist, speed, time) {
    const sum = dist * this.weights[0] + speed * this.weights[1] + time * this.weights[2];
    return 1 / (1 + Math.exp(-sum));
  }

  jump() {
    if (this.grounded) {
      this.velocityY = this.jumpForce;
      this.grounded = false;
    }
  }

  applyPhysics() {
    this.velocityY += this.gravity;
    this.y += this.velocityY;
    if (this.y >= 240) {
      this.y = 240;
      this.velocityY = 0;
      this.grounded = true;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = 'cyan';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

let aiAgents = [];
for (let i = 0; i < 5; i++) aiAgents.push(new AIAgent());

// Load obstacle images
const obstacleImages = [
  'assets/cactus.svg',
  'assets/block_spikes.svg',
  'assets/bomb.svg'
];

const obstacleImgs = obstacleImages.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

let obstacle = {
  x: canvas.width,
  width: 60,
  height: 60,
  y: 270,
  speed: 6,
  img: obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)]
};

let aiObstacle = { ...obstacle };

// Game state
let gameTimer = 120;
let userCountry = 'Unknown';
let countryCode = '';
let lives = 3;
let distance = 0;
let aiScore = 0;
let gameOver = false;
let gameStarted = false;
let speedMultiplier = 1;
let lastTimestamp = null;
let generation = 1;

fetch('https://ipapi.co/json/')
  .then(res => res.json())
  .then(data => {
    userCountry = data.country_name || 'Unknown';
    countryCode = data.country_code || '';
  });

const frameInterval = 12;
let currentFrame = 0;
let frameTimer = 0;
const playerFrames = [];

const frameSources = [
  'assets/character/character_yellow_idle.png',
  'assets/character/character_yellow_walk_a.png',
  'assets/character/character_yellow_walk_b.png'
];

let imagesLoaded = 0;
frameSources.forEach((src) => {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === frameSources.length) {
      showStartButton();
    }
  };
  playerFrames.push(img);
});

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
    }

    distance += 10 * speedMultiplier * delta;
    speedMultiplier = 1 + Math.floor(distance / 100) * 0.15;

    if (!player.grounded) {
      player.velocityY += player.gravity;
      player.y += player.velocityY;
      if (player.y >= 240) {
        player.y = 240;
        player.velocityY = 0;
        player.grounded = true;
      }
    }

    obstacle.x -= obstacle.speed * speedMultiplier;
    if (obstacle.x + obstacle.width < 0) {
      obstacle = {
        x: canvas.width + Math.random() * 200,
        width: 60,
        height: 60,
        y: 270,
        speed: 6,
        img: obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)]
      };
    }

    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y &&
      !player.blink
    ) {
      lives--;
      player.blink = true;
      player.blinkTimer = 3;
    }

    aiObstacle.x -= aiObstacle.speed * speedMultiplier;
    if (aiObstacle.x + aiObstacle.width < 0) {
      aiObstacle = {
        x: aiCanvas.width + Math.random() * 200,
        width: 60,
        height: 60,
        y: 270,
        speed: 6,
        img: obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)]
      };
    }

    aiAgents.forEach(agent => {
      const distToObstacle = aiObstacle.x - agent.x;
      agent.update([distToObstacle, aiObstacle.speed * speedMultiplier, gameTimer]);

      if (
        agent.x < aiObstacle.x + aiObstacle.width &&
        agent.x + agent.width > aiObstacle.x &&
        agent.y < aiObstacle.y + aiObstacle.height &&
        agent.y + agent.height > aiObstacle.y
      ) {
        agent.alive = false;
      }
    });
  }

  draw();
  drawAI();

  if (!gameOver && gameStarted) {
    requestAnimationFrame(update);
  }
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
    if (player.blinkTimer <= 0) {
      player.blink = false;
    }
  } else {
    ctx.drawImage(playerFrames[currentFrame], player.x, player.y, player.width, player.height);
  }

  ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

  ctx.fillStyle = '#000';
  ctx.fillRect(10, 10, 220, 90);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Lives: ${lives}`, 20, 35);
  ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 65);
  ctx.fillText(`Time Left: ${Math.ceil(gameTimer)}s`, 20, 85);
}

function drawAI() {
  aiCtx.clearRect(0, 0, aiCanvas.width, aiCanvas.height);
  aiCtx.drawImage(backgroundImg, 0, 0, aiCanvas.width, aiCanvas.height);
  aiCtx.drawImage(aiObstacle.img, aiObstacle.x, aiObstacle.y, aiObstacle.width, aiObstacle.height);

  aiAgents.forEach(agent => agent.draw(aiCtx));

  aiCtx.fillStyle = '#000';
  aiCtx.fillRect(10, 10, 220, 70);
  aiCtx.fillStyle = '#fff';
  aiCtx.font = '20px Arial';
  aiCtx.fillText(`Gen: ${generation}`, 20, 35);
  aiCtx.fillText(`Alive: ${aiAgents.filter(a => a.alive).length}/5`, 20, 60);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && player.grounded && !gameOver && gameStarted) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }
});

function showStartButton() {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse {
      0% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.05); }
      100% { transform: translate(-50%, -50%) scale(1); }
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.textContent = 'Start Game';
  button.style.position = 'absolute';
  button.style.top = '50%';
  button.style.left = '50%';
  button.style.transform = 'translate(-50%, -50%)';
  button.style.fontSize = '20px';
  button.style.padding = '10px 20px';
  button.style.cursor = 'pointer';
  button.style.opacity = '0';
  button.style.transition = 'opacity 1s ease, transform 0.3s ease-in-out';
  button.style.animation = 'pulse 2s infinite';
  document.body.appendChild(button);

  setTimeout(() => {
    button.style.opacity = '1';
  }, 50);

  button.addEventListener('click', () => {
    document.body.removeChild(button);
    gameStarted = true;
    requestAnimationFrame(update);
  });
}

function showEndScreen() {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';

  const won = distance > aiScore;
  const titleText = document.createElement('div');
  titleText.textContent = won ? 'You Won!' : 'AI Won!';
  titleText.style.color = '#fff';
  titleText.style.fontSize = '32px';
  titleText.style.marginBottom = '20px';
  overlay.appendChild(titleText);

  const scoreText = document.createElement('div');
  scoreText.textContent = `Your score: ${Math.floor(distance)}\nAI score: ${Math.floor(aiScore)}`;
  scoreText.style.color = '#fff';
  scoreText.style.fontSize = '24px';
  scoreText.style.marginBottom = '20px';
  overlay.appendChild(scoreText);

  if (won) {
    const flagImg = document.createElement('img');
    flagImg.src = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
    flagImg.alt = 'Country flag';
    flagImg.style.width = '60px';
    flagImg.style.height = 'auto';
    flagImg.style.marginBottom = '20px';
    overlay.appendChild(flagImg);
  } else {
    const emoji = document.createElement('div');
    emoji.textContent = '🤖';
    emoji.style.fontSize = '48px';
    emoji.style.marginBottom = '20px';
    overlay.appendChild(emoji);
  }

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
  speedMultiplier = 1;
  obstacle.x = canvas.width;
  aiObstacle.x = aiCanvas.width;
  player.y = 240;
  player.velocityY = 0;
  player.grounded = true;
  player.blink = false;
  lastTimestamp = null;
  generation++;
  aiAgents = [];
  for (let i = 0; i < 5; i++) aiAgents.push(new AIAgent());
  requestAnimationFrame(update);
}