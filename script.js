const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudHealthValue = document.getElementById('health-value');
const hudManaValue = document.getElementById('mana-value');
const hudLevelValue = document.getElementById('level-value');
const hudXpValue = document.getElementById('xp-value');
const hudSpellName = document.getElementById('spell-name');
const hudWaveValue = document.getElementById('wave-value'); // New HUD element
const gameOverScreen = document.getElementById('game-over-screen');
const restartGameBtn = document.getElementById('restart-game');
const mainMenuScreen = document.getElementById('main-menu-screen');
const startGameBtn = document.getElementById('start-game-btn');
const gameContent = document.getElementById('game-content');
const abilityCardsScreen = document.getElementById('ability-cards-screen'); // New screen element
const abilityCardOptionsDiv = document.getElementById('ability-card-options'); // Container for cards
const mobileControlsBar = document.getElementById('mobile-controls-bar');
const moveLeftBtn = document.getElementById('move-left-btn');
const moveRightBtn = document.getElementById('move-right-btn');
const castSpellBtn = document.getElementById('cast-spell-btn');
const prevSpellBtn = document.getElementById('prev-spell-btn');
const nextSpellBtn = document.getElementById('next-spell-btn');

// --- Configurações do Jogo ---
let GAME_WIDTH;
let GAME_HEIGHT;
const PLAYER_SIZE = 50;
const INITIAL_MONSTER_SIZE = 40;
const ACTUAL_PLAYER_SIZE = PLAYER_SIZE * 0.4;
const ACTUAL_MONSTER_BASE_SIZE = INITIAL_MONSTER_SIZE * 0.4;
const SPELL_SIZE = 20;
const PLAYER_SPEED = 5;
const PROJECTILE_BASE_SPEED = 7; // Base speed for projectiles
const INITIAL_MONSTER_SPEED = 1;
const XP_PER_MONSTER = 10;
const LEVEL_UP_XP_BASE = 100;
const LEVEL_UP_XP_MULTIPLIER = 1.2;
let CONTROLLER_BAR_HEIGHT = 120; // Default, will be updated in resizeCanvas
const ASSET_PATHS = {
    player: './assets/player.png',
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
let gameState = 'MENU'; // Possible states: 'MENU', 'PLAYING', 'WAVE_COMPLETE', 'CHOOSING_ABILITY', 'GAME_OVER'
let currentWave = 0;
let monstersInWave = 0;
let monstersKilledInWave = 0;
let lastMonsterSpawnTime = 0;
let monsterSpawnDelay = 1500; // Time between monster spawns within a wave
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
    'Relâmpago': { damage: 40, cost: 30, color: 'gold', cooldown: 800, type: 'aoe_lightning', radius: 100, description: "Um raio atinge inimigos próximos ao jogador." },
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
    // Novas magias (exemplo, você deve adicionar os sprites e descrições no spellsData)
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
    const gameContainer = document.getElementById('game-container');
    
    CONTROLLER_BAR_HEIGHT = mobileControlsBar.offsetHeight;
    canvas.width = gameContent.clientWidth;
    canvas.height = gameContent.clientHeight;
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;
    if (player) {
        player.x = GAME_WIDTH / 2 - player.size / 2;
        player.y = GAME_HEIGHT - player.size - 20;
    }
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

// --- Funções de Desenho (mantidas as mesmas do último código) ---
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
        if (spell.type === 'aoe_lightning') {
            ctx.strokeStyle = spell.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(spell.x, 0);
            ctx.lineTo(spell.x, spell.y);
            ctx.stroke();
            ctx.fillStyle = spell.color;
            ctx.beginPath();
            ctx.arc(spell.x, spell.y, spell.radius / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
             ctx.fillStyle = spell.color.replace(')', ', 0.4)');
             ctx.beginPath();
             ctx.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2);
             ctx.fill();
        }
        else {
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
        const projectileSprite = loadedAssets.projectile_monster; // Assuming a generic monster projectile sprite
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
    hudLevelValue.textContent = player.level;
    hudXpValue.textContent = `${player.xp}/${player.xpToNextLevel}`;
    hudSpellName.textContent = player.activeSpells[player.currentSpellIndex];
    hudWaveValue.textContent = currentWave;
}

// --- Lógica do Jogo ---
function movePlayer() {
    const currentSpeed = PLAYER_SPEED + player.movementSpeedBonus;
    if ((keys['ArrowLeft'] || keys['a']) && player.x > 0) { // Check for 'a'
        player.x -= currentSpeed;
    }
    if ((keys['ArrowRight'] || keys['d']) && player.x < GAME_WIDTH - player.size) { // Check for 'd'
        player.x += currentSpeed;
    }
    // Mobile controls (already present)
    if (isMovingLeft && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (isMovingRight && player.x < GAME_WIDTH - player.size) {
        player.x += currentSpeed;
    }
}

// Gerenciamento de spawns dentro de uma wave
let monstersToSpawnInCurrentWave = 0;
let spawnedMonstersCount = 0;

function spawnMonster() {
    if (spawnedMonstersCount >= monstersInWave) {
        return; // All monsters for this wave have been queued
    }
    const now = Date.now();
    if (now - lastMonsterSpawnTime > monsterSpawnDelay) {
        const x = Math.random() * (GAME_WIDTH - ACTUAL_MONSTER_BASE_SIZE);
        let monsterTypeKeys = Object.keys(monsterTypes);
        // Ensure healing and exploding monsters appear only at higher waves
        let availableTypes = monsterTypeKeys.filter(type =>
            currentWave >= 1 || (type !== 'healer' && type !== 'exploder' && type !== 'ghost' && type !== 'giant_worm')
        );
        let monsterTypeKey;
        const rand = Math.random();
        // Adjust monster type probabilities based on wave
        if (currentWave >= 4 && rand < 0.1) {
            monsterTypeKey = 'giant_worm';
        } else if (currentWave >= 3 && rand < 0.2) {
            monsterTypeKey = 'ghost';
        } else if (currentWave >= 2.5 && rand < 0.3) {
            monsterTypeKey = 'exploder';
        } else if (currentWave >= 2 && rand < 0.4) {
            monsterTypeKey = 'healer';
        } else if (rand < 0.5 + (currentWave * 0.05)) { // Increase chance for varied basic types
            const basicTypes = ['basic', 'shooter', 'tank', 'fast'];
            monsterTypeKey = basicTypes[Math.floor(Math.random() * basicTypes.length)];
        } else {
            monsterTypeKey = 'basic';
        }
        // Fallback if selected type isn't available for current wave
        if (!availableTypes.includes(monsterTypeKey)) {
            monsterTypeKey = 'basic';
        }
        const typeData = monsterTypes[monsterTypeKey];
        const monsterSize = ACTUAL_MONSTER_BASE_SIZE * typeData.sizeMultiplier * (1 + currentWave * 0.02); // Monsters grow slightly
        const monsterHealth = 20 * (1 + currentWave * 0.2) * typeData.healthMultiplier; // Health scales with wave
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
            xpValue: typeData.xp + (currentWave * 2), // XP scales with wave
            contactDamage: typeData.contactDamage * (1 + currentWave * 0.05),
            healAmount: typeData.healAmount || 0,
            healRadius: typeData.healRadius || 0,
            healInterval: typeData.healInterval || 0,
            lastHealTime: typeData.lastHealTime || 0,
            explosionRadius: typeData.explosionRadius || 0,
            evadeChance: typeData.evadeChance || 0,
            isSlowed: false,
            slowTimer: 0,
            sprite: typeData.sprite,
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
    for (let i = monsters.length - 1; i >= 0; i--) { // Loop backwards for safe removal
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
                // Basic repulsion: push monster slightly away from the other
                const dx = tempRect.x - otherRect.x;
                const dy = tempRect.y - otherRect.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    nextX += (dx / dist) * 0.5; // Small push
                    nextY += (dy / dist) * 0.5;
                }
                break;
            }
        }

        monster.x = nextX; // Always update position to avoid freezing
        monster.y = nextY;

        // Monster Shooting Logic
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

        // Healer monster logic
        if (monster.type === 'healer' && now - monster.lastHealTime > monster.healInterval) {
            monsters.forEach(otherMonster => {
                const dist = Math.sqrt(Math.pow(monster.x - otherMonster.x, 2) + Math.pow(monster.y - otherMonster.y, 2));
                if (dist < monster.healRadius && otherMonster.health < otherMonster.maxHealth) {
                    otherMonster.health = Math.min(otherMonster.maxHealth, otherMonster.health + monster.healAmount);
                }
            });
            monster.lastHealTime = now;
        }
    }
    // Remove monsters that are off-screen or dead
    monsters = monsters.filter(monster => monster.health > 0 && monster.y < GAME_HEIGHT + monster.size);
}

function moveSpells() {
    const now = Date.now();
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];

        if (spell.type === 'aoe_lightning' || spell.type === 'aoe_slow') {
            if (now - spell.castTime > spell.duration) {
                spells.splice(i, 1);
            }
        } else if (spell.type === 'aoe_dot') {
            // AoE DOT (Poison Cloud) is handled in updatePoisonClouds
            spells.splice(i, 1); // Remove placeholder spell, actual cloud is in poisonClouds array
        }
        else {
            spell.x += spell.vx;
            spell.y += spell.vy;

            // Remove if off-screen
            if (spell.y < -SPELL_SIZE || spell.y > GAME_HEIGHT + SPELL_SIZE ||
                spell.x < -SPELL_SIZE || spell.x > GAME_WIDTH + SPELL_SIZE) {
                spells.splice(i, 1);
            }
        }
    }
}

function moveMonsterProjectiles() {
    for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = monsterProjectiles[i];
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        // Remove if off-screen
        if (projectile.y < -projectile.size || projectile.y > GAME_HEIGHT + projectile.size ||
            projectile.x < -projectile.size || projectile.x > GAME_WIDTH + projectile.size) {
            monsterProjectiles.splice(i, 1);
        }
    }
}

function applyPoisonDamage() {
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

function checkCollisions() {
    // Player Projectile vs Monster
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];
        if (spell.type === 'aoe_lightning') {
            // AoE lightning hits all monsters within its radius
            monsters.forEach(monster => {
                const dist = Math.sqrt(Math.pow(spell.x - (monster.x + monster.size / 2), 2) + Math.pow(spell.y - (monster.y + monster.size / 2), 2));
                if (dist < spell.radius && !monster.hitByLightning) {
                    let damage = spell.damage * player.spellPower;
                    if (Math.random() < player.criticalChance) damage *= 1.5; // Critical hit
                    monster.health -= damage;
                    monster.hitByLightning = true; // Mark as hit to prevent multiple hits per cast
                }
            });
        } else if (spell.type === 'aoe_slow') {
            monsters.forEach(monster => {
                const dist = Math.sqrt(Math.pow(spell.x - (monster.x + monster.size / 2), 2) + Math.pow(spell.y - (monster.y + monster.size / 2), 2));
                if (dist < spell.radius && !monster.isSlowed) {
                    let damage = spell.damage * player.spellPower;
                    if (Math.random() < player.criticalChance) damage *= 1.5; // Critical hit
                    monster.health -= damage;
                    monster.isSlowed = true;
                    monster.slowTimer = Date.now() + spellsData['Explosão Congelante'].slowDuration;
                }
            });
        } else if (spell.type === 'multishot') {
            // Multishot projectiles
            for (let j = monsters.length - 1; j >= 0; j--) {
                let monster = monsters[j];
                if (spell.x < monster.x + monster.size &&
                    spell.x + SPELL_SIZE > monster.x &&
                    spell.y < monster.y + monster.size &&
                    spell.y + SPELL_SIZE > monster.y) {
                    
                    if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
                        console.log('Ghost evaded attack!');
                        spells.splice(i, 1); // Remove spell on evade
                        break;
                    }

                    let damage = spell.damage * player.spellPower;
                    if (Math.random() < player.criticalChance) damage *= 1.5; // Critical hit
                    monster.health -= damage;

                    if (spell.type === 'lifesteal') {
                        player.health = Math.min(player.maxHealth, player.health + (damage * spellsData['Drenar Vida'].lifeSteal));
                    }
                    spells.splice(i, 1);
                    break;
                }
            }
        }
        else { // Regular projectile spells
            for (let j = monsters.length - 1; j >= 0; j--) {
                let monster = monsters[j];
                if (spell.x < monster.x + monster.size &&
                    spell.x + SPELL_SIZE > monster.x &&
                    spell.y < monster.y + monster.size &&
                    spell.y + SPELL_SIZE > monster.y) {

                    // Ghost evade logic
                    if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
                        console.log('Ghost evaded attack!');
                        spells.splice(i, 1); // Remove spell on evade
                        break;
                    }

                    let damage = spell.damage * player.spellPower;
                    if (Math.random() < player.criticalChance) damage *= 1.5; // Critical hit
                    monster.health -= damage;

                    // Lifesteal logic
                    if (spell.type === 'lifesteal') {
                        player.health = Math.min(player.maxHealth, player.health + (damage * spellsData['Drenar Vida'].lifeSteal));
                    }
                    spells.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Monster Projectile vs Player
    for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = monsterProjectiles[i];
        if (projectile.x < player.x + player.size &&
            projectile.x + projectile.size > player.x &&
            projectile.y < player.y + player.size &&
            projectile.y + projectile.size > player.y) {
            if (player.shield > 0) {
                player.shield -= projectile.damage;
                if (player.shield < 0) {
                    player.health += player.shield; // Apply remaining damage to health
                    player.shield = 0;
                }
            } else {
                player.health -= projectile.damage;
            }
            monsterProjectiles.splice(i, 1);
        }
    }

    // Monster vs Player (contact damage)
    monsters.forEach(monster => {
        if (monster.contactDamage > 0 &&
            player.x < monster.x + monster.size &&
            player.x + player.size > monster.x &&
            player.y < monster.y + monster.size &&
            player.y + player.size > monster.y) {

            if (monster.type === 'exploder') {
                // Exploder logic
                if (!monster.hasExploded) {
                    if (player.shield > 0) {
                        player.shield -= monster.contactDamage;
                        if (player.shield < 0) {
                            player.health += player.shield;
                            player.shield = 0;
                        }
                    } else {
                        player.health -= monster.contactDamage;
                    }
                    // Apply AoE damage to other monsters
                    monsters.forEach(otherMonster => {
                        if (otherMonster !== monster) {
                            const dist = Math.sqrt(Math.pow(monster.x - otherMonster.x, 2) + Math.pow(monster.y - otherMonster.y, 2));
                            if (dist < monster.explosionRadius) {
                                otherMonster.health -= monster.contactDamage * 0.5; // Half damage to other monsters
                            }
                        }
                    });
                    monster.health = 0; // Exploding monster is destroyed
                    monster.hasExploded = true;
                }
            } else {
                // Regular contact damage for non-exploders
                if (player.shield > 0) {
                    player.shield -= monster.contactDamage;
                    if (player.shield < 0) {
                        player.health += player.shield;
                        player.shield = 0;
                    }
                } else {
                    player.health -= monster.contactDamage;
                }
                monster.health = 0; // Monster dies on contact
            }
        }
    });

    // Handle monster deaths after all collisions are checked
    for (let i = monsters.length - 1; i >= 0; i--) {
        if (monsters[i].health <= 0) {
            addXp(monsters[i].xpValue);
            monstersKilledInWave++;
            monsters.splice(i, 1);
        }
    }
}

function addXp(amount) {
    player.xp += amount;
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * LEVEL_UP_XP_MULTIPLIER);
        levelUp();
    }
    updateHUD();
}

function levelUp() {
    console.log(`Player leveled up to ${player.level}!`);
    pauseGameForAbilityChoice();
}

function pauseGameForAbilityChoice() {
    gameState = 'CHOOSING_ABILITY';
    displayAbilityCards();
    showScreen(abilityCardsScreen);
}

function displayAbilityCards() {
    abilityCardOptionsDiv.innerHTML = ''; // Clear previous cards
    const chosenCards = [];
    const availableAbilities = ABILITY_CARDS.filter(ability => {
        // Filter out "Nova Magia" cards if the spell is already active
        if (ability.name.startsWith("Nova Magia:")) {
            const spellName = ability.name.replace("Nova Magia: ", "");
            return !player.activeSpells.includes(spellName);
        }
        return true; // Keep other types of abilities
    });

    while (chosenCards.length < 3 && availableAbilities.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAbilities.length);
        const card = availableAbilities[randomIndex];
        chosenCards.push(card);
        availableAbilities.splice(randomIndex, 1); // Remove so it's not chosen again
    }

    chosenCards.forEach(ability => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('ability-card');
        cardElement.innerHTML = `
            <h3>${ability.name}</h3>
            <p>${ability.description}</p>
        `;
        cardElement.onclick = () => {
            ability.apply();
            startNewWave(); // Resume game after choosing ability
        };
        abilityCardOptionsDiv.appendChild(cardElement);
    });
}

function gameOver() {
    gameState = 'GAME_OVER';
    showScreen(gameOverScreen);
}

function resetGame() {
    player = {
        x: GAME_WIDTH / 2 - PLAYER_SIZE / 2,
        y: GAME_HEIGHT - PLAYER_SIZE - 20,
        size: PLAYER_SIZE,
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        manaRegenRate: 0.1, // mana per frame
        level: 1,
        xp: 0,
        xpToNextLevel: LEVEL_UP_XP_BASE,
        activeSpells: ['Fagulha'], // Start with Fagulha
        currentSpellIndex: 0,
        spellPower: 1.0, // Multiplier for spell damage
        cooldownReduction: 0.0, // Percentage reduction (0.1 for 10%)
        criticalChance: 0.0, // Chance to deal 1.5x damage
        shield: 0,
        movementSpeedBonus: 0 // flat bonus to PLAYER_SPEED
    };
    monsters = [];
    spells = [];
    monsterProjectiles = [];
    poisonClouds = [];
    currentWave = 0;
    monstersKilledInWave = 0;
    lastMonsterSpawnTime = 0;
    updateHUD();
}

function startNewWave() {
    currentWave++;
    monstersInWave = 5 + (currentWave * 2); // More monsters each wave
    spawnedMonstersCount = 0; // Reset count for the new wave
    monsterSpawnDelay = Math.max(500, 1500 - (currentWave * 50)); // Spawn faster
    gameState = 'PLAYING';
    showScreen(gameContent);
    monsters = []; // Clear monsters from previous wave if any remain
    monsterProjectiles = [];
    poisonClouds = [];
    // Reset monster lightning hit status for new wave
    monsters.forEach(monster => monster.hitByLightning = false);
    updateHUD();
}

// --- Event Listeners ---
startGameBtn.addEventListener('click', () => {
    resetGame();
    startNewWave();
});

restartGameBtn.addEventListener('click', () => {
    resetGame();
    startNewWave();
});

moveLeftBtn.addEventListener('touchstart', () => { isMovingLeft = true; });
moveLeftBtn.addEventListener('touchend', () => { isMovingLeft = false; });
moveLeftBtn.addEventListener('mousedown', () => { isMovingLeft = true; });
moveLeftBtn.addEventListener('mouseup', () => { isMovingLeft = false; });

moveRightBtn.addEventListener('touchstart', () => { isMovingRight = true; });
moveRightBtn.addEventListener('touchend', () => { isMovingRight = false; });
moveRightBtn.addEventListener('mousedown', () => { isMovingRight = true; });
moveRightBtn.addEventListener('mouseup', () => { isMovingRight = false; });

castSpellBtn.addEventListener('click', castSpell);

prevSpellBtn.addEventListener('click', () => {
    player.currentSpellIndex = (player.currentSpellIndex - 1 + player.activeSpells.length) % player.activeSpells.length;
    updateHUD();
});

nextSpellBtn.addEventListener('click', () => {
    player.currentSpellIndex = (player.currentSpellIndex + 1) % player.activeSpells.length;
    updateHUD();
});

// Global variables for new features
let isDevMode = false;
let devModeInputBuffer = '';
const DEV_MODE_CODE = '999';

// --- Functions for new features ---
function activateDevMode() {
    if (isDevMode) return; // Prevent re-activation
    isDevMode = true;

    player.health = 99999;
    player.maxHealth = 99999;
    player.mana = 99999;
    player.maxMana = 99999;

    // Add all spells to activeSpells
    for (const spellName in spellsData) {
        if (!player.activeSpells.includes(spellName)) {
            player.activeSpells.push(spellName);
        }
    }
    console.log("Modo Desenvolvedor Ativado!");
    updateHUD(); // Update HUD to reflect new stats
}

// --- Event Listeners for new controls and dev mode ---
window.addEventListener('keydown', (e) => {
    // Standard movement keys
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true; // Handle 'a'/'A', 'd'/'D'

    // Spacebar to cast spell
    if (e.key === ' ' && !e.repeat) { // Prevent rapid casting on hold
        castSpell();
    }

    // Dev Mode Activation (999)
    if (e.key === '9') {
        devModeInputBuffer += '9';
        if (devModeInputBuffer.length > DEV_MODE_CODE.length) {
            devModeInputBuffer = devModeInputBuffer.substring(devModeInputBuffer.length - DEV_MODE_CODE.length);
        }
        if (devModeInputBuffer === DEV_MODE_CODE) {
            activateDevMode();
            devModeInputBuffer = ''; // Reset buffer after activation
        }
    } else if (e.key !== ' ' && e.key.toLowerCase() !== 'a' && e.key.toLowerCase() !== 'd' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        // Reset buffer if a non-movement, non-space, non-'9' key is pressed
        devModeInputBuffer = '';
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.key.toLowerCase()] = false;
});

// --- Cast Spell Function (Modified for non-homing projectiles) ---
function castSpell() {
    const activeSpellName = player.activeSpells[player.currentSpellIndex];
    const spellData = spellsData[activeSpellName];
    const now = Date.now();

    if (player.mana >= spellData.cost && (now - spellLastCastTime[activeSpellName] > spellData.cooldown * (1 - player.cooldownReduction))) {
        player.mana -= spellData.cost;
        spellLastCastTime[activeSpellName] = now;
        const playerCenterX = player.x + player.size / 2;
        const playerCenterY = player.y + player.size / 2;

        // Check spell type for specific behaviors
        if (spellData.type === 'heal') {
            player.health = Math.min(player.maxHealth, player.health + spellData.heal);
        } else if (spellData.type === 'shield') {
            player.shield += spellData.shieldAmount;
        } else if (spellData.type === 'aoe_lightning') {
            spells.push({
                x: playerCenterX,
                y: playerCenterY,
                radius: spellData.radius,
                color: spellData.color,
                damage: spellData.damage,
                type: 'aoe_lightning',
                castTime: now,
                duration: 200
            });
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
             // Multishot logic remains as it spawns projectiles from random spots and sends them downwards.
             // It's not a homing projectile from player to monster.
             for (let i = 0; i < spellData.numProjectiles; i++) {
                const spawnX = player.x + (Math.random() - 0.5) * spellData.spread;
                const spawnY = -50 - (Math.random() * 100);
                const targetX = player.x + player.size / 2 + (Math.random() - 0.5) * player.size; // Random target x
                const targetY = GAME_HEIGHT; // Always target bottom
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
        else { // Standard projectile spells (Fagulha, Bola de Fogo, Estilhaço de Gelo, Rajada Arcana, Drenar Vida)
            // Projectiles now go straight up instead of homing.
            const vx = 0; // Go straight up (no horizontal movement)
            const vy = -PROJECTILE_BASE_SPEED; // Negative for upwards movement

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
        updateHUD(); // Update mana display immediately
    }
}

// --- Main Game Loop ---
let lastFrameTime = 0;
let animationFrameId;

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    playerAnimationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(currentTime * ENTITY_ANIMATION_SPEED * 0.001);

    // Regenerate Mana if not at max
    if (player.mana < player.maxMana) {
        player.mana = Math.min(player.maxMana, player.mana + player.manaRegenRate);
    }

    // Always clear canvas and draw background first
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawBackground();

    if (gameState === 'PLAYING') {
        movePlayer();
        spawnMonster();
        moveMonsters();
        moveSpells();
        moveMonsterProjectiles();
        applyPoisonDamage();
        checkCollisions();
        updateHUD();

        // Check for Game Over
        if (player.health <= 0) {
            gameOver();
        }

        // Check for wave completion
        if (monstersKilledInWave >= monstersInWave && monsters.length === 0 && spawnedMonstersCount >= monstersInWave) {
            gameState = 'WAVE_COMPLETE'; // Set state to indicate wave end
            pauseGameForAbilityChoice(); // Show ability cards
        }
    } else if (gameState === 'WAVE_COMPLETE' || gameState === 'CHOOSING_ABILITY' || gameState === 'MENU' || gameState === 'GAME_OVER') {
        // When paused, still draw the last frame of the game content for context
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        if (loadedAssets.background && loadedAssets.background.complete) {
            ctx.drawImage(loadedAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        drawPlayer();
        drawMonsters(); // Draw remaining monsters if any (e.g. if game over happened during gameplay)
        drawSpells(); // Keep spells visible if they were cast
        drawMonsterProjectiles(); // Keep projectiles visible
        drawPoisonClouds(); // Keep poison clouds visible
        // Do NOT update HUD here, it should only update when PLAYING
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function drawBackground() {
    if (loadedAssets.background && loadedAssets.background.complete) {
        ctx.drawImage(loadedAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}


loadAssets().then(() => {
    console.log("Todos os assets carregados! Exibindo menu inicial...");
    player = { /* initial player setup will be done in resetGame() */ }; // Initialize player so resizeCanvas works
    resizeCanvas(); // Initial canvas resize
    resetGame(); // Set up initial game state (resets player, etc.)
    showScreen(mainMenuScreen); // Show the main menu
    animationFrameId = requestAnimationFrame(gameLoop); // Start the loop for state management
}).catch(error => {
    console.error("Erro ao carregar assets:", error);
    document.getElementById('game-container').innerHTML = '<p style="color: red;">Erro ao carregar os recursos do jogo. Por favor, tente novamente.</p>';
});
