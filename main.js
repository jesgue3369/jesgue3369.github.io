const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startGameBtn = document.getElementById('start-game-btn');
const restartGameBtn = document.getElementById('restart-game');

const moveLeftBtn = document.getElementById('move-left-btn');
const moveRightBtn = document.getElementById('move-right-btn');
const castSpellBtn = document.getElementById('cast-spell-btn');
const prevSpellBtn = document.getElementById('prev-spell-btn');
const nextSpellBtn = document.getElementById('next-spell-btn');

// --- Global Game State ---
let gameStates = {
    gameState: 'MENU', // Possible states: 'MENU', 'PLAYING', 'WAVE_COMPLETE', 'CHOOSING_ABILITY', 'GAME_OVER'
    currentWave: 0,
    monstersInWave: 0,
    monstersKilledInWave: 0,
    spawnedMonstersCount: 0, // How many monsters have been *queued* to spawn this wave
    isMovingLeft: false,
    isMovingRight: false,
    keys: {}
};

// Global player state (defined in player.js)
// playerState.player, playerState.spellLastCastTime

let animationFrameId; // To store the requestAnimationFrame ID
let lastFrameTime = 0; // For delta time calculation

// --- Game Initialization and Reset ---
function resetGame() {
    initializePlayer(GAME_WIDTH, GAME_HEIGHT); // From player.js
    
    // Reset global arrays
    monsters = [];
    spells = [];
    monsterProjectiles = [];
    poisonClouds = [];

    // Reset game state
    gameStates.currentWave = 0;
    gameStates.monstersInWave = 0;
    gameStates.monstersKilledInWave = 0;
    gameStates.spawnedMonstersCount = 0;
    gameStates.keys = {};
    gameStates.isMovingLeft = false;
    gameStates.isMovingRight = false;
    
    // Reset monster spawn timer in monsters.js
    lastMonsterSpawnTime = 0;

    updateHUD(playerState.player, gameStates.currentWave); // From gameUtils.js
    resizeCanvas(canvas, playerState.player); // From gameUtils.js
}

function startGame() {
    resetGame();
    startNextWave();
}

function endGame() {
    gameStates.gameState = 'GAME_OVER';
    showScreen(gameOverScreen); // From gameUtils.js
}

function startNextWave() {
    gameStates.currentWave++;
    gameStates.monstersKilledInWave = 0;
    gameStates.spawnedMonstersCount = 0;

    gameStates.monstersInWave = 5 + (gameStates.currentWave * 2);

    gameStates.gameState = 'PLAYING';
    showScreen(gameContent); // From gameUtils.js
    console.log(`Starting Wave ${gameStates.currentWave} with ${gameStates.monstersInWave} monsters.`);
    
    if (!animationFrameId) {
        gameLoop();
    }
}

function pauseGameForAbilityChoice() {
    gameStates.gameState = 'CHOOSING_ABILITY';
    showScreen(abilityCardsScreen); // From gameUtils.js
    generateAbilityCards(playerState.player, startNextWave); // From gameUtils.js, pass player and startNextWave callback
}

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    gameStates.keys[e.key] = true;
    if (gameStates.gameState === 'PLAYING') {
        if (e.key === ' ') {
            e.preventDefault();
            castSpell(playerState.player, playerState.spellLastCastTime, monsters, applyDamageToMonster);
        } else if (e.key === 'q' || e.key === 'Q') {
            playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex - 1 + playerState.player.activeSpells.length) % playerState.player.activeSpells.length;
            updateHUD(playerState.player, gameStates.currentWave);
        } else if (e.key === 'e' || e.key === 'E') {
            playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex + 1) % playerState.player.activeSpells.length;
            updateHUD(playerState.player, gameStates.currentWave);
        }
    }
});

document.addEventListener('keyup', (e) => {
    gameStates.keys[e.key] = false;
});

// Mobile button listeners
moveLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameStates.gameState === 'PLAYING') gameStates.isMovingLeft = true; });
moveLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); gameStates.isMovingLeft = false; });
moveLeftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); gameStates.isMovingLeft = false; });

moveRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameStates.gameState === 'PLAYING') gameStates.isMovingRight = true; });
moveRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); gameStates.isMovingRight = false; });
moveRightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); gameStates.isMovingRight = false; });

castSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameStates.gameState === 'PLAYING') {
        castSpell(playerState.player, playerState.spellLastCastTime, monsters, applyDamageToMonster);
    }
});

prevSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameStates.gameState === 'PLAYING') {
        playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex - 1 + playerState.player.activeSpells.length) % playerState.player.activeSpells.length;
        updateHUD(playerState.player, gameStates.currentWave);
    }
});

nextSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameStates.gameState === 'PLAYING') {
        playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex + 1) % playerState.player.activeSpells.length;
        updateHUD(playerState.player, gameStates.currentWave);
    }
});

startGameBtn.addEventListener('click', startGame);
restartGameBtn.addEventListener('click', startGame);

window.addEventListener('resize', () => resizeCanvas(canvas, playerState.player));

// --- Main Game Loop ---
function gameLoop(currentTime) {
    if (!lastFrameTime) lastFrameTime = currentTime;
    // const deltaTime = currentTime - lastFrameTime; // For frame-rate independent physics if needed
    lastFrameTime = currentTime;

    if (gameStates.gameState === 'PLAYING') {
        playerState.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(currentTime * ENTITY_ANIMATION_SPEED * 0.001);

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (loadedAssets.background && loadedAssets.background.complete) {
            ctx.drawImage(loadedAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        movePlayer(gameStates.keys, gameStates.isMovingLeft, gameStates.isMovingRight); // From player.js
        
        // Spawn monster and update spawned count
        if (gameStates.spawnedMonstersCount < gameStates.monstersInWave) {
             const monsterSpawned = spawnMonster(gameStates.currentWave, gameStates.monstersInWave, gameStates.spawnedMonstersCount, GAME_WIDTH, GAME_HEIGHT); // From monsters.js
             if (monsterSpawned) {
                gameStates.spawnedMonstersCount++;
             }
        }
       
        moveMonsters(playerState.player, endGame); // From monsters.js
        moveSpells(); // From spells.js
        moveMonsterProjectiles(); // From monsters.js

        // Check all collisions
        checkSpellCollisions(playerState.player, monsters, endGame, handleMonsterDefeat, applyDamageToMonster); // From spells.js
        // Monster Projectiles vs Player is handled in gameUtils's takeDamage, or here?
        // Let's add explicit check here for monster projectiles
        // Monster Projectiles vs Player (moved from gameUtils to main logic for clarity)
        for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
            let projectile = monsterProjectiles[i];
            const projCenterX = projectile.x + projectile.size / 2;
            const projCenterY = projectile.y + projectile.size / 2;
            const playerCenterX = playerState.player.x + playerState.player.size / 2;
            const playerCenterY = playerState.player.y + playerState.player.size / 2;

            const dist = Math.sqrt(
                Math.pow(projCenterX - playerCenterX, 2) +
                Math.pow(projCenterY - playerCenterY, 2)
            );

            if (dist < (projectile.size / 2 + playerState.player.size / 2)) {
                takeDamage(playerState.player, projectile.damage, endGame); // From gameUtils.js
                monsterProjectiles.splice(i, 1);
            }
        }

        // Monsters (contact) vs Player (moved from gameUtils to main logic for clarity)
        for (let i = monsters.length - 1; i >= 0; i--) {
            let monster = monsters[i];
            if (monster.type === 'shooter') {
                continue;
            }

            if (monster.y + monster.size > playerState.player.y &&
                monster.y < playerState.player.y + playerState.player.size &&
                monster.x + monster.size > playerState.player.x &&
                monster.x < playerState.player.x + playerState.player.size) {

                if (monster.type === 'exploder') {
                    takeDamage(playerState.player, monster.contactDamage, endGame);
                    handleMonsterDefeat(monster, i, playerState.player, gainXP); // Exploder self-destructs
                } else {
                    takeDamage(playerState.player, monster.contactDamage, endGame);
                    // Standard monsters don't despawn on contact, they continue to move past player
                    // unless they are defeated by damage. If they are defeated by contact, they should be removed.
                    // For now, let's assume contact is just damage, monster stays until health 0
                    // OR if you want them to be removed like in previous code:
                    // monsters.splice(i, 1);
                }
            }
        }


        regenerateMana(); // From player.js

        drawPlayer(playerState.player, playerState.animationOffset); // From gameUtils.js
        drawMonsters(monsters); // From gameUtils.js
        drawSpells(spells); // From gameUtils.js
        drawMonsterProjectiles(monsterProjectiles); // From gameUtils.js
        drawPoisonClouds(poisonClouds); // From gameUtils.js
        updateHUD(playerState.player, gameStates.currentWave); // From gameUtils.js

        if (gameStates.monstersKilledInWave >= gameStates.monstersInWave && monsters.length === 0 && monsterProjectiles.length === 0) {
            console.log(`Wave ${gameStates.currentWave} complete!`);
            gameStates.gameState = 'WAVE_COMPLETE';
            pauseGameForAbilityChoice();
        }

    } else if (gameStates.gameState === 'WAVE_COMPLETE' || gameStates.gameState === 'CHOOSING_ABILITY' || gameStates.gameState === 'MENU' || gameStates.gameState === 'GAME_OVER') {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        if (loadedAssets.background && loadedAssets.background.complete) {
            ctx.drawImage(loadedAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        drawPlayer(playerState.player, playerState.animationOffset);
        drawMonsters(monsters);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Initial setup
loadAssets().then(() => {
    console.log("Todos os assets carregados! Exibindo menu inicial...");
    // Initialize player and resize canvas after assets are loaded and HTML elements are ready
    // We need to set ctx and GAME_WIDTH/GAME_HEIGHT globally for gameUtils
    window.ctx = ctx; // Make ctx accessible globally
    window.GAME_WIDTH = canvas.width; // Initial value, will be updated by resizeCanvas
    window.GAME_HEIGHT = canvas.height; // Initial value, will be updated by resizeCanvas

    resetGame(); // Perform initial setup including player initialization and canvas resize
    showScreen(mainMenuScreen); // Show the main menu
    animationFrameId = requestAnimationFrame(gameLoop); // Start the loop
}).catch(error => {
    console.error("Erro ao carregar assets:", error);
});
