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
    background: './assets/background.png' // Adicionado o background
};

let loadedAssets = {};
let assetsLoadedCount = 0;
let totalAssetsToLoad = Object.keys(ASSET_PATHS).length;

// --- Estado do Jogo ---
let player = {
    x: 0,
    y: 0,
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

// --- Novas variáveis para animação do jogador ---
let playerAnimationOffset = 0;
const PLAYER_ANIMATION_AMPLITUDE = 5;
const PLAYER_ANIMATION_SPEED = 5;


let monsters = [];
let spells = [];
let monsterProjectiles = [];
let poisonClouds = [];
let keys = {};
let isMovingLeft = false;
let isMovingRight = false;
let lastMonsterSpawnTime = 0;
let gameOver = false;
let gamePaused = false;
let difficultyLevel = 1;

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
    spellLastCastTime

model: http://googleusercontent.com/image_generation_content/0
