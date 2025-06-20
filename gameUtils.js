// Variáveis que precisarão ser acessíveis de outros arquivos
// Serão inicializadas em main.js e passadas ou acessadas via objeto global
let loadedAssets = {};
// window.ctx, window.GAME_WIDTH, window.GAME_HEIGHT são definidas em main.js para acessibilidade global

// Elementos HUD e Telas
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
const gameContent = document.getElementById('game-content'); // Importante: obter game-content aqui também

// --- Verificação de Elementos (adicionado para depuração) ---
document.addEventListener('DOMContentLoaded', () => {
    // Estas logs são vitais para depurar problemas de 'null'
    console.log("DOM Carregado - Verificando elementos:");
    console.log("mainMenuScreen:", mainMenuScreen);
    console.log("gameOverScreen:", gameOverScreen);
    console.log("abilityCardsScreen:", abilityCardsScreen);
    console.log("abilityCardOptionsDiv:", abilityCardOptionsDiv);
    console.log("mobileControlsBar:", mobileControlsBar);
    console.log("gameContent:", gameContent); // Adicionado para verificação
    console.log("hudHealthValue:", hudHealthValue);
    // Adicione verificações para outros elementos se necessário

    if (!mainMenuScreen) console.error("Erro CRÍTICO: #main-menu-screen não encontrado!");
    if (!gameOverScreen) console.error("Erro CRÍTICO: #game-over-screen não encontrado!");
    if (!abilityCardsScreen) console.error("Erro CRÍTICO: #ability-cards-screen não encontrado!");
    if (!abilityCardOptionsDiv) console.error("Erro CRÍTICO: #ability-card-options não encontrado!");
    if (!mobileControlsBar) console.error("Erro CRÍTICO: #mobile-controls-bar não encontrado!");
    if (!gameContent) console.error("Erro CRÍTICO: #game-content não encontrado!");
    if (!hudHealthValue) console.error("Erro: #health-value não encontrado!");
    if (!hudManaValue) console.error("Erro: #mana-value não encontrado!");
    if (!hudLevelValue) console.error("Erro: #level-value não encontrado!");
    if (!hudXpValue) console.error("Erro: #xp-value não encontrado!");
    if (!hudSpellName) console.error("Erro: #spell-name não encontrado!");
    if (!hudWaveValue) console.error("Erro: #wave-value não encontrado!");
});


// --- Asset Loading ---
function loadAssets() {
    return new Promise(resolve => {
        let loadedCount = 0;
        const totalAssets = Object.keys(ASSET_PATHS).length;

        if (totalAssets === 0) { // Handle case with no assets
            console.log("Nenhum asset para carregar.");
            resolve();
            return;
        }

        for (let key in ASSET_PATHS) {
            const img = new Image();
            img.src = ASSET_PATHS[key];
            img.onload = () => {
                loadedAssets[key] = img;
                loadedCount++;
                // console.log(`Asset carregado: ${key} (${loadedCount}/${totalAssets})`); // Pode ser muito verboso
                if (loadedCount === totalAssets) {
                    console.log("Todos os assets carregados!");
                    resolve();
                }
            };
            img.onerror = () => {
                console.error(`Falha ao carregar imagem: ${ASSET_PATHS[key]}`);
                loadedCount++;
                if (loadedCount === totalAssets) {
                    console.log("Todos os assets carregados (com erros ou não)!");
                    resolve();
                }
            };
        }
    });
}

// --- Canvas Resizing ---
// ctx, GAME_WIDTH, GAME_HEIGHT são variáveis globais definidas em main.js
function resizeCanvas(canvas, player) {
    // Certifique-se de que mobileControlsBar não é null
    CONTROLLER_BAR_HEIGHT = mobileControlsBar ? mobileControlsBar.offsetHeight : 0;

    // Use clientWidth/clientHeight do game-content para o canvas
    // Isso garante que o canvas se ajuste à área visível da div pai
    if (gameContent) { // Verificação para garantir que gameContent existe
        canvas.width = gameContent.clientWidth;
        // Ajusta a altura do canvas subtraindo a altura do HUD e da barra de controle, se aplicável
        canvas.height = gameContent.clientHeight - (hudHealthValue ? hudHealthValue.offsetHeight : 0) - CONTROLLER_BAR_HEIGHT;
    } else {
        // Fallback se gameContent não for encontrado
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - CONTROLLER_BAR_HEIGHT;
    }


    window.GAME_WIDTH = canvas.width; // Atualiza a variável global
    window.GAME_HEIGHT = canvas.height; // Atualiza a variável global

    if (player) {
        player.x = window.GAME_WIDTH / 2 - player.size / 2;
        player.y = window.GAME_HEIGHT - player.size - 20;
    }
    console.log(`Canvas redimensionado para: ${window.GAME_WIDTH}x${window.GAME_HEIGHT}. Altura dos controles: ${CONTROLLER_BAR_HEIGHT}`);
}

// --- Screen Display Functions ---
function showScreen(screenElement) {
    const allScreens = document.querySelectorAll('.game-screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
        // console.log(`Removendo 'active' de: ${screen.id}`); // Para depuração
    });
    if (screenElement) { // Verificação para garantir que o elemento existe
        screenElement.classList.add('active');
        console.log(`Exibindo tela: ${screenElement.id}`); // Para depuração
    } else {
        console.error("Erro: Tentando mostrar uma tela nula ou indefinida.");
    }
}

// --- Drawing Functions ---
// Usando window.ctx para acessar o contexto global
function drawPlayer(player, animationOffset) {
    const playerYAdjusted = player.y + animationOffset;

    if (loadedAssets.player && loadedAssets.player.complete) {
        window.ctx.drawImage(loadedAssets.player, player.x, playerYAdjusted, player.size, player.size);
    } else {
        window.ctx.fillStyle = '#00f';
        window.ctx.fillRect(player.x, playerYAdjusted, player.size, player.size);
        window.ctx.fillStyle = 'white';
        window.ctx.font = `${player.size * 0.6}px Arial`;
        window.ctx.textAlign = 'center';
        window.ctx.textBaseline = 'middle';
        window.ctx.fillText('M', player.x + player.size / 2, playerYAdjusted + player.size / 2);
    }

    if (player.shield > 0) {
        window.ctx.strokeStyle = 'cyan';
        window.ctx.lineWidth = 3;
        window.ctx.beginPath();
        window.ctx.arc(player.x + player.size / 2, playerYAdjusted + player.size / 2, player.size / 2 + 5, 0, Math.PI * 2);
        window.ctx.stroke();
    }
}

function drawMonsters(monsters) {
    monsters.forEach(monster => {
        const monsterYAdjusted = monster.y + monster.animationOffset;
        const monsterSprite = loadedAssets[monster.sprite];
        if (monsterSprite && monsterSprite.complete) {
            window.ctx.drawImage(monsterSprite, monster.x, monsterYAdjusted, monster.size, monster.size);
        } else {
            window.ctx.fillStyle = monster.color;
            window.ctx.beginPath();
            window.ctx.arc(monster.x + monster.size / 2, monsterYAdjusted + monster.size / 2, monster.size / 2, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.fillStyle = 'white';
            window.ctx.font = `${monster.size * 0.6}px Arial`;
            window.ctx.textAlign = 'center';
            window.ctx.textBaseline = 'middle';
            window.ctx.fillText(monster.initial, monster.x + monster.size / 2, monsterYAdjusted + monster.size / 2);
        }

        const healthBarWidth = monster.size * 0.8;
        const healthBarHeight = 5;
        const healthRatio = monster.health / monster.maxHealth;
        window.ctx.fillStyle = 'red';
        window.ctx.fillRect(monster.x + monster.size * 0.1, monsterYAdjusted - 10, healthBarWidth, healthBarHeight);
        window.ctx.fillStyle = 'green';
        window.ctx.fillRect(monster.x + monster.size * 0.1, monsterYAdjusted - 10, healthBarWidth * healthRatio, healthBarHeight);
    });
}

function drawSpells(spells) {
    spells.forEach(spell => {
        const spellSprite = loadedAssets[spell.sprite];
        if (spell.type === 'aoe_lightning') {
            window.ctx.strokeStyle = spell.color;
            window.ctx.lineWidth = 3;
            window.ctx.beginPath();
            window.ctx.moveTo(spell.x, 0);
            window.ctx.lineTo(spell.x, spell.y);
            window.ctx.stroke();

            window.ctx.fillStyle = spell.color;
            window.ctx.beginPath();
            window.ctx.arc(spell.x, spell.y, spell.radius / 2, 0, Math.PI * 2);
            window.ctx.fill();
        } else if (spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
             window.ctx.fillStyle = spell.color.replace(')', ', 0.4)');
             window.ctx.beginPath();
             window.ctx.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2);
             window.ctx.fill();
        }
        else {
            if (spellSprite && spellSprite.complete) {
                window.ctx.drawImage(spellSprite, spell.x - SPELL_SIZE / 2, spell.y - SPELL_SIZE / 2, SPELL_SIZE, SPELL_SIZE);
            } else {
                window.ctx.fillStyle = spell.color;
                window.ctx.beginPath();
                window.ctx.arc(spell.x, spell.y, SPELL_SIZE / 2, 0, Math.PI * 2);
                window.ctx.fill();
            }
        }
    });
}

function drawMonsterProjectiles(monsterProjectiles) {
    monsterProjectiles.forEach(projectile => {
        const projectileSprite = loadedAssets.projectile_monster;
        if (projectileSprite && projectileSprite.complete) {
            window.ctx.drawImage(projectileSprite, projectile.x - projectile.size / 2, projectile.y - projectile.size / 2, projectile.size, projectile.size);
        } else {
            window.ctx.fillStyle = projectile.color;
            window.ctx.beginPath();
            window.ctx.arc(projectile.x, projectile.y, projectile.size / 2, 0, Math.PI * 2);
            window.ctx.fill();
        }
    });
}

function drawPoisonClouds(poisonClouds) {
    poisonClouds.forEach(cloud => {
        if (cloud.duration > 0) {
            window.ctx.fillStyle = `rgba(128, 0, 128, ${cloud.duration / SPELLS_DATA['Névoa Venenosa'].duration * 0.4})`;
            window.ctx.beginPath();
            window.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            window.ctx.fill();
        }
    });
}

function updateHUD(player, currentWave) {
    // Certifique-se de que os elementos HUD existam antes de tentar atualizá-los
    if (hudHealthValue) hudHealthValue.textContent = `${player.health}/${player.maxHealth}${player.shield > 0 ? ` (+${player.shield})` : ''}`;
    if (hudManaValue) hudManaValue.textContent = `${player.mana.toFixed(0)}/${player.maxMana.toFixed(0)}`;
    if (hudLevelValue) hudLevelValue.textContent = player.level;
    if (hudXpValue) hudXpValue.textContent = `${player.xp}/${player.xpToNextLevel}`;
    if (hudSpellName) hudSpellName.textContent = player.activeSpells[player.currentSpellIndex];
    if (hudWaveValue) hudWaveValue.textContent = currentWave;
}

// --- Colisão e Dano ---
// Adaptação: agora recebe endGameCallback (passado de main.js)
function takeDamage(player, amount, endGameCallback) {
    console.log(`Jogador recebeu ${amount} de dano. Vida antes: ${player.health}, Escudo: ${player.shield}`); // Depuração
    if (player.shield > 0) {
        const remainingDamage = amount - player.shield;
        player.shield = Math.max(0, player.shield - amount);
        if (remainingDamage > 0) {
            player.health -= remainingDamage;
        }
    } else {
        player.health -= amount;
    }
    if (player.health < 0) player.health = 0;
    console.log(`Vida atual: ${player.health}, Escudo atual: ${player.shield}`); // Depuração

    if (player.health <= 0) {
        console.log("Vida do jogador chegou a zero. Chamando endGameCallback."); // Depuração
        endGameCallback(); // Usa o callback passado
    }
}

function applyDamageToMonster(monster, damage) {
    if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
        // console.log('Ghost evaded attack!'); // Pode ser verboso
        return;
    }
    monster.health -= damage;
}

// Adaptação: agora recebe levelUpCallback (passado de main.js)
function gainXP(player, amount, levelUpCallback) {
    player.xp += amount;
    if (player.xp >= player.xpToNextLevel) {
        levelUpCallback(); // Usa o callback passado
    }
}

// --- Gerenciamento de Habilidades ---
// Adaptação: agora recebe playerState.player e startNextWaveCallback
function generateAbilityCards(player, startNextWaveCallback) {
    if (!abilityCardOptionsDiv) {
        console.error("Erro: abilityCardOptionsDiv não encontrado para gerar cartas de habilidade.");
        return;
    }
    abilityCardOptionsDiv.innerHTML = ''; // Clear previous cards
    const chosenCards = [];

    const availableAbilities = [...ABILITY_CARDS];

    // Certifique-se de que não estamos em um loop infinito se não houver cartas disponíveis
    const cardsToGenerate = Math.min(3, availableAbilities.length); 

    for (let i = 0; i < cardsToGenerate; i++) {
        let chosen;
        let attempts = 0;
        const maxAttempts = availableAbilities.length * 2; // Evita loop infinito em cenários complexos

        do {
            if (availableAbilities.length === 0) {
                console.warn("Nenhuma habilidade disponível para escolher!");
                break; // Sai do loop se não houver mais habilidades
            }
            const randomIndex = Math.floor(Math.random() * availableAbilities.length);
            chosen = availableAbilities.splice(randomIndex, 1)[0];

            // Verifica se a magia já foi aprendida e tenta escolher outra
            if (chosen.name.startsWith("Nova Magia:") && player.activeSpells.includes(chosen.name.replace("Nova Magia: ", ""))) {
                // Se já tem, adiciona de volta para não perder a carta, mas não a considera para esta rodada
                // Ou você pode optar por simplesmente descartar e tentar outra sem adicioná-la de volta
                // Para simplificar, vamos apenas tentar novamente sem adicionar de volta
                chosen = null; 
            }
            attempts++;
        } while (!chosen && attempts < maxAttempts);

        if (!chosen) {
            console.warn("Não foi possível encontrar 3 habilidades únicas para escolher.");
            break; // Sai se não conseguir escolher uma carta válida após várias tentativas
        }


        const cardElement = document.createElement('div');
        cardElement.classList.add('ability-card');
        cardElement.innerHTML = `<h3>${chosen.name}</h3><p>${chosen.description}</p>`;
        cardElement.addEventListener('click', () => {
            chosen.apply(); // A função apply está dentro do escopo de constants.js, que acessa playerState.player globalmente
            if (chosen.name.startsWith("Nova Magia:")) {
                // Atualiza o índice da magia atual para a nova magia, se for uma nova magia
                player.currentSpellIndex = player.activeSpells.indexOf(chosen.name.replace("Nova Magia: ", ""));
            }
            // gameStates é uma variável global em main.js. Aqui, estamos acessando-a diretamente.
            updateHUD(player, window.gameStates.currentWave);
            showScreen(window.gameContent); // Mostra a tela do jogo novamente
            startNextWaveCallback(); // Inicia a próxima onda
        });
        abilityCardOptionsDiv.appendChild(cardElement);
    }
}
