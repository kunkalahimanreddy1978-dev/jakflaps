const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= GLOBAL SETTINGS =================
let gameState = "start";
let pipeSpeed = 2.0;
let pipes = [];
let frame = 0;
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;
let gap, pipeSpacing; 

let gameOverScale = 0;
let bounceBack = false;
let gameOverPlayed = false;

let retryButton = { x: 0, y: 0, width: 160, height: 45 };

// ================= LOAD IMAGES =================
const birdImg = new Image();
birdImg.src = "images/bird.jpeg";

const gameOverImg = new Image();
gameOverImg.src = "images/gameover.jpeg";

const pipeImg = new Image();
pipeImg.src = "images/pipe.jpeg";

// ================= LOAD SOUND =================
const jumpSound = new Audio("sounds/jump.mp3");
const gameOverSound = new Audio("sounds/gameover.mp3");

// ================= BIRD OBJECT =================
let bird = {
  x: 0, 
  y: 0,
  width: 0,
  height: 0,
  gravity: 0.22,
  lift: -5,
  velocity: 0
};

// ================= RESIZE LOGIC =================
function resizeCanvas() {
  const ratio = 0.6;
  let w = window.innerWidth;
  let h = window.innerHeight;

  if (w / h > ratio) {
    canvas.height = h;
    canvas.width = h * ratio;
  } else {
    canvas.width = w;
    canvas.height = w / ratio;
  }

  // Set dynamic sizes
  bird.width = canvas.height * 0.07;
  bird.height = bird.width;
  bird.x = canvas.width * 0.15; // Position bird 15% from left
  
  gap = canvas.height * 0.24;
  pipeSpacing = canvas.width * 0.75;

  retryButton.width = canvas.width * 0.5;
  retryButton.height = 50;

  if (gameState === "start") bird.y = canvas.height / 2;
}

// Initialize scale
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================= RESET GAME =================
function resetGame() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  frame = 0;
  score = 0;
  pipeSpeed = 2.0;
  gameOverScale = 0;
  bounceBack = false;
  gameOverPlayed = false;
}

// ================= DRAWING FUNCTIONS =================
function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  let rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 4, bird.velocity * 0.1));
  ctx.rotate(rotation);
  ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  ctx.restore();
}

function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  // Ground collision
  if (bird.y + bird.height > canvas.height) {
    bird.y = canvas.height - bird.height;
    gameState = "gameover";
  }
  // Ceiling
  if (bird.y < 0) bird.y = 0;
}

function createPipe() {
  let minPipeHeight = 50;
  let maxPipeHeight = canvas.height - gap - minPipeHeight;
  let topHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;

  pipes.push({
    x: canvas.width,
    width: canvas.width * 0.18,
    top: topHeight,
    bottom: canvas.height - topHeight - gap,
    passed: false
  });
}

function drawPipes() {
  pipes.forEach(pipe => {
    // Top Pipe Clipping Logic
    ctx.drawImage(
      pipeImg,
      0, pipeImg.height - pipe.top, pipeImg.width, pipe.top, 
      pipe.x, 0, pipe.width, pipe.top
    );

    // Bottom Pipe Clipping Logic
    ctx.drawImage(
      pipeImg,
      0, 0, pipeImg.width, pipe.bottom, 
      pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom
    );

    if (gameState === "playing") pipe.x -= pipeSpeed;

    // Collision Detection
    if (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x &&
       (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)) {
      gameState = "gameover";
    }

    // Scoring
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      score++;
      pipe.passed = true;
    }
  });
  pipes = pipes.filter(p => p.x + p.width > 0);
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = `bold ${canvas.height * 0.03}px Arial`;
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("High: " + highScore, 20, 75);
}

function drawStartScreen() {
  ctx.fillStyle = "black";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Flappy-Jak", canvas.width / 2, canvas.height / 3);
  ctx.font = "18px Arial";
  ctx.fillText("Tap or Press Space to Start", canvas.width / 2, canvas.height / 2);
}

function drawGameOver() {
  if (!gameOverPlayed) {
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    gameOverPlayed = true;
  }
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyHighScore", highScore);
  }

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!bounceBack) {
    gameOverScale += 0.08;