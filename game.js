// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load background image
const backgroundImg = new Image();
backgroundImg.src = 'assets/background_fade_trees.svg';

// Player setup (3x size, reduced jump)
let player = {
  x: 100,
  y: 240,              // Adjusted for better alignment
  width: 90,
  height: 90,
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -12.8,    // 20% less than -16
  grounded: true,
  blink: false,
  blinkTimer: 0
};

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

// Create obstacle with image
let obstacle = {
  x: canvas.width,
  width: 60,
  height: 60,
  y: 270,
  speed: 6,
  img: obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)]
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

      if (lives <= 0) {
        gameOver = true;
        showRestartButton();
      }
    }
  }

  draw();
  if (!gameOver) {
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

  // Draw HUD background box
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 10, 180, 70);

  // Draw HUD text
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Lives: ${lives}`, 20, 35);
  ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 65);

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

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && player.grounded && !gameOver) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }
});

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
  player.y = 240;
  player.velocityY = 0;
  player.grounded = true;
  player.blink = false;
  lastTimestamp = null;
}
