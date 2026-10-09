
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");
const manualRestartBtn = document.getElementById("manualRestartBtn");

const initialGameSpeed = 5;
const speedIncreasePerMilestone = 0.5;
const gravity = 0.5;
let gameSpeed = initialGameSpeed;
let gameOver = false;
let score = 0;
let highScore = Number(localStorage.getItem("dinoHighScore")) || 0;
let audioContext;
let animationFrameId;

const dino = {
    x: 50,
    y: canvas.height - 47,
    width: 44,
    height: 47,
    vy: 0,
    isJumping: false
};

const obstacle = {
    x: canvas.width,
    y: canvas.height - 40,
    width: 25,
    height: 40
};

const dinoImg = new Image();
dinoImg.src = "assets/css/dino.png";
const cactusImg = new Image();
cactusImg.src = "assets/css/cactus.png";

function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function update() {
    score++;
    if (score > highScore) {
        highScore = score;
    }
    gameSpeed = initialGameSpeed
        + Math.floor(score / 100) * speedIncreasePerMilestone;
    if (score % 100 === 0) {
        playSound(880);
    }

    if (dino.isJumping) {
        dino.vy += gravity;
        dino.y += dino.vy;
        if (dino.y >= canvas.height - dino.height) {
            dino.y = canvas.height - dino.height;
            dino.isJumping = false;
            dino.vy = 0;
        }
    }

    obstacle.x -= gameSpeed;
    if (obstacle.x + obstacle.width < 0) {
        obstacle.x = canvas.width + Math.random() * 200;
    }

    if (collision(dino, obstacle)) {
        gameOver = true;
        saveHighScore();
        restartBtn.hidden = false;
    }
}

function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText("Puntaje: " + score, 10, 22);
    ctx.fillText("Récord: " + highScore, 475, 22);

    ctx.save();
    if (dino.isJumping) {
        ctx.filter = "hue-rotate(120deg)";
    }
    if (dinoImg.complete) {
        ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    } else {
        ctx.fillStyle = dino.isJumping ? "#16a34a" : "green";
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    }
    ctx.restore();

    if (cactusImg.complete) {
        ctx.drawImage(cactusImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
        ctx.fillStyle = "brown";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

function playSound(frequency) {
    if (typeof window.AudioContext === "undefined") {
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0.15, audioContext.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
}

function saveHighScore() {
    localStorage.setItem("dinoHighScore", String(highScore));
}

function jump() {
    if (!dino.isJumping && !gameOver) {
        dino.isJumping = true;
        dino.vy = -10;
        playSound(520);
    }
}

function resetGame() {
    cancelAnimationFrame(animationFrameId);
    saveHighScore();
    gameOver = false;
    score = 0;
    gameSpeed = initialGameSpeed;
    dino.y = canvas.height - dino.height;
    dino.isJumping = false;
    dino.vy = 0;
    obstacle.x = canvas.width;
    restartBtn.hidden = true;
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault();
        jump();
    }
});

restartBtn.addEventListener("click", resetGame);
manualRestartBtn.addEventListener("click", resetGame);

draw();
animationFrameId = requestAnimationFrame(gameLoop);
