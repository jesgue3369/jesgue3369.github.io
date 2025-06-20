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
const moveRightBtn = document = document.getElementById('move-right-btn');
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
let particles = []; // Array for particles
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
    'Estilhaco de Gelo': { damage: 25, cost: 12, color: 'lightblue', cooldown: 400, sprite: 'spell_estilhaco_de_gelo', description: "Atira um estilhaço que causa dano de gelo." },
    'Rajada Arcana': { damage: 15, cost: 8, color: 'purple', cooldown: 150, description: "Uma rápida rajada de energia arcana." },
    'Cura Menor': { heal: 30, cost: 20, color: 'lime', cooldown: 1000, type: 'heal', description: "Recupera uma pequena quantidade de vida." },
    'Escudo Arcano': { shieldAmount: 50, cost: 25, color: 'cyan', cooldown: 1500, type: 'shield', description: "Cria um escudo temporário." },
    'Relâmpago': { damage: 30, cost: 30, color: 'gold', cooldown: 1500, type: 'aoe_lightning', numBeams: 3, beamDuration: 400, description: "Três raios atingem posições aleatórias da tela." },
    'Névoa Venenosa': { damagePerTick: 5, tickInterval: 500, duration: 3000, radius: 80, cost: 25, color: 'darkgreen', cooldown: 1200, type: 'aoe_projectile_dot', sprite: 'spell_fagulha', description: "Lança um projétil que cria uma nuvem venenosa ao atingir um inimigo." }, // Changed type to aoe_projectile_dot
    'Explosão Congelante': { damage: 35, slowFactor: 0.5, slowDuration: 2000, radius: 70, cost: 28, color: 'skyblue', cooldown: 1000, type: 'aoe_projectile_slow', sprite: 'spell_estilhaco_de_gelo', description: "Lança um projétil que explode e retarda inimigos." }, // Changed type to aoe_projectile_slow
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
            // Draw lightning beam
            ctx.strokeStyle = spell.color;
            ctx.lineWidth = 5; // Thicker beam
            ctx.beginPath();
            ctx.moveTo(spell.x, 0); // Start from top
            ctx.lineTo(spell.x, GAME_HEIGHT); // Go to bottom
            ctx.stroke();
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

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * deltaTime / 16; // Adjust for frame rate
        p.y += p.vy * deltaTime / 16;
        p.alpha -= p.fadeRate * deltaTime / 16;
        p.size -= p.shrinkRate * deltaTime / 16;

        p.color = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.alpha})`;

        if (p.alpha <= 0 || p.size <= 0) {
            particles.splice(i, 1);
        }
    }
}

function createParticleExplosion(x, y, color, count = 20, speed = 2, size = 3, fadeRate = 0.05, shrinkRate = 0.1) {
    const [r, g, b] = color.match(/\d+/g).map(Number); // Extract RGB from color string
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed * (0.5 + Math.random());
        const vy = Math.sin(angle) * speed * (0.5 + Math.random());
        particles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            size: size * (0.5 + Math.random()),
            alpha: 1,
            fadeRate: fadeRate,
            shrinkRate: shrinkRate,
            color: `rgba(${r}, ${g}, ${b}, 1)`,
            r: r, g: g, b: b
        });
    }
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
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (keys['ArrowRight'] && player.x < GAME_WIDTH - player.size) {
        player.x += currentSpeed;
    }
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
            animationStartTime: now,
            id: Math.random() // Unique ID for monsters for lightning spell tracking
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
            if (tempRect.x < otherRect.x + otherRect.width && tempRect.x + tempRect.width > otherRect.x && tempRect.y < otherRect.y + otherRect.height && tempRect.y + tempRect.height > otherRect.y) {
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
            monsterProjectiles.push({ x: monsterCenterX, y: monsterCenterY, color: monster.projectileColor, damage: monster.projectileDamage, size: monster.projectileSize, vx: vx, vy: vy });
            monster.lastShotTime = now;
        }
        if (monster.type === 'healer' && now - monster.lastHealTime > monster.healInterval) {
            monsters.forEach(otherMonster => {
                const dist = Math.sqrt(
                    Math.pow((monster.x + monster.size / 2) - (otherMonster.x + otherMonster.size / 2), 2) +
                    Math.pow((monster.y + monster.size / 2) - (otherMonster.y + otherMonster.size / 2), 2)
                );
                if (dist < monster.healRadius && otherMonster.health < otherMonster.maxHealth) {
                    otherMonster.health = Math.min(otherMonster.maxHealth, otherMonster.health + monster.healAmount);
                }
            });
            monster.lastHealTime = now;
        }
        if (monster.y > GAME_HEIGHT) {
            // Monster has left the screen
            monsters.splice(i, 1);
        } else if (checkCollision(player, monster)) {
            if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
                // Ghost evades contact damage sometimes
                console.log("Fantasma evadiu!");
            } else {
                applyDamage(player, monster.contactDamage);
            }
            if (monster.type === 'exploder') {
                explodeMonster(monster);
                monsters.splice(i, 1); // Remove exploder immediately after explosion
                continue;
            }
        }
    }
}
function moveSpells() {
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];
        if (spell.type === 'aoe_lightning') {
            // Lightning beams have a fixed duration
            if (Date.now() > spell.startTime + spell.beamDuration) {
                createParticleExplosion(spell.x, GAME_HEIGHT / 2, spell.color, 30, 3, 4, 0.08, 0.15); // Particle effect at disappearance
                spells.splice(i, 1);
            }
            continue;
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
    }
}
function moveMonsterProjectiles() {
    for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = monsterProjectiles[i];
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        if (projectile.y > GAME_HEIGHT || projectile.y < 0 || projectile.x < 0 || projectile.x > GAME_WIDTH) {
            monsterProjectiles.splice(i, 1);
        } else if (checkCollision(projectile, player)) {
            applyDamage(player, projectile.damage);
            monsterProjectiles.splice(i, 1);
        }
    }
}
function updatePoisonClouds() {
    const now = Date.now();
    for (let i = poisonClouds.length - 1; i >= 0; i--) {
        let cloud = poisonClouds[i];
        if (now > cloud.startTime + cloud.duration) {
            poisonClouds.splice(i, 1);
        } else {
            // Apply damage over time to monsters within the cloud
            if (now - cloud.lastTickTime > cloud.tickInterval) {
                monsters.forEach(monster => {
                    const dist = Math.sqrt(
                        Math.pow((cloud.x) - (monster.x + monster.size / 2), 2) + // Changed to cloud.x and cloud.y as center
                        Math.pow((cloud.y) - (monster.y + monster.size / 2), 2)
                    );
                    if (dist < cloud.radius) {
                        applyDamage(monster, cloud.damagePerTick);
                    }
                });
                cloud.lastTickTime = now;
            }
        }
    }
}
function castSpell() {
    const now = Date.now();
    const currentSpellName = player.activeSpells[player.currentSpellIndex];
    const spellInfo = spellsData[currentSpellName];
    if (!spellInfo) {
        console.error("Magia não encontrada:", currentSpellName);
        return;
    }
    const actualCooldown = spellInfo.cooldown * (1 - player.cooldownReduction);
    if (player.mana >= spellInfo.cost && now - spellLastCastTime[currentSpellName] > actualCooldown) {
        player.mana -= spellInfo.cost;
        spellLastCastTime[currentSpellName] = now;
        if (spellInfo.type === 'heal') {
            player.health = Math.min(player.maxHealth, player.health + spellInfo.heal);
        } else if (spellInfo.type === 'shield') {
            player.shield += spellInfo.shieldAmount;
            setTimeout(() => {
                player.shield = Math.max(0, player.shield - spellInfo.shieldAmount);
            }, spellInfo.cooldown); // Shield lasts as long as cooldown for simplicity
        } else if (spellInfo.type === 'aoe_lightning') {
            // Cast 3 lightning beams at random X positions
            for (let i = 0; i < spellInfo.numBeams; i++) {
                const randomX = Math.random() * GAME_WIDTH;
                spells.push({
                    x: randomX,
                    y: 0, // Beams start from the top
                    color: spellInfo.color,
                    damage: spellInfo.damage,
                    type: spellInfo.type,
                    beamDuration: spellInfo.beamDuration, // How long the beam stays
                    startTime: now,
                    // Store affected monsters for this beam to prevent multiple hits from the same beam
                    affectedMonsters: new Set()
                });
            }
        } else if (spellInfo.type === 'aoe_projectile_dot' || spellInfo.type === 'aoe_projectile_slow') {
            // Launch a projectile for AoE spells
            spells.push({
                x: player.x + player.size / 2,
                y: player.y + player.size / 2,
                speed: PROJECTILE_BASE_SPEED,
                color: spellInfo.color,
                damage: spellInfo.damage, // Base damage to be used if the projectile itself causes initial damage
                sprite: spellInfo.sprite,
                type: spellInfo.type // e.g., 'aoe_projectile_dot' or 'aoe_projectile_slow'
            });
        }
        else {
            // Normal projectile spell
            spells.push({
                x: player.x + player.size / 2,
                y: player.y + player.size / 2,
                speed: PROJECTILE_BASE_SPEED,
                color: spellInfo.color,
                damage: spellInfo.damage,
                sprite: spellInfo.sprite,
                type: spellInfo.type || 'projectile'
            });
        }
    }
}
function switchSpell(direction) {
    player.currentSpellIndex += direction;
    if (player.currentSpellIndex < 0) {
        player.currentSpellIndex = player.activeSpells.length - 1;
    } else if (player.currentSpellIndex >= player.activeSpells.length) {
        player.currentSpellIndex = 0;
    }
    updateHUD();
}
function checkCollision(obj1, obj2) {
    // AABB collision detection
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.size > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.size > obj2.y;
}

// Function to check if a point (x, y) is within a rectangle (rect.x, rect.y, rect.width, rect.height)
function isPointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
}

function applyDamage(target, damage) {
    if (target.shield && target.shield > 0) {
        target.shield -= damage;
        if (target.shield < 0) {
            target.health += target.shield; // Apply remaining damage to health
            target.shield = 0;
        }
    } else {
        target.health -= damage;
    }
    if (target.health <= 0) {
        if (target === player) {
            endGame();
        } else {
            // It's a monster
            player.xp += target.xpValue;
            monstersKilledInWave++;
            createParticleExplosion(target.x + target.size / 2, target.y + target.size / 2, 'white', 20, 1.5, 3, 0.05, 0.1); // Particle effect on monster death
            if (player.xp >= player.xpToNextLevel) {
                levelUp();
            }
        }
    }
}
function levelUp() {
    player.level++;
    player.xp -= player.xpToNextLevel;
    player.xpToNextLevel = Math.floor(LEVEL_UP_XP_BASE * Math.pow(LEVEL_UP_XP_MULTIPLIER, player.level - 1));
    player.maxHealth += 10;
    player.health = player.maxHealth; // Restore health on level up
    player.maxMana += 10;
    player.mana = player.maxMana; // Restore mana on level up
    console.log(`Level Up! Nível: ${player.level}, Próximo XP: ${player.xpToNextLevel}`);
}
function startNewWave() {
    currentWave++;
    monstersInWave = 5 + (currentWave - 1) * 2; // Increase monsters per wave
    monstersToSpawnInCurrentWave = monstersInWave;
    spawnedMonstersCount = 0;
    lastMonsterSpawnTime = 0;
    monsters = []; // Clear any remaining monsters
    monsterProjectiles = [];
    poisonClouds = [];
    spells = []; // Clear player spells as well
    // Reset player position for new wave start if desired
    player.x = GAME_WIDTH / 2 - player.size / 2;
    player.y = GAME_HEIGHT - player.size - 20;
    showScreen(gameContent);
    gameState = 'PLAYING';
    console.log(`Starting Wave ${currentWave} with ${monstersInWave} monsters.`);
}
function resetGame() {
    player = {
        x: GAME_WIDTH / 2 - ACTUAL_PLAYER_SIZE / 2,
        y: GAME_HEIGHT - ACTUAL_PLAYER_SIZE - 20,
        size: ACTUAL_PLAYER_SIZE,
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        manaRegenRate: 0.1, // Mana regenerated per frame/tick
        level: 1,
        xp: 0,
        xpToNextLevel: LEVEL_UP_XP_BASE,
        currentSpellIndex: 0,
        activeSpells: ['Fagulha', 'Bola de Fogo', 'Estilhaco de Gelo'], // Player starts with these
        spellPower: 1.0, // Multiplier for spell damage/effect
        cooldownReduction: 0, // Percentage reduction (0 to 1)
        criticalChance: 0.1, // 10% critical chance
        criticalDamageMultiplier: 1.5, // 150% critical damage
        shield: 0,
        movementSpeedBonus: 0
    };
    monsters = [];
    spells = [];
    monsterProjectiles = [];
    poisonClouds = [];
    particles = [];
    currentWave = 0;
    monstersInWave = 0;
    monstersKilledInWave = 0;
    lastMonsterSpawnTime = 0;
    playerAnimationOffset = 0;
    // Reset spell cooldowns
    for (const spellName in spellsData) {
        spellLastCastTime[spellName] = 0;
    }
    updateHUD();
    console.log("Game reset.");
}
function endGame() {
    gameState = 'GAME_OVER';
    showScreen(gameOverScreen);
    console.log("Game Over!");
}
function pauseGameForAbilityChoice() {
    gameState = 'CHOOSING_ABILITY';
    displayAbilityCards();
    showScreen(abilityCardsScreen);
}
function displayAbilityCards() {
    abilityCardOptionsDiv.innerHTML = ''; // Clear previous cards
    const chosenCards = [];
    const availableCards = [...ABILITY_CARDS]; // Copy to avoid modifying original
    // Filter out spells already learned
    const learnableSpells = availableCards.filter(card => {
        const isSpellCard = card.name.startsWith('Nova Magia: ');
        const spellName = card.name.replace('Nova Magia: ', '');
        return !isSpellCard || !player.activeSpells.includes(spellName);
    });
    // Prioritize showing new spells if available and not too many
    let numNewSpells = 0;
    for (let i = 0; i < learnableSpells.length && chosenCards.length < 3; i++) {
        const card = learnableSpells[Math.floor(Math.random() * learnableSpells.length)];
        if (!chosenCards.includes(card) && card.name.startsWith('Nova Magia: ') && numNewSpells < 1) { // Limit to one new spell per choice
            chosenCards.push(card);
            numNewSpells++;
        }
    }
    // Fill remaining slots with general upgrades
    while (chosenCards.length < 3) {
        const card = availableCards[Math.floor(Math.random() * availableCards.length)];
        if (!chosenCards.includes(card) && !card.name.startsWith('Nova Magia: ')) { // Ensure it's not a new spell card
            chosenCards.push(card);
        }
    }
    chosenCards.forEach(cardData => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('ability-card');
        cardElement.innerHTML = `
            <h3>${cardData.name}</h3>
            <p>${cardData.description}</p>
        `;
        cardElement.addEventListener('click', () => {
            cardData.apply();
            startNewWave();
        });
        abilityCardOptionsDiv.appendChild(cardElement);
    });
}
// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (gameState === 'PLAYING') {
        if (e.key === ' ') {
            castSpell();
        } else if (e.key === 'q') {
            switchSpell(-1);
        } else if (e.key === 'e') {
            switchSpell(1);
        }
    }
});
document.addEventListener('keyup', (e) => {
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
mobileControlsBar.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior like scrolling
    const touch = e.touches[0];
    const targetId = touch.target.id;
    if (targetId === 'move-left-btn') {
        isMovingLeft = true;
    } else if (targetId === 'move-right-btn') {
        isMovingRight = true;
    } else if (targetId === 'cast-spell-btn') {
        castSpell();
    } else if (targetId === 'prev-spell-btn') {
        switchSpell(-1);
    } else if (targetId === 'next-spell-btn') {
        switchSpell(1);
    }
}, { passive: false });
mobileControlsBar.addEventListener('touchend', (e) => {
    e.preventDefault();
    const targetId = e.target.id;
    if (targetId === 'move-left-btn') {
        isMovingLeft = false;
    } else if (targetId === 'move-right-btn') {
        isMovingRight = false;
    }
});
// --- Game Loop ---
let animationFrameId;
let lastUpdateTime = 0;
const targetFrameRate = 60;
const frameInterval = 1000 / targetFrameRate;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastUpdateTime;
    if (deltaTime > frameInterval) {
        lastUpdateTime = timestamp - (deltaTime % frameInterval);

        playerAnimationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(timestamp * ENTITY_ANIMATION_SPEED * 0.001);
        
        // Always update particles, even when game is paused for menus
        updateParticles(deltaTime);

        if (gameState === 'PLAYING') {
            movePlayer();
            player.mana = Math.min(player.maxMana, player.mana + player.manaRegenRate); // Mana regeneration
            spawnMonster();
            moveMonsters();
            moveSpells(); // Spells are updated
            moveMonsterProjectiles(); // Monster projectiles are updated
            updatePoisonClouds(); // Poison clouds are updated
            
            // Damage monsters hit by lightning beams
            spells.filter(s => s.type === 'aoe_lightning').forEach(beam => {
                monsters.forEach(monster => {
                    const monsterRect = { x: monster.x, y: monster.y, width: monster.size, height: monster.size };
                    // Check if monster is under the beam and hasn't been hit by this beam yet
                    if (isPointInRect(beam.x, monster.y + monster.size / 2, monsterRect) && !beam.affectedMonsters.has(monster.id)) {
                        let damage = beam.damage * player.spellPower;
                        if (Math.random() < player.criticalChance) {
                            damage *= player.criticalDamageMultiplier;
                            console.log("CRÍTICO (Raio)!");
                        }
                        applyDamage(monster, damage);
                        beam.affectedMonsters.add(monster.id); // Mark monster as hit by this beam
                    }
                });
            });

            // Remove dead monsters - moved particle effect to applyDamage
            monsters = monsters.filter(monster => monster.health > 0);
            updateHUD();
        }
        
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        if (loadedAssets.background && loadedAssets.background.complete) {
            ctx.drawImage(loadedAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        drawPlayer();
        drawMonsters();
        drawSpells(); // AGORA CHAMADO PARA DESENHAR FEITIÇOS
        drawMonsterProjectiles(); // AGORA CHAMADO PARA DESENHAR PROJÉTEIS DE MONSTROS
        drawPoisonClouds(); // AGORA CHAMADO PARA DESENHAR NUVENS DE VENENO
        drawParticles(); 


        if (gameState === 'PLAYING') {
            if (monstersKilledInWave >= monstersInWave && spawnedMonstersCount >= monstersInWave) {
                gameState = 'WAVE_COMPLETE'; // Set state to indicate wave end
                pauseGameForAbilityChoice(); // Show ability cards
            }
        }
    }
    animationFrameId = requestAnimationFrame(gameLoop);
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
});
