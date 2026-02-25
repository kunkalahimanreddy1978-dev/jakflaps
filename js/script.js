const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= GLOBAL SETTINGS (Missing in your last snippet) =================
let gameState = "start";
let pipeSpeed = 1.5;
let pipes = [];
let frame = 0;
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;
let gap, pipeSpacing; // These get set in resizeCanvas()

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

// ================= BIRD =================
let bird = {
  x: 80,
  y: 300,
  width: 60,
  height: 60,
  gravity: 0.18,
  lift: -4,
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

  // Set dynamic sizes after canvas is sized
  bird.width = canvas.height * 0.07;
  bird.height = bird.width;
  gap = canvas.height * 0.22;
  pipeSpacing = canvas.width * 0.8;
}

// CALL THIS IMMEDIATELY
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================= RESET GAME =================
function resetGame() {
  bird.y = 300;
  bird.velocity = 0;
  pipes = [];
  frame = 0;
  score = 0;
  pipeSpeed = 1.5;
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
  if (bird.y + bird.height > canvas.height) gameState = "gameover";
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
    ctx.drawImage(pipeImg, pipe.x, 0, pipe.width, pipe.top);
    ctx.drawImage(pipeImg, pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);

    pipe.x -= pipeSpeed;

    // Collision
    if (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x &&
       (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)) {
      gameState = "gameover";
    }

    // Score
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      score++;
      pipe.passed = true;
    }
  });
  // Cleanup pipes
  pipes = pipes.filter(p => p.x + p.width > 0);
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("High: " + highScore, 20, 70);
}

function drawStartScreen() {
  ctx.fillStyle = "black";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Flappy-Jak", canvas.width / 2, canvas.height / 3);
  ctx.font = "18px Arial";
  ctx.fillText("Press Space or Tap to Start", canvas.width / 2, canvas.height / 2);
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
    if (gameOverScale >= 1.1) bounceBack = true;
  } else {
    gameOverScale -= 0.05;
    if (gameOverScale <= 1) gameOverScale = 1;
  }

  let popupWidth = canvas.width * 0.8 * gameOverScale;
  let popupHeight = popupWidth * 0.7;
  let popupX = canvas.width / 2 - popupWidth / 2;
  let popupY = canvas.height / 2 - popupHeight / 2;

  ctx.drawImage(gameOverImg, popupX, popupY, popupWidth, popupHeight);

  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, popupY - 30);
  
  ctx.fillStyle = "#ffcc00";
  retryButton.x = canvas.width / 2 - retryButton.width / 2;
  retryButton.y = popupY + popupHeight + 20;
  ctx.fillRect(retryButton.x, retryButton.y, retryButton.width, retryButton.height);
  ctx.fillStyle = "black";
  ctx.fillText("RETRY", canvas.width / 2, retryButton.y + 30);
}

// ================= MAIN LOOP =================
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "playing") {
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
      createPipe();
    }
    if (frame % 280 === 0 && frame !== 0) pipeSpeed += 0.1;
    updateBird();
    drawPipes();
    drawBird();
    drawScore();
    frame++;
  } else if (gameState === "gameover") {
    drawPipes();
    drawBird();
    drawGameOver();
  }
  requestAnimationFrame(gameLoop);
}

// ================= INPUTS =================
function handleInput(event) {
  if (gameState === "start") {
    gameState = "playing";
  } else if (gameState === "playing") {
    bird.velocity = bird.lift;
    jumpSound.currentTime = 0;
    jumpSound.play();
  } else if (gameState === "gameover") {
    if (event) {
      let rect = canvas.getBoundingClientRect();
      let mouseX = event.clientX - rect.left;
      let mouseY = event.clientY - rect.top;
      if (mouseX > retryButton.x && mouseX < retryButton.x + retryButton.width &&
          mouseY > retryButton.y && mouseY < retryButton.y + retryButton.height) {
        resetGame();
        gameState = "start";
      }
    }
  }
}

document.addEventListener("keydown", (e) => { if (e.code === "Space") handleInput(); });
canvas.addEventListener("mousedown", (e) => { handleInput(e); });
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); handleInput(); }, { passive: false });

gameLoop();