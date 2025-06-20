const menu = document.getElementById('menu');
const playButton = document.getElementById('play-button');
const gameContainer = document.getElementById('game-container');
const gameArea = document.getElementById('game-area');
let player = document.getElementById('player'); // Pode ser recriado

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
let playerMpRegenRate = 0.05; // Ajustado para ser mais lento inicialmente
let score = 0;
let currentWave = 0;
let enemies = [];
let playerProjectiles = [];
let enemyProjectiles = [];
let keysPressed = {};
let mouseX = 0;
let mouseY = 0;
let canShoot = true;
let shootCooldown = 600; // ms (aumentado para balancear)
let waveDifficultyMultiplier = 1.1; // Aumenta a dificuldade por wave
let maxReachedWave = 0;

let gameLoopInterval; // Para o requestAnimationFrame

// --- Platforms for Collision (Baseado no cenário gerado por CSS) ---
// Coordenadas ajustadas para o cenário gerado
const platforms = [
    // Chão principal
    { x: 0, y: 0, width: 800, height: 50 },
    // Plataformas elevadas (ajuste conforme o design do cenário)
    { x: 0, y: 110, width: 220, height: 30 }, // Plataforma esquerda baixa
    { x: 260, y: 150, width: 280, height: 30 }, // Plataforma central
    { x: 550, y: 100, width: 250, height: 30 }, // Plataforma direita baixa
    { x: 300, y: 220, width: 100, height: 30 }, // Plataforma central alta (torre menor)
    { x: 600, y: 200, width: 150, height: 30 }, // Plataforma direita média
    { x: 0, y: 220, width: 100, height: 30 } // Plataforma esquerda alta
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
    // Adicione mais waves aqui para aumentar a dificuldade
];

// --- Enemy Classes ---
class Enemy {
    constructor(x, y, speed, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = speed; // Velocidade vertical de queda
        this.type = type;
        this.element = document.createElement('div');
        this.element.classList.add('enemy');
        this.element.classList.add(type);
        gameArea.appendChild(this.element);

        this.horizontalSpeed = 0.5; // Velocidade horizontal da IA
        this.shootInterval = null;
        this.canShoot = false;
        this.projectileSpeed = 4;
        this.hp = 10; // Vida básica do inimigo

        // Propriedades específicas de cada tipo
        switch (type) {
            case 'giant':
                this.width = 60;
                this.height = 60;
                this.speed *= 0.6; // Gigante mais lento
                this.hp = 30;
                break;
            case 'fast':
                this.width = 25;
                this.height = 25;
                this.speed *= 1.5; // Rápido
                this.horizontalSpeed *= 1.5;
                break;
            case 'sniper':
                this.canShoot = true;
                this.shootInterval = setInterval(() => this.shoot(), 2500 / waveDifficultyMultiplier); // Atira mais rápido com dificuldade
                this.hp = 15;
                this.projectileSpeed = 6; // Projétil mais rápido
                break;
        }

        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        this.onGround = false; // Flag para colisão com o chão
        this.velocityY = 0; // Para gravidade do inimigo
    }

    // Calcula a posição do "chão" para o inimigo
    getGroundY() {
        let groundY = gameArea.offsetHeight; // Default para o chão da tela (bottom = 0)
        // Converte as coordenadas do inimigo para "top" para facilitar a comparação com as plataformas
        const enemyTopY = this.y;
        const enemyBottomY = this.y + this.height;

        for (const platform of platforms) {
            // Converte as coordenadas da plataforma para "top"
            const platformTopY = gameArea.offsetHeight - (platform.y + platform.height);
            const platformBottomY = gameArea.offsetHeight - platform.y;

            // Verifica sobreposição horizontal e se o inimigo está caindo para a plataforma
            if (this.x + this.width > platform.x && this.x < platform.x + platform.width) {
                // Se o inimigo está caindo e vai pousar na plataforma
                if (enemyBottomY <= platformTopY && (enemyBottomY + this.velocityY) >= platformTopY) {
                    groundY = Math.min(groundY, platformTopY); // Define o novo chão como a parte de cima da plataforma
                }
            }
        }
        return groundY; // Retorna o valor de "top" onde o inimigo deve pousar
    }


    move(playerRect) {
        let targetX = playerRect.left + playerRect.width / 2;
        let targetY = playerRect.top + playerRect.height / 2;

        // Gravidade e Colisão com o chão
        this.velocityY += gravity; // Aplica gravidade
        this.y += this.velocityY;

        let groundY = this.getGroundY(); // Obtém a altura do chão para o inimigo
        if (this.y + this.height >= groundY) { // Se o inimigo atingiu ou passou do chão
            this.y = groundY - this.height; // Cola no chão
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Movimento Horizontal (IA simples de cerco)
        if (this.onGround) {
            if (this.x < targetX - this.width / 2 - 50) { // Tenta ficar um pouco à esquerda do player
                this.x += this.horizontalSpeed;
            } else if (this.x > targetX - this.width / 2 + 50) { // Tenta ficar um pouco à direita
                this.x -= this.horizontalSpeed;
            }
            // Se estiver na mesma linha, pode tentar se mover um pouco para os lados
            else {
                if (Math.random() < 0.01) { // Pequena chance de mudar de direção
                    this.horizontalSpeed *= -1;
                }
                this.x += this.horizontalSpeed * 0.5; // Movimento mais lento quando "cercando"
            }
        }

        // Limita o inimigo dentro da área de jogo
        this.x = Math.max(0, Math.min(this.x, gameArea.offsetWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, gameArea.offsetHeight - this.height)); // Previne que suba demais

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`; // Ajuste: top para posicionamento

        // Snipers atiram apenas se estiverem no chão e visíveis
        if (this.type === 'sniper' && this.onGround && this.y < gameArea.offsetHeight * 0.7) { // Só atira se não estiver muito baixo
            if (!this.shootInterval) { // Garante que o intervalo só é criado uma vez
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

            // Calcula a direção para o player
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
            return true; // Retorna true se o inimigo foi destruído
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
        const startX = playerX + playerWidth / 2 - 7.5; // Ajuste para centralizar o projétil do player
        const startY = gameArea.offsetHeight - (playerY + playerHeight / 2 - 7.5); // Converte playerY para top

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
        p.x += p.vx; // Inimigos Snipers atiram em linha reta, não apenas para baixo
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
let currentGroundY = 0; // A altura do chão atual do player (distância do bottom)

// Encontra o chão mais alto sob o player
function getPlayerGroundY() {
    let newGroundY = 0; // O ponto mais alto de "chão" (menor valor Y na tela, distância do bottom)

    for (const platform of platforms) {
        // Converte as coordenadas do player e plataforma para "bottom"
        const playerBottom = playerY;
        const platformTop = platform.y + platform.height; // Topo da plataforma em relação ao bottom da gameArea

        // Verifica sobreposição horizontal
        if (playerX + playerWidth > platform.x && playerX < platform.x + platform.width) {
            // Se o player está caindo e vai pousar na plataforma
            if (playerBottom >= platformTop && (playerBottom + velocityY) <= platformTop) {
                newGroundY = Math.max(newGroundY, platformTop);
            }
        }
    }
    return newGroundY; // Retorna o offset do bottom
}


document.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
    if (e.code === 'Space' && canJump) {
        isJumping = true;
        canJump = false; // Impede pulos múltiplos
        velocityY = jumpForce; // Velocidade positiva para subir (Y é do bottom)
    }
});

document.addEventListener('keyup', (e) => {
    delete keysPressed[e.code];
});

function movePlayer() {
    // Movimento horizontal
    if (keysPressed['KeyA']) {
        playerX -= playerSpeed;
    }
    if (keysPressed['KeyD']) {
        playerX += playerSpeed;
    }

    // Aplica gravidade ao player
    velocityY -= gravity; // Subtrai porque Y positivo é para cima (bottom)
    playerY += velocityY;

    // Calcula o chão atual para o player
    currentGroundY = getPlayerGroundY();

    if (playerY <= currentGroundY) { // Se o player está abaixo ou no nível do chão
        playerY = currentGroundY;
        velocityY = 0;
        isJumping = false;
        canJump = true; // Pode pular novamente
    }

    // Limites da área de jogo
    playerX = Math.max(0, Math.min(playerX, gameArea.offsetWidth - playerWidth));
    playerY = Math.max(0, Math.min(playerY, gameArea.offsetHeight - playerHeight));

    // Atualiza a posição CSS do player
    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;
}

// --- Scenario Generation ---
function generateScenario() {
    // Limpa o cenário anterior, exceto o player
    gameArea.querySelectorAll('.ground-segment, .ground-texture, .castle-tower, .castle-wall, .castle-window, .moon, .cloud').forEach(el => el.remove());

    // Lua
    const moon = document.createElement('div');
    moon.classList.add('moon');
    gameArea.appendChild(moon);

    // Nuvens (posições e tamanhos aleatórios)
    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.classList.add('cloud');
        cloud.classList.add(Math.random() > 0.5 ? 'small' : 'medium');
        cloud.style.left = `${Math.random() * (gameArea.offsetWidth - 100)}px`;
        cloud.style.top = `${Math.random() * 150 + 20}px`;
        gameArea.appendChild(cloud);
    }

    // Chão principal
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

    // Plataformas e torres (baseado na imagem original)
    // Plataforma esquerda baixa
    const platform1 = document.createElement('div');
    platform1.classList.add('ground-segment');
    platform1.style.width = `220px`;
    platform1.style.height = `30px`;
    platform1.style.left = `0px`;
    platform1.style.bottom = `110px`;
    gameArea.appendChild(platform1);

    // Plataforma central
    const platform2 = document.createElement('div');
    platform2.classList.add('ground-segment');
    platform2.style.width = `280px`;
    platform2.style.height = `30px`;
    platform2.style.left = `260px`;
    platform2.style.bottom = `150px`;
    gameArea.appendChild(platform2);

    // Plataforma direita baixa
    const platform3 = document.createElement('div');
    platform3.classList.add('ground-segment');
    platform3.style.width = `250px`;
    platform3.style.height = `30px`;
    platform3.style.left = `550px`;
    platform3.style.bottom = `100px`;
    gameArea.appendChild(platform3);

    // Torre menor (plataforma central alta)
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
    // Janelas da torre 1
    let window1_1 = document.createElement('div'); window1_1.classList.add('castle-window'); window1_1.style.left = '340px'; window1_1.style.bottom = '240px'; gameArea.appendChild(window1_1);
    let window1_2 = document.createElement('div'); window1_2.classList.add('castle-window'); window1_2.style.left = '360px'; window1_2.style.bottom = '240px'; gameArea.appendChild(window1_2);


    // Torre maior (direita)
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
    // Janelas da torre 2
    let window2_1 = document.createElement('div'); window2_1.classList.add('castle-window'); window2_1.style.left = '650px'; window2_1.style.bottom = '230px'; gameArea.appendChild(window2_1);
    let window2_2 = document.createElement('div'); window2_2.classList.add('castle-window'); window2_2.style.left = '670px'; window2_2.style.bottom = '230px'; gameArea.appendChild(window2_2);


    // Plataforma esquerda alta
    const platform4 = document.createElement('div');
    platform4.classList.add('ground-segment');
    platform4.style.width = `100px`;
    platform4.style.height = `30px`;
    platform4.style.left = `0px`;
    platform4.style.bottom = `220px`;
    gameArea.appendChild(platform4);
}


// --- Enemy Spawning ---
function spawnEnemy(type, baseSpeed) {
    // Spawna inimigos aleatoriamente no topo
    const x = Math.random() * (gameArea.offsetWidth - 30);
    // Inimigos começam acima da tela e caem
    const enemy = new Enemy(x, -50, baseSpeed * waveDifficultyMultiplier, type);
    enemies.push(enemy);
}

function startWave() {
    currentWave++;
    if (currentWave > wavesData.length) {
        isGameRunning = false;
        alert('Parabéns! Você venceu todas as ondas disponíveis!');
        showMenu();
        return;
    }

    const waveData = wavesData[currentWave - 1];
    
    // Atualiza a dificuldade para esta wave
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
            // A transição para a próxima wave (ou cartas) acontece em checkCollisions
        }
    }, waveData.spawnDelay);
}

// --- Card Selection ---
const cards = [
    { name: 'Aura de Cura', description: 'Ganha +1 HP/seg.', effect: () => { playerMaxHp += 0; setInterval(() => { if (isGameRunning) playerHp = Math.min(playerMaxHp, playerHp + 1); updateHud(); }, 1000); } },
    { name: 'Regen de Mana Acelerado', description: '+0.15 Regen de Mana', effect: () => { playerMpRegenRate += 0.15; } },
    { name: 'Tiro Rápido', description: 'Cooldown de tiro -20%', effect: () => { shootCooldown *= 0.8; } },
    { name: 'Mago Robustez', description: '+30 Vida Máx.', effect: () => { playerMaxHp += 30; playerHp += 30; updateHud(); } },
    { name: 'Aceleração Arcana', description: '+1 Velocidade do Mago', effect: () => { playerSpeed += 1; } },
    { name: 'Projéteis Fortalecidos', description: 'Aumento de dano nos tiros.', effect: () => { /* Implementar dano em Projectile */ } },
    { name: 'Recuperação Instantânea', description: 'Restaura 50% de HP e MP.', effect: () => { playerHp = Math.min(playerMaxHp, playerHp + playerMaxHp * 0.5); playerMp = Math.min(playerMaxMp, playerMp + playerMaxMp * 0.5); updateHud(); } },
    { name: 'Explosão Arcana', description: 'Habilidade ativa: detona inimigos próximos (custo de MP).', effect: () => {
        // Exemplo: Adicionar botão ou atalho para ativar esta habilidade
        alert('Habilidade "Explosão Arcana" adquirida! (Lógica precisa ser implementada)');
        // Você precisaria de um sistema de habilidades ativas
    }},
    // Adicione mais cartas para diversificar
];

function showCardSelection() {
    isGameRunning = false; // Pausa o jogo
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
    cards[cardIndex].effect(); // Aplica o efeito da carta
    cardSelectionDiv.style.display = 'none';
    isGameRunning = true; // Retoma o jogo
    startNextWave();
}

function startNextWave() {
    setTimeout(startWave, 2000); // Pequena pausa antes da próxima wave
}

// --- Collision Detection ---
function checkCollisions() {
    const playerRect = player.getBoundingClientRect(); // Obtém a bounding box do player

    // Player vs Enemy Projectiles
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = enemyProjectiles[i];
        const projectileRect = projectile.element.getBoundingClientRect();

        if (rectIntersection(playerRect, projectileRect)) {
            projectile.element.remove();
            enemyProjectiles.splice(i, 1);
            playerHp -= 10; // Dano do projétil inimigo
            updateHud();
            if (playerHp <= 0) {
                gameOver();
                return;
            }
        }
    }

    // Player Projectiles vs Enemies
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const projectile = playerProjectiles[i];
        const projectileRect = projectile.element.getBoundingClientRect();

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyRect = enemy.element.getBoundingClientRect();

            if (rectIntersection(projectileRect, enemyRect)) {
                projectile.element.remove();
                playerProjectiles.splice(i, 1);
                // Inimigo toma dano
                if (enemy.takeDamage(10)) { // Player projectile damage
                    score += 10;
                    updateHud();
                }
                break; // Tiro acertou, não precisa verificar outros inimigos para este tiro
            }
        }
    }

    // Enemy vs Enemy (Prevenção de sobreposição simples)
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            const enemy1 = enemies[i];
            const enemy2 = enemies[j];
            const rect1 = enemy1.element.getBoundingClientRect();
            const rect2 = enemy2.element.getBoundingClientRect();

            if (rectIntersection(rect1, rect2)) {
                // Se sobrepõem, afaste-os um pouco
                const dx = (rect1.left + rect1.width / 2) - (rect2.left + rect2.width / 2);
                if (dx > 0) { // Enemy1 está à direita de Enemy2
                    enemy1.x += 1;
                    enemy2.x -= 1;
                } else {
                    enemy1.x -= 1;
                    enemy2.x += 1;
                }
            }
        }
    }

    // Verificar se a wave foi limpa
    // Apenas se nenhum inimigo foi spawnado na wave atual e todos os inimigos existentes foram eliminados
    const currentWaveData = wavesData[currentWave - 1];
    if (currentWaveData && enemies.length === 0 && isGameRunning) {
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
    isGameRunning = false;
    // Limpa todos os intervalos de tiro dos inimigos
    enemies.forEach(e => {
        if (e.shootInterval) clearInterval(e.shootInterval);
    });
    cancelAnimationFrame(gameLoopInterval); // Para o loop do jogo (usando requestAnimationFrame)
    alert(`Game Over! Pontuação: ${score}, Wave: ${currentWave}`);
    if (currentWave > maxReachedWave) {
        maxReachedWave = currentWave;
        localStorage.setItem('maxWave', maxReachedWave); // Salva a wave máxima
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
    // Exemplo de progressão: a cada 100 pontos, um nível
    const pointsForNextLevel = playerLevel * 100;
    if (score >= pointsForNextLevel) {
        playerLevel++;
        playerMaxHp += 20; // Aumenta HP máximo
        playerHp = playerMaxHp; // Restaura HP para o novo máximo
        playerMaxMp += 10; // Aumenta MP máximo
        playerMp = playerMaxMp; // Restaura MP para o novo máximo
        playerMpRegenRate += 0.02; // Pequeno aumento na regen
        playerSpeed += 0.2; // Pequeno aumento de velocidade
        updateHud();
        alert(`Level Up! Você alcançou o Nível ${playerLevel}!`);
    }
}

// --- Game Loop ---
function gameLoop() {
    if (!isGameRunning) return;

    movePlayer();
    const playerRectForEnemies = player.getBoundingClientRect(); // Posição atual do player
    enemies.forEach(enemy => enemy.move(playerRectForEnemies)); // Inimigos precisam da posição do player
    movePlayerProjectiles();
    moveEnemyProjectiles();
    checkCollisions();
    checkLevelUp();

    // Regeneração de MP
    playerMp = Math.min(playerMaxMp, playerMp + playerMpRegenRate);
    updateHud();

    // Remove inimigos que morreram ou saíram da tela
    enemies = enemies.filter(enemy => enemy.element && enemy.element.parentElement);
    playerProjectiles = playerProjectiles.filter(p => p.element && p.element.parentElement);
    enemyProjectiles = enemyProjectectiles.filter(p => p.element && p.element.parentElement);

    gameLoopInterval = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
gameArea.addEventListener('mousemove', (e) => {
    // As coordenadas do mouse são relativas à gameArea
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});

gameArea.addEventListener('click', createPlayerProjectile);

playButton.addEventListener('click', () => {
    startNewGame();
});

// --- Start New Game ---
function startNewGame() {
    menu.style.display = 'none';
    gameContainer.style.display = 'flex'; // Usar flex para centralizar game-area

    // Resetar estado do jogo
    isGameRunning = true;
    playerX = 100;
    playerY = 50; // Posição inicial no chão
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

    // Remover todos os elementos anteriores (inimigos, projéteis, cenário)
    gameArea.querySelectorAll('.enemy, .projectile, .ground-segment, .ground-texture, .castle-tower, .castle-wall, .castle-window, .moon, .cloud').forEach(el => el.remove());
    enemies = [];
    playerProjectiles = [];
    enemyProjectiles = [];

    // Recria o elemento do player se necessário (se ele foi removido em gameOver)
    if (!document.getElementById('player')) {
        player = document.createElement('div');
        player.id = 'player';
        gameArea.appendChild(player);
    }
    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`; // Inicia no chão

    generateScenario(); // Gera o cenário programaticamente

    updateHud();
    startWave();
    gameLoopInterval = requestAnimationFrame(gameLoop); // Inicia o loop do jogo
}

// --- Show Menu ---
function showMenu() {
    menu.style.display = 'flex';
    gameContainer.style.display = 'none';
    maxWaveDisplay.textContent = localStorage.getItem('maxWave') || 0; // Carrega a wave máxima salva
}

// --- Initialize ---
showMenu(); // Mostra o menu ao carregar a página
