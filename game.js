// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load background image
const backgroundImg = new Image();
backgroundImg.src = 'assets/background_fade_trees.svg';

// Player setup (3x size, restored jump)
let player = {
  x: 100,
  y: 240,
  width: 90,
  height: 90,
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -16,    // original jump restored
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
let gameTimer = 120; // 2 minutes in seconds
let userCountry = 'Unknown';
let countryCode = '';

fetch('https://ipapi.co/json/')
  .then(res => res.json())
  .then(data => {
    userCountry = data.country_name || 'Unknown';
    countryCode = data.country_code || '';
    console.log("User is from:", userCountry);
  })
  .catch(() => {
    console.warn("Could not determine country");
  });
let lives = 3;
let distance = 0;
let gameOver = false;
let gameStarted = false;
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

      if (lives <= 0) {
        gameOver = true;
        showEndScreen();
      }
    }
  }

  draw();
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

  const titleText = document.createElement('div');
  titleText.textContent = gameTimer <= 0 ? 'Congratulations, you won!' : 'Game Over!';
  titleText.style.color = '#fff';
  titleText.style.fontSize = '32px';
  titleText.style.marginBottom = '20px';
  overlay.appendChild(titleText);

  const scoreText = document.createElement('div');
  scoreText.textContent = `Your score is ${Math.floor(distance)}`;
  scoreText.style.color = '#fff';
  scoreText.style.fontSize = '28px';
  scoreText.style.marginBottom = '20px';

  const button = document.createElement('button');
  button.textContent = 'Try Again';
  button.style.fontSize = '20px';
  button.style.padding = '10px 20px';
  button.style.cursor = 'pointer';

  button.addEventListener('click', () => {
    document.body.removeChild(overlay);
    restartGame();
  });

  // Create flag image
  const flagImg = document.createElement('img');
  flagImg.src = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
  flagImg.style.marginBottom = '20px';
  flagImg.alt = 'Country flag';
  flagImg.style.width = '60px';
  flagImg.style.height = 'auto';
  overlay.appendChild(flagImg);

  overlay.appendChild(scoreText);
  overlay.appendChild(button);
  document.body.appendChild(overlay);
}

function restartGame() {
  gameTimer = 20;
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
  requestAnimationFrame(update);
}
