export class AIAgent {
  constructor(weights = [Math.random(), Math.random(), Math.random()]) {
    this.x = 100;
    this.y = 270;
    this.width = 90;
    this.height = 90;
    this.velocityY = 0;
    this.gravity = 0.8;
    this.jumpForce = -16;
    this.grounded = true;
    this.alive = true;
    this.score = 0;
    this.weights = weights;
    this.frameIndex = 1;
    this.frameTimer = 0;
  }

  update(inputs) {
    if (!this.alive) return;
    const [dist, speed, timeLeft] = inputs;
    const decision = this.think(dist, speed, timeLeft);
    if (decision > 0.5) this.jump();
    this.applyPhysics();
    this.score++;

    this.frameTimer++;
    if (this.frameTimer >= 12) {
      this.frameIndex = this.frameIndex === 1 ? 2 : 1;
      this.frameTimer = 0;
    }
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
    if (this.y >= 270) {
      this.y = 270;
      this.velocityY = 0;
      this.grounded = true;
    }
  }

  draw(ctx, frames) {
    if (!this.alive) return;
    ctx.drawImage(frames[this.frameIndex], this.x, this.y, this.width, this.height);
  }
}

export let aiAgents = [];
export let aiObstacle = {
  x: 900,
  width: 60,
  height: 60,
  y: 270,
  speed: 6,
  img: new Image()
};
aiObstacle.img.src = 'assets/cactus.svg';

export function evolveNextGeneration() {
  const topAgents = [...aiAgents].sort((a, b) => b.score - a.score).slice(0, 2);
  const children = [];

  while (children.length < 5) {
    const parentA = topAgents[Math.floor(Math.random() * topAgents.length)].weights;
    const parentB = topAgents[Math.floor(Math.random() * topAgents.length)].weights;
    const childWeights = parentA.map((w, i) => {
      const avg = (w + parentB[i]) / 2;
      return Math.random() < 0.2 ? avg + (Math.random() - 0.5) * 0.5 : avg;
    });
    children.push(new AIAgent(childWeights));
  }

  aiAgents = children;
}

export function updateAI(delta, speedMultiplier, gameTimer) {
  aiObstacle.x -= aiObstacle.speed * speedMultiplier;
  if (aiObstacle.x + aiObstacle.width < 0) {
    aiObstacle = {
      x: 900 + Math.random() * 200,
      width: 60,
      height: 60,
      y: 270,
      speed: 6,
      img: aiObstacle.img
    };
  }

  aiAgents.forEach(agent => {
    const dist = aiObstacle.x - agent.x;
    agent.update([dist, aiObstacle.speed * speedMultiplier, gameTimer]);

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

export function drawAI() {
  const aiCanvas = document.getElementById('aiCanvas');
  const aiCtx = aiCanvas.getContext('2d');
  const backgroundImg = new Image();
  backgroundImg.src = 'assets/background_fade_trees.svg';

  aiCtx.clearRect(0, 0, aiCanvas.width, aiCanvas.height);
  aiCtx.drawImage(backgroundImg, 0, 0, aiCanvas.width, aiCanvas.height);
  aiCtx.drawImage(aiObstacle.img, aiObstacle.x, aiObstacle.y, aiObstacle.width, aiObstacle.height);

  aiAgents.forEach(agent => agent.draw(aiCtx, [null, ...document.querySelectorAll('img[src*="character_yellow"]')]));

  aiCtx.fillStyle = '#000';
  aiCtx.fillRect(10, 10, 220, 70);
  aiCtx.fillStyle = '#fff';
  aiCtx.font = '20px Arial';
  aiCtx.fillText(`Gen: ${window.generation || 1}`, 20, 35);
  aiCtx.fillText(`Alive: ${aiAgents.filter(a => a.alive).length}/5`, 20, 60);
}

export function resetAI() {
  aiAgents = [];
  for (let i = 0; i < 5; i++) aiAgents.push(new AIAgent());
  aiObstacle.x = 900;
}
