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

// --- Verificação de Elementos (adicionado para depuração) ---
document.addEventListener('DOMContentLoaded', () => {
    if (!mainMenuScreen) console.error("Erro: #main-menu-screen não encontrado!");
    if (!gameOverScreen) console.error("Erro: #game-over-screen não encontrado!");
    if (!abilityCardsScreen) console.error("Erro: #ability-cards-screen não encontrado!");
    if (!abilityCardOptionsDiv) console.error("Erro: #ability-card-options não encontrado!");
    if (!mobileControlsBar) console.error("Erro: #mobile-controls-bar não encontrado!");
    if (!hudHealthValue) console.error("Erro: #health-value não encontrado!");
    // Adicione verificações para outros elementos se necessário
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

    canvas.width = document.getElementById('game-content').clientWidth;
    canvas.height = document.getElementById('game-content').clientHeight;

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
    });
    if (screenElement) { // Verificação para garantir que o elemento existe
        screenElement.classList.add('active');
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

    if (player.health <= 0) {
        endGameCallback(); // Usa o callback passado
    }
}

function applyDamageToMonster(monster, damage) {
    if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
        console.log('Ghost evaded attack!');
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

    for (let i = 0; i < 3; i++) {
        if (availableAbilities.length === 0) break;

        const randomIndex = Math.floor(Math.random() * availableAbilities.length);
        const chosen = availableAbilities.splice(randomIndex, 1)[0];

        if (chosen.name.startsWith("Nova Magia:") && player.activeSpells.includes(chosen.name.replace("Nova Magia: ", ""))) {
            i--; // Retry to pick another card if this one is already known
            continue;
        }

        const cardElement = document.createElement('div');
        cardElement.classList.add('ability-card');
        cardElement.innerHTML = `<h3>${chosen.name}</h3><p>${chosen.description}</p>`;
        cardElement.addEventListener('click', () => {
            chosen.apply(); // A função apply está dentro do escopo de constants.js, que acessa playerState.player globalmente
            if (chosen.name.startsWith("Nova Magia:")) {
                player.currentSpellIndex = player.activeSpells.indexOf(chosen.name.replace("Nova Magia: ", ""));
            }
            // gameStates é uma variável global em main.js. Aqui, estamos acessando-a diretamente.
            // Para maior modularidade, gameStates.currentWave poderia ser passado como parâmetro para updateHUD
            updateHUD(player, window.gameStates.currentWave);
            showScreen(window.gameContent); // Mostra a tela do jogo novamente
            startNextWaveCallback(); // Inicia a próxima onda
        });
        abilityCardOptionsDiv.appendChild(cardElement);
    }
}
