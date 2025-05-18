// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player setup (3x size)
let player = {
  x: 100,
  y: 210,
  width: 90,
  height: 90,
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -12,
  grounded: true,
  blink: false,
  blinkTimer: 0
};

// Obstacle setup
let obstacleTypes = [
  { width: 30, height: 50 },
  { width: 25, height: 40 },
  { width: 35, height: 30 }
];

let obstacle = {
  x: canvas.width,
  ...obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)],
  y: 270,
  speed: 6
};

// Game state
let lives = 3;
let distance = 0;
let gameOver = false;
let speedMultiplier = 1;
let lastTimestamp = null;

// Animation setup
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
      requestAnimationFrame(update);
    }
  };
  playerFrames.push(img);
});

function update(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (!gameOver) {
    // Update distance and speed multiplier
    distance += 10 * speedMultiplier * delta;
    speedMultiplier = 1 + Math.floor(distance / 100) * 0.15;

    // Gravity
    if (!player.grounded) {
      player.velocityY += player.gravity;
      player.y += player.velocityY;
      if (player.y >= 210) {
        player.y = 210;
        player.velocityY = 0;
        player.grounded = true;
      }
    }

    // Obstacle movement
    obstacle.x -= obstacle.speed * speedMultiplier;
    if (obstacle.x + obstacle.width < 0) {
      obstacle = {
        x: canvas.width + Math.random() * 200,
        ...obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)],
        y: 270,
        speed: 6
      };
    }

    // Collision detection
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

      if (lives <= 0) {
        gameOver = true;
        showRestartButton();
      }
    }
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Animate player
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

  // Draw obstacle
  ctx.fillStyle = '#ff5555';
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

  // Draw HUD
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Lives: ${lives}`, 20, 30);
  ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 60);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText(`You ran ${Math.floor(distance)}m`, canvas.width / 2 - 80, canvas.height / 2 + 20);
  }
}

// Controls
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && player.grounded && !gameOver) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }
});

// Try Again Button
function showRestartButton() {
  const button = document.createElement('button');
  button.textContent = 'Try Again';
  button.style.position = 'absolute';
  button.style.top = '50%';
  button.style.left = '50%';
  button.style.transform = 'translate(-50%, -50%)';
  button.style.fontSize = '20px';
  button.style.padding = '10px 20px';
  button.style.cursor = 'pointer';
  document.body.appendChild(button);

  button.addEventListener('click', () => {
    document.body.removeChild(button);
    restartGame();
  });
}

function restartGame() {
  lives = 3;
  distance = 0;
  gameOver = false;
  speedMultiplier = 1;
  obstacle.x = canvas.width;
  player.y = 210;
  player.velocityY = 0;
  player.grounded = true;
  player.blink = false;
  lastTimestamp = null;
}
