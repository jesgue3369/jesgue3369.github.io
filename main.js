// --- Elementos HTML ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Contexto do canvas

// Importante: Definir gameContent aqui para ser usado na transição de telas
const gameContent = document.getElementById('game-content'); 

const startGameBtn = document.getElementById('start-game-btn');
const restartGameBtn = document.getElementById('restart-game');

const moveLeftBtn = document.getElementById('move-left-btn');
const moveRightBtn = document.getElementById('move-right-btn');
const castSpellBtn = document.getElementById('cast-spell-btn');
const prevSpellBtn = document.getElementById('prev-spell-btn');
const nextSpellBtn = document.getElementById('next-spell-btn');

// --- Variáveis Globais (Expostas para outros módulos se necessário, mas melhor passar como args) ---
// Para simplificar a refatoração sem modules, vamos "hackear" algumas para o window
window.ctx = ctx; // Torna o contexto 2D acessível globalmente
window.GAME_WIDTH = canvas.width; // Inicializado, mas será redimensionado
window.GAME_HEIGHT = canvas.height; // Inicializado, mas será redimensionado

// --- Global Game State ---
// Tornar gameStates global no window para que outras funções como handleMonsterDefeat possam acessá-lo
window.gameStates = {
    gameState: 'MENU', // Possible states: 'MENU', 'PLAYING', 'WAVE_COMPLETE', 'CHOOSING_ABILITY', 'GAME_OVER'
    currentWave: 0,
    monstersInWave: 0,
    monstersKilledInWave: 0,
    spawnedMonstersCount: 0, // How many monsters have been *queued* to spawn this wave
    isMovingLeft: false,
    isMovingRight: false,
    keys: {}
};

// playerState é definido em player.js e é global
// monsters, spells, monsterProjectiles, poisonClouds são definidos em seus respectivos arquivos e são globais

let animationFrameId; // To store the requestAnimationFrame ID
let lastFrameTime = 0; // For delta time calculation

// --- Game Initialization and Reset ---
function resetGame() {
    console.log("Reiniciando jogo...");
    initializePlayer(window.GAME_WIDTH, window.GAME_HEIGHT); // From player.js
    
    // Reset global arrays
    monsters.length = 0; // Esvazia o array
    spells.length = 0;
    monsterProjectiles.length = 0;
    poisonClouds.length = 0;

    // Reset game state
    window.gameStates.currentWave = 0;
    window.gameStates.monstersInWave = 0;
    window.gameStates.monstersKilledInWave = 0;
    window.gameStates.spawnedMonstersCount = 0;
    window.gameStates.keys = {};
    window.gameStates.isMovingLeft = false;
    window.gameStates.isMovingRight = false;
    window.gameStates.gameState = 'MENU'; // Volta para o menu por padrão após reset

    // Reset monster spawn timer in monsters.js
    window.lastMonsterSpawnTime = 0; // Acessando a variável globalmente

    updateHUD(playerState.player, window.gameStates.currentWave); // From gameUtils.js
    resizeCanvas(canvas, playerState.player); // From gameUtils.js
    console.log("Jogo reiniciado. Estado:", window.gameStates.gameState);
}

function startGame() {
    console.log("Botão 'Começar Jogo' clicado!");
    resetGame(); // Garante que tudo está limpo e no estado inicial
    startNextWave(); // Inicia a primeira onda
}

function endGame() {
    console.log("Fim de Jogo!");
    window.gameStates.gameState = 'GAME_OVER';
    showScreen(gameOverScreen); // From gameUtils.js
    // Parar o loop de animação para economizar recursos, ou deixá-lo para desenhar a tela de Game Over
    // cancelAnimationFrame(animationFrameId); // Pode ser útil se você não quiser mais renderizar o jogo de fundo
}

function startNextWave() {
    console.log(`Iniciando a próxima onda. Onda atual: ${window.gameStates.currentWave}`);
    window.gameStates.currentWave++;
    window.gameStates.monstersKilledInWave = 0;
    window.gameStates.spawnedMonstersCount = 0;

    window.gameStates.monstersInWave = 5 + (window.gameStates.currentWave * 2);

    window.gameStates.gameState = 'PLAYING';
    showScreen(gameContent); // Mostra a tela de jogo (canvas e HUD)
    console.log(`Iniciando Onda ${window.gameStates.currentWave} com ${window.gameStates.monstersInWave} monstros.`);
    
    // Garante que o gameLoop está rodando. Se já estiver, não inicia um novo.
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function pauseGameForAbilityChoice() {
    console.log("Pausando jogo para escolha de habilidade.");
    window.gameStates.gameState = 'CHOOSING_ABILITY';
    showScreen(abilityCardsScreen); // From gameUtils.js
    generateAbilityCards(playerState.player, startNextWave); // From gameUtils.js, pass player and startNextWave callback
}

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    window.gameStates.keys[e.key] = true;
    if (window.gameStates.gameState === 'PLAYING') {
        if (e.key === ' ') {
            e.preventDefault();
            // Passa as funções como callbacks
            castSpell(playerState.player, playerState.spellLastCastTime, monsters, applyDamageToMonster);
        } else if (e.key === 'q' || e.key === 'Q') {
            playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex - 1 + playerState.player.activeSpells.length) % playerState.player.activeSpells.length;
            updateHUD(playerState.player, window.gameStates.currentWave);
        } else if (e.key === 'e' || e.key === 'E') {
            playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex + 1) % playerState.player.activeSpells.length;
            updateHUD(playerState.player, window.gameStates.currentWave);
        }
    }
});

document.addEventListener('keyup', (e) => {
    window.gameStates.keys[e.key] = false;
});

// Mobile button listeners
// Adicionar e.preventDefault() em touchstart para evitar problemas em dispositivos móveis
moveLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (window.gameStates.gameState === 'PLAYING') window.gameStates.isMovingLeft = true; });
moveLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); window.gameStates.isMovingLeft = false; });
moveLeftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); window.gameStates.isMovingLeft = false; });

moveRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (window.gameStates.gameState === 'PLAYING') window.gameStates.isMovingRight = true; });
moveRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); window.gameStates.isMovingRight = false; });
moveRightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); window.gameStates.isMovingRight = false; });

castSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        // Passa as funções como callbacks
        castSpell(playerState.player, playerState.spellLastCastTime, monsters, applyDamageToMonster);
    }
});

prevSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex - 1 + playerState.player.activeSpells.length) % playerState.player.activeSpells.length;
        updateHUD(playerState.player, window.gameStates.currentWave);
    }
});

nextSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex + 1) % playerState.player.activeSpells.length;
        updateHUD(playerState.player, window.gameStates.currentWave);
    }
});

startGameBtn.addEventListener('click', startGame);
restartGameBtn.addEventListener('click', startGame);

window.addEventListener('resize', () => resizeCanvas(canvas, playerState.player));

// --- Main Game Loop ---
function gameLoop(currentTime) {
    if (!lastFrameTime) lastFrameTime = currentTime;
    // const deltaTime = currentTime - lastFrameTime; // Para física independente do framerate se necessário
    lastFrameTime = currentTime;

    // Limpa o canvas no início de cada frame, independentemente do estado
    window.ctx.clearRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);

    // Desenha o background para todos os estados visíveis no canvas
    if (loadedAssets.background && loadedAssets.background.complete) {
        window.ctx.drawImage(loadedAssets.background, 0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    } else {
        window.ctx.fillStyle = '#333';
        window.ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    }

    if (window.gameStates.gameState === 'PLAYING') {
        playerState.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(currentTime * ENTITY_ANIMATION_SPEED * 0.001);

        movePlayer(window.gameStates.keys, window.gameStates.isMovingLeft, window.gameStates.isMovingRight); // From player.js
        
        // Spawn monster and update spawned count
        if (window.gameStates.spawnedMonstersCount < window.gameStates.monstersInWave) {
             const monsterSpawned = spawnMonster(window.gameStates.currentWave, window.gameStates.monstersInWave, window.gameStates.spawnedMonstersCount, window.GAME_WIDTH, window.GAME_HEIGHT); // From monsters.js
             if (monsterSpawned) {
                window.gameStates.spawnedMonstersCount++;
             }
        }
       
        // Passa endGame como callback para takeDamage
        moveMonsters(playerState.player, endGame); // From monsters.js
        moveSpells(); // From spells.js
        moveMonsterProjectiles(); // From monsters.js

        // Check all collisions
        // Passa as funções como callbacks
        checkSpellCollisions(playerState.player, monsters, endGame, handleMonsterDefeat, applyDamageToMonster); // From spells.js
        
        // Monster Projectiles vs Player
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
                takeDamage(playerState.player, projectile.damage, endGame); // Passa endGame
                monsterProjectiles.splice(i, 1);
            }
        }

        // Monsters (contact) vs Player
        for (let i = monsters.length - 1; i >= 0; i--) {
            let monster = monsters[i];
            if (monster.type === 'shooter') {
                continue; // Shooters don't do contact damage
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
                }
            }
        }

        regenerateMana(); // From player.js

        drawPlayer(playerState.player, playerState.animationOffset); // From gameUtils.js
        drawMonsters(monsters); // From gameUtils.js
        drawSpells(spells); // From gameUtils.js
        drawMonsterProjectiles(monsterProjectiles); // From gameUtils.js
        drawPoisonClouds(poisonClouds); // From gameUtils.js
        updateHUD(playerState.player, window.gameStates.currentWave); // From gameUtils.js

        // Check for wave completion
        if (window.gameStates.monstersKilledInWave >= window.gameStates.monstersInWave && monsters.length === 0 && monsterProjectiles.length === 0) {
            console.log(`Onda ${window.gameStates.currentWave} completa!`);
            window.gameStates.gameState = 'WAVE_COMPLETE';
            pauseGameForAbilityChoice();
        }

    } else if (window.gameStates.gameState === 'MENU' || window.gameStates.gameState === 'GAME_OVER' || window.gameStates.gameState === 'CHOOSING_ABILITY') {
        // Redraw player and monsters in background if any, even in menu/game over screens for visual effect
        // Only draw if player is initialized and game state allows
        if (playerState.player) {
            drawPlayer(playerState.player, playerState.animationOffset);
        }
        if (monsters) {
            drawMonsters(monsters);
        }
        // No need to draw spells or projectiles in these states usually, or they should be cleared.
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Initial setup ---
loadAssets().then(() => {
    console.log("Todos os assets carregados! Exibindo menu inicial...");
    
    // Inicializa o player e redimensiona o canvas APÓS os assets serem carregados
    // e os elementos HTML estarem prontos.
    resetGame(); // Garante que as variáveis de jogo estão limpas e o player inicializado
    resizeCanvas(canvas, playerState.player); // Redimensiona o canvas para o tamanho correto

    showScreen(mainMenuScreen); // Mostra o menu principal (garantindo que ele está ativo no início)
    console.log("Estado inicial do jogo após loadAssets:", window.gameStates.gameState);

    // Inicia o loop do jogo. Ele vai renderizar o menu enquanto o gameState for 'MENU'.
    animationFrameId = requestAnimationFrame(gameLoop); 
}).catch(error => {
    console.error("Erro ao carregar assets:", error);
});

// Ações adicionais no DOMContentLoaded para garantir que os elementos estejam disponíveis
document.addEventListener('DOMContentLoaded', () => {
    // Estas ações já são feitas no loadAssets().then(), mas é bom ter uma redundância aqui
    // para garantir que os listeners sejam atribuídos mesmo que o carregamento de assets seja super rápido.
    // Ou se você quiser que o resizeCanvas inicial aconteça antes mesmo dos assets estarem 100%
    if (!playerState.player) { // Se o player ainda não foi inicializado
        // Não chame resetGame aqui, pois loadAssets().then() já o fará
        // Apenas para garantir o resize inicial se necessário
        // resizeCanvas(canvas, playerState.player);
    }
});
