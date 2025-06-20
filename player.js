// Variáveis que precisarão ser acessíveis de outros arquivos
// Serão inicializadas em main.js e passadas ou acessadas via objeto global
let playerState = {}; // Object to hold player properties

function initializePlayer(GAME_WIDTH, GAME_HEIGHT) {
    playerState.player = {
        size: ACTUAL_PLAYER_SIZE,
        x: GAME_WIDTH / 2 - ACTUAL_PLAYER_SIZE / 2,
        y: GAME_HEIGHT - ACTUAL_PLAYER_SIZE - 20,
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        level: 1,
        xp: 0,
        xpToNextLevel: LEVEL_UP_XP_BASE,
        activeSpells: ['Fagulha'],
        currentSpellIndex: 0,
        spellPower: 1,
        manaRegenRate: 0.1,
        shield: 0,
        cooldownReduction: 0,
        criticalChance: 0,
        movementSpeedBonus: 0
    };
    playerState.spellLastCastTime = {};
    for (const spellName in SPELLS_DATA) {
        playerState.spellLastCastTime[spellName] = 0;
    }
    playerState.animationOffset = 0; // Moved animation offset to player state
}

function movePlayer(keys, isMovingLeft, isMovingRight) {
    const currentSpeed = PLAYER_SPEED + playerState.player.movementSpeedBonus;
    if (keys['ArrowLeft'] && playerState.player.x > 0) {
        playerState.player.x -= currentSpeed;
    }
    if (keys['ArrowRight'] && playerState.player.x < GAME_WIDTH - playerState.player.size) {
        playerState.player.x += currentSpeed;
    }

    if (isMovingLeft && playerState.player.x > 0) {
        playerState.player.x -= currentSpeed;
    }
    if (isMovingRight && playerState.player.x < GAME_WIDTH - playerState.player.size) {
        playerState.player.x += currentSpeed;
    }
}

function regenerateMana() {
    if (playerState.player.mana < playerState.player.maxMana) {
        playerState.player.mana = Math.min(playerState.player.maxMana, playerState.player.mana + playerState.player.manaRegenRate);
    }
}

function levelUp(pauseGameForAbilityChoiceCallback) {
    playerState.player.level++;
    playerState.player.xp -= playerState.player.xpToNextLevel;
    playerState.player.xpToNextLevel = Math.floor(playerState.player.xpToNextLevel * LEVEL_UP_XP_MULTIPLIER);
    playerState.player.maxHealth += 20;
    playerState.player.health = playerState.player.maxHealth;
    playerState.player.maxMana += 10;
    playerState.player.mana = playerState.player.maxMana;

    if (gameStates.gameState === 'PLAYING') {
        pauseGameForAbilityChoiceCallback();
    }
}
