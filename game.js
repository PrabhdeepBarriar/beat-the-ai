const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player properties
let player = {
  x: 100,
  y: 300,
  width: 30,
  height: 30,
  velocityY: 0,
  gravity: 0.8,
  jumpForce: -12,
  grounded: true
};

// Load character frames
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

frameSources.forEach((src, index) => {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === frameSources.length) {
      update(); // Start game only after all images load
    }
  };
  playerFrames.push(img);
});

// Draw game frame
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Animate between walkA and walkB
  frameTimer++;
  if (frameTimer >= frameInterval) {
    currentFrame = currentFrame === 1 ? 2 : 1;
    frameTimer = 0;
  }

  ctx.drawImage(playerFrames[currentFrame], player.x, player.y, player.width, player.height);
}

// Game logic
function update() {
  if (!player.grounded) {
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    if (player.y >= 300) {
      player.y = 300;
      player.velocityY = 0;
      player.grounded = true;
    }
  }

  draw();
  requestAnimationFrame(update);
}

// Controls
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && player.grounded) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }
});