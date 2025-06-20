// Definindo uma classe Player
class Player {
    constructor(gameWidth, gameHeight) {
        this.size = 50;
        this.x = gameWidth / 2 - this.size / 2;
        this.y = gameHeight - this.size - 20;
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.manaRegenRate = 0.5; // Mana regenerated per frame/update
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.activeSpells = ['Fagulha']; // Initial spell
        this.currentSpellIndex = 0;
        this.spellPowerMultiplier = 1.0;
        this.spellCooldownReduction = 0; // percentage, e.g., 0.1 for 10%
        this.movementSpeedBonus = 0; // percentage
        this.healthRegenRate = 0;
        this.shield = 0; // Temporary shield points
        this.criticalChance = 0; // percentage, 0.0 - 1.0
        this.criticalDamageBonus = 0.5; // additional damage on crit, e.g., 0.5 for 150% total
        this.animationOffset = 0; // For floating animation
    }

    // Métodos para o jogador (ex: mover, regenerar mana)
    move(isMovingLeft, isMovingRight) {
        let actualSpeed = this.speed * (1 + this.movementSpeedBonus);
        if (isMovingLeft) {
            this.x -= actualSpeed;
        }
        if (isMovingRight) {
            this.x += actualSpeed;
        }

        // Keep player within canvas bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.size > window.GAME_WIDTH) this.x = window.GAME_WIDTH - this.size;
    }

    regenerateMana() {
        this.mana = Math.min(this.maxMana, this.mana + this.manaRegenRate);
    }

    // Método para aplicar habilidade
    applyAbility(abilityName) {
        // Lógica para aplicar a habilidade ao player
        // Isso será chamado pelas funções em constants.js
        console.log(`Habilidade ${abilityName} aplicada ao jogador.`);
    }
}

// Inicializa uma instância do jogador.
// `playerState` é o objeto que conterá a instância do Player e outras variáveis relacionadas.
// É uma variável global para que outros arquivos possam acessá-lo.
let playerState = {
    player: null, // Será inicializado em `initializePlayer`
    spellLastCastTime: 0
};

// Função para inicializar (ou resetar) o player
function initializePlayer(gameWidth, gameHeight) {
    playerState.player = new Player(gameWidth, gameHeight);
    playerState.spellLastCastTime = 0; // Reseta o tempo do último lançamento de magia
}

// Variáveis para as entidades do jogo (serão gerenciadas em main.js)
let monsters = [];
let spells = [];
let monsterProjectiles = [];
let poisonClouds = [];

// Função para mover o jogador, acessando playerState
function movePlayer(keys, isMovingLeft, isMovingRight) {
    if (keys['ArrowLeft'] || keys['a']) {
        isMovingLeft = true;
    }
    if (keys['ArrowRight'] || keys['d']) {
        isMovingRight = true;
    }
    playerState.player.move(isMovingLeft, isMovingRight);
}

// Função para regenerar mana do jogador
function regenerateMana() {
    playerState.player.regenerateMana();
}
