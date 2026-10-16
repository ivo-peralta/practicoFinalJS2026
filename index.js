
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");
const manualRestartBtn = document.getElementById("manualRestartBtn");

// Valores iniciales del juego
const velocidadInicial = 5;
const aumentoVelocidad = 0.5;
const gravedad = 0.5;

let gameSpeed = velocidadInicial;
let gameOver = false;
let score = 0;
let highScore = Number(localStorage.getItem("dinoHighScore")) || 0;
let audioContext;
let animationFrameId;

// Datos del dinosaurio
const dino = {
    x: 50,
    y: canvas.height - 47,
    width: 44,
    height: 47,
    vy: 0,
    isJumping: false
};

// Datos del cactus que tenemos que esquivar
const obstacle = {
    x: canvas.width,
    y: canvas.height - 40,
    width: 25,
    height: 40
};

// Cargamos las imágenes del juego
const dinoImg = new Image();
dinoImg.src = "assets/css/dino.png";

const dinoDeadImg = new Image();
dinoDeadImg.src = "dinoRojo.png";

const cactusImg = new Image();
cactusImg.src = "assets/css/cactus.png";

// Esta función mantiene el juego en movimiento
function gameLoop() {
    if (!gameOver) {
        update();
        draw();

        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Actualiza el puntaje, la velocidad y la posición de los objetos
function update() {
    score++;

    if (score > highScore) {
        highScore = score;
    }

    // El juego se vuelve más rápido cada 100 puntos
    gameSpeed = velocidadInicial
        + Math.floor(score / 100) * aumentoVelocidad;

    if (score % 100 === 0) {
        playSound(880);
    }

    // Movimiento del dinosaurio cuando salta
    if (dino.isJumping) {
        dino.vy += gravedad;
        dino.y += dino.vy;

        // Cuando toca el suelo, termina el salto
        if (dino.y >= canvas.height - dino.height) {
            dino.y = canvas.height - dino.height;
            dino.isJumping = false;
            dino.vy = 0;
        }
    }

    // El cactus se mueve hacia la izquierda
    obstacle.x -= gameSpeed;

    // Cuando sale de la pantalla, vuelve a aparecer
    if (obstacle.x + obstacle.width < 0) {
        obstacle.x = canvas.width + Math.random() * 200;
    }

    // Si el dinosaurio toca el cactus, termina el juego
    if (collision(dino, obstacle)) {
        gameOver = true;
        saveHighScore();
        restartBtn.hidden = false;
    }
}

// Comprueba si el dinosaurio choca con el cactus
function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Dibuja el dinosaurio, el cactus y los puntajes
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText("Puntaje: " + score, 10, 22);
    ctx.fillText("Récord: " + highScore, 475, 22);

    // Dibujamos el dinosaurio
    ctx.save();

    if (dino.isJumping && !gameOver) {
        ctx.filter = "hue-rotate(120deg)";
    }

    const currentDinoImg = gameOver ? dinoDeadImg : dinoImg;

    if (currentDinoImg.complete && currentDinoImg.naturalWidth > 0) {
        ctx.drawImage(
            currentDinoImg,
            dino.x,
            dino.y,
            dino.width,
            dino.height
        );
    } else {
        // Si no carga la imagen, usamos un rectángulo
        ctx.fillStyle = gameOver ? "red" : dino.isJumping ? "#16a34a" : "green";
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    }

    ctx.restore();

    // Dibujamos el cactus
    if (cactusImg.complete) {
        ctx.drawImage(
            cactusImg,
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    } else {
        ctx.fillStyle = "brown";
        ctx.fillRect(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    }
}

// Reproduce sonidos con diferentes frecuencias
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
    volume.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.12
    );

    oscillator.connect(volume);
    volume.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
}

// Guarda el récord para que no se pierda al cerrar la página
function saveHighScore() {
    localStorage.setItem("dinoHighScore", String(highScore));
}

// Hace saltar al dinosaurio si está en el suelo
function jump() {
    if (!dino.isJumping && !gameOver) {
        dino.isJumping = true;
        dino.vy = -10;
        playSound(520);
    }
}

// Reinicia los valores para empezar una nueva partida
function resetGame() {
    cancelAnimationFrame(animationFrameId);
    saveHighScore();

    gameOver = false;
    score = 0;
    gameSpeed = velocidadInicial;

    dino.y = canvas.height - dino.height;
    dino.isJumping = false;
    dino.vy = 0;

    obstacle.x = canvas.width;
    restartBtn.hidden = true;

    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Permite saltar usando la barra espaciadora
document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault();
        jump();
    }
});

// Los dos botones sirven para volver a jugar
restartBtn.addEventListener("click", resetGame);
if (manualRestartBtn) {
    manualRestartBtn.addEventListener("click", resetGame);
}

// Dibujamos la pantalla inicial y empezamos el juego
draw();
animationFrameId = requestAnimationFrame(gameLoop);