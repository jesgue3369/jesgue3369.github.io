// main.js - A lógica central do jogo, inicialização e loop do jogo.

// --- Contêineres de Estado de Jogo Globais ---
// Eles serão acessíveis via `window.propertyName` de outros arquivos.
// Este padrão de design evita `export`/`import` explícitos para estruturas de jogo simples
// e simplifica o acesso entre arquivos em um ambiente de navegador.

// Elementos HTML (referências ao DOM)
// Todas as referências a elementos HTML são declaradas APENAS AQUI
window.canvas = document.getElementById('gameCanvas');
window.ctx = window.canvas ? window.canvas.getContext('2d') : null;

window.hudHealthValue = document.getElementById('health-value');
window.hudManaValue = document.getElementById('mana-value');
window.hudLevelValue = document.getElementById('level-value');
window.hudXpValue = document.getElementById('xp-value');
window.hudSpellName = document.getElementById('spell-name');
window.hudWaveValue = document.getElementById('wave-value');

window.mainMenuScreen = document.getElementById('main-menu-screen');
window.gameOverScreen = document.getElementById('game-over-screen');
window.abilityCardsScreen = document.getElementById('ability-cards-screen');
window.abilityCardOptionsDiv = document.getElementById('ability-card-options');
window.mobileControlsBar = document.getElementById('mobile-controls-bar');
window.gameContent = document.getElementById('game-content'); 

// Botões (referências ao DOM)
window.startGameBtn = document.getElementById('start-game-btn');
window.restartGameBtn = document.getElementById('restart-game-btn'); // Corrigido ID do HTML

window.moveLeftBtn = document.getElementById('move-left-btn');
window.moveRightBtn = document.getElementById('move-right-btn');
window.castSpellBtn = document.getElementById('cast-spell-btn');
window.prevSpellBtn = document.getElementById('prev-spell-btn');
window.nextSpellBtn = document.getElementById('next-spell-btn');


// Variáveis e Estado do Jogo
window.GAME_WIDTH = window.canvas ? window.canvas.width : 800; // Será atualizado por resizeCanvas
window.GAME_HEIGHT = window.canvas ? window.canvas.height : 600; // Será atualizado por resizeCanvas
window.CONTROLLER_BAR_HEIGHT = 0; // Gerenciado por resizeCanvas

window.gameStates = {
    gameState: 'MENU', // 'MENU', 'PLAYING', 'WAVE_COMPLETE', 'CHOOSING_ABILITY', 'GAME_OVER'
    currentWave: 0,
    monstersInWave: 0,
    monstersKilledInWave: 0,
    spawnedMonstersCount: 0,
    isMovingLeft: false, // Para controles de toque
    isMovingRight: false, // Para controles de toque
    keys: {} // Para entrada de teclado
};

// Entidades do Jogo (arrays)
window.monsters = [];
window.spells = [];
window.monsterProjectiles = [];
window.poisonClouds = [];

// Estado do Jogador (inicializado pela função initializePlayer de player.js)
// window.playerState é então acessível aqui.


// Variáveis do Loop do Jogo
let animationFrameId = null;
let lastFrameTime = 0; // Para cálculos de delta time se necessário, ou temporização de animação simples


// --- Funções Utilitárias expostas ao escopo global (via window.gameFunctions) ---
// Isso permite que outros arquivos (como ABILITY_CARDS em constants.js ou monsters.js)
// chamem funções do núcleo do jogo sem dependências circulares diretas ou importações explícitas.
window.gameFunctions = {
    // De gameUtils.js
    loadedAssets: {}, // Objeto para armazenar assets carregados, gerenciado por loadAssets
    loadAssets: loadAssets,
    resizeCanvas: resizeCanvas,
    showScreen: showScreen,
    drawPlayer: drawPlayer,
    drawMonsters: drawMonsters,
    drawSpells: drawSpells,
    drawMonsterProjectiles: drawMonsterProjectiles,
    drawPoisonClouds: drawPoisonClouds,
    updateHUD: updateHUD,
    takeDamage: takeDamage,
    gainXP: gainXP,
    generateAbilityCards: generateAbilityCards,

    // De player.js (funções auxiliares que operam em window.playerState.player)
    handlePlayerMovement: handlePlayerMovement,
    handlePlayerManaRegen: handlePlayerManaRegen,
    handlePlayerHealthRegen: handlePlayerHealthRegen,
    initializePlayer: initializePlayer, // O inicializador para window.playerState.player

    // De monsters.js
    spawnMonster: spawnMonster,
    handleMonstersMovement: handleMonstersMovement,
    applyDamageToMonster: applyDamageToMonster,
    handleMonsterDefeat: handleMonsterDefeat,

    // De spells.js
    castSpell: castSpell,
    handleSpellsUpdate: handleSpellsUpdate,
    spawnMonsterProjectile: spawnMonsterProjectile, // Usado por monstros atiradores
    handleMonsterProjectilesUpdate: handleMonsterProjectilesUpdate,
    checkCollisions: checkCollisions
};


// --- Inicialização do Jogo e Transições de Estado ---

function resetGame() {
    console.log("resetGame: Iniciando processo de reinício do jogo.");
    
    // Inicializa/reinicializa a instância do player no window.playerState
    window.gameFunctions.initializePlayer(window.GAME_WIDTH, window.GAME_HEIGHT); 
    
    // Limpa todos os arrays de entidades (mantendo as referências, não criando novos arrays)
    window.monsters.length = 0; 
    window.spells.length = 0;
    window.monsterProjectiles.length = 0;
    window.poisonClouds.length = 0;

    // Reseta as variáveis de estado do jogo
    window.gameStates.currentWave = 0;
    window.gameStates.monstersInWave = 0;
    window.gameStates.monstersKilledInWave = 0;
    window.gameStates.spawnedMonstersCount = 0;
    window.gameStates.keys = {};
    window.gameStates.isMovingLeft = false;
    window.gameStates.isMovingRight = false;
    window.gameStates.gameState = 'MENU';

    // Reseta timers de spawn
    window.lastMonsterSpawnTime = 0;
    window.lastMonsterProjectileSpawnTime = 0;

    // Atualiza o HUD e redimensiona o canvas para o estado inicial
    window.gameFunctions.updateHUD(window.playerState.player, window.gameStates.currentWave);
    window.gameFunctions.resizeCanvas(window.canvas, window.playerState.player);
    console.log("resetGame: Jogo reiniciado. Estado atual:", window.gameStates.gameState);
}

function startGame() {
    console.log("startGame: Botão 'Começar Jogo' clicado!");
    resetGame(); // Garante um estado limpo
    // O estado é definido como PLAYING em startNextWave para que a primeira onda comece imediatamente
    startNextWave();
}

function endGame() {
    console.log("endGame: Game Over! Transicionando para a tela de Game Over.");
    window.gameStates.gameState = 'GAME_OVER';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Cancela o loop do jogo
        animationFrameId = null;
        console.log("endGame: Loop do jogo cancelado.");
    }
    window.gameFunctions.showScreen(window.gameOverScreen);
}

function startNextWave() {
    console.log(`startNextWave: Iniciando a onda ${window.gameStates.currentWave + 1}.`);
    window.gameStates.currentWave++;
    window.gameStates.monstersKilledInWave = 0;
    window.gameStates.spawnedMonstersCount = 0;

    window.gameStates.monstersInWave = 5 + (window.gameStates.currentWave * 2);

    window.gameStates.gameState = 'PLAYING';
    window.gameFunctions.showScreen(window.gameContent);
    console.log(`startNextWave: Onda ${window.gameStates.currentWave} iniciada com ${window.gameStates.monstersInWave} monstros. Estado do jogo: ${window.gameStates.gameState}`);
    
    if (!animationFrameId) { // Se o loop não estiver ativo (ex: após game over ou menu)
        console.log("startNextWave: Loop do jogo não estava ativo, solicitando novo frame de animação.");
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        console.log("startNextWave: Loop do jogo já ativo.");
    }
}

// Função chamada quando o jogador sobe de nível para escolher uma habilidade
// Exposta como uma função no window.gameFunctions
window.gameFunctions.pauseGameForAbilityChoice = function() { 
    console.log("pauseGameForAbilityChoice: Pausando jogo para escolha de habilidade.");
    window.gameStates.gameState = 'CHOOSING_ABILITY';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Pausa o loop do jogo
        animationFrameId = null;
        console.log("pauseGameForAbilityChoice: Loop do jogo pausado.");
    }
    window.gameFunctions.showScreen(window.abilityCardsScreen);
    window.gameFunctions.generateAbilityCards(window.playerState.player, startNextWave);
};

// --- Escutadores de Eventos ---
document.addEventListener('keydown', (e) => {
    window.gameStates.keys[e.key] = true;
    if (window.gameStates.gameState === 'PLAYING') {
        if (e.key === ' ') {
            e.preventDefault(); // Impede a rolagem da página
            window.gameFunctions.castSpell(window.playerState.player, window.monsters, window.gameFunctions.applyDamageToMonster);
        } else if (e.key === 'q' || e.key === 'Q') {
            window.playerState.player.currentSpellIndex = (window.playerState.player.currentSpellIndex - 1 + window.playerState.player.activeSpells.length) % window.playerState.player.activeSpells.length;
            window.gameFunctions.updateHUD(window.playerState.player, window.gameStates.currentWave);
        } else if (e.key === 'e' || e.key === 'E') {
            window.playerState.player.currentSpellIndex = (window.playerState.player.currentSpellIndex + 1) % window.playerState.player.activeSpells.length;
            window.gameFunctions.updateHUD(window.playerState.player, window.gameStates.currentWave);
        }
    }
});

document.addEventListener('keyup', (e) => {
    window.gameStates.keys[e.key] = false;
});

// Escutadores de eventos para botões móveis
if (window.moveLeftBtn) window.moveLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (window.gameStates.gameState === 'PLAYING') window.gameStates.isMovingLeft = true; });
if (window.moveLeftBtn) window.moveLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); window.gameStates.isMovingLeft = false; });
if (window.moveLeftBtn) window.moveLeftBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); window.gameStates.isMovingLeft = false; });

if (window.moveRightBtn) window.moveRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (window.gameStates.gameState === 'PLAYING') window.gameStates.isMovingRight = true; });
if (window.moveRightBtn) window.moveRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); window.gameStates.isMovingRight = false; });
if (window.moveRightBtn) window.moveRightBtn.addEventListener('touchcancel', (e) => { e.preventDefault(); window.gameStates.isMovingRight = false; });

if (window.castSpellBtn) window.castSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        window.gameFunctions.castSpell(window.playerState.player, window.monsters, window.gameFunctions.applyDamageToMonster);
    }
});

if (window.prevSpellBtn) window.prevSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        window.playerState.player.currentSpellIndex = (window.playerState.player.currentSpellIndex - 1 + window.playerState.player.activeSpells.length) % window.playerState.player.activeSpells.length;
        window.gameFunctions.updateHUD(window.playerState.player, window.gameStates.currentWave);
    }
});

if (window.nextSpellBtn) window.nextSpellBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.gameStates.gameState === 'PLAYING') {
        window.playerState.player.currentSpellIndex = (window.playerState.player.currentSpellIndex + 1) % window.playerState.player.activeSpells.length;
        window.gameFunctions.updateHUD(window.playerState.player, window.gameStates.currentWave);
    }
});

if (window.startGameBtn) window.startGameBtn.addEventListener('click', startGame);
if (window.restartGameBtn) window.restartGameBtn.addEventListener('click', startGame);

window.addEventListener('resize', () => window.gameFunctions.resizeCanvas(window.canvas, window.playerState.player));


// --- Loop Principal do Jogo ---
function gameLoop(currentTime) {
    if (!lastFrameTime) lastFrameTime = currentTime;
    const deltaTime = currentTime - lastFrameTime; // Delta time para lógica independente de taxa de quadros
    lastFrameTime = currentTime;

    if (!window.ctx) {
        console.error("gameLoop: ERRO! Contexto 2D do Canvas (window.ctx) não está disponível. Parando loop do jogo.");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }
    
    // Limpa o canvas e desenha o fundo, independentemente do estado do jogo
    window.ctx.clearRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    // loadedAssets agora está em window.gameFunctions.loadedAssets
    if (window.gameFunctions.loadedAssets.background && window.gameFunctions.loadedAssets.background.complete) {
        window.ctx.drawImage(window.gameFunctions.loadedAssets.background, 0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    } else {
        window.ctx.fillStyle = '#333'; // Cor de fundo padrão se a imagem não carregar
        window.ctx.fillRect(0, 0, window.GAME_WIDTH, window.GAME_HEIGHT);
    }

    // Apenas processa a lógica do jogo se o estado for 'PLAYING'
    if (window.gameStates.gameState === 'PLAYING') {
        // Atualização da animação do jogador
        window.playerState.player.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(currentTime * ENTITY_ANIMATION_SPEED * 0.001);

        // Movimento do jogador
        window.gameFunctions.handlePlayerMovement(window.gameStates.keys, window.gameStates.isMovingLeft, window.gameStates.isMovingRight);
        
        // Geração de monstros
        if (window.gameStates.spawnedMonstersCount < window.gameStates.monstersInWave) {
             const monsterSpawned = window.gameFunctions.spawnMonster(window.gameStates.currentWave, window.gameStates.monstersInWave, window.gameStates.spawnedMonstersCount, window.GAME_WIDTH, window.GAME_HEIGHT);
             if (monsterSpawned) {
                window.gameStates.spawnedMonstersCount++;
             }
        }
       
        // Atualiza posições das entidades
        window.gameFunctions.handleMonstersMovement(window.playerState.player, endGame);
        window.gameFunctions.handleSpellsUpdate();
        window.gameFunctions.handleMonsterProjectilesUpdate();

        // Verifica todas as colisões
        window.gameFunctions.checkCollisions(window.playerState.player, window.monsters, endGame);
        
        // Regenera estatísticas do jogador
        window.gameFunctions.handlePlayerManaRegen();
        window.gameFunctions.handlePlayerHealthRegen();

        // Desenha as entidades
        window.gameFunctions.drawPlayer(window.playerState.player, window.playerState.player.animationOffset);
        window.gameFunctions.drawMonsters(window.monsters);
        window.gameFunctions.drawSpells(window.spells);
        window.gameFunctions.drawMonsterProjectiles(window.monsterProjectiles);
        window.gameFunctions.drawPoisonClouds(window.poisonClouds);
        window.gameFunctions.updateHUD(window.playerState.player, window.gameStates.currentWave);

        // Verifica a conclusão da onda
        if (window.gameStates.monstersKilledInWave >= window.gameStates.monstersInWave && window.monsters.length === 0 && window.monsterProjectiles.length === 0) {
            console.log(`gameLoop: Onda ${window.gameStates.currentWave} completa!`);
            window.gameStates.gameState = 'WAVE_COMPLETE'; // Define o estado antes de pausar o jogo para escolha
            window.gameFunctions.pauseGameForAbilityChoice(); // Isso pausará o próprio loop do jogo
        }

    } else { 
        // Se não estiver 'PLAYING', ainda desenha o player e monstros para continuidade visual
        if (window.playerState.player) {
            // Usa 0 para offset de animação se o jogo não estiver PLAYING, para não ter efeito flutuante
            window.gameFunctions.drawPlayer(window.playerState.player, 0); 
        }
        if (window.monsters && window.monsters.length > 0) {
            window.gameFunctions.drawMonsters(window.monsters);
        }
    }

    // Solicita o próximo frame se o loop do jogo ainda estiver ativo (não pausado por escolha de habilidade ou game over)
    if (window.gameStates.gameState !== 'GAME_OVER' && window.gameStates.gameState !== 'CHOOSING_ABILITY') {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// --- Configuração Inicial ao Carregar o DOM ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: Iniciando configuração inicial.");

    // Verificação crítica para canvas e contexto
    if (!window.canvas || !window.ctx) {
        console.error("DOMContentLoaded: ERRO CRÍTICO! Canvas ou seu contexto 2D não puderam ser encontrados. O jogo não pode iniciar.");
        return; // Interrompe a execução se o canvas estiver faltando
    }

    // Carrega os assets primeiro, depois inicializa o jogo
    window.gameFunctions.loadAssets().then((assets) => {
        // Atribui os assets carregados ao objeto loadedAssets dentro de gameFunctions
        window.gameFunctions.loadedAssets = assets; 
        console.log("DOMContentLoaded: Todos os assets carregados. Inicializando estado do jogo.");
        
        resetGame(); // Configura o estado inicial do jogo (player, arrays vazios, estado do menu)
        
        // Garante que a barra de controles móveis esteja inicialmente oculta
        if (window.mobileControlsBar) {
            window.mobileControlsBar.style.display = 'none';
            console.log("DOMContentLoaded: Barra de controles móveis inicialmente oculta.");
        }

        window.gameFunctions.showScreen(window.mainMenuScreen); // Mostra o menu principal
        console.log("DOMContentLoaded: Jogo inicializado. Exibindo Menu Principal.");

        // Inicia o loop do jogo somente depois que tudo estiver configurado e os assets carregados.
        // Ele será executado no estado 'MENU' inicialmente, desenhando o fundo.
        if (!animationFrameId) {
             animationFrameId = requestAnimationFrame(gameLoop);
             console.log("DOMContentLoaded: Loop do jogo iniciado.");
        }
       
    }).catch(error => {
        console.error("DOMContentLoaded: Erro durante o carregamento de assets:", error);
    });
});
