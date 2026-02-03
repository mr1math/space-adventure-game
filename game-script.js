// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let gameState = 'menu'; // menu, playing, paused, gameover
let score = 0;
let lives = 3;
let level = 1;
let highScore = localStorage.getItem('spaceGameHighScore') || 0;
let soundEnabled = true;

// Game Objects
let spaceship = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 7,
    color: '#4299e1'
};

let bullets = [];
let asteroids = [];
let particles = [];
let stars = [];

// Game Settings
const bulletSpeed = 8;
const asteroidSpeed = 2;
let asteroidSpawnRate = 60; // frames
let frameCount = 0;

// Initialize
function init() {
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        spaceship.x = canvas.width / 2 - spaceship.width / 2;
        spaceship.y = canvas.height - spaceship.height - 20;
        
        // Create background stars
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    updateHighScoreDisplay();
}

// Input Handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        shootBullet();
    }
    
    if (e.key === 'Escape' && gameState === 'playing') {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse/Touch Controls
if (canvas) {
    canvas.addEventListener('click', () => {
        if (gameState === 'playing') {
            shootBullet();
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (gameState === 'playing') {
            const rect = canvas.getBoundingClientRect();
            spaceship.x = e.clientX - rect.left - spaceship.width / 2;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (gameState === 'playing') {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            spaceship.x = touch.clientX - rect.left - spaceship.width / 2;
        }
    });

    canvas.addEventListener('touchstart', () => {
        if (gameState === 'playing') {
            shootBullet();
        }
    });
}

// Game Functions
function startGame() {
    hideAllScreens();
    document.getElementById('gameScreen').classList.remove('hidden');
    
    // Reset game
    score = 0;
    lives = 3;
    level = 1;
    bullets = [];
    asteroids = [];
    particles = [];
    asteroidSpawnRate = 60;
    frameCount = 0;
    
    if (canvas) {
        spaceship.x = canvas.width / 2 - spaceship.width / 2;
        spaceship.y = canvas.height - spaceship.height - 20;
    }
    
    updateUI();
    gameState = 'playing';
    
    if (!canvas) {
        init();
    }
    
    gameLoop();
}

function restartGame() {
    startGame();
}

function backToMenu() {
    gameState = 'menu';
    hideAllScreens();
    document.getElementById('startScreen').classList.remove('hidden');
}

function quitToMenu() {
    gameState = 'menu';
    hideAllScreens();
    document.getElementById('startScreen').classList.remove('hidden');
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
        gameLoop();
    }
}

function gameOver() {
    gameState = 'gameover';
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceGameHighScore', highScore);
        document.getElementById('newRecordMessage').classList.remove('hidden');
    } else {
        document.getElementById('newRecordMessage').classList.add('hidden');
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    
    hideAllScreens();
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    
    let heartsDisplay = '';
    for (let i = 0; i < lives; i++) {
        heartsDisplay += '❤️';
    }
    for (let i = lives; i < 3; i++) {
        heartsDisplay += '🖤';
    }
    document.getElementById('lives').textContent = heartsDisplay;
}

function updateHighScoreDisplay() {
    document.getElementById('highScoreDisplay').textContent = highScore;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundBtn').textContent = soundEnabled ? '🔊' : '🔇';
}

// Shooting
function shootBullet() {
    bullets.push({
        x: spaceship.x + spaceship.width / 2 - 2,
        y: spaceship.y,
        width: 4,
        height: 15,
        speed: bulletSpeed,
        color: '#48bb78'
    });
}

// Spawn Asteroid
function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: asteroidSpeed + (level - 1) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        color: `hsl(${Math.random() * 60 + 15}, 70%, 50%)`
    });
}

// Create Explosion Particles
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 4 + 2,
            color: color,
            life: 30
        });
    }
}

// Update Game Objects
function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Move spaceship
    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && spaceship.x > 0) {
        spaceship.x -= spaceship.speed;
    }
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && spaceship.x < canvas.width - spaceship.width) {
        spaceship.x += spaceship.speed;
    }
    
    // Update bullets
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
    
    // Spawn asteroids
    if (frameCount % asteroidSpawnRate === 0) {
        spawnAsteroid();
    }
    
    // Update asteroids
    asteroids = asteroids.filter(asteroid => {
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Check collision with spaceship
        if (checkCollision(spaceship, asteroid)) {
            lives--;
            updateUI();
            createExplosion(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2, '#f56565');
            
            if (lives <= 0) {
                gameOver();
            }
            
            return false;
        }
        
        return asteroid.y < canvas.height + asteroid.height;
    });
    
    // Check bullet-asteroid collisions
    bullets.forEach((bullet, bIndex) => {
        asteroids.forEach((asteroid, aIndex) => {
            if (checkCollision(bullet, asteroid)) {
                score += 10;
                updateUI();
                
                createExplosion(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2, asteroid.color);
                
                bullets.splice(bIndex, 1);
                asteroids.splice(aIndex, 1);
                
                // Level up every 100 points
                if (score % 100 === 0 && score > 0) {
                    level++;
                    asteroidSpawnRate = Math.max(30, asteroidSpawnRate - 5);
                    updateUI();
                }
            }
        });
    });
    
    // Update particles
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        return particle.life > 0;
    });
    
    // Update stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Collision Detection
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Draw Functions
function draw() {
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 4, 40, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => {
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        ctx.globalAlpha = 1;
    });
    
    // Draw spaceship
    drawSpaceship();
    
    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });
    
    // Draw asteroids
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
        ctx.rotate(asteroid.rotation);
        
        // Draw irregular asteroid shape
        ctx.fillStyle = asteroid.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = asteroid.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const radius = asteroid.width / 2 * (0.8 + Math.random() * 0.4);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();
    });
    
    // Draw particles
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.globalAlpha = 1;
    });
}

function drawSpaceship() {
    if (!ctx) return;
    
    ctx.save();
    ctx.translate(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height / 2);
    
    // Spaceship body
    ctx.fillStyle = spaceship.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = spaceship.color;
    
    ctx.beginPath();
    ctx.moveTo(0, -spaceship.height / 2);
    ctx.lineTo(spaceship.width / 2, spaceship.height / 2);
    ctx.lineTo(0, spaceship.height / 3);
    ctx.lineTo(-spaceship.width / 2, spaceship.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#90cdf4';
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#ffd89b';
    ctx.globalAlpha = 0.7 + Math.random() * 0.3;
    ctx.fillRect(-10, spaceship.height / 3, 8, 10);
    ctx.fillRect(2, spaceship.height / 3, 8, 10);
    ctx.globalAlpha = 1;
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Game Loop
function gameLoop() {
    if (gameState !== 'playing') return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Initialize on load
window.addEventListener('load', () => {
    init();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (canvas && gameState !== 'playing') {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
});
