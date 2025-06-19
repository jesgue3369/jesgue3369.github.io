const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudHealthValue = document.getElementById('health-value');
const hudManaValue = document.getElementById('mana-value');
const hudLevelValue = document.getElementById('level-value');
const hudXpValue = document.getElementById('xp-value');
const hudSpellName = document.getElementById('spell-name');
const hudSkillPointsValue = document.getElementById('skill-points-value');

const skillTree = document.getElementById('skill-tree');
const openSkillsBtn = document.getElementById('open-skills-btn');
const closeSkillTreeBtn = document.getElementById('close-skill-tree');
const unlockSkillButtons = document.querySelectorAll('.unlock-skill');

const gameOverScreen = document.getElementById('game-over-screen');
const restartGameBtn = document.getElementById('restart-game');

// NOVOS ELEMENTOS DO MENU
const mainMenuScreen = document.getElementById('main-menu-screen');
const startGameBtn = document.getElementById('start-game-btn');
const gameContent = document.getElementById('game-content'); // Onde o canvas e HUD estão

// Botões de controle mobile
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
const SPELL_SIZE = 20;
const PLAYER_SPEED = 5;
const PROJECTILE_SPEED = 7;
const INITIAL_MONSTER_SPEED = 1;
const MONSTER_SPAWN_INTERVAL = 1500;
const XP_PER_MONSTER = 10;
const LEVEL_UP_XP_BASE = 100;
const LEVEL_UP_XP_MULTIPLIER = 1.2;

const CONTROLLER_BAR_HEIGHT = 100;

// --- Sprites (Imagens) ---
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
let assetsLoadedCount = 0;
let totalAssetsToLoad = Object.keys(ASSET_PATHS).length;

// --- Estado do Jogo ---
let player; // Player será inicializado em resetGame()
let monsters = [];
let spells = [];
let monsterProjectiles = [];
let poisonClouds = [];
let keys = {};
let isMovingLeft = false;
let isMovingRight = false;
let lastMonsterSpawnTime = 0;
let difficultyLevel = 1;

// --- Gerenciamento de Estados do Jogo ---
// Estados possíveis: 'MENU', 'PLAYING', 'PAUSED_SKILL_TREE', 'GAME_OVER', 'WAVE_COMPLETE', 'CARD_SELECTION'
let gameState = 'MENU';

// --- Novas variáveis para animação do jogador ---
let playerAnimationOffset = 0;
const PLAYER_ANIMATION_AMPLITUDE = 5;
const PLAYER_ANIMATION_SPEED = 5;

// --- Definições de Magias e Habilidades ---
const spellsData = {
    'Fagulha': { damage: 10, cost: 5, color: 'yellow', cooldown: 100, sprite: 'spell_fagulha' },
    'Bola de Fogo': { damage: 30, cost: 15, color: 'orange', cooldown: 500, sprite: 'spell_bola_de_fogo' },
    'Estilhaço de Gelo': { damage: 25, cost: 12, color: 'lightblue', cooldown: 400, sprite: 'spell_estilhaco_de_gelo' },
    'Rajada Arcana': { damage: 15, cost: 8, color: 'purple', cooldown: 150 },
    'Cura Menor': { heal: 30, cost: 20, color: 'lime', cooldown: 1000, type: 'heal' },
    'Escudo Arcano': { shieldAmount: 50, cost: 25, color: 'cyan', cooldown: 1500, type: 'shield' },
    'Relâmpago': { damage: 40, cost: 30, color: 'gold', cooldown: 800, type: 'aoe_lightning', radius: 100 },
    'Névoa Venenosa': { damagePerTick: 5, tickInterval: 500, duration: 3000, radius: 80, cost: 25, color: 'darkgreen', cooldown: 1200, type: 'aoe_dot' },
    'Explosão Congelante': { damage: 35, slowFactor: 0.5, slowDuration: 2000, radius: 70, cost: 28, color: 'skyblue', cooldown: 1000, type: 'aoe_slow' },
    'Drenar Vida': { damage: 20, lifeSteal: 0.5, cost: 18, color: 'darkred', cooldown: 600, type: 'lifesteal' },
    'Tempestade de Meteoros': { damage: 20, numProjectiles: 5, spread: 100, cost: 40, color: 'brown', cooldown: 2000, type: 'multishot' }
};

let spellLastCastTime = {};
for (const spellName in spellsData) {
    spellLastCastTime[spellName] = 0;
}

const skillsData = {
    'fireball': { name: 'Bola de Fogo', type: 'active', cost: 1, unlock: () => player.activeSpells.push('Bola de Fogo') },
    'ice-shard': { name: 'Estilhaço de Gelo', type: 'active', cost: 1, unlock: () => player.activeSpells.push('Estilhaço de Gelo') },
    'arcane-blast': { name: 'Rajada Arcana', type: 'active', cost: 1, unlock: () => player.activeSpells.push('Rajada Arcana') },
    'minor-heal': { name: 'Cura Menor', type: 'active', cost: 2, unlock: () => player.activeSpells.push('Cura Menor') },
    'arcane-shield': { name: 'Escudo Arcano', type: 'active', cost: 2, unlock: () => player.activeSpells.push('Escudo Arcano') },
    'lightning': { name: 'Relâmpago', type: 'active', cost: 3, unlock: () => player.activeSpells.push('Relâmpago') },
    'poison-mist': { name: 'Névoa Venenosa', type: 'active', cost: 3, unlock: () => player.activeSpells.push('Névoa Venenosa') },
    'frost-explosion': { name: 'Explosão Congelante', type: 'active', cost: 4, unlock: () => player.activeSpells.push('Explosão Congelante') },
    'life-drain': { name: 'Drenar Vida', type: 'active', cost: 4, unlock: () => player.activeSpells.push('Drenar Vida') },
    'meteor-storm': { name: 'Tempestade de Meteoros', type: 'active', cost: 5, unlock: () => player.activeSpells.push('Tempestade de Meteoros') },

    'mana-regen': { name: 'Regeneração de Mana Aprimorada', type: 'passive', cost: 1, effect: () => player.manaRegenRate += 0.05 },
    'spell-power': { name: 'Poder Mágico Aumentado', type: 'passive', cost: 1, effect: () => player.spellPower += 0.1 },
    'health-boost': { name: 'Aumento de Vida', type: 'passive', cost: 2, effect: () => { player.maxHealth += 50; player.health += 50; } },
    'cooldown-reduction': { name: 'Redução de Recarga', type: 'passive', cost: 3, effect: () => player.cooldownReduction += 0.1 },
    'critical-chance': { name: 'Chance Crítica', type: 'passive', cost: 3, effect: () => player.criticalChance = Math.min(0.5, player.criticalChance + 0.05) },
    'movement-speed': { name: 'Velocidade de Movimento', type: 'passive', cost: 2, effect: () => player.movementSpeedBonus += 1 }
};

// --- Definições de Monstros ---
const monsterTypes = {
    'basic': {
        color: '#f00',
        initial: 'B',
        sizeMultiplier: 1,
        healthMultiplier: 1,
        speedMultiplier: 1,
        canShoot: false,
        xp: 10,
        contactDamage: 10,
        sprite: 'monster_basic',
        projectileSpeed: PROJECTILE_SPEED, // Adicionado
        projectileSize: SPELL_SIZE / 2 // Adicionado
    },
    'tank': {
        color: '#8B4513',
        initial: 'T',
        sizeMultiplier: 1.5,
        healthMultiplier: 3,
        speedMultiplier: 0.7,
        canShoot: false,
        xp: 30,
        contactDamage: 20,
        sprite: 'monster_tank',
        projectileSpeed: PROJECTILE_SPEED,
        projectileSize: SPELL_SIZE / 2
    },
    'shooter': {
        color: '#6A5ACD',
        initial: 'S',
        sizeMultiplier: 1.1,
        healthMultiplier: 1.2,
        speedMultiplier: 0.9,
        canShoot: true,
        projectileColor: 'red',
        projectileDamage: 15,
        shootInterval: 2000,
        lastShotTime: 0,
        xp: 20,
        contactDamage: 0,
        sprite: 'monster_shooter',
        projectileSpeed: PROJECTILE_SPEED,
        projectileSize: SPELL_SIZE / 2
    },
    'fast': {
        color: '#00FFFF',
        initial: 'F',
        sizeMultiplier: 0.8,
        healthMultiplier: 0.7,
        speedMultiplier: 1.5,
        canShoot: false,
        xp: 15,
        contactDamage: 8,
        sprite: 'monster_fast',
        projectileSpeed: PROJECTILE_SPEED,
        projectileSize: SPELL_SIZE / 2
    },
    'healer': {
        color: '#00FF00',
        initial: 'H',
        sizeMultiplier: 1.0,
        healthMultiplier: 1.5,
        speedMultiplier: 0.8,
        canShoot: false,
        xp: 25,
        contactDamage: 5,
        healAmount: 5,
        healRadius: 150,
        healInterval: 1500,
        lastHealTime: 0,
        type: 'healer',
        sprite: 'monster_healer',
        projectileSpeed: PROJECTILE_SPEED,
        projectileSize: SPELL_SIZE / 2
    },
    'exploder': {
        color: '#FF4500',
        initial: 'E',
        sizeMultiplier: 1.2,
        healthMultiplier: 0.8,
        speedMultiplier: 1.0,
        canShoot: false,
        xp: 20,
        contactDamage: 30,
        explosionRadius: 80,
        type: 'exploder',
        sprite: 'monster_exploder',
        projectileSpeed: PROJECTILE_SPEED,
        projectileSize: SPELL_SIZE / 2
    },
    'ghost': {
        color: 'rgba(255,255,255,0.4)',
        initial: 'G',
        sizeMultiplier: 0.9,
        healthMultiplier: 0.9,
        speedMultiplier: 1.2,
        canShoot: false,
        xp: 20,
        contactDamage: 12,
        evadeChance: 0.2,
        type: 'ghost',
        sprite: 'monster_ghost',
        projectileSpeed: PROJECTILE_SPEED,
        projectileSize: SPELL_SIZE / 2
    },
    'giant_worm': {
        color: '#A52A2A',
        initial: 'W',
        sizeMultiplier: 2.0,
        healthMultiplier: 5.0,
        speedMultiplier: 0.5,
        canShoot: true, // Giant Worm pode atirar
        projectileColor: 'brown',
        projectileDamage: 25,
        shootInterval: 3000,
        lastShotTime: 0,
        xp: 50,
        contactDamage: 40,
        type: 'giant_worm',
        sprite: 'monster_giant_worm',
        projectileSpeed: PROJECTILE_SPEED * 0.5, // Projétil do gigante é mais lento
        projectileSize: SPELL_SIZE * 1.5 // Projétil do gigante é maior
    }
};

// --- Função de pré-carregamento de assets ---
function loadAssets() {
    return new Promise(resolve => {
        for (let key in ASSET_PATHS) {
            const img = new Image();
            img.src = ASSET_PATHS[key];
            img.onload = () => {
                assetsLoadedCount++;
                loadedAssets[key] = img;
                if (assetsLoadedCount === totalAssetsToLoad) {
                    resolve();
                }
            };
            img.onerror = () => {
                console.error(`Falha ao carregar imagem: ${ASSET_PATHS[key]}`);
                assetsLoadedCount++;
                if (assetsLoadedCount === totalAssetsToLoad) {
                    resolve();
                }
            };
        }
    });
}

// --- Redimensionamento do Canvas ---
function resizeCanvas() {
    const gameContainer = document.getElementById('game-container');
    // Ajusta o canvas para preencher o game-content, que está dentro do game-container
    canvas.width = gameContent.clientWidth;
    canvas.height = gameContent.clientHeight;

    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;

    // Apenas ajuste a posição do jogador se o jogo estiver rodando
    if (gameState === 'PLAYING' || gameState === 'PAUSED_SKILL_TREE') {
        player.x = GAME_WIDTH / 2 - player.size / 2; // Usar player.size aqui
        player.y = GAME_HEIGHT - player.size - 20; // Usar player.size aqui
    }
}

window.addEventListener('resize', resizeCanvas);

// --- Funções de Exibição de Telas ---
function showScreen(screenElement) {
    const screens = document.querySelectorAll('.game-screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    screenElement.classList.add('active');
}

// --- Funções de Desenho ---
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
        const monsterSprite = loadedAssets[monster.sprite];
        if (monsterSprite && monsterSprite.complete) {
            ctx.drawImage(monsterSprite, monster.x, monster.y, monster.size, monster.size);
        } else {
            ctx.fillStyle = monster.color;
            ctx.beginPath();
            ctx.arc(monster.x + monster.size / 2, monster.y + monster.size / 2, monster.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = `${monster.size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(monster.initial, monster.x + monster.size / 2, monster.y + monster.size / 2);
        }

        const healthBarWidth = monster.size * 0.8;
        const healthBarHeight = 5;
        const healthRatio = monster.health / monster.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(monster.x + monster.size * 0.1, monster.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(monster.x + monster.size * 0.1, monster.y - 10, healthBarWidth * healthRatio, healthBarHeight);
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
        const projectileSprite = loadedAssets.projectile_monster; // Usar sprite genérico por enquanto, mudar se houver sprites específicos
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
    hudSkillPointsValue.textContent = player.skillPoints;
}

// --- Lógica do Jogo ---

function movePlayer() {
    const currentSpeed = PLAYER_SPEED + player.movementSpeedBonus;
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (keys['ArrowRight'] && player.x < GAME_WIDTH - player.size) { // Usar player.size
        player.x += currentSpeed;
    }

    if (isMovingLeft && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (isMovingRight && player.x < GAME_WIDTH - player.size) { // Usar player.size
        player.x += currentSpeed;
    }
}

function spawnMonster() {
    const now = Date.now();
    if (now - lastMonsterSpawnTime > MONSTER_SPAWN_INTERVAL / difficultyLevel) {
        const x = Math.random() * (GAME_WIDTH - INITIAL_MONSTER_SIZE); // Ainda usando INITIAL_MONSTER_SIZE para spawn inicial

        let monsterTypeKeys = Object.keys(monsterTypes);
        let availableTypes = monsterTypeKeys.filter(type =>
            difficultyLevel >= 1.0 || (type !== 'healer' && type !== 'exploder' && type !== 'ghost' && type !== 'giant_worm')
        );

        let monsterTypeKey;
        const rand = Math.random();
        if (difficultyLevel >= 4 && rand < 0.1) {
            monsterTypeKey = 'giant_worm';
        } else if (difficultyLevel >= 3 && rand < 0.2) {
            monsterTypeKey = 'ghost';
        } else if (difficultyLevel >= 2.5 && rand < 0.3) {
            monsterTypeKey = 'exploder';
        } else if (difficultyLevel >= 2 && rand < 0.4) {
            monsterTypeKey = 'healer';
        } else if (rand < 0.5 + (difficultyLevel * 0.1)) {
            const basicTypes = ['basic', 'shooter', 'tank', 'fast'];
            monsterTypeKey = basicTypes[Math.floor(Math.random() * basicTypes.length)];
        } else {
            monsterTypeKey = 'basic';
        }

        if (!availableTypes.includes(monsterTypeKey)) {
            monsterTypeKey = 'basic';
        }

        const typeData = monsterTypes[monsterTypeKey];
        // Aplicar redução de 60% para player e monstros (40% do tamanho original)
        const monsterSize = INITIAL_MONSTER_SIZE * typeData.sizeMultiplier * 0.4;
        const monsterHealth = 20 * difficultyLevel * typeData.healthMultiplier;
        const monsterSpeed = INITIAL_MONSTER_SPEED * (1 + (difficultyLevel - 1) * 0.1) * typeData.speedMultiplier;

        monsters.push({
            x: x,
            y: -monsterSize,
            health: monsterHealth,
            maxHealth: monsterHealth,
            speed: monsterSpeed,
            type: monsterTypeKey,
            color: typeData.color,
            initial: typeData.initial,
            size: monsterSize, // Tamanho final após redução
            canShoot: typeData.canShoot,
            projectileColor: typeData.projectileColor,
            projectileDamage: typeData.projectileDamage,
            shootInterval: typeData.shootInterval,
            lastShotTime: typeData.lastShotTime || 0,
            xpValue: typeData.xp,
            contactDamage: typeData.contactDamage,
            healAmount: typeData.healAmount || 0,
            healRadius: typeData.healRadius || 0,
            healInterval: typeData.healInterval || 0,
            lastHealTime: typeData.lastHealTime || 0,
            explosionRadius: typeData.explosionRadius || 0,
            evadeChance: typeData.evadeChance || 0,
            isSlowed: false,
            slowTimer: 0,
            sprite: typeData.sprite,
            projectileSpeed: typeData.projectileSpeed, // Usar velocidade do projétil do tipo de monstro
            projectileSize: typeData.projectileSize, // Usar tamanho do projétil do tipo de monstro
            targetY: GAME_HEIGHT * 0.3 + (Math.random() * GAME_HEIGHT * 0.2) // Voa até 30-50% da altura da tela
        });
        lastMonsterSpawnTime = now;
    }
}

function moveMonsters() {
    const now = Date.now();
    monsters.forEach((monster, index) => {
        let currentMonsterSpeed = monster.speed;
        if (monster.isSlowed && now < monster.slowTimer) {
            currentMonsterSpeed *= spellsData['Explosão Congelante'].slowFactor;
        }

        // Nova lógica de movimento: voa para baixo até certo ponto, depois horizontal
        if (monster.y < monster.targetY) {
            monster.y += currentMonsterSpeed;
        } else {
            // Uma vez que atingiu a altura alvo, move-se horizontalmente em direção ao player
            const monsterCenterX = monster.x + monster.size / 2;
            const playerCenterX = player.x + player.size / 2;

            if (monsterCenterX < playerCenterX) {
                monster.x += currentMonsterSpeed;
            } else if (monsterCenterX > playerCenterX) {
                monster.x -= currentMonsterSpeed;
            }
            // Não move mais verticalmente após atingir targetY
        }


        if (monster.canShoot && now - monster.lastShotTime > monster.shootInterval && monster.y > 0 && monster.y < GAME_HEIGHT * 0.7) {
            const monsterCenterX = monster.x + monster.size / 2;
            const monsterCenterY = monster.y + monster.size / 2;
            const playerCenterX = player.x + player.size / 2;
            const playerCenterY = player.y + player.size / 2;

            const dx = playerCenterX - monsterCenterX;
            const dy = playerCenterY - monsterCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const vx = (dx / distance) * monster.projectileSpeed; // Usar monster.projectileSpeed
            const vy = (dy / distance) * monster.projectileSpeed; // Usar monster.projectileSpeed

            monsterProjectiles.push({
                x: monsterCenterX,
                y: monsterCenterY,
                color: monster.projectileColor,
                damage: monster.projectileDamage,
                size: monster.projectileSize, // Usar monster.projectileSize
                vx: vx,
                vy: vy
            });
            monster.lastShotTime = now;
        }

        if (monster.type === 'healer' && now - monster.lastHealTime > monster.healInterval) {
            monsters.forEach(otherMonster => {
                const dist = Math.sqrt(
                    Math.pow((monster.x + monster.size / 2) - (otherMonster.x + otherMonster.size / 2), 2) +
                    Math.pow((monster.y + monster.size / 2) - (otherMonster.y + otherMonster.size / 2), 2)
                );
                if (monster !== otherMonster && dist < monster.healRadius) {
                    otherMonster.health = Math.min(otherMonster.maxHealth, otherMonster.health + monster.healAmount);
                }
            });
            monster.lastHealTime = now;
        }

        // Se o monstro atingir a parte inferior da tela, ele some (ou causa dano e some)
        if (monster.y > GAME_HEIGHT) {
            if (monster.type === 'exploder') {
                monsters.splice(index, 1);
                return;
            }

            if (monster.type !== 'shooter') { // Atacantes de contato ainda causam dano ao passar
                takeDamage(monster.contactDamage);
            }
            monsters.splice(index, 1); // Remove o monstro
            if (player.health <= 0) {
                endGame();
            }
        }
    });
}


function moveMonsterProjectiles() {
    monsterProjectiles.forEach((projectile, index) => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        if (projectile.y < 0 || projectile.y > GAME_HEIGHT || projectile.x < 0 || projectile.x > GAME_WIDTH) {
            monsterProjectiles.splice(index, 1);
        }
    });
}

function castSpell() {
    const currentSpellName = player.activeSpells[player.currentSpellIndex];
    const spellData = spellsData[currentSpellName];
    const now = Date.now();
    const effectiveCooldown = spellData.cooldown * (1 - player.cooldownReduction);

    if (player.mana >= spellData.cost && (now - spellLastCastTime[currentSpellName] > effectiveCooldown)) {
        player.mana -= spellData.cost;
        spellLastCastTime[currentSpellName] = now;

        const spellX = player.x + player.size / 2; // Usar player.size
        const spellY = player.y;

        let finalDamage = spellData.damage * player.spellPower;
        if (Math.random() < player.criticalChance && spellData.damage) {
            finalDamage *= 2;
            console.log("CRÍTICO!");
        }

        switch (spellData.type) {
            case 'heal':
                player.health = Math.min(player.maxHealth, player.health + spellData.heal);
                break;
            case 'shield':
                player.shield += spellData.shieldAmount;
                break;
            case 'aoe_lightning':
                spells.push({ x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, radius: spellData.radius });
                monsters.forEach(monster => {
                    const dist = Math.sqrt(Math.pow(spellX - (monster.x + monster.size / 2), 2) + Math.pow(spellY - (monster.y + monster.size / 2), 2));
                    if (dist < spellData.radius) {
                        applyDamageToMonster(monster, finalDamage);
                    }
                });
                break;
            case 'aoe_dot':
                poisonClouds.push({
                    x: spellX,
                    y: spellY,
                    damagePerTick: finalDamage,
                    tickInterval: spellData.tickInterval,
                    duration: spellData.duration,
                    radius: spellData.radius,
                    color: spellData.color,
                    lastTickTime: now
                });
                break;
            case 'aoe_slow':
                spells.push({ x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, radius: spellData.radius });
                monsters.forEach(monster => {
                    const dist = Math.sqrt(Math.pow(spellX - (monster.x + monster.size / 2), 2) + Math.pow(spellY - (monster.y + monster.size / 2), 2));
                    if (dist < spellData.radius) {
                        applyDamageToMonster(monster, finalDamage);
                        monster.isSlowed = true;
                        monster.slowTimer = now + spellData.slowDuration;
                    }
                });
                break;
            case 'lifesteal':
                spells.push({ x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, lifeSteal: spellData.lifeSteal });
                break;
            case 'multishot':
                for (let i = 0; i < spellData.numProjectiles; i++) {
                    const offsetX = (Math.random() - 0.5) * spellData.spread;
                    spells.push({ x: spellX + offsetX, y: spellY, damage: finalDamage, color: spellData.color, sprite: spellData.sprite });
                }
                break;
            default: // Magias de projétil padrão
                spells.push({
                    x: spellX,
                    y: spellY,
                    damage: finalDamage,
                    color: spellData.color,
                    type: spellData.type,
                    sprite: spellData.sprite || 'projectile_player'
                });
                break;
        }
    }
}

function moveSpells() {
    spells.forEach((spell, index) => {
        if (spell.type === 'aoe_lightning' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
            if (!spell.spawnTime) spell.spawnTime = Date.now();
            if (Date.now() - spell.spawnTime > 200) {
                spells.splice(index, 1);
            }
        } else {
            spell.y -= 10;
            if (spell.y < 0) {
                spells.splice(index, 1);
            }
        }
    });
}

function applyDamageToMonster(monster, damage) {
    if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
        console.log('Ghost evaded attack!');
        return;
    }
    monster.health -= damage;
}

function checkCollisions() {
    spells.forEach((spell, spellIndex) => {
        if (spell.type === 'aoe_lightning' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
            return;
        }

        monsters.forEach((monster, monsterIndex) => {
            if (spell.x < monster.x + monster.size &&
                spell.x + SPELL_SIZE > monster.x &&
                spell.y < monster.y + monster.size &&
                spell.y + SPELL_SIZE > monster.y) {

                applyDamageToMonster(monster, spell.damage);

                if (spell.type === 'lifesteal') {
                    player.health = Math.min(player.maxHealth + player.shield, player.health + (spell.damage * spell.lifeSteal));
                }

                spells.splice(spellIndex, 1);

                if (monster.health <= 0) {
                    if (monster.type === 'exploder') {
                        monsters.forEach(otherMonster => {
                            const dist = Math.sqrt(
                                Math.pow((monster.x + monster.size / 2) - (otherMonster.x + otherMonster.size / 2), 2) +
                                Math.pow((monster.y + monster.size / 2) - (otherMonster.y + otherMonster.size / 2), 2)
                            );
                            if (monster !== otherMonster && dist < monster.explosionRadius) {
                                applyDamageToMonster(otherMonster, monster.contactDamage * 0.5);
                            }
                        });
                        takeDamage(monster.contactDamage);
                    }
                    gainXP(monster.xpValue);
                    monsters.splice(monsterIndex, 1);
                }
            }
        });
    });

    monsterProjectiles.forEach((projectile, projIndex) => {
        const projCenterX = projectile.x + projectile.size / 2;
        const projCenterY = projectile.y + projectile.size / 2;
        const playerCenterX = player.x + player.size / 2; // Usar player.size
        const playerCenterY = player.y + player.size / 2; // Usar player.size

        const dist = Math.sqrt(
            Math.pow(projCenterX - playerCenterX, 2) +
            Math.pow(projCenterY - playerCenterY, 2)
        );

        if (dist < (projectile.size / 2 + player.size / 2)) { // Usar player.size
            takeDamage(projectile.damage);
            monsterProjectiles.splice(projIndex, 1);

            if (player.health <= 0) {
                endGame();
            }
        }
    });

    monsters.forEach((monster, index) => {
        if (monster.type === 'shooter') {
            return;
        }

        // Colisão de contato com o jogador
        if (monster.y + monster.size > player.y &&
            monster.y < player.y + player.size &&
            monster.x + monster.size > player.x &&
            monster.x < player.x + player.size) {

            if (monster.type === 'exploder') {
                takeDamage(monster.contactDamage);
                monsters.splice(index, 1);
            } else {
                takeDamage(monster.contactDamage);
                monsters.splice(index, 1);
            }

            if (player.health <= 0) {
                endGame();
            }
        }
    });

    const now = Date.now();
    poisonClouds.forEach((cloud, cloudIndex) => {
        if (now - cloud.lastTickTime > cloud.tickInterval) {
            monsters.forEach(monster => {
                const dist = Math.sqrt(
                    Math.pow((cloud.x) - (monster.x + monster.size / 2), 2) +
                    Math.pow((cloud.y) - (monster.y + monster.size / 2), 2),
                );
                if (dist < cloud.radius) {
                    applyDamageToMonster(monster, cloud.damagePerTick);
                }
            });
            cloud.lastTickTime = now;
        }
        cloud.duration -= (Date.now() - (cloud.lastDurationUpdate || now));
        cloud.lastDurationUpdate = now;
        if (cloud.duration <= 0) {
            poisonClouds.splice(cloudIndex, 1);
        }
    });
}

function takeDamage(amount) {
    if (player.shield > 0) {
        const remainingDamage = amount - player.shield;
        player.shield = Math.max(0, player.shield - amount);
        if (remainingDamage > 0) {
            player.health -= remainingDamage;
        }
    } else {
        player.health -= amount;
    }
    if (player.health < 0) player.health = 0;
}


function regenerateMana() {
    if (player.mana < player.maxMana) {
        player.mana = Math.min(player.maxMana, player.mana + player.manaRegenRate);
    }
}

function gainXP(amount) {
    player.xp += amount;
    if (player.xp >= player.xpToNextLevel) {
        levelUp();
    }
}

function levelUp() {
    player.level++;
    player.xp -= player.xpToNextLevel;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * LEVEL_UP_XP_MULTIPLIER);
    player.skillPoints++;
    player.maxHealth += 20;
    player.health = player.maxHealth;
    player.maxMana += 10;
    player.mana = player.maxMana;

    difficultyLevel += 0.2;

    updateUnlockSkillButtons();
}

function endGame() {
    gameState = 'GAME_OVER';
    showScreen(gameOverScreen);
}

function resetGame() {
    player = {
        // Redução de 60% no tamanho do player (0.4 do original)
        size: PLAYER_SIZE * 0.4,
        x: GAME_WIDTH / 2 - (PLAYER_SIZE * 0.4) / 2, // Posicionar centralizado com o novo tamanho
        y: GAME_HEIGHT - (PLAYER_SIZE * 0.4) - 20, // Posicionar acima da base com o novo tamanho
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        level: 1,
        xp: 0,
        xpToNextLevel: LEVEL_UP_XP_BASE,
        skillPoints: 0,
        activeSpells: ['Fagulha'],
        passiveSkills: [],
        currentSpellIndex: 0,
        spellPower: 1,
        manaRegenRate: 0.1,
        shield: 0,
        cooldownReduction: 0,
        criticalChance: 0,
        movementSpeedBonus: 0
    };
    for (const spellName in spellsData) {
        spellLastCastTime[spellName] = 0;
    }

    monsters = [];
    spells = [];
    monsterProjectiles = [];
    poisonClouds = [];
    keys = {};
    isMovingLeft = false;
    isMovingRight = false;
    lastMonsterSpawnTime = 0;
    difficultyLevel = 1;

    updateUnlockSkillButtons();
    updateHUD();
    resizeCanvas(); // Garante que o player é posicionado corretamente no novo tamanho
}

function startGame() {
    resetGame();
    gameState = 'PLAYING';
    showScreen(gameContent); // Mostra a tela do jogo
    requestAnimationFrame(gameLoop);
}

// --- Funções da Árvore de Habilidades ---
function toggleSkillTree() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED_SKILL_TREE';
        skillTree.classList.remove('hidden');
    } else if (gameState === 'PAUSED_SKILL_TREE') {
        skillTree.classList.add('hidden');
        gameState = 'PLAYING';
        requestAnimationFrame(gameLoop); // Retoma o loop do jogo
    }
    updateUnlockSkillButtons(); // Atualiza botões sempre que abrir/fechar
}

function unlockSkill(skillId) {
    const skill = skillsData[skillId];
    if (!skill) return;

    if (player.skillPoints >= skill.cost) {
        let alreadyUnlocked = false;

        if (skill.type === 'active') {
            if (player.activeSpells.includes(skill.name)) {
                alreadyUnlocked = true;
                alert('Você já tem essa magia!');
            } else {
                skill.unlock();
                player.currentSpellIndex = player.activeSpells.length - 1;
            }
        } else if (skill.type === 'passive') {
            if (player.passiveSkills.includes(skillId)) {
                alreadyUnlocked = true;
                alert('Você já tem essa habilidade passiva!');
            } else {
                player.passiveSkills.push(skillId);
                skill.effect();
            }
        }

        if (!alreadyUnlocked) {
            player.skillPoints -= skill.cost;
            updateHUD();
            updateUnlockSkillButtons();
        }

    } else {
        alert('Pontos de Habilidade insuficientes!');
    }
}

function updateUnlockSkillButtons() {
    unlockSkillButtons.forEach(button => {
        const skillId = button.dataset.skillId;
        const skill = skillsData[skillId];

        if (!skill) {
            button.disabled = true;
            button.textContent = 'Indisponível';
            return;
        }

        let alreadyUnlocked = false;
        if (skill.type === 'active') {
            alreadyUnlocked = player.activeSpells.includes(skill.name);
        } else if (skill.type === 'passive') {
            alreadyUnlocked = player.passiveSkills.includes(skillId);
        }

        if (alreadyUnlocked) {
            button.disabled = true;
            button.textContent = 'Desbloqueado';
            button.classList.add('unlocked');
        } else if (player.skillPoints < skill.cost) {
            button.disabled = true;
            button.textContent = `Desbloquear (${skill.cost} SP)`;
            button.classList.remove('unlocked');
        } else {
            button.disabled = false;
            button.textContent = `Desbloquear (${skill.cost} SP)`;
            button.classList.remove('unlocked');
        }
    });
}

// --- Event Listeners para Desktop (Teclado) ---
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (gameState === 'PLAYING') { // Apenas permite input se o jogo estiver PLAYING
        if (e.key === ' ') {
            e.preventDefault();
            castSpell();
        } else if (e.key === 'q' || e.key === 'Q') {
            player.currentSpellIndex = (player.currentSpellIndex - 1 + player.activeSpells.length) % player.activeSpells.length;
            updateHUD();
        } else if (e.key === 'e' || e.key === 'E') {
            player.currentSpellIndex = (player.currentSpellIndex + 1) % player.activeSpells.length;
            updateHUD();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- Event Listeners para Mobile (Toque) ---
moveLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState === 'PLAYING') isMovingLeft = true; });
moveLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); isMovingLeft = false; });
moveLeftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); isMovingLeft = false; });

moveRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState === 'PLAYING') isMovingRight = true; });
moveRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); isMovingRight = false; });
moveRightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); isMovingRight = false; });

castSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') {
        castSpell();
    }
});

prevSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') {
        player.currentSpellIndex = (player.currentSpellIndex - 1 + player.activeSpells.length) % player.activeSpells.length;
        updateHUD();
    }
});

nextSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') {
        player.currentSpellIndex = (player.currentSpellIndex + 1) % player.activeSpells.length;
        updateHUD();
    }
});

// Event Listeners para os botões do Menu e Game Over
startGameBtn.addEventListener('click', startGame);
restartGameBtn.addEventListener('click', startGame); // Ao invés de restartGame, chama startGame para resetar e iniciar

// Verificação se os elementos existem antes de adicionar event listeners
if (openSkillsBtn) {
    openSkillsBtn.addEventListener('click', toggleSkillTree);
} else {
    console.error("Erro: Botão 'Habilidades' com ID 'open-skills-btn' não encontrado no HTML!");
}

if (closeSkillTreeBtn) {
    closeSkillTreeBtn.addEventListener('click', toggleSkillTree);
} else {
    console.error("Erro: Botão 'Fechar Árvore de Habilidades' com ID 'close-skill-tree' não encontrado no HTML!");
}


unlockSkillButtons.forEach(button => {
    button.addEventListener('click', () => {
        const skillId = button.dataset.skillId;
        unlockSkill(skillId);
    });
});


// --- Loop Principal do Jogo ---
let lastFrameTime = 0;
function gameLoop(currentTime) {
    // Apenas executa a lógica do jogo se o estado for 'PLAYING'
    if (gameState === 'PLAYING') {
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        // Atualiza o offset da animação do jogador
        playerAnimationOffset = PLAYER_ANIMATION_AMPLITUDE * Math.sin(Date.now() * PLAYER_ANIMATION_SPEED * 0.001);

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Desenha o background
        if (loadedAssets.background && loadedAssets.background.complete) {
            ctx.drawImage(loadedAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            // Opcional: Desenhe uma cor de fundo enquanto a imagem carrega
            ctx.fillStyle = '#333'; // Exemplo de cor de fundo cinza escuro
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        movePlayer();
        spawnMonster();
        moveMonsters();
        moveSpells();
        moveMonsterProjectiles();
        checkCollisions();
        regenerateMana();

        drawPlayer();
        drawMonsters();
        drawSpells();
        drawMonsterProjectiles();
        drawPoisonClouds();
        updateHUD();
    }
    // Se o estado não for 'PLAYING', o loop ainda chama a si mesmo, mas não executa a lógica
    // Isso é importante para que o requestAnimationFrame continue rodando e o estado possa mudar
    requestAnimationFrame(gameLoop);
}

// --- Iniciar o Jogo ---
loadAssets().then(() => {
    console.log("Todos os assets carregados! Exibindo menu inicial...");
    // Inicializa o player com o tamanho reduzido ANTES de resizeCanvas
    player = {
        size: PLAYER_SIZE * 0.4, // Tamanho inicial reduzido
        x: 0, y: 0, // Posição será ajustada por resizeCanvas() e resetGame()
        health: 100, maxHealth: 100, mana: 100, maxMana: 100,
        level: 1, xp: 0, xpToNextLevel: LEVEL_UP_XP_BASE, skillPoints: 0,
        activeSpells: ['Fagulha'], passiveSkills: [], currentSpellIndex: 0,
        spellPower: 1, manaRegenRate: 0.1, shield: 0, cooldownReduction: 0,
        criticalChance: 0, movementSpeedBonus: 0
    };
    resizeCanvas(); // Ajusta o canvas e posiciona o player
    showScreen(mainMenuScreen); // Inicia mostrando o menu principal
    requestAnimationFrame(gameLoop); // Inicia o loop do jogo
}).catch(error => {
    console.error("Erro ao carregar assets:", error);
});
