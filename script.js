const menu = document.getElementById('menu');
const playButton = document.getElementById('play-button');
const gameContainer = document.getElementById('game-container');
let player = document.getElementById('player');

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
let playerY = 50; // Posição inicial no chão do cenário gerado
const playerWidth = 40;
const playerHeight = 60;
let playerSpeed = 5;

let isJumping = false;
let canJump = true; // Para evitar pulos múltiplos no ar
let jumpForce = 15; // Força inicial do pulo
let gravity = 0.8; // Gravidade
let velocityY = 0; // Velocidade vertical do player

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
let enemyProjectiles = [];
let keysPressed = {};
let mouseX = 0;
let mouseY = 0;
let canShoot = true;
let shootCooldown = 600; // ms
let waveDifficultyMultiplier = 1.1;
let maxReachedWave = 0;

let gameLoopInterval; // Para o requestAnimationFrame

// --- Platforms for Collision (APENAS A PLATAFORMA CENTRAL É UM COLISOR) ---
const platforms = [
    // Plataforma central como o ÚNICO colisor
    // { x: 260, y: 150, width: 280, height: 30 } // Antiga coordenada (bottom = 150)
    // Ajustando para que o player não caia para fora da tela caso não acerte a plataforma.
    // Vamos adicionar um "chão" invisível na base da gameArea para que o player sempre tenha onde pousar,
    // E garantir que a plataforma central ainda funcione como uma plataforma acima do "chão".
    { x: 0, y: 0, width: 800, height: 1 }, // Chão invisível na base (bottom = 0)
    { x: 260, y: 150, width: 280, height: 30 } // Plataforma central
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
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = speed;
        this.type = type;
        this.element = document.createElement('div');
        this.element.classList.add('enemy');
        this.element.classList.add(type);
        gameArea.appendChild(this.element);

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
                this.shootInterval = setInterval(() => this.shoot(), 2500 / waveDifficultyMultiplier);
                this.hp = 15;
                this.projectileSpeed = 6;
                break;
        }

        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        this.onGround = false;
        this.velocityY = 0;
    }

    getGroundY() {
        let groundY = 0; // Default para o chão mais baixo da gameArea (bottom = 0)

        for (const platform of platforms) {
            const enemyBottom = this.y + this.height; // Posição do bottom do inimigo (top-based + height)
            const platformTop = gameArea.offsetHeight - (platform.y + platform.height); // Topo da plataforma em relação ao TOP da gameArea

            // Verifica sobreposição horizontal e se o inimigo está caindo para a plataforma
            if (this.x + this.width > platform.x && this.x < platform.x + platform.width) {
                // Se o inimigo está caindo e vai pousar na plataforma
                if (enemyBottom <= platformTop + this.velocityY && (enemyBottom + this.velocityY) >= platformTop) {
                    groundY = Math.max(groundY, gameArea.offsetHeight - platformTop); // Retorna a coordenada 'bottom' da plataforma
                }
            }
        }
        return groundY; // Retorna o offset do bottom para o inimigo pousar
    }


    move(playerRect) {
        let targetX = playerRect.left + playerRect.width / 2;

        // Gravidade e Colisão com o chão
        this.velocityY += gravity;
        this.y += this.velocityY;

        let groundYBottom = this.getGroundY(); // Retorna o valor "bottom" para o inimigo

        // Converte o groundYBottom para a coordenada "top" para a comparação
        let groundYTopForEnemy = gameArea.offsetHeight - groundYBottom;

        if (this.y + this.height >= groundYTopForEnemy) {
            this.y = groundYTopForEnemy - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Movimento Horizontal (IA simples de cerco)
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

        this.x = Math.max(0, Math.min(this.x, gameArea.offsetWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, gameArea.offsetHeight - this.height));

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        if (this.type === 'sniper' && this.onGround && this.y < gameArea.offsetHeight * 0.7) {
            if (!this.shootInterval) {
                this.shootInterval = setInterval(() => this.shoot(), 2500 / waveDifficultyMultiplier);
            }
        } else if (this.type === 'sniper' && !this.onGround && this.shootInterval) {
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

            const angle = Math.atan2((playerY + playerHeight / 2) - startY, (playerX + playerWidth / 2) - startX);
            const vx = Math.cos(angle) * this.projectileSpeed;
            const vy = Math.sin(angle) * this.projectileSpeed;

            projectile.style.left = `${startX}px`;
            projectile.style.top = `${startY}px`;
            gameArea.appendChild(projectile);
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
        const startY = gameArea.offsetHeight - (playerY + playerHeight / 2 - 7.5);

        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;

        const angle = Math.atan2(mouseY - startY, mouseX - startX);
        const speed = 15;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        gameArea.appendChild(projectile);
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

        if (p.x < 0 || p.x > gameArea.offsetWidth || p.y < 0 || p.y > gameArea.offsetHeight) {
            p.element.remove();
            playerProjectiles.splice(i, 1);
        }
    }
}

function moveEnemyProjectiles() {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.element.style.left = `${p.x}px`;
        p.element.style.top = `${p.y}px`;

        if (p.x < 0 || p.x > gameArea.offsetWidth || p.y < 0 || p.y > gameArea.offsetHeight) {
            p.element.remove();
            enemyProjectiles.splice(i, 1);
        }
    }
}

// --- Player Movement ---
let currentGroundY = 0;

// Encontra o chão mais alto sob o player
function getPlayerGroundY() {
    let newGroundY = 0; // O ponto mais alto de "chão" (menor valor Y na tela, distância do bottom)

    for (const platform of platforms) {
        const playerBottom = playerY;
        const platformTop = platform.y + platform.height; // Topo da plataforma em relação ao bottom da gameArea

        // Verifica sobreposição horizontal
        if (playerX + playerWidth > platform.x && playerX < platform.x + platform.width) {
            // Se o player está caindo (velocityY negativo) e está acima ou vai pousar na plataforma
            if (velocityY <= 0 && playerBottom >= platformTop && (playerBottom + velocityY) <= platformTop) {
                newGroundY = Math.max(newGroundY, platformTop);
            }
        }
    }
    return newGroundY;
}


document.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
    if (e.code === 'Space' && canJump) {
        isJumping = true;
        canJump = false;
        velocityY = jumpForce;
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

    playerX = Math.max(0, Math.min(playerX, gameArea.offsetWidth - playerWidth));
    playerY = Math.max(0, Math.min(playerY, gameArea.offsetHeight - playerHeight));

    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;
}

// --- Scenario Generation ---
function generateScenario() {
    console.log('Generating scenario...');
    gameArea.querySelectorAll('.ground-segment, .ground-texture, .castle-tower, .castle-wall, .castle-window, .moon, .cloud').forEach(el => el.remove());

    const moon = document.createElement('div');
    moon.classList.add('moon');
    moon.style.top = '50px';
    moon.style.left = '450px';
    gameArea.appendChild(moon);

    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.classList.add('cloud');
        cloud.classList.add(Math.random() > 0.5 ? 'small' : 'medium');
        cloud.style.left = `${Math.random() * (gameArea.offsetWidth - 100)}px`;
        cloud.style.top = `${Math.random() * 150 + 20}px`;
        gameArea.appendChild(cloud);
    }

    // Chão principal (VISUAL APENAS, SEM COLISÃO NO ARRAY platforms)
    const mainGround = document.createElement('div');
    mainGround.classList.add('ground-segment');
    mainGround.style.width = `${gameArea.offsetWidth}px`;
    mainGround.style.height = `50px`;
    mainGround.style.left = `0px`;
    mainGround.style.bottom = `0px`;
    gameArea.appendChild(mainGround);

    const mainGroundTexture = document.createElement('div');
    mainGroundTexture.classList.add('ground-texture');
    mainGroundTexture.style.width = `${gameArea.offsetWidth}px`;
    mainGroundTexture.style.height = `30px`;
    mainGroundTexture.style.left = `0px`;
    mainGroundTexture.style.bottom = `0px`;
    gameArea.appendChild(mainGroundTexture);

    // Plataforma esquerda baixa (VISUAL APENAS)
    const platform1 = document.createElement('div');
    platform1.classList.add('ground-segment');
    platform1.style.width = `220px`;
    platform1.style.height = `30px`;
    platform1.style.left = `0px`;
    platform1.style.bottom = `110px`;
    gameArea.appendChild(platform1);

    // Plataforma central (VISUAL E COLISOR)
    const platform2 = document.createElement('div');
    platform2.classList.add('ground-segment');
    platform2.style.width = `280px`;
    platform2.style.height = `30px`;
    platform2.style.left = `260px`;
    platform2.style.bottom = `150px`;
    gameArea.appendChild(platform2);

    // Plataforma direita baixa (VISUAL APENAS)
    const platform3 = document.createElement('div');
    platform3.classList.add('ground-segment');
    platform3.style.width = `250px`;
    platform3.style.height = `30px`;
    platform3.style.left = `550px`;
    platform3.style.bottom = `100px`;
    gameArea.appendChild(platform3);

    // Torre menor (plataforma central alta - VISUAL APENAS)
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


    // Torre maior (direita - VISUAL APENAS)
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


    // Plataforma esquerda alta (VISUAL APENAS)
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
    const x = Math.random() * (gameArea.offsetWidth - 30);
    const enemy = new Enemy(x, -50, baseSpeed * waveDifficultyMultiplier, type);
    enemies.push(enemy);
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
    console.log(`Wave ${currentWave} setup complete.`);
}

// --- Card Selection ---
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

// --- Collision Detection ---
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

// --- Game Over ---
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

// --- Update HUD ---
function updateHud() {
    hudHp.textContent = `${Math.floor(playerHp)}/${playerMaxHp}`;
    hudMp.textContent = `${Math.floor(playerMp)}/${playerMaxMp}`;
    hudScore.textContent = score;
    hudLevel.textContent = playerLevel;
}

// --- Level Up ---
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
    if (!isGameRunning) {
        console.log('Game loop stopped.');
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

    enemies = enemies.filter(enemy => enemy.element && enemy.element.parentElement);
    playerProjectiles = playerProjectiles.filter(p => p.element && p.element.parentElement);
    enemyProjectiles = enemyProjectiles.filter(p => p.element && p.element.parentElement);

    gameLoopInterval = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
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
    if (!menu || !gameContainer || !gameArea || !player) {
        console.error('Um ou mais elementos DOM essenciais não foram encontrados!', { menu, gameContainer, gameArea, player });
        alert('Erro ao iniciar o jogo: Componentes essenciais não encontrados. Verifique o console para detalhes.');
        return;
    }

    menu.style.display = 'none';
    console.log('Menu hidden');
    gameContainer.style.display = 'flex';
    console.log('Game container shown');

    isGameRunning = true;
    playerX = 100;
    playerY = 50; // Ajustado para que o player comece no "chão invisível" se não tiver colisor abaixo
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
        gameArea.querySelectorAll('.enemy, .projectile, .ground-segment, .ground-texture, .castle-tower, .castle-wall, .castle-window, .moon, .cloud').forEach(el => el.remove());
        console.log('Previous game elements cleared from gameArea.');
    } catch (e) {
        console.error('Error clearing old game elements:', e);
    }
    enemies = [];
    playerProjectiles = [];
    enemyProjectiles = [];

    let existingPlayerElement = document.getElementById('player');
    if (!existingPlayerElement) {
        player = document.createElement('div');
        player.id = 'player';
        gameArea.appendChild(player);
        console.log('Player element was missing, created and appended.');
    } else {
        if (!gameArea.contains(existingPlayerElement)) {
            gameArea.appendChild(existingPlayerElement);
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

// --- Show Menu ---
function showMenu() {
    console.log('Showing menu...');
    if (menu) menu.style.display = 'flex';
    if (gameContainer) gameContainer.style.display = 'none';
    if (maxWaveDisplay) maxWaveDisplay.textContent = localStorage.getItem('maxWave') || 0;
}

// --- Initialize ---
showMenu();
