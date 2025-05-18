const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

function update() {
  // Gravity
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff99';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && player.grounded) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }
});

update();