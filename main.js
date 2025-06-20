// --- Elementos HTML ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// CENTRALIZAÇÃO DAS DECLARAÇÕES DE ELEMENTOS DOM AQUI
// E EXPOSIÇÃO AO OBJETO 'window'
const hudHealthValue = document.getElementById('health-value');
const hudManaValue = document.getElementById('mana-value');
const hudLevelValue = document.getElementById('level-value');
const hudXpValue = document.getElementById('xp-value');
const hudSpellName = document.getElementById('spell-name');
const hudWaveValue = document.getElementById('wave-value');

const mainMenuScreen = document.getElementById('main-menu-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const abilityCardsScreen = document.getElementById('ability-cards-screen');
const abilityCardOptionsDiv = document.getElementById('ability-card-options');
const mobileControlsBar = document.getElementById('mobile-controls-bar');
const gameContent = document.getElementById('game-content'); 

const startGameBtn = document.getElementById('start-game-btn');
const restartGameBtn = document.getElementById('restart-game');

const moveLeftBtn = document.getElementById('move-left-btn');
const moveRightBtn = document.getElementById('move-right-btn');
const castSpellBtn = document.getElementById('cast-spell-btn');
const prevSpellBtn = document.getElementById('prev-spell-btn');
const nextSpellBtn = document.getElementById('next-spell-btn');

// --- Exposição dos elementos DOM ao objeto 'window' ---
// Isso permite que gameUtils.js acesse esses elementos via 'window.nomeDoElemento'
window.hudHealthValue = hudHealthValue;
window.hudManaValue = hudManaValue;
window.hudLevelValue = hudLevelValue;
window.hudXpValue = hudXpValue;
window.hudSpellName = hudSpellName;
window.hudWaveValue = hudWaveValue;

window.mainMenuScreen = mainMenuScreen;
window.gameOverScreen = gameOverScreen;
window.abilityCardsScreen = abilityCardsScreen;
window.abilityCardOptionsDiv = abilityCardOptionsDiv;
window.mobileControlsBar = mobileControlsBar;
window.gameContent = gameContent; // ONDE ESTAVA O CONFLITO RESOLVIDO!


// Logs iniciais para verificar se os elementos essenciais foram encontrados
if (!canvas) {
    console.error("ERRO CRÍTICO: Elemento #gameCanvas não encontrado no DOM. O jogo não pode iniciar.");
}
if (!ctx) {
    console.error("ERRO CRÍTICO: Não foi possível obter o contexto 2D do Canvas. Seu navegador suporta Canvas?");
}

// --- Variáveis Globais (Expostas para outros módulos se necessário) ---
window.ctx = ctx; // Torna o contexto 2D acessível globalmente
window.GAME_WIDTH = canvas ? canvas.width : 800; // Inicializado com fallback
window.GAME_HEIGHT = canvas ? canvas.height : 600; // Inicializado com fallback
window.CONTROLLER_BAR_HEIGHT = 0; // Será atualizado em resizeCanvas

// --- Global Game State ---
window.gameStates = {
    gameState: 'MENU', // Possible states: 'MENU', 'PLAYING', 'WAVE_COMPLETE', 'CHOOSING_ABILITY', 'GAME_OVER'
    currentWave: 0,
    monstersInWave: 0,
    monstersKilledInWave: 0,
    spawnedMonstersCount: 0,
    isMovingLeft: false,
    isMovingRight: false,
    keys: {}
};

let animationFrameId = null;
let lastFrameTime = 0;

// --- Game Initialization and Reset ---
function resetGame() {
    console.log("Reiniciando jogo... Limpando estados e entidades.");
    initializePlayer(window.GAME_WIDTH, window.GAME_HEIGHT);
    
    monsters.length = 0;
    spells.length = 0;
    monsterProjectiles.length = 0;
    poisonClouds.length = 0;

    window.gameStates.currentWave = 0;
    window.gameStates.monstersInWave = 0;
    window.gameStates.monstersKilledInWave = 0;
    window.gameStates.spawnedMonstersCount = 0;
    window.gameStates.keys = {};
    window.gameStates.isMovingLeft = false;
    window.gameStates.isMovingRight = false;
    window.gameStates.gameState = 'MENU';

    window.lastMonsterSpawnTime = 0;

    updateHUD(playerState.player, window.gameStates.currentWave);
    resizeCanvas(canvas, playerState.player);
    console.log("Jogo reiniciado. Estado atual:", window.gameStates.gameState);
}

function startGame() {
    console.log("Botão 'Começar Jogo' clicado!");
    resetGame();
    startNextWave();
}

function endGame() {
    console.log("Fim de Jogo! Transicionando para tela de Game Over.");
    window.gameStates.gameState = 'GAME_OVER';
    showScreen(gameOverScreen); // Acessa 'gameOverScreen' que é uma 'const' local e global (via window)
}

function startNextWave() {
    console.log(`Iniciando a próxima onda. Onda atual (antes do incremento): ${window.gameStates.currentWave}`);
    window.gameStates.currentWave++;
    window.gameStates.monstersKilledInWave = 0;
    window.gameStates.spawnedMonstersCount = 0;

    window.gameStates.monstersInWave = 5 + (window.gameStates.currentWave * 2);

    window.gameStates.gameState = 'PLAYING';
    showScreen(gameContent); // Acessa 'gameContent' que é uma 'const' local e global (via window)
    console.log(`Onda ${window.gameStates.currentWave} iniciada com ${window.gameStates.monstersInWave} monstros. Estado do jogo: ${window.gameStates.gameState}`);
    
    if (!animationFrameId) {
        console.log("Iniciando gameLoop (primeira vez ou após Game Over/pausa manual).");
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        console.log("gameLoop já está ativo.");
    }
}

function pauseGameForAbilityChoice() {
    console.log("Pausando jogo para escolha de habilidade.");
    window.gameStates.gameState = 'CHOOSING_ABILITY';
    showScreen(abilityCardsScreen); // Acessa 'abilityCardsScreen' que é uma 'const' local e global (via window)
    generateAbilityCards(playerState.player, startNextWave);
}

// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    window.gameStates.keys[e.key] = true;
    if (window.gameStates.gameState === 'PLAYING') {
        if (e.key === ' ') {
            e.preventDefault();
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

// Mobile button listeners - Referenciam as 'consts' locais que são expostas ao 'window'
if (moveLeftBtn) moveLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (window.gameStates.gameState === 'PLAYING') window.gameStates.isMovingLeft = true; });
if (moveLeftBtn) moveLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); window.gameStates.isMovingLeft = false; });
if (moveLeftBtn) moveLeftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); window.gameStates.isMovingLeft = false; });

if (moveRightBtn) moveRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (window.gameStates.gameState === 'PLAYING') window.gameStates.isMovingRight = true; });
if (moveRightBtn) moveRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); window.gameStates.isMovingRight = false; });
if (moveRightBtn) moveRightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); window.gameStates.isMovingRight = false; });

if (castSpellBtn) castSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        castSpell(playerState.player, playerState.spellLastCastTime, monsters, applyDamageToMonster);
    }
});

if (prevSpellBtn) prevSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex - 1 + playerState.player.activeSpells.length) % playerState.player.activeSpells.length;
        updateHUD(playerState.player, window.gameStates.currentWave);
    }
});

if (nextSpellBtn) nextSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        playerState.player.currentSpellIndex = (playerState.player.currentSpellIndex + 1) % playerState.player.activeSpells.length;
        updateHUD(playerState.player, window.gameStates.currentWave);
    }
});

if (startGameBtn) startGameBtn.addEventListener('click', startGame);
if (restartGameBtn) restartGameBtn.addEventListener('click', startGame);

window.addEventListener('resize', () => resizeCanvas(canvas, playerState.player));

// --- Main Game Loop ---
function gameLoop(currentTime) {
    if (!lastFrameTime) lastFrameTime = currentTime;
    lastFrameTime = currentTime;

    if (!window.ctx) {
        console.error("ERRO: window.ctx não está disponível no gameLoop. Parando loop de animação.");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }
    
    window.ctx.clearRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);

    if (loadedAssets.background && loadedAssets.background.complete) {
        window.ctx.drawImage(loadedAssets.background, 0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    } else {
        window.ctx.fillStyle = '#333';
        window.ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    }

    if (window.gameStates.gameState === 'PLAYING') {
        playerState.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(currentTime * ENTITY_ANIMATION_SPEED * 0.001);

        movePlayer(window.gameStates.keys, window.gameStates.isMovingLeft, window.gameStates.isMovingRight);
        
        if (window.gameStates.spawnedMonstersCount < window.gameStates.monstersInWave) {
             const monsterSpawned = spawnMonster(window.gameStates.currentWave, window.gameStates.monstersInWave, window.gameStates.spawnedMonstersCount, window.GAME_WIDTH, window.GAME_HEIGHT);
             if (monsterSpawned) {
                window.gameStates.spawnedMonstersCount++;
             }
        }
       
        moveMonsters(playerState.player, endGame);
        moveSpells();
        moveMonsterProjectiles();

        checkSpellCollisions(playerState.player, monsters, endGame, handleMonsterDefeat, applyDamageToMonster);
        
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
                takeDamage(playerState.player, projectile.damage, endGame);
                monsterProjectiles.splice(i, 1);
            }
        }

        for (let i = monsters.length - 1; i >= 0; i--) {
            let monster = monsters[i];
            if (monster.type === 'shooter') {
                continue;
            }

            if (monster.x < playerState.player.x + playerState.player.size &&
                monster.x + monster.size > playerState.player.x &&
                monster.y < playerState.player.y + playerState.player.size &&
                monster.y + monster.size > playerState.player.y) {

                if (monster.type === 'exploder') {
                    takeDamage(playerState.player, monster.contactDamage, endGame);
                    handleMonsterDefeat(monster, i, playerState.player, gainXP);
                } else {
                    takeDamage(playerState.player, monster.contactDamage, endGame);
                }
            }
        }

        regenerateMana();

        drawPlayer(playerState.player, playerState.animationOffset);
        drawMonsters(monsters);
        drawSpells(spells);
        drawMonsterProjectiles(monsterProjectiles);
        drawPoisonClouds(poisonClouds);
        updateHUD(playerState.player, window.gameStates.currentWave);

        if (window.gameStates.monstersKilledInWave >= window.gameStates.monstersInWave && monsters.length === 0 && monsterProjectiles.length === 0) {
            console.log(`Onda ${window.gameStates.currentWave} completa!`);
            window.gameStates.gameState = 'WAVE_COMPLETE';
            pauseGameForAbilityChoice();
        }

    } else { // 'MENU', 'GAME_OVER', 'CHOOSING_ABILITY', 'WAVE_COMPLETE'
        if (playerState.player) {
            drawPlayer(playerState.player, playerState.animationOffset);
        }
        if (monsters && monsters.length > 0) {
            drawMonsters(monsters);
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Initial setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: Verificando botões e elementos globais em main.js:");
    console.log("startGameBtn:", startGameBtn);
    console.log("gameContent:", gameContent);
    console.log("mobileControlsBar (em main.js):", mobileControlsBar);
    console.log("canvas (em main.js):", canvas);
    console.log("ctx (em main.js):", ctx);

    // Logs para os elementos HUD e telas
    console.log("hudHealthValue:", hudHealthValue);
    console.log("mainMenuScreen:", mainMenuScreen);
    console.log("gameOverScreen:", gameOverScreen);
    console.log("abilityCardsScreen:", abilityCardsScreen);
    console.log("abilityCardOptionsDiv:", abilityCardOptionsDiv);

    if (canvas && ctx) {
        loadAssets().then(() => {
            console.log("Todos os assets carregados! Configurando jogo inicial...");
            
            resetGame();
            resizeCanvas(canvas, playerState.player); 

            // Garante que o mobileControlsBar está escondido no início
            if (mobileControlsBar) {
                mobileControlsBar.style.display = 'none';
                console.log("Mobile controls bar set to 'none' at initial load.");
            }

            showScreen(mainMenuScreen);
            console.log("Estado inicial do jogo após loadAssets e resetGame:", window.gameStates.gameState);

            animationFrameId = requestAnimationFrame(gameLoop); 
            console.log("gameLoop iniciado via requestAnimationFrame."); 
        }).catch(error => {
            console.error("Erro ao carregar assets:", error);
        });
    } else {
        console.error("Não foi possível iniciar o jogo devido a problemas no canvas ou contexto.");
    }
});
