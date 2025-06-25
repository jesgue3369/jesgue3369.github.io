const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudHealthValue = document.getElementById('health-value');
const hudManaValue = document.getElementById('mana-value');
const hudSpellName = document.getElementById('spell-name');
const hudWaveValue = document.getElementById('wave-value');
const gameOverScreen = document.getElementById('game-over-screen');
const restartGameBtn = document.getElementById('restart-game');
const mainMenuScreen = document.getElementById('main-menu-screen');
const startGameBtn = document.getElementById('start-game-btn');
const gameContent = document.getElementById('game-content');
const abilityCardsScreen = document.getElementById('ability-cards-screen');
const abilityCardOptionsDiv = document.getElementById('ability-card-options');
const mobileControlsBar = document.getElementById('mobile-controls-bar');
const moveLeftBtn = document.getElementById('move-left-btn');
const moveRightBtn = document.getElementById('move-right-btn');
const castSpellBtn = document.getElementById('cast-spell-btn');
const prevSpellBtn = document.getElementById('prev-spell-btn');
const nextSpellBtn = document = document.getElementById('next-spell-btn');

// --- Configurações do Jogo ---
let GAME_WIDTH;
let GAME_HEIGHT;
const PLAYER_SIZE = 50;
const INITIAL_MONSTER_SIZE = 40;
const ACTUAL_PLAYER_SIZE = PLAYER_SIZE * 0.4;
const ACTUAL_MONSTER_BASE_SIZE = INITIAL_MONSTER_SIZE * 0.4;
const SPELL_SIZE = 20;
const PLAYER_SPEED = 5;
const PROJECTILE_BASE_SPEED = 7;
const INITIAL_MONSTER_SPEED = 1;
let CONTROLLER_BAR_HEIGHT = 120; // Será atualizado dinamicamente
const ASSET_PATHS = {
    player: './player.png',
    projectile_player: './assets/projectile_player.png',
    projectile_monster: './assets/projectile_monster.png',
    monster_basic: './assets/monster_basic.png',
    monster_tank: './assets/monster_tank.png',
    monster_shooter: './assets/monster_shooter.png',
    monster_fast: './assets/monster_fast.png',
    monster_healer: './assets/monster_healer.png',
    monster_exploder: './assets/monster_exploder.png',
    monster_ghost: './assets/monster_ghost.png',
    monster_giant_worm: './assets/monster_giant_worm.png',
    spell_fagulha: './assets/spell_fagulha.png',
    spell_bola_de_fogo: './assets/spell_bola_de_fogo.png',
    spell_estilhaco_de_gelo: './assets/spell_estilhaco_de_gelo.png',
    background: './assets/background.png'
};
let loadedAssets = {};
let player;
let monsters = [];
let spells = [];
let monsterProjectiles = [];
let poisonClouds = [];
let keys = {};
let isMovingLeft = false;
let isMovingRight = false;
let gameState = 'MENU';
let currentWave = 0;
let monstersInWave = 0;
let monstersKilledInWave = 0;
let lastMonsterSpawnTime = 0;
let monsterSpawnDelay = 1500;
let playerAnimationOffset = 0;
const ENTITY_ANIMATION_AMPLITUDE = 5;
const ENTITY_ANIMATION_SPEED = 5;

const spellsData = {
    'Fagulha': { damage: 10, cost: 5, color: 'yellow', cooldown: 100, sprite: 'spell_fagulha', description: "Pequena explosão de energia mágica." },
    'Bola de Fogo': { damage: 30, cost: 15, color: 'orange', cooldown: 500, sprite: 'spell_bola_de_fogo', description: "Lança uma bola de fogo poderosa." },
    'Estilhaço de Gelo': { damage: 25, cost: 12, color: 'lightblue', cooldown: 400, sprite: 'spell_estilhaco_de_gelo', description: "Atira um estilhaço que causa dano de gelo." },
    'Rajada Arcana': { damage: 15, cost: 8, color: 'purple', cooldown: 150, description: "Uma rápida rajada de energia arcana." },
    'Cura Menor': { heal: 30, cost: 20, color: 'lime', cooldown: 1000, type: 'heal', description: "Recupera uma pequena quantidade de vida." },
    'Escudo Arcano': { shieldAmount: 50, cost: 25, color: 'cyan', cooldown: 1500, type: 'shield', description: "Cria um escudo temporário." },
    // Reformulação do Relâmpago: Agora é um projétil que causa dano em cadeia
    'Relâmpago': { damage: 40, cost: 30, color: 'gold', cooldown: 800, type: 'chain_lightning_projectile', sprite: 'spell_fagulha', description: "Um projétil que causa dano em cadeia em até 5 inimigos." },
    'Névoa Venenosa': { damagePerTick: 5, tickInterval: 500, duration: 3000, radius: 80, cost: 25, color: 'darkgreen', cooldown: 1200, type: 'aoe_dot', description: "Cria uma nuvem venenosa que causa dano ao longo do tempo." },
    'Explosão Congelante': { damage: 35, slowFactor: 0.5, slowDuration: 2000, radius: 70, cost: 28, color: 'skyblue', cooldown: 1000, type: 'aoe_slow', description: "Explosão que causa dano e retarda inimigos." },
    'Drenar Vida': { damage: 20, lifeSteal: 0.5, cost: 18, color: 'darkred', cooldown: 600, type: 'lifesteal', description: "Drena vida dos inimigos para o jogador." },
    'Tempestade de Meteoros': { damage: 20, numProjectiles: 5, spread: 100, cost: 40, color: 'brown', cooldown: 2000, type: 'multishot', description: "Chuva de meteoros que atinge múltiplos inimigos." }
};
let spellLastCastTime = {};
for (const spellName in spellsData) {
    spellLastCastTime[spellName] = 0;
}

const monsterTypes = {
    'basic': {
        color: '#f00', initial: 'B', sizeMultiplier: 1, healthMultiplier: 1, speedMultiplier: 1, canShoot: true, projectileColor: 'red', projectileDamage: 10, shootInterval: 2500, projectileSpeed: PROJECTILE_BASE_SPEED, projectileSize: SPELL_SIZE / 2, xp: 10, contactDamage: 10, sprite: 'monster_basic', animationOffset: 0
    },
    'tank': {
        color: '#8B4513', initial: 'T', sizeMultiplier: 1.5, healthMultiplier: 3, speedMultiplier: 0.7, canShoot: true, projectileColor: '#A0522D', projectileDamage: 15, shootInterval: 3500, projectileSpeed: PROJECTILE_BASE_SPEED * 0.7, projectileSize: SPELL_SIZE * 0.8, xp: 30, contactDamage: 20, sprite: 'monster_tank', animationOffset: 0
    },
    'shooter': {
        color: '#6A5ACD', initial: 'S', sizeMultiplier: 1.1, healthMultiplier: 1.2, speedMultiplier: 0.9, canShoot: true, projectileColor: 'purple', projectileDamage: 12, shootInterval: 1800, projectileSpeed: PROJECTILE_BASE_SPEED * 1.2, projectileSize: SPELL_SIZE * 0.6, xp: 20, contactDamage: 0, sprite: 'monster_shooter', animationOffset: 0
    },
    'fast': {
        color: '#00FFFF', initial: 'F', sizeMultiplier: 0.8, healthMultiplier: 0.7, speedMultiplier: 1.5, canShoot: true, projectileColor: 'cyan', projectileDamage: 8, shootInterval: 2000, projectileSpeed: PROJECTILE_BASE_SPEED * 1.5, projectileSize: SPELL_SIZE * 0.4, xp: 15, contactDamage: 8, sprite: 'monster_fast', animationOffset: 0
    },
    'healer': {
        color: '#00FF00', initial: 'H', sizeMultiplier: 1.0, healthMultiplier: 1.5, speedMultiplier: 0.8, canShoot: false, xp: 25, contactDamage: 5, healAmount: 5, healRadius: 150, healInterval: 1500, lastHealTime: 0, type: 'healer', sprite: 'monster_healer', animationOffset: 0
    },
    'exploder': {
        color: '#FF4500', initial: 'E', sizeMultiplier: 1.2, healthMultiplier: 0.8, speedMultiplier: 1.0, canShoot: false, xp: 20, contactDamage: 30, explosionRadius: 80, type: 'exploder', sprite: 'monster_exploder', animationOffset: 0
    },
    'ghost': {
        color: 'rgba(255,255,255,0.4)', initial: 'G', sizeMultiplier: 0.9, healthMultiplier: 0.9, speedMultiplier: 1.2, canShoot: true, projectileColor: 'lightgray', projectileDamage: 10, shootInterval: 2800, projectileSpeed: PROJECTILE_BASE_SPEED * 1.1, projectileSize: SPELL_SIZE * 0.5, xp: 20, contactDamage: 12, evadeChance: 0.2, type: 'ghost', sprite: 'monster_ghost', animationOffset: 0
    },
    'giant_worm': {
        color: '#A52A2A', initial: 'W', sizeMultiplier: 2.0, healthMultiplier: 5.0, speedMultiplier: 0.5, canShoot: true, projectileColor: 'brown', projectileDamage: 25, shootInterval: 3000, projectileSpeed: PROJECTILE_BASE_SPEED * 0.6, projectileSize: SPELL_SIZE * 1.5, xp: 50, contactDamage: 40, type: 'giant_worm', sprite: 'monster_giant_worm', animationOffset: 0
    }
};

const ABILITY_CARDS = [
    { name: "Aumento de Vida Máxima", description: "+25 Vida Máxima", apply: () => { player.maxHealth += 25; player.health += 25; } },
    { name: "Aumento de Mana Máxima", description: "+20 Mana Máxima", apply: () => { player.maxMana += 20; player.mana += 20; } },
    { name: "Regeneração de Mana Aprimorada", description: "+0.05 Mana/Tick", apply: () => { player.manaRegenRate += 0.05; } },
    { name: "Poder Mágico Aumentado", description: "+0.1 Poder Mágico", apply: () => { player.spellPower += 0.1; } },
    { name: "Redução de Recarga", description: "-5% Recarga de Magias", apply: () => { player.cooldownReduction = Math.min(0.5, player.cooldownReduction + 0.05); } },
    { name: "Chance Crítica", description: "+5% Chance Crítica", apply: () => { player.criticalChance = Math.min(0.5, player.criticalChance + 0.05); } },
    { name: "Velocidade de Movimento", description: "+1 Velocidade de Movimento", apply: () => { player.movementSpeedBonus += 1; } },
    { name: "Fagulha Aprimorada", description: "Aumento de dano da Fagulha", apply: () => { spellsData['Fagulha'].damage += 5; } },
    { name: "Bola de Fogo Aprimorada", description: "Aumento de dano da Bola de Fogo", apply: () => { spellsData['Bola de Fogo'].damage += 10; } },
    { name: "Estilhaço de Gelo Aprimorado", description: "Aumento de dano do Estilhaço de Gelo", apply: () => { spellsData['Estilhaço de Gelo'].damage += 8; } },
    // Magias que podem ser adquiridas via carta
    { name: "Nova Magia: Rajada Arcana", description: "Aprende Rajada Arcana", apply: () => { if (!player.activeSpells.includes('Rajada Arcana')) player.activeSpells.push('Rajada Arcana'); } },
    { name: "Nova Magia: Cura Menor", description: "Aprende Cura Menor", apply: () => { if (!player.activeSpells.includes('Cura Menor')) player.activeSpells.push('Cura Menor'); } },
    { name: "Nova Magia: Escudo Arcano", description: "Aprende Escudo Arcano", apply: () => { if (!player.activeSpells.includes('Escudo Arcano')) player.activeSpells.push('Escudo Arcano'); } },
    { name: "Nova Magia: Relâmpago", description: "Aprende Relâmpago", apply: () => { if (!player.activeSpells.includes('Relâmpago')) player.activeSpells.push('Relâmpago'); } },
    { name: "Nova Magia: Névoa Venenosa", description: "Aprende Névoa Venenosa", apply: () => { if (!player.activeSpells.includes('Névoa Venenosa')) player.activeSpells.push('Névoa Venenosa'); } },
    { name: "Nova Magia: Explosão Congelante", description: "Aprende Explosão Congelante", apply: () => { if (!player.activeSpells.includes('Explosão Congelante')) player.activeSpells.push('Explosão Congelante'); } },
    { name: "Nova Magia: Drenar Vida", description: "Aprende Drenar Vida", apply: () => { if (!player.activeSpells.includes('Drenar Vida')) player.activeSpells.push('Drenar Vida'); } },
    { name: "Nova Magia: Tempestade de Meteoros", description: "Aprende Tempestade de Meteoros", apply: () => { if (!player.activeSpells.includes('Tempestade de Meteoros')) player.activeSpells.push('Tempestade de Meteoros'); } }
];

function loadAssets() {
    return new Promise(resolve => {
        let loadedCount = 0;
        const totalAssets = Object.keys(ASSET_PATHS).length;
        for (let key in ASSET_PATHS) {
            const img = new Image();
            img.src = ASSET_PATHS[key];
            img.onload = () => {
                loadedAssets[key] = img;
                loadedCount++;
                console.log(`Asset carregado: ${key} (${loadedCount}/${totalAssets})`);
                if (loadedCount === totalAssets) {
                    console.log("Todos os assets carregados!");
                    resolve();
                }
            };
            img.onerror = () => {
                console.error(`Falha ao carregar imagem: ${ASSET_PATHS[key]}`);
                // Ainda incrementa o contador mesmo em caso de erro para não travar o carregamento total
                loadedCount++;
                if (loadedCount === totalAssets) {
                    console.log("Todos os assets carregados (com erros ou não)!");
                    resolve();
                }
            };
        }
    });
}

// --- Redimensionamento do Canvas ---
function resizeCanvas() {
    // Garante que o player existe antes de tentar acessar suas propriedades
    if (!player) {
        // Inicializa uma versão básica do player para que o resize possa calcular a posição
        player = {
            x: 0, y: 0, size: ACTUAL_PLAYER_SIZE
        };
    }

    CONTROLLER_BAR_HEIGHT = mobileControlsBar.offsetHeight;
    canvas.width = gameContent.clientWidth;
    canvas.height = gameContent.clientHeight;
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;
    player.x = GAME_WIDTH / 2 - player.size / 2;
    player.y = GAME_HEIGHT - player.size - CONTROLLER_BAR_HEIGHT;
    console.log(`Canvas resized to: ${GAME_WIDTH}x${GAME_HEIGHT}. Controls height: ${CONTROLLER_BAR_HEIGHT}`);
}
window.addEventListener('resize', resizeCanvas);

// --- Funções de Exibição de Telas ---
function showScreen(screenElement) {
    const allScreens = document.querySelectorAll('.game-screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    screenElement.classList.add('active');
}

// --- Funções de Desenho ---
function drawBackground() {
    if (loadedAssets.background && loadedAssets.background.complete) {
        ctx.drawImage(loadedAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}

function drawPlayer() {
    const playerYAdjusted = player.y + playerAnimationOffset;
    if (loadedAssets.player && loadedAssets.player.complete) {
        ctx.drawImage(loadedAssets.player, player.x, playerYAdjusted, player.size, player.size);
    } else {
        ctx.fillStyle = '#00f';
        ctx.fillRect(player.x, playerYAdjusted, player.size, player.size);
        ctx.fillStyle = 'white';
        ctx.font = `${player.size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', player.x + player.size / 2, playerYAdjusted + player.size / 2);
    }
    if (player.shield > 0) {
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.size / 2, playerYAdjusted + player.size / 2, player.size / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawMonsters() {
    monsters.forEach(monster => {
        const monsterYAdjusted = monster.y + monster.animationOffset;
        const monsterSprite = loadedAssets[monster.sprite];
        if (monsterSprite && monsterSprite.complete) {
            ctx.drawImage(monsterSprite, monster.x, monsterYAdjusted, monster.size, monster.size);
        } else {
            ctx.fillStyle = monster.color;
            ctx.beginPath();
            ctx.arc(monster.x + monster.size / 2, monsterYAdjusted + monster.size / 2, monster.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = `${monster.size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(monster.initial, monster.x + monster.size / 2, monsterYAdjusted + monster.size / 2);
        }
        const healthBarWidth = monster.size * 0.8;
        const healthBarHeight = 5;
        const healthRatio = monster.health / monster.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(monster.x + monster.size * 0.1, monsterYAdjusted - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(monster.x + monster.size * 0.1, monsterYAdjusted - 10, healthBarWidth * healthRatio, healthBarHeight);
    });
}

function drawSpells() {
    spells.forEach(spell => {
        const spellSprite = loadedAssets[spell.sprite];
        // O tipo 'aoe_lightning' foi removido e substituído por 'chain_lightning_projectile'
        // A lógica de desenho anterior para 'aoe_lightning' não é mais necessária aqui.
        if (spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
             ctx.fillStyle = spell.color.replace(')', ', 0.4)');
             ctx.beginPath();
             ctx.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2);
             ctx.fill();
        }
        else { // Isso lida com projéteis regulares e o novo 'chain_lightning_projectile'
            if (spellSprite && spellSprite.complete) {
                ctx.drawImage(spellSprite, spell.x - SPELL_SIZE / 2, spell.y - SPELL_SIZE / 2, SPELL_SIZE, SPELL_SIZE);
            } else {
                ctx.fillStyle = spell.color;
                ctx.beginPath();
                ctx.arc(spell.x, spell.y, SPELL_SIZE / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

function drawMonsterProjectiles() {
    monsterProjectiles.forEach(projectile => {
        const projectileSprite = loadedAssets.projectile_monster;
        if (projectileSprite && projectileSprite.complete) {
            ctx.drawImage(projectileSprite, projectile.x - projectile.size / 2, projectile.y - projectile.size / 2, projectile.size, projectile.size);
        } else {
            ctx.fillStyle = projectile.color;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawPoisonClouds() {
    poisonClouds.forEach(cloud => {
        if (cloud.duration > 0) {
            ctx.fillStyle = `rgba(128, 0, 128, ${cloud.duration / spellsData['Névoa Venenosa'].duration * 0.4})`;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function updateHUD() {
    hudHealthValue.textContent = `${player.health}/${player.maxHealth}${player.shield > 0 ? ` (+${player.shield})` : ''}`;
    hudManaValue.textContent = `${player.mana.toFixed(0)}/${player.maxMana.toFixed(0)}`;
    hudSpellName.textContent = player.activeSpells[player.currentSpellIndex];
    hudWaveValue.textContent = currentWave;
}

// --- Lógica do Jogo ---
function movePlayer() {
    const currentSpeed = PLAYER_SPEED + player.movementSpeedBonus;
    // Adicionado controles 'A' e 'D'
    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && player.x > 0) {
        player.x -= currentSpeed;
    }
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && player.x < GAME_WIDTH - player.size) {
        player.x += currentSpeed;
    }
    // Mantido para compatibilidade com controles mobile/touch
    if (isMovingLeft && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (isMovingRight && player.x < GAME_WIDTH - player.size) {
        player.x += currentSpeed;
    }
}

let monstersToSpawnInCurrentWave = 0; // Esta variável não está sendo usada, pode ser removida se não houver planos para ela.
let spawnedMonstersCount = 0;

function spawnMonster() {
    if (spawnedMonstersCount >= monstersInWave) {
        return;
    }
    const now = Date.now();
    if (now - lastMonsterSpawnTime > monsterSpawnDelay) {
        const x = Math.random() * (GAME_WIDTH - ACTUAL_MONSTER_BASE_SIZE);
        let monsterTypeKeys = Object.keys(monsterTypes);
        let availableTypes = monsterTypeKeys.filter(type =>
            currentWave >= 1 || (type !== 'healer' && type !== 'exploder' && type !== 'ghost' && type !== 'giant_worm')
        );
        let monsterTypeKey;
        const rand = Math.random();
        if (currentWave >= 4 && rand < 0.1) {
            monsterTypeKey = 'giant_worm';
        } else if (currentWave >= 3 && rand < 0.2) {
            monsterTypeKey = 'ghost';
        } else if (currentWave >= 2.5 && rand < 0.3) {
            monsterTypeKey = 'exploder';
        } else if (currentWave >= 2 && rand < 0.4) {
            monsterTypeKey = 'healer';
        } else if (rand < 0.5 + (currentWave * 0.05)) {
            const basicTypes = ['basic', 'shooter', 'tank', 'fast'];
            monsterTypeKey = basicTypes[Math.floor(Math.random() * basicTypes.length)];
        } else {
            monsterTypeKey = 'basic';
        }
        if (!availableTypes.includes(monsterTypeKey)) {
            monsterTypeKey = 'basic';
        }
        const typeData = monsterTypes[monsterTypeKey];
        const monsterSize = ACTUAL_MONSTER_BASE_SIZE * typeData.sizeMultiplier * (1 + currentWave * 0.02);
        const monsterHealth = 20 * (1 + currentWave * 0.2) * typeData.healthMultiplier;
        const monsterSpeed = INITIAL_MONSTER_SPEED * (1 + (currentWave - 1) * 0.05) * typeData.speedMultiplier;
        monsters.push({
            x: x,
            y: -monsterSize,
            health: monsterHealth,
            maxHealth: monsterHealth,
            speed: monsterSpeed,
            type: monsterTypeKey,
            color: typeData.color,
            initial: typeData.initial,
            size: monsterSize,
            canShoot: typeData.canShoot,
            projectileColor: typeData.projectileColor,
            projectileDamage: typeData.projectileDamage,
            shootInterval: typeData.shootInterval,
            lastShotTime: typeData.lastShotTime || 0,
            xpValue: typeData.xp + (currentWave * 2),
            contactDamage: typeData.contactDamage * (1 + currentWave * 0.05),
            healAmount: typeData.healAmount || 0,
            healRadius: typeData.healRadius || 0,
            healInterval: typeData.healInterval || 0,
            lastHealTime: typeData.lastHealTime || 0,
            explosionRadius: typeData.explosionRadius || 0,
            evadeChance: typeData.evadeChance || 0,
            isSlowed: false,
            slowTimer: 0,
            sprite: typeData.sprite, // Garante que o sprite está sendo definido
            projectileSpeed: typeData.projectileSpeed,
            projectileSize: typeData.projectileSize,
            targetY: GAME_HEIGHT * 0.3 + (Math.random() * GAME_HEIGHT * 0.2),
            animationOffset: 0,
            animationStartTime: now
        });
        lastMonsterSpawnTime = now;
        spawnedMonstersCount++;
    }
}

function moveMonsters() {
    const now = Date.now();
    for (let i = monsters.length - 1; i >= 0; i--) {
        let monster = monsters[i];
        let currentMonsterSpeed = monster.speed;
        if (monster.isSlowed && now < monster.slowTimer) {
            currentMonsterSpeed *= spellsData['Explosão Congelante'].slowFactor;
        }
        monster.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin((now - monster.animationStartTime) * ENTITY_ANIMATION_SPEED * 0.001);
        let nextX = monster.x;
        let nextY = monster.y;
        if (monster.y < monster.targetY) {
            nextY += currentMonsterSpeed;
        } else {
            const monsterCenterX = monster.x + monster.size / 2;
            const playerCenterX = player.x + player.size / 2;
            if (monsterCenterX < playerCenterX) {
                nextX += currentMonsterSpeed;
            } else if (monsterCenterX > playerCenterX) {
                nextX -= currentMonsterSpeed;
            }
        }
        let collisionDetected = false;
        const tempRect = { x: nextX, y: nextY, width: monster.size, height: monster.size };
        for (let j = 0; j < monsters.length; j++) {
            if (j === i) continue;
            const other = monsters[j];
            const otherRect = { x: other.x, y: other.y, width: other.size, height: other.size };
            if (tempRect.x < otherRect.x + otherRect.width &&
                tempRect.x + tempRect.width > otherRect.x &&
                tempRect.y < otherRect.y + otherRect.height &&
                tempRect.y + tempRect.height > otherRect.y) {
                collisionDetected = true;
                const dx = tempRect.x - otherRect.x;
                const dy = tempRect.y - otherRect.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    nextX += (dx / dist) * 0.5;
                    nextY += (dy / dist) * 0.5;
                }
                break;
            }
        }
        monster.x = nextX;
        monster.y = nextY;

        if (monster.canShoot && now - monster.lastShotTime > monster.shootInterval && monster.y > 0 && monster.y < GAME_HEIGHT * 0.7) {
            const monsterCenterX = monster.x + monster.size / 2;
            const monsterCenterY = monster.y + monster.size / 2;
            const playerCenterX = player.x + player.size / 2;
            const playerCenterY = player.y + player.size / 2;
            const dx = playerCenterX - monsterCenterX;
            const dy = playerCenterY - monsterCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const vx = (dx / distance) * monster.projectileSpeed;
            const vy = (dy / distance) * monster.projectileSpeed;
            monsterProjectiles.push({
                x: monsterCenterX,
                y: monsterCenterY,
                vx: vx,
                vy: vy,
                damage: monster.projectileDamage,
                color: monster.projectileColor,
                size: monster.projectileSize
            });
            monster.lastShotTime = now;
        }

        if (monster.type === 'healer' && now - monster.lastHealTime > monster.healInterval) {
            monsters.forEach(otherMonster => {
                const dist = Math.sqrt(Math.pow(monster.x - otherMonster.x, 2) + Math.pow(monster.y - otherMonster.y, 2));
                if (dist < monster.healRadius && otherMonster.health < otherMonster.maxHealth) {
                    otherMonster.health = Math.min(otherMonster.maxHealth, otherMonster.health + monster.healAmount);
                }
            });
            monster.lastHealTime = now;
        }

        if (checkCollision(player, monster)) {
            if (monster.contactDamage > 0) {
                applyDamageToPlayer(monster.contactDamage);
            }
            if (monster.type === 'exploder') {
                handleExploderExplosion(monster);
                monsters.splice(i, 1);
                continue;
            }
        }
        if (monster.health <= 0) {
            if (monster.type === 'exploder') {
                handleExploderExplosion(monster);
            }
            monstersKilledInWave++;
            monsters.splice(i, 1);
        }
    }
}

function moveSpells() {
    const now = Date.now();
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];
        // AOE spells (dot/slow) are duration-based, not projectile movement
        if (spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
            if (now - spell.castTime > spell.duration) {
                spells.splice(i, 1);
            }
            continue; // Skip movement logic for these types
        }
        // All other spells are projectiles that move
        spell.x += spell.vx;
        spell.y += spell.vy;
        if (spell.y < 0 || spell.y > GAME_HEIGHT || spell.x < 0 || spell.x > GAME_WIDTH) {
            spells.splice(i, 1);
        }
    }
}

function moveMonsterProjectiles() {
    for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = monsterProjectiles[i];
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        if (checkCollision(player, projectile)) {
            applyDamageToPlayer(projectile.damage);
            monsterProjectiles.splice(i, 1);
            continue;
        }
        if (projectile.y > GAME_HEIGHT || projectile.y < 0 || projectile.x < 0 || projectile.x > GAME_WIDTH) {
            monsterProjectiles.splice(i, 1);
        }
    }
}

function updatePoisonClouds() {
    const now = Date.now();
    for (let i = poisonClouds.length - 1; i >= 0; i--) {
        let cloud = poisonClouds[i];
        if (now - cloud.lastTickTime > spellsData['Névoa Venenosa'].tickInterval) {
            monsters.forEach(monster => {
                const dist = Math.sqrt(Math.pow(cloud.x - (monster.x + monster.size / 2), 2) + Math.pow(cloud.y - (monster.y + monster.size / 2), 2));
                if (dist < cloud.radius) {
                    monster.health -= spellsData['Névoa Venenosa'].damagePerTick * player.spellPower;
                }
            });
            cloud.lastTickTime = now;
        }
        cloud.duration -= (now - cloud.lastUpdateTime);
        cloud.lastUpdateTime = now;

        if (cloud.duration <= 0) {
            poisonClouds.splice(i, 1);
        }
    }
}

function handleCollisions() {
    const CHAIN_RADIUS = 150; // Raio para o raio em cadeia pular para o próximo alvo
    const MAX_CHAIN_TARGETS = 5; // Número total de alvos para o raio em cadeia (incluindo o inicial)

    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];

        // Se a magia é do tipo AOE (ponto de dano ou lentidão), ela não colide como um projétil,
        // seus efeitos são tratados por duração ou ticks.
        if (spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
             continue; // Pula para a próxima magia, pois não é um projétil colidível aqui.
        }

        // Lidar com colisão para magias baseadas em projéteis (incluindo o novo Relâmpago em cadeia)
        for (let j = monsters.length - 1; j >= 0; j--) {
            let monster = monsters[j];
            if (checkCollision(spell, monster)) {
                // Verificação de evasão de fantasma para qualquer projétil
                if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
                    spells.splice(i, 1); // Projétil evadido é consumido
                    break; // Sai do loop interno e vai para a próxima magia
                }

                let finalDamage = spell.damage * player.spellPower;
                if (Math.random() < player.criticalChance) {
                    finalDamage *= 1.5;
                }

                if (spell.type === 'chain_lightning_projectile') {
                    // Lógica do Relâmpago em cadeia
                    monster.health -= finalDamage; // Primeiro acerto
                    let hitMonsters = new Set(); // Para rastrear monstros já atingidos na cadeia
                    hitMonsters.add(monster);
                    let lastHitMonster = monster; // O último monstro atingido para calcular o próximo salto

                    for (let k = 1; k < MAX_CHAIN_TARGETS; k++) { // Começa de 1 porque o primeiro alvo já foi atingido
                        let closestUnhitMonster = null;
                        let minDistance = Infinity;

                        monsters.forEach(potentialTarget => {
                            // Certifica-se de que o monstro não foi atingido nesta cadeia e não é o monstro atual
                            if (!hitMonsters.has(potentialTarget)) {
                                const dist = Math.sqrt(
                                    Math.pow((lastHitMonster.x + lastHitMonster.size/2) - (potentialTarget.x + potentialTarget.size/2), 2) +
                                    Math.pow((lastHitMonster.y + lastHitMonster.size/2) - (potentialTarget.y + potentialTarget.size/2), 2)
                                );
                                if (dist < minDistance && dist < CHAIN_RADIUS) {
                                    minDistance = dist;
                                    closestUnhitMonster = potentialTarget;
                                }
                            }
                        });

                        if (closestUnhitMonster) {
                            closestUnhitMonster.health -= finalDamage; // Causa dano ao monstro encadeado
                            hitMonsters.add(closestUnhitMonster);
                            lastHitMonster = closestUnhitMonster; // Atualiza o último monstro atingido para o próximo salto
                        } else {
                            break; // Não há mais monstros dentro do alcance para encadear
                        }
                    }
                    spells.splice(i, 1); // Remove o projétil Relâmpago em cadeia após ele ativar a cadeia
                    break; // Sai do loop interno (monstros) e vai para a próxima magia principal
                } else if (spell.type === 'lifesteal') {
                    monster.health -= finalDamage;
                    player.health = Math.min(player.maxHealth, player.health + (finalDamage * spellsData['Drenar Vida'].lifeSteal));
                    spells.splice(i, 1);
                    break; // Sai do loop interno e vai para a próxima magia
                } else { // Todos os outros projéteis regulares (Fagulha, Bola de Fogo, Estilhaço de Gelo, Rajada Arcana, Tempestade de Meteoros)
                    monster.health -= finalDamage;
                    spells.splice(i, 1); // Remove o projétil após colisão
                    break; // Sai do loop interno e vai para a próxima magia
                }
            }
        }
    }
}

function checkCollision(rect1, rect2) {
    const r1x = rect1.x;
    const r1y = rect1.y;
    const r1w = rect1.size || SPELL_SIZE;
    const r1h = rect1.size || SPELL_SIZE;
    const r2x = rect2.x;
    const r2y = rect2.y;
    const r2w = rect2.size || INITIAL_MONSTER_SIZE;
    const r2h = rect2.size || INITIAL_MONSTER_SIZE;
    return r1x < r2x + r2w &&
           r1x + r1w > r2x &&
           r1y < r2y + r2h &&
           r1y + r1h > r2y;
}

function castSpell() {
    const activeSpellName = player.activeSpells[player.currentSpellIndex];
    const spellData = spellsData[activeSpellName];
    const now = Date.now();
    if (player.mana >= spellData.cost && (now - spellLastCastTime[activeSpellName] > spellData.cooldown * (1 - player.cooldownReduction))) {
        player.mana -= spellData.cost;
        spellLastCastTime[activeSpellName] = now;
        const playerCenterX = player.x + player.size / 2;
        const playerCenterY = player.y + player.size / 2;

        // A lógica de encontrar o monstro mais próximo foi mantida para outras funcionalidades,
        // mas não é mais usada para determinar a direção de projéteis padrão do jogador.
        let targetMonster = null;
        let minDistance = Infinity;
        monsters.forEach(monster => {
            const dist = Math.sqrt(Math.pow(playerCenterX - (monster.x + monster.size / 2), 2) + Math.pow(playerCenterY - (monster.y + monster.size / 2), 2));
            if (dist < minDistance) {
                minDistance = dist;
                targetMonster = monster;
            }
        });

        if (spellData.type === 'heal') {
            player.health = Math.min(player.maxHealth, player.health + spellData.heal);
        } else if (spellData.type === 'shield') {
            player.shield += spellData.shieldAmount;
        } else if (spellData.type === 'aoe_dot') {
            poisonClouds.push({
                x: playerCenterX,
                y: playerCenterY,
                radius: spellData.radius,
                duration: spellData.duration,
                lastTickTime: now,
                lastUpdateTime: now
            });
        } else if (spellData.type === 'aoe_slow') {
            spells.push({
                x: playerCenterX,
                y: playerCenterY,
                radius: spellData.radius,
                color: spellData.color,
                damage: spellData.damage,
                type: 'aoe_slow',
                castTime: now,
                duration: 200
            });
        } else if (spellData.type === 'multishot') {
            for (let i = 0; i < spellData.numProjectiles; i++) {
                const spawnX = player.x + (Math.random() - 0.5) * spellData.spread;
                const spawnY = -50 - (Math.random() * 100);
                const targetX = player.x + player.size / 2 + (Math.random() - 0.5) * player.size;
                const targetY = GAME_HEIGHT;
                const dx = targetX - spawnX;
                const dy = targetY - spawnY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const vx = (dx / distance) * PROJECTILE_BASE_SPEED;
                const vy = (dy / distance) * PROJECTILE_BASE_SPEED;
                spells.push({
                    x: spawnX,
                    y: spawnY,
                    vx: vx,
                    vy: vy,
                    damage: spellData.damage,
                    color: spellData.color,
                    sprite: spellData.sprite || 'projectile_player',
                    type: spellData.type
                });
            }
        }
        // Nova lógica para o Relâmpago (chain_lightning_projectile)
        else if (spellData.type === 'chain_lightning_projectile') {
            const vx = 0; // Projétil atira reto para cima no eixo X
            const vy = -PROJECTILE_BASE_SPEED; // Projétil atira reto para cima no eixo Y

            spells.push({
                x: playerCenterX,
                y: playerCenterY,
                vx: vx,
                vy: vy,
                damage: spellData.damage,
                color: spellData.color,
                sprite: spellData.sprite,
                type: spellData.type
            });
        }
        // Este 'else' cobre todas as outras magias de projéteis padrão (Fagulha, Bola de Fogo, Estilhaço de Gelo, Rajada Arcana, Drenar Vida)
        else {
            const vx = 0; // Não se move horizontalmente
            const vy = -PROJECTILE_BASE_SPEED; // Move para cima na velocidade base

            spells.push({
                x: playerCenterX,
                y: playerCenterY,
                vx: vx,
                vy: vy,
                damage: spellData.damage,
                color: spellData.color,
                sprite: spellData.sprite || 'projectile_player',
                type: spellData.type
            });
        }
    }
}

function applyDamageToPlayer(damage) {
    if (player.shield > 0) {
        player.shield -= damage;
        if (player.shield < 0) {
            player.health += player.shield;
            player.shield = 0;
        }
    } else {
        player.health -= damage;
    }
    if (player.health <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState = 'GAME_OVER';
    showScreen(gameOverScreen);
}

function resetGame() {
    player = {
        x: GAME_WIDTH / 2 - PLAYER_SIZE / 2,
        y: GAME_HEIGHT - PLAYER_SIZE - CONTROLLER_BAR_HEIGHT,
        size: ACTUAL_PLAYER_SIZE,
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        manaRegenRate: 0.1,
        activeSpells: ['Fagulha', 'Bola de Fogo', 'Estilhaço de Gelo'],
        currentSpellIndex: 0,
        spellPower: 1.0,
        cooldownReduction: 0.0,
        criticalChance: 0.05,
        movementSpeedBonus: 0,
        shield: 0
    };
    monsters = [];
    spells = [];
    monsterProjectiles = [];
    poisonClouds = [];
    keys = {};
    isMovingLeft = false;
    isMovingRight = false;
    currentWave = 0;
    monstersInWave = 0;
    monstersKilledInWave = 0;
    lastMonsterSpawnTime = 0;
    for (const spellName in spellsData) {
        spellLastCastTime[spellName] = 0;
    }
    updateHUD();
}

function startNewWave() {
    currentWave++;
    monstersInWave = 5 + (currentWave - 1) * 2;
    spawnedMonstersCount = 0;
    monstersKilledInWave = 0;
    monsterSpawnDelay = Math.max(500, 1500 - currentWave * 50);
    gameState = 'PLAYING';
    showScreen(gameContent);
}

function pauseGameForAbilityChoice() {
    gameState = 'CHOOSING_ABILITY';
    showScreen(abilityCardsScreen);
    displayAbilityCards();
}

function displayAbilityCards() {
    abilityCardOptionsDiv.innerHTML = '';
    const chosenCards = [];
    const availableAbilities = [...ABILITY_CARDS];

    // Filter out spells already known
    const filteredAbilities = availableAbilities.filter(ability =>
        !ability.name.startsWith("Nova Magia:") || !player.activeSpells.includes(ability.name.replace("Nova Magia: ", ""))
    );
    
    // Ensure the player has at least 3 distinct options if possible
    let optionsToChooseFrom = [];
    // Adiciona algumas opções fixas para garantir que as melhorias básicas sempre apareçam
    const basicUpgrades = [
        "Aumento de Vida Máxima",
        "Aumento de Mana Máxima",
        "Regeneração de Mana Aprimorada",
        "Poder Mágico Aumentado",
        "Redução de Recarga",
        "Velocidade de Movimento"
    ];

    // Prioriza 1 ou 2 upgrades básicos se não houver magias novas suficientes
    for (let i = 0; i < basicUpgrades.length && optionsToChooseFrom.length < 2; i++) {
        const upgrade = filteredAbilities.find(a => a.name === basicUpgrades[i]);
        if (upgrade && !optionsToChooseFrom.includes(upgrade)) {
            optionsToChooseFrom.push(upgrade);
            filteredAbilities.splice(filteredAbilities.indexOf(upgrade), 1); // Remove para não duplicar
        }
    }

    while (optionsToChooseFrom.length < 3 && filteredAbilities.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredAbilities.length);
        const ability = filteredAbilities.splice(randomIndex, 1)[0];
        optionsToChooseFrom.push(ability);
    }
    // Caso ainda não haja 3 opções, preencher com o que sobrou, garantindo não mais de 3
    while (optionsToChooseFrom.length < 3 && availableAbilities.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAbilities.length);
        const ability = availableAbilities.splice(randomIndex, 1)[0];
        if (!optionsToChooseFrom.includes(ability)) {
            optionsToChooseFrom.push(ability);
        }
    }


    optionsToChooseFrom.forEach(ability => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('ability-card');
        cardElement.innerHTML = `<h3>${ability.name}</h3><p>${ability.description}</p>`;
        cardElement.onclick = () => {
            ability.apply();
            startNewWave();
        };
        abilityCardOptionsDiv.appendChild(cardElement);
    });
}

function handleExploderExplosion(exploder) {
    monsters.forEach(monster => {
        const dist = Math.sqrt(Math.pow((exploder.x + exploder.size / 2) - (monster.x + monster.size / 2), 2) +
                               Math.pow((exploder.y + exploder.size / 2) - (monster.y + monster.size / 2), 2));
        if (dist < exploder.explosionRadius) {
            monster.health -= exploder.contactDamage * 2;
        }
    });
    const distToPlayer = Math.sqrt(Math.pow((exploder.x + exploder.size / 2) - (player.x + player.size / 2), 2) +
                                   Math.pow((exploder.y + exploder.size / 2) - (player.y + player.size / 2), 2));
    if (distToPlayer < exploder.explosionRadius + player.size / 2) {
        applyDamageToPlayer(exploder.contactDamage * 1.5);
    }
}

// --- Game Loop ---
let lastFrameTime = 0;
let animationFrameId; // Variável para armazenar o ID do requestAnimationFrame

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    playerAnimationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(currentTime * ENTITY_ANIMATION_SPEED * 0.001);

    // Sempre limpa o canvas e desenha o background primeiro
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawBackground();

    if (gameState === 'PLAYING') {
        movePlayer();
        spawnMonster();
        moveMonsters();
        moveSpells();
        moveMonsterProjectiles();
        updatePoisonClouds();
        handleCollisions();
        player.mana = Math.min(player.maxMana, player.mana + player.manaRegenRate);
        updateHUD();

        // Desenha os elementos do jogo apenas quando está "PLAYING"
        drawPlayer();
        drawMonsters();
        drawSpells();
        drawMonsterProjectiles();
        drawPoisonClouds();


        if (monstersKilledInWave >= monstersInWave && monsters.length === 0) {
            gameState = 'WAVE_COMPLETE'; // Define o estado para 'WAVE_COMPLETE'
            pauseGameForAbilityChoice(); // Mostra as cartas de habilidade
        }
    } else {
        // Quando não está 'PLAYING' (menu, game over, escolhendo habilidade),
        // desenhamos o estado atual do jogo (player e monstros) sem atualizá-los,
        // para que a tela de sobreposição tenha um fundo visual.
        drawPlayer();
        drawMonsters();
        drawSpells(); // Mantenha as magias visíveis se foram lançadas
        drawMonsterProjectiles(); // Mantenha projéteis visíveis
        drawPoisonClouds(); // Mantenha as nuvens de veneno visíveis
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

loadAssets().then(() => {
    console.log("Todos os assets carregados! Exibindo menu inicial...");
    resizeCanvas(); // Ajusta o canvas e inicializa o player para o tamanho correto
    resetGame(); // Reseta o jogo para o estado inicial
    showScreen(mainMenuScreen); // Mostra o menu principal
    animationFrameId = requestAnimationFrame(gameLoop); // Inicia o loop do jogo
}).catch(error => {
    console.error("Erro ao carregar assets:", error);
    document.getElementById('game-container').innerHTML = '<p style="color: red;">Erro ao carregar os recursos do jogo. Por favor, tente novamente.</p>';
});

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Adicionado controle de disparo pela tecla de Espaço
    if (e.key === ' ' || e.key === 'Spacebar') { // 'Spacebar' é para navegadores mais antigos
        e.preventDefault(); // Previne o comportamento padrão da barra de espaço (ex: rolar a página)
        castSpell();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startGameBtn.addEventListener('click', () => {
    resetGame();
    startNewWave();
});

restartGameBtn.addEventListener('click', () => {
    resetGame();
    startNewWave();
});

castSpellBtn.addEventListener('click', castSpell);

nextSpellBtn.addEventListener('click', () => {
    player.currentSpellIndex = (player.currentSpellIndex + 1) % player.activeSpells.length;
    updateHUD();
});

prevSpellBtn.addEventListener('click', () => {
    player.currentSpellIndex = (player.currentSpellIndex - 1 + player.activeSpells.length) % player.activeSpells.length;
    updateHUD();
});

// Mobile Controls
moveLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isMovingLeft = true; }, { passive: false });
moveLeftBtn.addEventListener('touchend', () => { isMovingLeft = false; });
moveLeftBtn.addEventListener('touchcancel', () => { isMovingLeft = false; }); // Adicionado para robustez

moveRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isMovingRight = true; }, { passive: false });
moveRightBtn.addEventListener('touchend', () => { isMovingRight = false; });
moveRightBtn.addEventListener('touchcancel', () => { isMovingRight = false; }); // Adicionado para robustez
