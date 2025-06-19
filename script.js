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
const PROJECTILE_SPEED = 7; // Velocidade padrão dos projéteis (tanto do jogador quanto dos monstros)
const INITIAL_MONSTER_SPEED = 1;
const MONSTER_SPAWN_INTERVAL = 1500; // ms
const XP_PER_MONSTER = 10;
const LEVEL_UP_XP_BASE = 100;
const LEVEL_UP_XP_MULTIPLIER = 1.2;

const CONTROLLER_BAR_HEIGHT = 100; // Deve corresponder ao CSS

// --- Estado do Jogo ---
let player = {
    x: 0,
    y: 0,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    level: 1,
    xp: 0,
    xpToNextLevel: LEVEL_UP_XP_BASE,
    skillPoints: 0,
    activeSpells: ['Fagulha'], // Fagulha é a magia inicial
    passiveSkills: [], // Armazena IDs de skills passivas
    currentSpellIndex: 0,
    spellPower: 1,
    manaRegenRate: 0.1,
    shield: 0, // Novo: Escudo do jogador
    cooldownReduction: 0, // Novo: Redução de recarga
    criticalChance: 0, // Novo: Chance crítica (0.0 a 1.0)
    movementSpeedBonus: 0 // Novo: Bônus de velocidade de movimento
};

let monsters = [];
let spells = [];
let monsterProjectiles = [];
let poisonClouds = []; // Para a Névoa Venenosa
let keys = {};
let isMovingLeft = false;
let isMovingRight = false;
let lastMonsterSpawnTime = 0;
let gameOver = false;
let gamePaused = false;
let difficultyLevel = 1;

// --- Definições de Magias e Habilidades ---
const spellsData = {
    'Fagulha': { damage: 10, cost: 5, color: 'yellow', cooldown: 100 }, // Cooldown em ms
    'Bola de Fogo': { damage: 30, cost: 15, color: 'orange', cooldown: 500 },
    'Estilhaço de Gelo': { damage: 25, cost: 12, color: 'lightblue', cooldown: 400 },
    'Rajada Arcana': { damage: 15, cost: 8, color: 'purple', cooldown: 150 }, // Rápida e barata
    'Cura Menor': { heal: 30, cost: 20, color: 'lime', cooldown: 1000, type: 'heal' }, // Cura o jogador
    'Escudo Arcano': { shieldAmount: 50, cost: 25, color: 'cyan', cooldown: 1500, type: 'shield' }, // Concede escudo
    'Relâmpago': { damage: 40, cost: 30, color: 'gold', cooldown: 800, type: 'aoe_lightning', radius: 100 }, // Dano em área pequena
    'Névoa Venenosa': { damagePerTick: 5, tickInterval: 500, duration: 3000, radius: 80, cost: 25, color: 'darkgreen', cooldown: 1200, type: 'aoe_dot' },
    'Explosão Congelante': { damage: 35, slowFactor: 0.5, slowDuration: 2000, radius: 70, cost: 28, color: 'skyblue', cooldown: 1000, type: 'aoe_slow' },
    'Drenar Vida': { damage: 20, lifeSteal: 0.5, cost: 18, color: 'darkred', cooldown: 600, type: 'lifesteal' }, // Rouba vida
    'Tempestade de Meteoros': { damage: 20, numProjectiles: 5, spread: 100, cost: 40, color: 'brown', cooldown: 2000, type: 'multishot' }
};

// Adiciona um tempo para controlar a recarga de cada magia
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
    'cooldown-reduction': { name: 'Redução de Recarga', type: 'passive', cost: 3, effect: () => player.cooldownReduction += 0.1 }, // 10% de redução
    'critical-chance': { name: 'Chance Crítica', type: 'passive', cost: 3, effect: () => player.criticalChance = Math.min(0.5, player.criticalChance + 0.05) }, // Max 50%
    'movement-speed': { name: 'Velocidade de Movimento', type: 'passive', cost: 2, effect: () => player.movementSpeedBonus += 1 }
};

// --- Definições de Monstros ---
const monsterTypes = {
    'basic': {
        color: '#f00',       // Vermelho
        initial: 'B',
        sizeMultiplier: 1,
        healthMultiplier: 1,
        speedMultiplier: 1,
        canShoot: false,
        xp: 10,
        contactDamage: 10 // Dano por contato com o player
    },
    'tank': {
        color: '#8B4513',    // Marrom
        initial: 'T',
        sizeMultiplier: 1.5,
        healthMultiplier: 3,
        speedMultiplier: 0.7,
        canShoot: false,
        xp: 30,
        contactDamage: 20
    },
    'shooter': {
        color: '#6A5ACD',    // Roxo SlateBlue
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
        contactDamage: 0 // ATENÇÃO: Shooter agora NÃO causa dano por contato
    },
    'fast': {
        color: '#00FFFF',    // Ciano
        initial: 'F',
        sizeMultiplier: 0.8,
        healthMultiplier: 0.7,
        speedMultiplier: 1.5,
        canShoot: false,
        xp: 15,
        contactDamage: 8
    },
    'healer': { // Novo: Cura outros monstros
        color: '#00FF00',    // Verde
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
        type: 'healer' // Tipo específico para lógica de cura
    },
    'exploder': { // Novo: Explode ao morrer ou contato
        color: '#FF4500',    // Laranja Avermelhado
        initial: 'E',
        sizeMultiplier: 1.2,
        healthMultiplier: 0.8,
        speedMultiplier: 1.0,
        canShoot: false,
        xp: 20,
        contactDamage: 30, // Dano de contato ao explodir
        explosionRadius: 80,
        type: 'exploder'
    },
    'ghost': { // Novo: Chance de ignorar dano
        color: 'rgba(255,255,255,0.4)', // Translúcido
        initial: 'G',
        sizeMultiplier: 0.9,
        healthMultiplier: 0.9,
        speedMultiplier: 1.2,
        canShoot: false,
        xp: 20,
        contactDamage: 12,
        evadeChance: 0.2, // 20% de chance de evadir dano
        type: 'ghost'
    },
    'giant_worm': { // Novo: Mais vida, atinge mais forte
        color: '#A52A2A',    // Marrom avermelhado
        initial: 'W', // Worm
        sizeMultiplier: 2.0, // Monstro grande
        healthMultiplier: 5.0, // Muita vida
        speedMultiplier: 0.5, // Lento
        canShoot: false,
        xp: 50,
        contactDamage: 40,
        type: 'giant_worm'
    }
};

// --- Redimensionamento do Canvas ---
function resizeCanvas() {
    const gameContainer = document.getElementById('game-container');
    canvas.width = gameContainer.clientWidth;

    // A altura do canvas é a altura total do contêiner menos a altura da barra de controle
    canvas.height = gameContainer.clientHeight - CONTROLLER_BAR_HEIGHT;

    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;

    // Ajusta a posição do jogador para a nova largura/altura do CANVAS
    player.x = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
    // O player.y deve estar na parte inferior do CANVAS, com uma margem de 20px
    player.y = GAME_HEIGHT - PLAYER_SIZE - 20;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Chamada inicial para definir o tamanho

// --- Funções de Desenho ---
function drawPlayer() {
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    ctx.fillStyle = 'white';
    ctx.font = `${PLAYER_SIZE * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2);

    // Desenhar escudo se houver
    if (player.shield > 0) {
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2, PLAYER_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawMonsters() {
    monsters.forEach(monster => {
        ctx.fillStyle = monster.color;
        ctx.beginPath();
        ctx.arc(monster.x + monster.size / 2, monster.y + monster.size / 2, monster.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Desenhar a inicial do monstro
        ctx.fillStyle = 'white'; // Cor do texto
        ctx.font = `${monster.size * 0.6}px Arial`; // Tamanho da fonte proporcional ao monstro
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(monster.initial, monster.x + monster.size / 2, monster.y + monster.size / 2);

        // Opcional: desenhar barra de vida do monstro
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
        if (spell.type === 'aoe_lightning') {
            ctx.strokeStyle = spell.color;
            ctx.lineWidth = 3;
            // Simula um raio: linha do topo até o ponto de impacto
            ctx.beginPath();
            ctx.moveTo(spell.x, 0); // Começa no topo
            ctx.lineTo(spell.x, spell.y); // Termina no ponto de impacto
            ctx.stroke();

            // Desenha a "explosão" no ponto de impacto
            ctx.fillStyle = spell.color;
            ctx.beginPath();
            ctx.arc(spell.x, spell.y, spell.radius / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
             // Desenha a área de efeito (Névoa Venenosa/Explosão Congelante)
             ctx.fillStyle = spell.color.replace(')', ', 0.4)'); // Mais transparente
             ctx.beginPath();
             ctx.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2);
             ctx.fill();
        }
        else {
            ctx.fillStyle = spell.color;
            ctx.beginPath();
            ctx.arc(spell.x, spell.y, SPELL_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawMonsterProjectiles() {
    monsterProjectiles.forEach(projectile => {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPoisonClouds() {
    poisonClouds.forEach(cloud => {
        if (cloud.duration > 0) {
            ctx.fillStyle = `rgba(128, 0, 128, ${cloud.duration / spellsData['Névoa Venenosa'].duration * 0.4})`; // Mais transparente conforme desaparece
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
    if (keys['ArrowRight'] && player.x < GAME_WIDTH - PLAYER_SIZE) {
        player.x += currentSpeed;
    }

    if (isMovingLeft && player.x > 0) {
        player.x -= currentSpeed;
    }
    if (isMovingRight && player.x < GAME_WIDTH - PLAYER_SIZE) {
        player.x += currentSpeed;
    }
}

function spawnMonster() {
    const now = Date.now();
    if (now - lastMonsterSpawnTime > MONSTER_SPAWN_INTERVAL / difficultyLevel) {
        const x = Math.random() * (GAME_WIDTH - INITIAL_MONSTER_SIZE);

        let monsterTypeKeys = Object.keys(monsterTypes);
        // Excluir 'healer' e 'exploder' e 'ghost' e 'giant_worm' de spawns iniciais
        let availableTypes = monsterTypeKeys.filter(type =>
            difficultyLevel >= 1.0 || (type !== 'healer' && type !== 'exploder' && type !== 'ghost' && type !== 'giant_worm')
        );

        // Aumentar a chance de monstros mais fortes com a dificuldade
        let monsterTypeKey;
        const rand = Math.random();
        if (difficultyLevel >= 4 && rand < 0.1) { // 10% de chance de Giant Worm
            monsterTypeKey = 'giant_worm';
        } else if (difficultyLevel >= 3 && rand < 0.2) { // 10% de chance de Ghost (total 20%)
            monsterTypeKey = 'ghost';
        } else if (difficultyLevel >= 2.5 && rand < 0.3) { // 10% de chance de Exploder (total 30%)
            monsterTypeKey = 'exploder';
        } else if (difficultyLevel >= 2 && rand < 0.4) { // 10% de chance de Healer (total 40%)
            monsterTypeKey = 'healer';
        } else if (rand < 0.5 + (difficultyLevel * 0.1)) { // Aumentar chance de tipos existentes com dificuldade
            const basicTypes = ['basic', 'shooter', 'tank', 'fast'];
            monsterTypeKey = basicTypes[Math.floor(Math.random() * basicTypes.length)];
        } else {
            monsterTypeKey = 'basic';
        }

        // Fallback caso o tipo escolhido não esteja disponível para a dificuldade
        if (!availableTypes.includes(monsterTypeKey)) {
            monsterTypeKey = 'basic';
        }


        const typeData = monsterTypes[monsterTypeKey];
        const monsterSize = INITIAL_MONSTER_SIZE * typeData.sizeMultiplier;
        const monsterHealth = 20 * difficultyLevel * typeData.healthMultiplier;
        const monsterSpeed = INITIAL_MONSTER_SPEED * (1 + (difficultyLevel - 1) * 0.1) * typeData.speedMultiplier;

        monsters.push({
            x: x,
            y: -monsterSize,
            health: monsterHealth,
            maxHealth: monsterHealth, // Guardar maxHealth para barra de vida
            speed: monsterSpeed,
            type: monsterTypeKey,
            color: typeData.color,
            initial: typeData.initial, // Adicionado
            size: monsterSize,
            canShoot: typeData.canShoot,
            projectileColor: typeData.projectileColor,
            projectileDamage: typeData.projectileDamage,
            shootInterval: typeData.shootInterval,
            lastShotTime: typeData.lastShotTime || 0,
            xpValue: typeData.xp,
            contactDamage: typeData.contactDamage,
            // Propriedades específicas para novos tipos
            healAmount: typeData.healAmount || 0,
            healRadius: typeData.healRadius || 0,
            healInterval: typeData.healInterval || 0,
            lastHealTime: typeData.lastHealTime || 0,
            explosionRadius: typeData.explosionRadius || 0,
            evadeChance: typeData.evadeChance || 0,
            isSlowed: false,
            slowTimer: 0
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

        monster.y += currentMonsterSpeed;

        // Lógica para atiradores
        if (monster.canShoot && now - monster.lastShotTime > monster.shootInterval && monster.y > 0 && monster.y < GAME_HEIGHT * 0.7) {
            // Calcular a direção para o jogador
            const monsterCenterX = monster.x + monster.size / 2;
            const monsterCenterY = monster.y + monster.size / 2;
            const playerCenterX = player.x + PLAYER_SIZE / 2;
            const playerCenterY = player.y + PLAYER_SIZE / 2;

            const dx = playerCenterX - monsterCenterX;
            const dy = playerCenterY - monsterCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Normalizar o vetor de direção e multiplicar pela velocidade do projétil
            const vx = (dx / distance) * PROJECTILE_SPEED;
            const vy = (dy / distance) * PROJECTILE_SPEED;


            monsterProjectiles.push({
                x: monsterCenterX,
                y: monsterCenterY,
                color: monster.projectileColor,
                damage: monster.projectileDamage,
                size: SPELL_SIZE / 2,
                vx: vx, // Adicionado velocidade X
                vy: vy  // Adicionado velocidade Y
            });
            monster.lastShotTime = now;
        }

        // Lógica para curadores
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


        if (monster.y > GAME_HEIGHT) {
            // Se for um exploder e sair da tela, não explode, apenas desaparece
            if (monster.type === 'exploder') {
                monsters.splice(index, 1);
                return;
            }

            // ATENÇÃO: Shooter agora NÃO causa dano ao passar da tela
            if (monster.type !== 'shooter') {
                // Dano de contato ao player se o monstro sair da tela
                takeDamage(monster.contactDamage);
            }
            monsters.splice(index, 1);
            if (player.health <= 0) {
                endGame();
            }
        }
    });
}

function moveMonsterProjectiles() {
    monsterProjectiles.forEach((projectile, index) => {
        projectile.x += projectile.vx; // Usa vx
        projectile.y += projectile.vy; // Usa vy

        // Remover projéteis que saem da tela
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

        const spellX = player.x + PLAYER_SIZE / 2;
        const spellY = player.y;

        let finalDamage = spellData.damage * player.spellPower;
        if (Math.random() < player.criticalChance && spellData.damage) { // Só magias com dano podem ser críticas
            finalDamage *= 2; // Dano crítico dobrado
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
                // Aplica o dano imediatamente aos monstros na área
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
                    damagePerTick: finalDamage, // damagePerTick pode ser afetado por spellPower
                    tickInterval: spellData.tickInterval,
                    duration: spellData.duration,
                    radius: spellData.radius,
                    color: spellData.color,
                    lastTickTime: now
                });
                break;
            case 'aoe_slow':
                spells.push({ x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, radius: spellData.radius });
                // Aplica o dano e lentidão imediatamente
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
                    // Pequena variação na posição X para simular "chuva"
                    const offsetX = (Math.random() - 0.5) * spellData.spread;
                    spells.push({ x: spellX + offsetX, y: spellY, damage: finalDamage, color: spellData.color });
                }
                break;
            default: // Magias de projétil padrão
                spells.push({
                    x: spellX,
                    y: spellY,
                    damage: finalDamage,
                    color: spellData.color,
                    type: spellData.type // Garante que o tipo padrão seja propagado
                });
                break;
        }
    }
}

function moveSpells() {
    spells.forEach((spell, index) => {
        if (spell.type === 'aoe_lightning' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
            // Essas magias não se movem, apenas ativam e ficam por um tempo para efeitos visuais
            // Remove as magias de efeito de área após um curto período visual
            if (!spell.spawnTime) spell.spawnTime = Date.now();
            if (Date.now() - spell.spawnTime > 200) { // Tempo de exibição visual
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
        return; // Monstro fantasma evadiu o ataque
    }
    monster.health -= damage;
}


function checkCollisions() {
    // Colisão de magias do jogador com monstros
    spells.forEach((spell, spellIndex) => {
        // Magias de efeito de área (AOE) já aplicam dano no cast, são apenas visuais aqui
        if (spell.type === 'aoe_lightning' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
            return;
        }

        monsters.forEach((monster, monsterIndex) => {
            if (spell.x < monster.x + monster.size &&
                spell.x + SPELL_SIZE > monster.x &&
                spell.y < monster.y + monster.size &&
                spell.y + SPELL_SIZE > monster.y) {

                applyDamageToMonster(monster, spell.damage);

                // Drenar vida para o jogador
                if (spell.type === 'lifesteal') {
                    player.health = Math.min(player.maxHealth + player.shield, player.health + (spell.damage * spell.lifeSteal));
                }

                spells.splice(spellIndex, 1); // Remove a magia após a colisão

                if (monster.health <= 0) {
                    // Lógica para exploder ao morrer
                    if (monster.type === 'exploder') {
                        monsters.forEach(otherMonster => {
                            const dist = Math.sqrt(
                                Math.pow((monster.x + monster.size / 2) - (otherMonster.x + otherMonster.size / 2), 2) +
                                Math.pow((monster.y + monster.size / 2) - (otherMonster.y + otherMonster.size / 2), 2)
                            );
                            if (monster !== otherMonster && dist < monster.explosionRadius) {
                                applyDamageToMonster(otherMonster, monster.contactDamage * 0.5); // Dano reduzido para outros monstros
                            }
                        });
                        takeDamage(monster.contactDamage); // Exploder causa dano ao player também
                    }
                    gainXP(monster.xpValue);
                    monsters.splice(monsterIndex, 1);
                }
            }
        });
    });

    // Colisão de projéteis de monstros com o jogador
    monsterProjectiles.forEach((projectile, projIndex) => {
        // Usa as coordenadas do centro do projétil para colisão mais precisa
        const projCenterX = projectile.x + projectile.size / 2;
        const projCenterY = projectile.y + projectile.size / 2;
        const playerCenterX = player.x + PLAYER_SIZE / 2;
        const playerCenterY = player.y + PLAYER_SIZE / 2;

        const dist = Math.sqrt(
            Math.pow(projCenterX - playerCenterX, 2) +
            Math.pow(projCenterY - playerCenterY, 2)
        );

        if (dist < (projectile.size / 2 + PLAYER_SIZE / 2)) { // Colisão circular
            takeDamage(projectile.damage);
            monsterProjectiles.splice(projIndex, 1); // Remove o projétil após a colisão

            if (player.health <= 0) {
                endGame();
            }
        }
    });

    // Colisão de monstros com o jogador (contato)
    monsters.forEach((monster, index) => {
        // Se o monstro é do tipo 'shooter', ele NÃO causa dano de contato.
        // O dano para 'shooter' é EXCLUSIVAMENTE via projéteis.
        if (monster.type === 'shooter') {
            return; // Sai desta iteração se for um shooter
        }

        if (monster.y + monster.size > player.y && // Monstro está abaixo do player
            monster.y < player.y + PLAYER_SIZE &&   // Monstro está acima do player
            monster.x + monster.size > player.x &&  // Monstro está à direita do player
            monster.x < player.x + PLAYER_SIZE) {    // Monstro está à esquerda do player

            if (monster.type === 'exploder') {
                takeDamage(monster.contactDamage); // Exploder causa dano de contato ao player
                monsters.splice(index, 1); // Explode e desaparece
            } else {
                // Outros monstros causam dano por contato contínuo ou quando passam
                // Para simplificar, causa dano e remove o monstro (como se ele "passasse" pelo jogador)
                takeDamage(monster.contactDamage);
                monsters.splice(index, 1);
            }

            if (player.health <= 0) {
                endGame();
            }
        }
    });

    // Lógica para Névoa Venenosa (Damage over Time)
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
    if (player.health < 0) player.health = 0; // Evitar vida negativa
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
    player.maxHealth += 20; // Aumento base de vida no level up
    player.health = player.maxHealth;
    player.maxMana += 10; // Aumento base de mana no level up
    player.mana = player.maxMana;

    difficultyLevel += 0.2; // Aumenta a dificuldade um pouco mais rápido

    updateUnlockSkillButtons();
}

function endGame() {
    gameOver = true;
    gamePaused = true;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    player = {
        x: GAME_WIDTH / 2 - PLAYER_SIZE / 2,
        y: GAME_HEIGHT - PLAYER_SIZE - 20,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
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
    // Resetar tempos de recarga das magias
    for (const spellName in spellsData) {
        spellLastCastTime[spellName] = 0;
    }

    monsters = [];
    spells = [];
    monsterProjectiles = [];
    poisonClouds = []; // Resetar também as nuvens de veneno
    keys = {};
    isMovingLeft = false;
    isMovingRight = false;
    lastMonsterSpawnTime = 0;
    gameOver = false;
    gamePaused = false;
    difficultyLevel = 1;

    // Atualiza os botões da árvore de habilidades
    updateUnlockSkillButtons();

    gameOverScreen.classList.add('hidden');
    updateHUD();
    gameLoop();
}

// --- Funções da Árvore de Habilidades ---
function toggleSkillTree() {
    skillTree.classList.toggle('hidden');
    gamePaused = !skillTree.classList.contains('hidden');
    if (!gamePaused) {
        gameLoop();
    } else {
        // Quando a árvore de habilidades abre, atualiza o estado dos botões
        updateUnlockSkillButtons();
    }
}

function unlockSkill(skillId) {
    const skill = skillsData[skillId];
    if (!skill) return; // Garante que a skill existe

    if (player.skillPoints >= skill.cost) {
        let alreadyUnlocked = false;

        if (skill.type === 'active') {
            if (player.activeSpells.includes(skill.name)) {
                alreadyUnlocked = true;
                alert('Você já tem essa magia!');
            } else {
                skill.unlock(); // Adiciona a magia ao player.activeSpells
                player.currentSpellIndex = player.activeSpells.length - 1; // Seleciona a magia nova
            }
        } else if (skill.type === 'passive') {
            if (player.passiveSkills.includes(skillId)) {
                alreadyUnlocked = true;
                alert('Você já tem essa habilidade passiva!');
            } else {
                player.passiveSkills.push(skillId); // Adiciona o ID da skill passiva
                skill.effect(); // Aplica o efeito da passiva
            }
        }

        if (!alreadyUnlocked) {
            player.skillPoints -= skill.cost;
            updateHUD();
            updateUnlockSkillButtons(); // Atualiza o estado dos botões da árvore
        }

    } else {
        alert('Pontos de Habilidade insuficientes!');
    }
}

function updateUnlockSkillButtons() {
    unlockSkillButtons.forEach(button => {
        const skillId = button.dataset.skillId;
        const skill = skillsData[skillId];

        // Se a skill não existe em skillsData (por exemplo, Fagulha que não é desbloqueável)
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
            button.classList.add('unlocked'); // Adiciona uma classe para estilo visual
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
    if (!gamePaused) {
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
moveLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isMovingLeft = true; });
moveLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); isMovingLeft = false; });
moveLeftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); isMovingLeft = false; });

moveRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isMovingRight = true; });
moveRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); isMovingRight = false; });
moveRightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); isMovingRight = false; });

castSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!gamePaused) {
        castSpell();
    }
});

prevSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!gamePaused) {
        player.currentSpellIndex = (player.currentSpellIndex - 1 + player.activeSpells.length) % player.activeSpells.length;
        updateHUD();
    }
});

nextSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!gamePaused) {
        player.currentSpellIndex = (player.currentSpellIndex + 1) % player.activeSpells.length;
        updateHUD();
    }
});

openSkillsBtn.addEventListener('click', toggleSkillTree);
closeSkillTreeBtn.addEventListener('click', toggleSkillTree);

unlockSkillButtons.forEach(button => {
    button.addEventListener('click', () => {
        const skillId = button.dataset.skillId;
        unlockSkill(skillId);
    });
});

restartGameBtn.addEventListener('click', restartGame);


// --- Loop Principal do Jogo ---
let lastFrameTime = 0;
function gameLoop(currentTime) {
    if (gameOver || gamePaused) {
        return;
    }

    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

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

    requestAnimationFrame(gameLoop);
}

// --- Iniciar o Jogo ---
updateHUD();
updateUnlockSkillButtons();
gameLoop();