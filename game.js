const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player setup (3x size)
let player = {
  x: 100,
  y: 210,              // Adjusted ground Y
  width: 90,           // 3x width
  height: 90,          // 3x height
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -12,
  grounded: true
};

// Obstacle setup (proportional)
let obstacle = {
  x: canvas.width,
  y: 240,              // Bottom aligned to new ground
  width: 30,
  height: 60,
  speed: 6
};

// Game state
let lives = 3;
let distance = 0;
let gameOver = false;

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
      update(); // start game after all images load
    }
  };
  playerFrames.push(img);
});

// Main game loop
function update() {
  if (!gameOver) {
    if (!player.grounded) {
      player.velocityY += player.gravity;
      player.y += player.velocityY;

      if (player.y >= 210) {
        player.y = 210;
        player.velocityY = 0;
        player.grounded = true;
      }
    }

    // Move obstacle
    obstacle.x -= obstacle.speed;

    if (obstacle.x + obstacle.width < 0) {
      obstacle.x = canvas.width + Math.random() * 200;
      distance += 10;
    }

    // Collision detection
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      lives--;
      obstacle.x = canvas.width + Math.random() * 200; // reset obstacle

      if (lives <= 0) {
        gameOver = true;
        showRestartButton();
      }
    }
  }

  draw();
  requestAnimationFrame(update);
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player (animated)
  frameTimer++;
  if (frameTimer >= frameInterval) {
    currentFrame = currentFrame === 1 ? 2 : 1;
    frameTimer = 0;
  }
  ctx.drawImage(playerFrames[currentFrame], player.x, player.y, player.width, player.height);

  // Draw obstacle
  ctx.fillStyle = '#ff5555';
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

  // Draw HUD
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Lives: ${lives}`, 20, 30);
  ctx.fillText(`Distance: ${distance}m`, 20, 60);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText(`You ran ${distance}m`, canvas.width / 2 - 80, canvas.height / 2 + 20);
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

// Reset game state
function restartGame() {
  lives = 3;
  distance = 0;
  gameOver = false;
  obstacle.x = canvas.width;
  player.y = 210;
  player.velocityY = 0;
  player.grounded = true;
}