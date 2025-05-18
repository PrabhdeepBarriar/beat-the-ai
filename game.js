const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player setup
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

// Load character animation frames
const playerFrames = [];

const idleImg = new Image();
idleImg.src = 'assets/character/character_yellow_idle.png';

const walkAImg = new Image();
walkAImg.src = 'assets/character/character_yellow_walk_a.png';

const walkBImg = new Image();
walkBImg.src = 'assets/character/character_yellow_walk_b.png';

playerFrames.push(idleImg, walkAImg, walkBImg);

let currentFrame = 0;
let frameTimer = 0;
const frameInterval = 12;

// Draw the player with animation
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Animate between walkA and walkB
  frameTimer++;
  if (frameTimer >= frameInterval) {
    currentFrame = currentFrame === 1 ? 2 : 1; // toggle between walkA and walkB
    frameTimer = 0;
  }

  // Draw current frame
  ctx.drawImage(playerFrames[currentFrame], player.x, player.y, player.width, player.height);
}

// Game update loop
function update() {
  // Apply gravity
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

// Jump on spacebar
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && player.grounded) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }
});

// Start game only after final image loads
walkBImg.onload = () => {
  update();
};