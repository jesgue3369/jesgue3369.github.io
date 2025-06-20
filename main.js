// --- Elementos HTML ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Contexto do canvas

// Importante: Definir gameContent aqui para ser usado na transição de telas
const gameContent = document.getElementById('game-content'); 
const mobileControlsBar = document.getElementById('mobile-controls-bar'); // Precisa ser acessível aqui também

const startGameBtn = document.getElementById('start-game-btn');
const restartGameBtn = document.getElementById('restart-game');

const moveLeftBtn = document.getElementById('move-left-btn');
const moveRightBtn = document.getElementById('move-right-btn');
const castSpellBtn = document.getElementById('cast-spell-btn');
const prevSpellBtn = document.getElementById('prev-spell-btn');
const nextSpellBtn = document.getElementById('next-spell-btn');

const mainMenuScreen = document.getElementById('main-menu-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const abilityCardsScreen = document.getElementById('ability-cards-screen');

// --- Variáveis Globais (Expostas para outros módulos se necessário) ---
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

let animationFrameId = null; // To store the requestAnimationFrame ID, inicializado como null
let lastFrameTime = 0; // For delta time calculation

// --- Game Initialization and Reset ---
function resetGame() {
    console.log("Reiniciando jogo... Limpando estados e entidades.");
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
    window.gameStates.gameState = 'MENU'; // MUITO IMPORTANTE: Garante que o estado inicial é MENU

    window.lastMonsterSpawnTime = 0; // Reset monster spawn timer in monsters.js

    updateHUD(playerState.player, window.gameStates.currentWave); // From gameUtils.js
    resizeCanvas(canvas, playerState.player); // From gameUtils.js
    console.log("Jogo reiniciado. Estado atual:", window.gameStates.gameState);
}

function startGame() {
    console.log("Botão 'Começar Jogo' clicado!");
    resetGame(); // Garante que tudo está limpo e no estado inicial (MENU)
    startNextWave(); // Transiciona para o jogo (PLAYING)
}

function endGame() {
    console.log("Fim de Jogo! Transicionando para tela de Game Over.");
    window.gameStates.gameState = 'GAME_OVER';
    showScreen(gameOverScreen); // From gameUtils.js
    
    // Se desejar parar completamente o loop de animação ao perder
    // cancelAnimationFrame(animationFrameId); 
    // animationFrameId = null; // Zera o ID para permitir um novo requestAnimationFrame se o jogo recomeçar
}

function startNextWave() {
    console.log(`Iniciando a próxima onda. Onda atual (antes do incremento): ${window.gameStates.currentWave}`);
    window.gameStates.currentWave++;
    window.gameStates.monstersKilledInWave = 0;
    window.gameStates.spawnedMonstersCount = 0;

    window.gameStates.monstersInWave = 5 + (window.gameStates.currentWave * 2);

    window.gameStates.gameState = 'PLAYING'; // Define o estado como JOGANDO
    showScreen(gameContent); // Mostra a tela de jogo (canvas e HUD)
    console.log(`Onda ${window.gameStates.currentWave} iniciada com ${window.gameStates.monstersInWave} monstros. Estado do jogo: ${window.gameStates.gameState}`);
    
    // Garante que o gameLoop está rodando. Se já estiver, não inicia um novo.
    if (!animationFrameId) { // Verifica se não há um loop ativo
        console.log("Iniciando gameLoop (primeira vez ou após Game Over/pausa manual).");
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        console.log("gameLoop já está ativo.");
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
            e.preventDefault(); // Evita scroll da página com barra de espaço
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

    // Apenas processa a lógica do jogo se o estado for 'PLAYING'
    if (window.gameStates.gameState === 'PLAYING') {
        playerState.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(currentTime * ENTITY_ANIMATION_SPEED * 0.001);

        movePlayer(window.gameStates.keys, window.gameStates.isMovingLeft, window.gameStates.isMovingRight);
        
        // Spawn monster and update spawned count
        if (window.gameStates.spawnedMonstersCount < window.gameStates.monstersInWave) {
             const monsterSpawned = spawnMonster(window.gameStates.currentWave, window.gameStates.monstersInWave, window.gameStates.spawnedMonstersCount, window.GAME_WIDTH, window.GAME_HEIGHT);
             if (monsterSpawned) {
                window.gameStates.spawnedMonstersCount++;
             }
        }
       
        // Passa endGame como callback para takeDamage
        moveMonsters(playerState.player, endGame); // Colisões de monstros com jogador aqui
        moveSpells();
        moveMonsterProjectiles();

        // Check all collisions
        // Passa as funções como callbacks
        checkSpellCollisions(playerState.player, monsters, endGame, handleMonsterDefeat, applyDamageToMonster);
        
        // Monster Projectiles vs Player (já tratada em checkSpellCollisions)
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

        // Monsters (contact) vs Player (já tratada em moveMonsters para passar pela tela)
        // Esta é a colisão de contato com o corpo do jogador, não apenas passar pela tela
        for (let i = monsters.length - 1; i >= 0; i--) {
            let monster = monsters[i];
            if (monster.type === 'shooter') {
                continue; // Shooters don't do contact damage by default
            }

            // Colisão de AABB (Axis-Aligned Bounding Box)
            if (monster.x < playerState.player.x + playerState.player.size &&
                monster.x + monster.size > playerState.player.x &&
                monster.y < playerState.player.y + playerState.player.size &&
                monster.y + monster.size > playerState.player.y) {

                if (monster.type === 'exploder') {
                    takeDamage(playerState.player, monster.contactDamage, endGame);
                    handleMonsterDefeat(monster, i, playerState.player, gainXP); // Exploder self-destructs and gives XP
                    // Se o exploder morreu e foi removido, ajusta o índice para evitar pular o próximo monstro
                    // (handleMonsterDefeat já lida com o splice)
                } else {
                    takeDamage(playerState.player, monster.contactDamage, endGame);
                }
            }
        }

        regenerateMana();

        // Desenho de entidades (player, monstros, feitiços) no estado 'PLAYING'
        drawPlayer(playerState.player, playerState.animationOffset);
        drawMonsters(monsters);
        drawSpells(spells);
        drawMonsterProjectiles(monsterProjectiles);
        drawPoisonClouds(poisonClouds);
        updateHUD(playerState.player, window.gameStates.currentWave);

        // Check for wave completion
        if (window.gameStates.monstersKilledInWave >= window.gameStates.monstersInWave && monsters.length === 0 && monsterProjectiles.length === 0) {
            console.log(`Onda ${window.gameStates.currentWave} completa!`);
            window.gameStates.gameState = 'WAVE_COMPLETE'; // Altera o estado
            pauseGameForAbilityChoice(); // Mostra a tela de escolha
        }

    // Se não estiver no estado 'PLAYING', apenas desenha o que for relevante para o fundo
    } else { // Ou seja, 'MENU', 'GAME_OVER', 'CHOOSING_ABILITY', 'WAVE_COMPLETE'
        // Desenha o player e monstros (opcionalmente) como um "fundo" estático
        // Eles não se movem ou causam dano nestes estados
        if (playerState.player) {
            drawPlayer(playerState.player, playerState.animationOffset);
        }
        // Se você não quiser ver monstros no menu/game over, remova a linha abaixo
        if (monsters && monsters.length > 0) {
            drawMonsters(monsters);
        }
        // Não desenha spells, nem monsterProjectiles nessas telas, eles devem estar limpos pelo resetGame
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Initial setup ---
loadAssets().then(() => {
    console.log("Todos os assets carregados! Configurando jogo inicial...");
    
    // Inicializa o player e redimensiona o canvas APÓS os assets serem carregados
    // e os elementos HTML estarem prontos.
    resetGame(); // Garante estado inicial LIMPO e definido como 'MENU'
    
    // Redimensiona o canvas. É crucial que mobileControlsBar e gameContent sejam elementos válidos aqui.
    resizeCanvas(canvas, playerState.player); 

    showScreen(mainMenuScreen); // Exibe o menu principal (garantindo que ele está ativo no início)
    console.log("Estado inicial do jogo após loadAssets e resetGame:", window.gameStates.gameState);

    // Inicia o gameLoop. Ele vai renderizar o menu enquanto o gameState for 'MENU'.
    // A lógica de jogo só começa quando o estado for 'PLAYING'.
    animationFrameId = requestAnimationFrame(gameLoop); 
}).catch(error => {
    console.error("Erro ao carregar assets:", error);
});

// Ações adicionais no DOMContentLoaded para garantir que os elementos estejam disponíveis
document.addEventListener('DOMContentLoaded', () => {
    // Estas logs são para garantir que os botões são encontrados.
    console.log("DOMContentLoaded - Verificando botões e elementos globais:");
    console.log("startGameBtn:", startGameBtn);
    console.log("gameContent:", gameContent);
    console.log("mobileControlsBar (em main.js):", mobileControlsBar);
});
