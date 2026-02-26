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
pipeImg.src = "images/pipe.jpeg"; // This is now your square "cap"

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

  bird.width = canvas.height * 0.07;
  bird.height = bird.width;
  bird.x = canvas.width * 0.15; 
  
  gap = canvas.height * 0.24;
  pipeSpacing = canvas.width * 0.75;

  retryButton.width = canvas.width * 0.5;
  retryButton.height = 55;

  if (gameState === "start") bird.y = canvas.height / 2;
}

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

  if (bird.y + bird.height > canvas.height) {
    bird.y = canvas.height - bird.height;
    gameState = "gameover";
  }
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
    ctx.fillStyle = "#cbcb00";

    // --- TOP PIPE ---
    // Start at 0, draw down to pipe.top
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
    // Draw square cap at the very bottom edge of this top section
    ctx.drawImage(pipeImg, pipe.x, pipe.top - pipe.width, pipe.width, pipe.width);

    // --- BOTTOM PIPE ---
    let bottomStartY = pipe.top + gap; // The Y coordinate where the bottom pipe starts
    let bottomHeight = canvas.height - bottomStartY; // Distance from start to the absolute bottom

    // Draw solid black from start point to the bottom of the canvas
    ctx.fillRect(pipe.x, bottomStartY, pipe.width, bottomHeight);
    
    // Draw square cap at the very top edge of this bottom section
    ctx.drawImage(pipeImg, pipe.x, bottomStartY, pipe.width, pipe.width);

    if (gameState === "playing") pipe.x -= pipeSpeed;

    // Collision (Updated to be more precise)
    if (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x &&
       (bird.y < pipe.top || bird.y + bird.height > bottomStartY)) {
      gameState = "gameover";
    }

    // Score
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
  ctx.fillText("JAK FLAPS", canvas.width / 2, canvas.height / 3);
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
    if (gameOverScale >= 1.1) bounceBack = true;
  } else {
    gameOverScale -= 0.05;
    if (gameOverScale <= 1) gameOverScale = 1;
  }

  let popupW = canvas.width * 0.8 * gameOverScale;
  let popupH = popupW * 0.65;
  let popupX = canvas.width / 2 - popupW / 2;
  let popupY = canvas.height / 2 - popupH / 2;

  ctx.drawImage(gameOverImg, popupX, popupY, popupW, popupH);

  ctx.fillStyle = "white";
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, popupY - 30);
  
  ctx.fillStyle = "#ff4444";
  ctx.font = "16px Arial";
  ctx.fillText("poyi chaduvuko inka", canvas.width / 2, popupY - 10);

  retryButton.x = canvas.width / 2 - retryButton.width / 2;
  retryButton.y = popupY + popupH + 30;
  
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(retryButton.x, retryButton.y, retryButton.width, retryButton.height);
  ctx.fillStyle = "black";
  ctx.font = "bold 20px Arial";
  ctx.fillText("RETRY", canvas.width / 2, retryButton.y + 35);
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
    if (frame % 300 === 0 && frame !== 0) pipeSpeed += 0.15;
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

// ================= INPUT HANDLER =================
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
      let clickX, clickY;

      if (event.touches && event.touches.length > 0) {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
      } else {
        clickX = (event.clientX || 0) - rect.left;
        clickY = (event.clientY || 0) - rect.top;
      }

      if (clickX > retryButton.x - 10 && clickX < retryButton.x + retryButton.width + 10 &&
          clickY > retryButton.y - 10 && clickY < retryButton.y + retryButton.height + 10) {
        resetGame();
        gameState = "start";
      }
    }
  }
}

document.addEventListener("keydown", (e) => { if (e.code === "Space") handleInput(); });
canvas.addEventListener("mousedown", (e) => { handleInput(e); });
canvas.addEventListener("touchstart", (e) => { 
  if (gameState === "playing") e.preventDefault(); 
  handleInput(e); 
}, { passive: false });

gameLoop();