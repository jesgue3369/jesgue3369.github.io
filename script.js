// --- Elementos DOM globais ---
const menu = document.getElementById('menu');
const playButton = document.getElementById('play-button');
const gameArea = document.getElementById('game-container'); // *** CRITICAL FIX: Define gameArea ***
let player = document.getElementById('player'); // Será obtido ao iniciar o jogo

const hudHp = document.getElementById('hud-hp');
const hudMp = document.getElementById('hud-mp');
const hudScore = document.getElementById('hud-score');
const hudLevel = document.getElementById('hud-level');
const cardSelectionDiv = document.getElementById('card-selection');
const cardButtons = document.querySelectorAll('.card-button');
const maxWaveDisplay = document.getElementById('max-wave');

// --- Game State ---
let isGameRunning = false;
let playerX = 100;
let playerY = 50; // Posição inicial no chão do cenário gerado (bottom-based)
const playerWidth = 40;
const playerHeight = 60;
let playerSpeed = 5;

let isJumping = false;
let canJump = true;
let jumpForce = 15;
let gravity = 0.8;
let velocityY = 0;

let playerHp = 100;
let playerMaxHp = 100;
let playerMp = 50;
let playerMaxMp = 50;
let playerLevel = 1;
let playerMpRegenRate = 0.05;
let score = 0;
let currentWave = 0;
let enemies = [];
let playerProjectiles = [];
let enemyProjectiles = []; // Garantido que seja inicializado como array
let keysPressed = {};
let mouseX = 0;
let mouseY = 0;
let canShoot = true;
let shootCooldown = 600; // ms
let waveDifficultyMultiplier = 1.1;
let maxReachedWave = 0;

let gameLoopInterval;

// --- Platforms for Collision (bottom-based coordinates) ---
const platforms = [
    // Chão invisível na base (bottom = 0) - altura de 1px para colisão
    { x: 0, y: 0, width: 800, height: 1 },
    // Plataforma central (bottom = 150)
    { x: 260, y: 150, width: 280, height: 30 }
];

// --- Waves Data ---
const wavesData = [
    { count: 4, types: ['basic'], baseEnemySpeed: 1.5, spawnDelay: 1500, cards: false },
    { count: 6, types: ['basic', 'fast'], baseEnemySpeed: 1.8, spawnDelay: 1200, cards: false },
    { count: 8, types: ['basic', 'fast'], baseEnemySpeed: 2.0, spawnDelay: 1000, cards: true },
    { count: 10, types: ['basic', 'fast', 'sniper'], baseEnemySpeed: 2.2, spawnDelay: 900, cards: false },
    { count: 12, types: ['basic', 'fast', 'sniper', 'giant'], baseEnemySpeed: 2.5, spawnDelay: 800, cards: true },
    { count: 15, types: ['basic', 'fast', 'sniper', 'giant'], baseEnemySpeed: 2.8, spawnDelay: 700, cards: false },
    { count: 18, types: ['basic', 'fast', 'sniper', 'giant'], baseEnemySpeed: 3.0, spawnDelay: 600, cards: true },
];

// --- Enemy Classes ---
class Enemy {
    constructor(x, y, speed, type) {
        this.x = x; // Top-based X
        this.y = y; // Top-based Y
        this.width = 30;
        this.height = 30;
        this.speed = speed;
        this.type = type;
        this.element = document.createElement('div');
        this.element.classList.add('enemy');
        this.element.classList.add(type);
        gameArea.appendChild(this.element); // *** Depende de gameArea estar definida ***

        this.horizontalSpeed = 0.5;
        this.shootInterval = null;
        this.canShoot = false;
        this.projectileSpeed = 4;
        this.hp = 10;

        switch (type) {
            case 'giant':
                this.width = 60;
                this.height = 60;
                this.speed *= 0.6;
                this.hp = 30;
                break;
            case 'fast':
                this.width = 25;
                this.height = 25;
                this.speed *= 1.5;
                this.horizontalSpeed *= 1.5;
                break;
            case 'sniper':
                this.canShoot = true;
                this.hp = 15;
                this.projectileSpeed = 6;
                break;
        }

        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`; // Inimigo é posicionado usando 'top'

        this.onGround = false;
        this.velocityY = 0;
        console.log(`Enemy spawned: Type ${this.type}, X:${this.x}, Y:${this.y}`); // Log de spawn
    }

    // Retorna a coordenada 'top' do chão ou plataforma onde o inimigo deve pousar
    getGroundY() {
        let surfaceY = gameArea.offsetHeight; // Default para o chão mais baixo da gameArea (como top-coordinate)

        for (const platform of platforms) {
            const platformTopEdgeInTopCoords = gameArea.offsetHeight - (platform.y + platform.height);

            if (this.x + this.width > platform.x && this.x < platform.x + platform.width) {
                if ((this.y + this.height <= platformTopEdgeInTopCoords + 1) && 
                    (this.y + this.height + this.velocityY) >= platformTopEdgeInTopCoords) {
                    surfaceY = Math.min(surfaceY, platformTopEdgeInTopCoords);
                }
            }
        }
        return surfaceY; // Retorna uma coordenada 'top'
    }

    move(playerRect) {
        let targetX = playerRect.left + playerRect.width / 2;

        this.velocityY += gravity;
        this.y += this.velocityY; // Atualiza a posição Y (top-based)

        let groundYTop = this.getGroundY(); // Obtém o chão como uma coordenada 'top'

        if (this.y + this.height >= groundYTop) {
            this.y = groundYTop - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        if (this.onGround) {
            if (this.x < targetX - this.width / 2 - 50) {
                this.x += this.horizontalSpeed;
            } else if (this.x > targetX - this.width / 2 + 50) {
                this.x -= this.horizontalSpeed;
            } else {
                if (Math.random() < 0.01) {
                    this.horizontalSpeed *= -1;
                }
                this.x += this.horizontalSpeed * 0.5;
            }
        }

        this.x = Math.max(0, Math.min(this.x, gameArea.offsetWidth - this.width)); // *** Depende de gameArea ***
        this.y = Math.max(0, Math.min(this.y, gameArea.offsetHeight - this.height)); // *** Depende de gameArea ***

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        if (this.type === 'sniper' && this.onGround && this.y < gameArea.offsetHeight * 0.7) {
            if (!this.shootInterval) {
                this.shootInterval = setInterval(() => this.shoot(), 2500 / waveDifficultyMultiplier);
            }
        } else if (this.type === 'sniper' && (!this.onGround || this.y >= gameArea.offsetHeight * 0.7) && this.shootInterval) {
            clearInterval(this.shootInterval);
            this.shootInterval = null;
        }
    }

    shoot() {
        if (this.canShoot && isGameRunning) {
            const projectile = document.createElement('div');
            projectile.classList.add('projectile');
            const startX = this.x + this.width / 2 - 5;
            const startY = this.y + this.height / 2;

            const playerYTopBased = gameArea.offsetHeight - (playerY + playerHeight / 2); // *** Depende de gameArea ***
            const angle = Math.atan2(playerYTopBased - startY, (playerX + playerWidth / 2) - startX);
            const vx = Math.cos(angle) * this.projectileSpeed;
            const vy = Math.sin(angle) * this.projectileSpeed;

            projectile.style.left = `${startX}px`;
            projectile.style.top = `${startY}px`;
            gameArea.appendChild(projectile); // *** Depende de gameArea ***
            enemyProjectiles.push({
                element: projectile,
                x: startX,
                y: startY,
                vx: vx,
                vy: vy
            });
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.element.remove();
            if (this.shootInterval) clearInterval(this.shootInterval);
            return true;
        }
        return false;
    }
}

// --- Player Projectile ---
function createPlayerProjectile() {
    if (canShoot && isGameRunning && playerMp >= 5) {
        playerMp -= 5;
        updateHud();
        canShoot = false;
        setTimeout(() => {
            canShoot = true;
        }, shootCooldown);

        const projectile = document.createElement('div');
        projectile.classList.add('projectile');
        projectile.classList.add('player-projectile');
        const startX = playerX + playerWidth / 2 - 7.5;
        const startY = gameArea.offsetHeight - (playerY + playerHeight / 2 - 7.5); // *** Depende de gameArea ***

        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;

        const angle = Math.atan2(mouseY - startY, mouseX - startX);
        const speed = 15;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        gameArea.appendChild(projectile); // *** Depende de gameArea ***
        playerProjectiles.push({ element: projectile, x: startX, y: startY, vx: velocityX, vy: velocityY });
    }
}

function movePlayerProjectiles() {
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const p = playerProjectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.element.style.left = `${p.x}px`;
        p.element.style.top = `${p.y}px`;

        if (p.x < 0 || p.x > gameArea.offsetWidth || p.y < 0 || p.y > gameArea.offsetHeight) { // *** Depende de gameArea ***
            p.element.remove();
            playerProjectiles.splice(i, 1);
        }
    }
}

function moveEnemyProjectiles() {
    // Tratamento defensivo adicional para garantir que enemyProjectiles é um array.
    // O erro "is not defined" aqui frequentemente significa que alguma coisa anterior
    // impediu a inicialização completa do script. A correção de gameArea deve resolver isso.
    if (!Array.isArray(enemyProjectiles)) {
        console.error("enemyProjectiles não é um array! Inicializando defensivamente.", enemyProjectiles);
        enemyProjectiles = []; // Re-inicializa para evitar erro
        return;
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.element.style.left = `${p.x}px`;
        p.element.style.top = `${p.y}px`;

        if (p.x < 0 || p.x > gameArea.offsetWidth || p.y < 0 || p.y > gameArea.offsetHeight) { // *** Depende de gameArea ***
            p.element.remove();
            enemyProjectiles.splice(i, 1);
        }
    }
}

// --- Player Movement ---
let currentGroundY = 0;

function getPlayerGroundY() {
    let newGroundY = 0;

    for (const platform of platforms) {
        const playerBottom = playerY;
        const platformTop = platform.y + platform.height;

        if (playerX + playerWidth > platform.x && playerX < platform.x + platform.width) {
            if (velocityY <= 0 && playerBottom >= platformTop && (playerBottom + velocityY) <= platformTop) {
                newGroundY = Math.max(newGroundY, platformTop);
            }
        }
    }
    return newGroundY;
}

document.addEventListener('keydown', (e) => {
    console.log('Key pressed:', e.code);
    keysPressed[e.code] = true;
    if (e.code === 'Space' && canJump) {
        isJumping = true;
        canJump = false;
        velocityY = jumpForce;
        console.log('Jump initiated. VelocityY:', velocityY);
    }
});

document.addEventListener('keyup', (e) => {
    delete keysPressed[e.code];
});

function movePlayer() {
    if (keysPressed['KeyA']) {
        playerX -= playerSpeed;
    }
    if (keysPressed['KeyD']) {
        playerX += playerSpeed;
    }

    velocityY -= gravity;
    playerY += velocityY;

    currentGroundY = getPlayerGroundY();

    if (playerY <= currentGroundY) {
        playerY = currentGroundY;
        velocityY = 0;
        isJumping = false;
        canJump = true;
    }

    playerX = Math.max(0, Math.min(playerX, gameArea.offsetWidth - playerWidth)); // *** Depende de gameArea ***
    playerY = Math.max(0, Math.min(playerY, gameArea.offsetHeight - playerHeight)); // *** Depende de gameArea ***

    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;
    console.log(`Player Pos: (X:${playerX.toFixed(1)}, Y:${playerY.toFixed(1)}), VelY:${velocityY.toFixed(1)}, GroundY:${currentGroundY}, CanJump:${canJump}`);
}

// --- Scenario Generation ---
function generateScenario() {
    console.log('Generating scenario...');
    gameArea.querySelectorAll('.ground-segment, .ground-texture, .castle-tower, .castle-wall, .castle-window, .moon, .cloud').forEach(el => el.remove()); // *** Depende de gameArea ***

    const moon = document.createElement('div');
    moon.classList.add('moon');
    moon.style.top = '50px';
    moon.style.left = '450px';
    gameArea.appendChild(moon);

    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.classList.add('cloud');
        cloud.classList.add(Math.random() > 0.5 ? 'small' : 'medium');
        cloud.style.left = `${Math.random() * (gameArea.offsetWidth - 100)}px`; // *** Depende de gameArea ***
        cloud.style.top = `${Math.random() * 150 + 20}px`;
        gameArea.appendChild(cloud);
    }

    // Chão principal (VISUAL APENAS, SEM COLISÃO NO ARRAY platforms, exceto o invisível na base)
    const mainGround = document.createElement('div');
    mainGround.classList.add('ground-segment');
    mainGround.style.width = `${gameArea.offsetWidth}px`; // *** Depende de gameArea ***
    mainGround.style.height = `50px`;
    mainGround.style.left = `0px`;
    mainGround.style.bottom = `0px`;
    gameArea.appendChild(mainGround);

    const mainGroundTexture = document.createElement('div');
    mainGroundTexture.classList.add('ground-texture');
    mainGroundTexture.style.width = `${gameArea.offsetWidth}px`; // *** Depende de gameArea ***
    mainGroundTexture.style.height = `30px`;
    mainGroundTexture.style.left = `0px`;
    mainGroundTexture.style.bottom = `0px`;
    gameArea.appendChild(mainGroundTexture);

    const platform1 = document.createElement('div');
    platform1.classList.add('ground-segment');
    platform1.style.width = `220px`;
    platform1.style.height = `30px`;
    platform1.style.left = `0px`;
    platform1.style.bottom = `110px`;
    gameArea.appendChild(platform1);

    const platform2 = document.createElement('div');
    platform2.classList.add('ground-segment');
    platform2.style.width = `280px`;
    platform2.style.height = `30px`;
    platform2.style.left = `260px`;
    platform2.style.bottom = `150px`;
    gameArea.appendChild(platform2);

    const platform3 = document.createElement('div');
    platform3.classList.add('ground-segment');
    platform3.style.width = `250px`;
    platform3.style.height = `30px`;
    platform3.style.left = `550px`;
    platform3.style.bottom = `100px`;
    gameArea.appendChild(platform3);

    const tower1 = document.createElement('div');
    tower1.classList.add('castle-tower');
    tower1.style.width = `80px`;
    tower1.style.height = `100px`;
    tower1.style.left = `310px`;
    tower1.style.bottom = `180px`;
    gameArea.appendChild(tower1);
    const tower1Platform = document.createElement('div');
    tower1Platform.classList.add('ground-segment');
    tower1Platform.style.width = `100px`;
    tower1Platform.style.height = `30px`;
    tower1Platform.style.left = `300px`;
    tower1Platform.style.bottom = `220px`;
    gameArea.appendChild(tower1Platform);
    let window1_1 = document.createElement('div'); window1_1.classList.add('castle-window'); window1_1.style.left = '340px'; window1_1.style.bottom = '240px'; gameArea.appendChild(window1_1);
    let window1_2 = document.createElement('div'); window1_2.classList.add('castle-window'); window1_2.style.left = '360px'; window1_2.style.bottom = '240px'; gameArea.appendChild(window1_2);


    const tower2 = document.createElement('div');
    tower2.classList.add('castle-tower');
    tower2.style.width = `100px`;
    tower2.style.height = `150px`;
    tower2.style.left = `620px`;
    tower2.style.bottom = `170px`;
    gameArea.appendChild(tower2);
    const tower2Platform = document.createElement('div');
    tower2Platform.classList.add('ground-segment');
    tower2Platform.style.width = `150px`;
    tower2Platform.style.height = `30px`;
    tower2Platform.style.left = `600px`;
    tower2Platform.style.bottom = `200px`;
    gameArea.appendChild(tower2Platform);
    let window2_1 = document.createElement('div'); window2_1.classList.add('castle-window'); window2_1.style.left = '650px'; window2_1.style.bottom = '230px'; gameArea.appendChild(window2_1);
    let window2_2 = document.createElement('div'); window2_2.classList.add('castle-window'); window2_2.style.left = '670px'; window2_2.style.bottom = '230px'; gameArea.appendChild(window2_2);


    const platform4 = document.createElement('div');
    platform4.classList.add('ground-segment');
    platform4.style.width = `100px`;
    platform4.style.height = `30px`;
    platform4.style.left = `0px`;
    platform4.style.bottom = `220px`;
    gameArea.appendChild(platform4);
    console.log('Scenario generation complete.');
}


// --- Enemy Spawning ---
function spawnEnemy(type, baseSpeed) {
    const x = Math.random() * (gameArea.offsetWidth - 30); // *** Depende de gameArea ***
    const enemy = new Enemy(x, -50, baseSpeed * waveDifficultyMultiplier, type);
    enemies.push(enemy);
    console.log(`Spawned enemy: ${type} at X:${x}, initial Y:-50`);
}

function startWave() {
    console.log(`Starting Wave ${currentWave + 1}...`);
    currentWave++;
    if (currentWave > wavesData.length) {
        isGameRunning = false;
        alert('Parabéns! Você venceu todas as ondas disponíveis!');
        showMenu();
        return;
    }

    const waveData = wavesData[currentWave - 1];
    
    let currentEnemySpeed = waveData.baseEnemySpeed;
    
    let enemiesToSpawn = waveData.count;
    let spawnCount = 0;

    const spawnInterval = setInterval(() => {
        if (isGameRunning && spawnCount < enemiesToSpawn) {
            const randomType = waveData.types[Math.floor(Math.random() * waveData.types.length)];
            spawnEnemy(randomType, currentEnemySpeed);
            spawnCount++;
        } else if (spawnCount >= enemiesToSpawn) {
            clearInterval(spawnInterval);
        }
    }, waveData.spawnDelay);
    console.log(`Wave ${currentWave} setup complete. Enemies to spawn: ${enemiesToSpawn}`);
}

// --- Card Selection (sem alterações) ---
const cards = [
    { name: 'Aura de Cura', description: 'Ganha +1 HP/seg.', effect: () => { playerMaxHp += 0; setInterval(() => { if (isGameRunning) playerHp = Math.min(playerMaxHp, playerHp + 1); updateHud(); }, 1000); } },
    { name: 'Regen de Mana Acelerado', description: '+0.15 Regen de Mana', effect: () => { playerMpRegenRate += 0.15; } },
    { name: 'Tiro Rápido', description: 'Cooldown de tiro -20%', effect: () => { shootCooldown *= 0.8; } },
    { name: 'Mago Robustez', description: '+30 Vida Máx.', effect: () => { playerMaxHp += 30; playerHp += 30; updateHud(); } },
    { name: 'Aceleração Arcana', description: '+1 Velocidade do Mago', effect: () => { playerSpeed += 1; } },
    { name: 'Projéteis Fortalecidos', description: 'Aumento de dano nos tiros.', effect: () => { /* Implementar dano em Projectile */ } },
    { name: 'Recuperação Instantânea', description: 'Restaura 50% de HP e MP.', effect: () => { playerHp = Math.min(playerMaxHp, playerHp + playerMaxHp * 0.5); playerMp = Math.min(playerMaxMp, playerMaxMp + playerMaxMp * 0.5); updateHud(); } },
    { name: 'Explosão Arcana', description: 'Habilidade ativa: detona inimigos próximos (custo de MP).', effect: () => {
        alert('Habilidade "Explosão Arcana" adquirida! (Lógica precisa ser implementada)');
    }},
];

function showCardSelection() {
    console.log('Showing card selection...');
    isGameRunning = false;
    cardSelectionDiv.style.display = 'flex';
    const availableCards = [];
    while (availableCards.length < 3) {
        const randomIndex = Math.floor(Math.random() * cards.length);
        if (!availableCards.includes(randomIndex)) {
            availableCards.push(randomIndex);
        }
    }

    cardButtons.forEach((button, index) => {
        const cardData = cards[availableCards[index]];
        button.innerHTML = `<strong>${cardData.name}</strong><br><span>${cardData.description}</span>`;
        button.onclick = () => selectCard(availableCards[index]);
    });
}

function selectCard(cardIndex) {
    console.log(`Card selected: ${cards[cardIndex].name}`);
    cards[cardIndex].effect();
    cardSelectionDiv.style.display = 'none';
    isGameRunning = true;
    startNextWave();
}

function startNextWave() {
    console.log('Starting next wave countdown...');
    setTimeout(startWave, 2000);
}

// --- Collision Detection (sem alterações na lógica, apenas o funcionamento via gameArea) ---
function checkCollisions() {
    if (!player || !player.parentElement) {
        console.warn("Player element not found or not in DOM during collision check.");
        return;
    }
    const playerRect = player.getBoundingClientRect();

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = enemyProjectiles[i];
        if (!projectile.element || !projectile.element.parentElement) continue;
        const projectileRect = projectile.element.getBoundingClientRect();

        if (rectIntersection(playerRect, projectileRect)) {
            projectile.element.remove();
            enemyProjectiles.splice(i, 1);
            playerHp -= 10;
            updateHud();
            if (playerHp <= 0) {
                gameOver();
                return;
            }
        }
    }

    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const projectile = playerProjectiles[i];
        if (!projectile.element || !projectile.element.parentElement) continue;
        const projectileRect = projectile.element.getBoundingClientRect();

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (!enemy.element || !enemy.element.parentElement) continue;
            const enemyRect = enemy.element.getBoundingClientRect();

            if (rectIntersection(projectileRect, enemyRect)) {
                projectile.element.remove();
                playerProjectiles.splice(i, 1);
                if (enemy.takeDamage(10)) {
                    score += 10;
                    updateHud();
                }
                break;
            }
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        const enemy1 = enemies[i];
        if (!enemy1.element || !enemy1.element.parentElement) continue;

        for (let j = i + 1; j < enemies.length; j++) {
            const enemy2 = enemies[j];
            if (!enemy2.element || !enemy2.element.parentElement) continue;
            
            const rect1 = enemy1.element.getBoundingClientRect();
            const rect2 = enemy2.element.getBoundingClientRect();

            if (rectIntersection(rect1, rect2)) {
                const dx = (rect1.left + rect1.width / 2) - (rect2.left + rect2.width / 2);
                if (dx > 0) {
                    enemy1.x += 1;
                    enemy2.x -= 1;
                } else {
                    enemy1.x -= 1;
                    enemy2.x += 1;
                }
            }
        }
    }

    const currentWaveData = wavesData[currentWave - 1];
    if (currentWaveData && enemies.length === 0 && isGameRunning) {
        console.log('Wave cleared!');
        if (currentWaveData.cards) {
            showCardSelection();
        } else {
            startNextWave();
        }
    }
}

function rectIntersection(rect1, rect2) {
    return rect1.left < rect2.right &&
           rect1.right > rect2.left &&
           rect1.top < rect2.bottom &&
           rect1.bottom > rect2.top;
}

// --- Game Over (sem alterações) ---
function gameOver() {
    console.log('Game Over!');
    isGameRunning = false;
    enemies.forEach(e => {
        if (e.shootInterval) clearInterval(e.shootInterval);
    });
    cancelAnimationFrame(gameLoopInterval);
    alert(`Game Over! Pontuação: ${score}, Wave: ${currentWave}`);
    if (currentWave > maxReachedWave) {
        maxReachedWave = currentWave;
        localStorage.setItem('maxWave', maxReachedWave);
    }
    showMenu();
}

// --- Update HUD (sem alterações) ---
function updateHud() {
    hudHp.textContent = `${Math.floor(playerHp)}/${playerMaxHp}`;
    hudMp.textContent = `${Math.floor(playerMp)}/${playerMaxMp}`;
    hudScore.textContent = score;
    hudLevel.textContent = playerLevel;
}

// --- Level Up (sem alterações) ---
function checkLevelUp() {
    const pointsForNextLevel = playerLevel * 100;
    if (score >= pointsForNextLevel) {
        playerLevel++;
        playerMaxHp += 20;
        playerHp = playerMaxHp;
        playerMaxMp += 10;
        playerMp = playerMaxMp;
        playerMpRegenRate += 0.02;
        playerSpeed += 0.2;
        updateHud();
        alert(`Level Up! Você alcançou o Nível ${playerLevel}!`);
    }
}

// --- Game Loop ---
function gameLoop() {
    console.log('--- Game Loop Iteration ---');
    console.log('isGameRunning:', isGameRunning);
    console.log('enemyProjectiles (start of loop):', enemyProjectiles); 

    if (!isGameRunning) {
        console.log('Game loop stopped because isGameRunning is false.');
        return;
    }

    movePlayer();
    const playerRectForEnemies = player && player.parentElement ? player.getBoundingClientRect() : null;
    if (playerRectForEnemies) {
        enemies.forEach(enemy => enemy.move(playerRectForEnemies));
    }
    movePlayerProjectiles();
    moveEnemyProjectiles();
    checkCollisions();
    checkLevelUp();

    playerMp = Math.min(playerMaxMp, playerMp + playerMpRegenRate);
    updateHud();

    enemies = enemies.filter(enemy => {
        const isValid = enemy.element && enemy.element.parentElement;
        if (!isValid && enemy.shootInterval) {
            clearInterval(enemy.shootInterval);
        }
        return isValid;
    });
    playerProjectiles = playerProjectiles.filter(p => p.element && p.element.parentElement);
    
    // O tratamento defensivo ainda é válido, mas o erro original deve ter sido resolvido pela definição de gameArea
    enemyProjectiles = (Array.isArray(enemyProjectiles) ? enemyProjectiles : [])
                       .filter(p => p.element && p.element.parentElement);
    console.log('enemyProjectiles (after filter):', enemyProjectiles);


    gameLoopInterval = requestAnimationFrame(gameLoop);
    console.log('--- End Game Loop Iteration ---');
}

// --- Event Listeners (gameArea agora está definida) ---
gameArea.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});

gameArea.addEventListener('click', createPlayerProjectile);

playButton.addEventListener('click', () => {
    startNewGame();
});

// --- Start New Game ---
function startNewGame() {
    console.log('startNewGame called');
    // Verificação de elementos DOM essenciais (gameArea agora é verificado corretamente)
    if (!menu || !gameArea || !player) {
        console.error('Um ou mais elementos DOM essenciais não foram encontrados!', { menu, gameArea, player });
        alert('Erro ao iniciar o jogo: Componentes essenciais não encontrados. Verifique o console para detalhes.');
        return;
    }

    menu.style.display = 'none';
    console.log('Menu hidden');
    gameArea.style.display = 'flex'; // *** gameContainer mudou para gameArea ***
    console.log('Game container shown');

    isGameRunning = true;
    playerX = 100;
    playerY = 50;
    playerHp = 100;
    playerMaxHp = 100;
    playerMp = 50;
    playerMaxMp = 50;
    playerLevel = 1;
    playerMpRegenRate = 0.05;
    score = 0;
    currentWave = 0;
    playerSpeed = 5;
    shootCooldown = 600;
    waveDifficultyMultiplier = 1.1;

    try {
        // Limpa elementos de jogo anteriores usando gameArea
        gameArea.querySelectorAll('.enemy, .projectile, .ground-segment, .ground-texture, .castle-tower, .castle-wall, .castle-window, .moon, .cloud').forEach(el => el.remove());
        console.log('Previous game elements cleared from gameArea.');
    } catch (e) {
        console.error('Error clearing old game elements:', e);
    }
    enemies = [];
    playerProjectiles = [];
    enemyProjectiles = [];
    console.log('Arrays de inimigos e projéteis resetados.');

    let existingPlayerElement = document.getElementById('player');
    if (!existingPlayerElement) {
        player = document.createElement('div');
        player.id = 'player';
        gameArea.appendChild(player); // Adiciona player ao gameArea
        console.log('Player element was missing, created and appended.');
    } else {
        if (!gameArea.contains(existingPlayerElement)) {
            gameArea.appendChild(existingPlayerElement); // Re-adiciona player ao gameArea
            console.log('Existing player element re-appended to gameArea.');
        }
        player = existingPlayerElement;
    }
    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;
    console.log('Player positioned at starting point.');

    try {
        generateScenario();
        console.log('Scenario generated successfully.');
    } catch (e) {
        console.error('Error in generateScenario():', e);
        alert('Erro ao gerar o cenário. Verifique o console.');
        return;
    }

    updateHud();
    console.log('HUD updated.');
    startWave();
    console.log('Initial wave started.');
    
    if (gameLoopInterval) {
        cancelAnimationFrame(gameLoopInterval);
    }
    gameLoopInterval = requestAnimationFrame(gameLoop);
    console.log('Game loop initiated.');
}

// --- Show Menu (gameArea agora está definida) ---
function showMenu() {
    console.log('Showing menu...');
    if (menu) menu.style.display = 'flex';
    if (gameArea) gameArea.style.display = 'none'; // *** gameContainer mudou para gameArea ***
    if (maxWaveDisplay) maxWaveDisplay.textContent = localStorage.getItem('maxWave') || 0;
}

// --- Initialize ---
showMenu();
