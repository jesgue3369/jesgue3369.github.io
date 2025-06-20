// player.js - Define a classe Player e as funções relacionadas ao jogador.

// Player Class Definition
class Player {
    constructor(gameWidth, gameHeight) {
        this.size = PLAYER_SIZE; // From constants.js
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
        this.healthRegenRate = 0; // Health regenerated per frame/update (e.g., 1/60 for 1 health per second)
        this.shield = 0; // Temporary shield points
        this.criticalChance = 0; // percentage, 0.0 - 1.0
        this.criticalDamageBonus = 0.5; // additional damage on crit, e.g., 0.5 for 150% total
        this.animationOffset = 0; // For floating animation
    }

    // Método para mover o jogador com base na entrada
    move(isMovingLeft, isMovingRight) {
        let actualSpeed = this.speed * (1 + this.movementSpeedBonus);
        if (isMovingLeft) {
            this.x -= actualSpeed;
        }
        if (isMovingRight) {
            this.x += actualSpeed;
        }

        // Limita o jogador dentro dos limites do canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.size > window.GAME_WIDTH) this.x = window.GAME_WIDTH - this.size; // GAME_WIDTH do window
    }

    // Método para regenerar mana
    regenerateMana() {
        this.mana = Math.min(this.maxMana, this.mana + this.manaRegenRate);
    }

    // Método para regenerar vida
    regenerateHealth() {
        this.health = Math.min(this.maxHealth, this.health + this.healthRegenRate);
    }

    // Lógica de subir de nível (chamada pela função gainXP em gameUtils.js)
    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel; // Subtrai o XP excedente
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); // Aumenta o XP necessário para o próximo nível
        this.maxHealth += 10;
        this.health = this.maxHealth; // Cura total ao subir de nível
        this.maxMana += 10;
        this.mana = this.maxMana; // Mana total ao subir de nível
        console.log(`Jogador subiu para o nível ${this.level}!`);
        // Aciona a tela de escolha de habilidade através de uma função exposta globalmente
        if (window.gameFunctions && typeof window.gameFunctions.pauseGameForAbilityChoice === 'function') {
            window.gameFunctions.pauseGameForAbilityChoice(); 
        }
    }
}

// Objeto de estado global do jogador (inicializado por main.js)
// Ele conterá a instância do Player e outras variáveis relacionadas ao jogador.
window.playerState = {
    player: null, // Será inicializado em main.js
    spellLastCastTime: 0
};

// Função para inicializar (ou resetar) a instância do player
function initializePlayer(gameWidth, gameHeight) {
    window.playerState.player = new Player(gameWidth, gameHeight);
    window.playerState.spellLastCastTime = 0;
    console.log("Player inicializado:", window.playerState.player);
}

// Função auxiliar para gerenciar o movimento do jogador com base em teclas/toque
function handlePlayerMovement(keys, isMovingLeft, isMovingRight) {
    // Combina entrada de teclado e toque
    const finalIsMovingLeft = keys['ArrowLeft'] || keys['a'] || isMovingLeft;
    const finalIsMovingRight = keys['ArrowRight'] || keys['d'] || isMovingRight;

    if (window.playerState.player) {
        window.playerState.player.move(finalIsMovingLeft, finalIsMovingRight);
    }
}

// Função auxiliar para gerenciar a regeneração de mana do jogador
function handlePlayerManaRegen() {
    if (window.playerState.player) {
        window.playerState.player.regenerateMana();
    }
}

// Função auxiliar para gerenciar a regeneração de vida do jogador
function handlePlayerHealthRegen() {
    if (window.playerState.player) {
        window.playerState.player.regenerateHealth();
    }
}
