const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;

  // Make it tall like mobile game
  canvas.height = screenHeight;
  canvas.width = screenHeight * 0.6;

  // If width becomes bigger than screen, adjust
  if (canvas.width > screenWidth) {
    canvas.width = screenWidth;
    canvas.height = screenWidth / 0.6;
  }
}

function resizeCanvas() {
  const ratio = 0.6; // Aspect ratio (width / height)
  let w = window.innerWidth;
  let h = window.innerHeight;

  // Fit the game to the screen while maintaining the 0.6 ratio
  if (w / h > ratio) {
    canvas.height = h;
    canvas.width = h * ratio;
  } else {
    canvas.width = w;
    canvas.height = w / ratio;
  }

  // Update dynamic sizes based on new canvas height
  // This ensures the gap and bird size feel the same on an iPhone or a Tablet
  bird.width = canvas.height * 0.07;  // Bird is 7% of screen height
  bird.height = bird.width;
  gap = canvas.height * 0.22;        // Gap is 22% of screen height
}

// ================= LOAD IMAGES =================

const birdImg = new Image();
birdImg.src = "images/bird.jpeg";

const gameOverImg = new Image();
gameOverImg.src = "images/gameover.jpeg";

const pipeImg = new Image();
pipeImg.src = "images/pipe.jpeg";   // change name if different

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

// ================= RESET GAME =================

function resetGame() {
  bird.y = 300;
  bird.velocity = 0;
  pipes = [];
  frame = 0;
  score = 0;
  pipeSpeed = 1.0;
  gameOverScale = 0;
  bounceBack = false;
  gameOverPlayed = false;
}

// ================= DRAW BIRD =================


function drawBird() {
  ctx.save(); // Save the current canvas state
  
  // Move the "center" of the canvas to the bird's position for rotation
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  
  // Calculate rotation: velocity * 0.1 is a good ratio (clamped between -25 and 90 degrees)
  let rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 4, bird.velocity * 0.1));
  ctx.rotate(rotation);

  // Draw the bird centered at (0,0) because we translated the canvas
  ctx.drawImage(
    birdImg,
    -bird.width / 2,
    -bird.height / 2,
    bird.width,
    bird.height
  );

  ctx.restore(); // Restore the canvas so other elements don't tilt
}

// ================= UPDATE BIRD =================

function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height) {
    gameState = "gameover";
  }

  if (bird.y < 0) {
    bird.y = 0;
  }
}

// ================= CREATE PIPE =================

function createPipe() {
  let topHeight = Math.random() * 300 + 50;

  pipes.push({
    x: canvas.width,
    width: 100,
    top: topHeight,
    bottom: canvas.height - topHeight - gap,
    passed: false
  });
}

// ================= DRAW PIPES =================

function drawPipes() {

  pipes.forEach(pipe => {

    // ===== TOP PIPE =====
    ctx.drawImage(
      pipeImg,
      pipe.x,
      0,
      pipe.width,
      pipe.top
    );

    // ===== BOTTOM PIPE =====
    ctx.drawImage(
      pipeImg,
      pipe.x,
      canvas.height - pipe.bottom,
      pipe.width,
      pipe.bottom
    );

    // Move pipe
    pipe.x -= pipeSpeed;

    // Collision detection
    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top ||
       bird.y + bird.height > canvas.height - pipe.bottom)
    ) {
      gameState = "gameover";
    }

    // Score
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      score++;
      pipe.passed = true;
    }

  });
}

// ================= DRAW SCORE =================

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "22px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("High: " + highScore, 20, 60);
}

// ================= START SCREEN =================

function drawStartScreen() {
  ctx.fillStyle = "black";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Flappy-Jak", canvas.width / 2, 250);

  ctx.font = "18px Arial";
  ctx.fillText("Press Space or Tap to Start", canvas.width / 2, 300);
}

// ================= GAME OVER SCREEN =================

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

  // Zoom + Bounce
  if (!bounceBack) {
    gameOverScale += 0.08;
    if (gameOverScale >= 1.1) bounceBack = true;
  } else {
    gameOverScale -= 0.05;
    if (gameOverScale <= 1) gameOverScale = 1;
  }

  let popupWidth = 320 * gameOverScale;
  let popupHeight = 220 * gameOverScale;

  let popupX = canvas.width / 2 - popupWidth / 2;
  let popupY = canvas.height / 2 - popupHeight / 2;

  // TEXT ABOVE IMAGE
  ctx.shadowColor = "yellow";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "white";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, popupY - 50);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ff4444";
  ctx.font = "20px Arial";
  ctx.fillText("hehehe inka pakkaki po", canvas.width / 2, popupY - 20);

  // IMAGE
  ctx.drawImage(
    gameOverImg,
    popupX,
    popupY,
    popupWidth,
    popupHeight
  );

  // SCORE BELOW IMAGE
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, canvas.width / 2, popupY + popupHeight + 30);
  ctx.fillText("High: " + highScore, canvas.width / 2, popupY + popupHeight + 60);

  // RETRY BUTTON
  retryButton.x = canvas.width / 2 - retryButton.width / 2;
  retryButton.y = popupY + popupHeight + 80;

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(
    retryButton.x,
    retryButton.y,
    retryButton.width,
    retryButton.height
  );

  ctx.fillStyle = "black";
  ctx.font = "bold 18px Arial";
  ctx.fillText("RETRY", canvas.width / 2, retryButton.y + 28);
}

// ================= MAIN LOOP =================

function gameLoop() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "start") {
    drawStartScreen();
  }

  if (gameState === "playing") {

    // Fixed horizontal spacing
    if (pipes.length === 0) {
      createPipe();
    } else {
      let lastPipe = pipes[pipes.length - 1];
      if (lastPipe.x < canvas.width - pipeSpacing) {
        createPipe();
      }
    }

    // Difficulty increases only speed
    if (frame % 280==0 && frame !== 0) {
      pipeSpeed += 0.1;
    }

    updateBird();
    drawBird();
    drawPipes();
    drawScore();

    frame++;
  }

  if (gameState === "gameover") {
    drawBird();
    drawPipes();
    drawScore();
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

// ================= INPUT =================

function handleInput(event) {

  if (gameState === "start") {
    gameState = "playing";
  }
  else if (gameState === "playing") {

    bird.velocity = bird.lift;

    jumpSound.currentTime = 0;
    jumpSound.play();
  }
  else if (gameState === "gameover") {

    if (event) {
      let mouseX = event.offsetX;
      let mouseY = event.offsetY;

      if (
        mouseX > retryButton.x &&
        mouseX < retryButton.x + retryButton.width &&
        mouseY > retryButton.y &&
        mouseY < retryButton.y + retryButton.height
      ) {
        resetGame();
        gameState = "start";
      }
    }
  }
}

// 1. Keyboard (Spacebar)
document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    handleInput();
  }
});

// 2. Mouse Click (Desktop)
// Using 'mousedown' is often more responsive than 'click'
canvas.addEventListener("mousedown", function (e) {
  handleInput(e);
});

// 3. Mobile Touch (The fix for "Ghost Clicks")
canvas.addEventListener("touchstart", function (e) {
  // This is the crucial part: it stops the 'mousedown/click' 
  // from firing immediately after the touch.
  e.preventDefault(); 
  handleInput();
}, { passive: false });
gameLoop();