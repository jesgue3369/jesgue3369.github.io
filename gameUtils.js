// gameUtils.js - Contém funções utilitárias para carregamento de assets, desenho,
// gerenciamento de tela e mecânicas de jogo (dano, XP, habilidades).
// Depende de variáveis e funções globais expostas por main.js.

let loadedAssets = {}; // Armazena objetos Image carregados

// --- Carregamento de Assets ---
function loadAssets() {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const totalAssets = Object.keys(ASSET_PATHS).length; // ASSET_PATHS de constants.js

        if (totalAssets === 0) {
            console.log("loadAssets: Nenhum asset para carregar.");
            resolve(loadedAssets); // Resolve mesmo sem assets
            return;
        }

        for (let key in ASSET_PATHS) {
            const img = new Image();
            img.src = ASSET_PATHS[key];
            img.onload = () => {
                loadedAssets[key] = img;
                loadedCount++;
                console.log(`loadAssets: Carregado: ${key} (${loadedCount}/${totalAssets})`);
                if (loadedCount === totalAssets) {
                    console.log("loadAssets: Todos os assets carregados!");
                    resolve(loadedAssets);
                }
            };
            img.onerror = () => {
                console.error(`loadAssets: Falha ao carregar asset: ${ASSET_PATHS[key]}`);
                loadedCount++;
                if (loadedCount === totalAssets) {
                    console.warn("loadAssets: Todos os assets processados (alguns podem ter falhado).");
                    resolve(loadedAssets); // Ainda resolve para que o jogo possa tentar iniciar
                }
            };
        }
    });
}

// --- Redimensionamento do Canvas ---
// 'canvas' é passado como argumento; outras referências DOM via 'window'
function resizeCanvas(canvas, player) {
    const mobileControlsBarElement = window.mobileControlsBar; // Acessa do window
    let currentControllerBarHeight = 0;
    // Só calcula a altura se a barra de controle estiver sendo exibida
    if (mobileControlsBarElement && mobileControlsBarElement.style.display !== 'none') { 
        currentControllerBarHeight = mobileControlsBarElement.offsetHeight;
    }
    window.CONTROLLER_BAR_HEIGHT = currentControllerBarHeight;

    console.log("resizeCanvas: CONTROLLER_BAR_HEIGHT calculado:", window.CONTROLLER_BAR_HEIGHT);

    const gameContentElement = window.gameContent; // Acessa do window
    if (gameContentElement) {
        canvas.width = gameContentElement.clientWidth;
        const hudElement = document.getElementById('hud'); // Acessa diretamente, pois não está exposto globalmente
        const hudHeight = hudElement ? hudElement.offsetHeight : 0;
        console.log("resizeCanvas: hudHeight calculado:", hudHeight);

        // A altura do canvas subtrai as alturas do HUD e da barra de controles móveis
        canvas.height = gameContentElement.clientHeight - hudHeight - window.CONTROLLER_BAR_HEIGHT;
        console.log(`resizeCanvas: gameContentClientWidth: ${gameContentElement.clientWidth}, gameContentClientHeight: ${gameContentElement.clientHeight}`);
    } else {
        console.warn("resizeCanvas: window.gameContent não encontrado! Usando window.innerWidth/innerHeight como fallback.");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - window.CONTROLLER_BAR_HEIGHT;
    }

    if (canvas.width <= 0 || canvas.height <= 0) {
        console.error(`resizeCanvas: ERRO! Canvas tem dimensões inválidas: ${canvas.width}x${canvas.height}. Defaulting para 800x600.`);
        canvas.width = 800;
        canvas.height = 600;
    }

    window.GAME_WIDTH = canvas.width; // Atualiza o GAME_WIDTH global
    window.GAME_HEIGHT = canvas.height; // Atualiza o GAME_HEIGHT global

    console.log(`resizeCanvas: Tamanho final do Canvas: ${window.GAME_WIDTH}x${window.GAME_HEIGHT}`);

    if (player) {
        // Reposiciona o jogador se o tamanho do canvas mudar
        player.x = window.GAME_WIDTH / 2 - player.size / 2;
        player.y = window.GAME_HEIGHT - player.size - 20;
    }
    console.log(`resizeCanvas: Canvas redimensionado para: ${window.GAME_WIDTH}x${window.GAME_HEIGHT}. Altura dos controles: ${window.CONTROLLER_BAR_HEIGHT}`);
}

// --- Funções de Exibição de Tela ---
function showScreen(screenElement) {
    const allScreens = document.querySelectorAll('.game-screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    if (screenElement) {
        screenElement.classList.add('active');
        console.log(`showScreen: Exibindo tela: ${screenElement.id}`);
        
        // Ajusta a visibilidade da barra de controle móvel com base na tela ativa
        if (screenElement === window.gameContent) { // Se for a tela do jogo (canvas + HUD)
            if (window.mobileControlsBar) {
                window.mobileControlsBar.style.display = 'flex'; // Mostra a barra de controle
                console.log("showScreen: Mobile controls bar set to 'flex'.");
            }
        } else { // Se for qualquer outra tela (menu, game over, escolha de habilidade)
            if (window.mobileControlsBar) {
                window.mobileControlsBar.style.display = 'none'; // Esconde a barra de controle
                console.log("showScreen: Mobile controls bar set to 'none'.");
            }
        }
    } else {
        console.error("showScreen: Erro: Tentando mostrar uma tela nula ou indefinida.");
    }
}

// --- Funções de Desenho ---
function drawPlayer(player, animationOffset) {
    if (!window.ctx) {
        console.error("drawPlayer: ERRO! window.ctx não está definido!");
        return;
    }

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

    // Desenha o escudo
    if (player.shield > 0) {
        window.ctx.strokeStyle = 'cyan';
        window.ctx.lineWidth = 3;
        window.ctx.beginPath();
        window.ctx.arc(player.x + player.size / 2, playerYAdjusted + player.size / 2, player.size / 2 + 5, 0, Math.PI * 2);
        window.ctx.stroke();
    }
}

function drawMonsters(monsters) { // array de monstros passado como argumento
    if (!window.ctx) {
        console.error("drawMonsters: ERRO! window.ctx não está definido!");
        return;
    }
    monsters.forEach(monster => {
        const monsterYAdjusted = monster.y + monster.animationOffset;
        const monsterSprite = loadedAssets[monster.sprite]; // Pega o sprite de loadedAssets
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

        // Desenha a barra de vida
        const healthBarWidth = monster.size * 0.8;
        const healthBarHeight = 5;
        const healthRatio = monster.health / monster.maxHealth;
        window.ctx.fillStyle = 'red';
        window.ctx.fillRect(monster.x + monster.size * 0.1, monsterYAdjusted - 10, healthBarWidth, healthBarHeight);
        window.ctx.fillStyle = 'green';
        window.ctx.fillRect(monster.x + monster.size * 0.1, monsterYAdjusted - 10, healthBarWidth * healthRatio, healthBarHeight);
    });
}

function drawSpells(spells) { // array de magias passado como argumento
    if (!window.ctx) {
        console.error("drawSpells: ERRO! window.ctx não está definido!");
        return;
    }
    spells.forEach(spell => {
        const spellSprite = loadedAssets[spell.sprite]; // Pega o sprite de loadedAssets
        if (spell.type === 'aoe_lightning') {
            window.ctx.strokeStyle = spell.color;
            window.ctx.lineWidth = 3;
            // Desenha uma linha da posição original do jogador até a posição do monstro atingido
            window.ctx.beginPath();
            // Start from player's spell cast origin (which is player's x + size/2, and player's y)
            window.ctx.moveTo(spell.x, window.playerState.player.y + window.playerState.player.size / 2); 
            window.ctx.lineTo(spell.x, spell.y); // Go to target monster's Y (passed as spell.y for lightning)
            window.ctx.stroke();

            // Desenha um círculo no ponto de impacto
            window.ctx.fillStyle = spell.color;
            window.ctx.beginPath();
            window.ctx.arc(spell.x, spell.y, spell.radius / 2, 0, Math.PI * 2);
            window.ctx.fill();
        } else if (spell.type === 'aoe_dot' || spell.type === 'aoe_slow' || spell.type === 'aoe') {
             window.ctx.fillStyle = spell.color.replace(')', ', 0.4)'); // Torna semi-transparente
             window.ctx.beginPath();
             window.ctx.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2);
             window.ctx.fill();
        } else { // Magias de projétil
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

function drawMonsterProjectiles(monsterProjectiles) { // array de monsterProjectiles passado como argumento
    if (!window.ctx) {
        console.error("drawMonsterProjectiles: ERRO! window.ctx não está definido!");
        return;
    }
    monsterProjectiles.forEach(projectile => {
        const projectileSprite = loadedAssets.projectile_monster; // Pega o sprite de loadedAssets
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

function drawPoisonClouds(poisonClouds) { // array de poisonClouds passado como argumento
    if (!window.ctx) {
        console.error("drawPoisonClouds: ERRO! window.ctx não está definido!");
        return;
    }
    poisonClouds.forEach(cloud => {
        if (cloud.duration > 0) {
            // Efeito de fade out
            window.ctx.fillStyle = `rgba(128, 0, 128, ${(cloud.duration / SPELLS_DATA['Névoa Venenosa'].duration) * 0.4})`;
            window.ctx.beginPath();
            window.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            window.ctx.fill();
        }
    });
}

// --- Atualização do HUD ---
function updateHUD(player, currentWave) {
    // Acessa os elementos do HUD através das propriedades 'window.'
    if (window.hudHealthValue) window.hudHealthValue.textContent = `${player.health.toFixed(0)}/${player.maxHealth.toFixed(0)}${player.shield > 0 ? ` (+${player.shield.toFixed(0)})` : ''}`;
    if (window.hudManaValue) window.hudManaValue.textContent = `${player.mana.toFixed(0)}/${player.maxMana.toFixed(0)}`;
    if (window.hudLevelValue) window.hudLevelValue.textContent = player.level;
    if (window.hudXpValue) window.hudXpValue.textContent = `${player.xp.toFixed(0)}/${player.xpToNextLevel.toFixed(0)}`;
    if (window.hudSpellName) window.hudSpellName.textContent = player.activeSpells[player.currentSpellIndex];
    if (window.hudWaveValue) window.hudWaveValue.textContent = currentWave;
}

// --- Mecânicas de Jogo (Dano, XP, Habilidades) ---
function takeDamage(player, amount, endGameCallback) {
    console.log(`takeDamage: Jogador recebeu ${amount} de dano. Vida antes: ${player.health.toFixed(0)}, Escudo: ${player.shield.toFixed(0)}`);
    if (player.shield > 0) {
        const remainingDamage = amount - player.shield;
        player.shield = Math.max(0, player.shield - amount);
        if (remainingDamage > 0) {
            player.health -= remainingDamage;
        }
    } else {
        player.health -= amount;
    }
    player.health = Math.max(0, player.health); // Garante que a vida não fique abaixo de 0
    console.log(`takeDamage: Vida atual: ${player.health.toFixed(0)}, Escudo atual: ${player.shield.toFixed(0)}`);

    if (player.health <= 0) {
        console.log("takeDamage: Vida do jogador chegou a zero. Chamando endGameCallback.");
        endGameCallback();
    }
}

function gainXP(player, amount) { 
    player.xp += amount;
    console.log(`gainXP: Jogador ganhou ${amount} XP. Total XP: ${player.xp.toFixed(0)}/${player.xpToNextLevel.toFixed(0)}`);
    if (player.xp >= player.xpToNextLevel) {
        player.levelUp(); // Chama o método levelUp do player
    }
}

// Função para gerar cartas de habilidade na tela de escolha de habilidade
function generateAbilityCards(player, startNextWaveCallback) {
    const abilityCardOptionsDiv = window.abilityCardOptionsDiv; // Acessa do window
    if (!abilityCardOptionsDiv) {
        console.error("generateAbilityCards: Erro: window.abilityCardOptionsDiv não encontrado para gerar cartas de habilidade.");
        return;
    }
    abilityCardOptionsDiv.innerHTML = ''; // Limpa as cartas anteriores
    
    const availableAbilities = [...ABILITY_CARDS]; // Copia para modificar. ABILITY_CARDS de constants.js
    const chosenCards = [];

    const cardsToGenerate = Math.min(3, availableAbilities.length); 

    for (let i = 0; i < cardsToGenerate; i++) {
        let chosen = null;
        let attempts = 0;
        const maxAttempts = availableAbilities.length * 2; // Evita loops infinitos

        do {
            if (availableAbilities.length === 0) {
                console.warn("generateAbilityCards: Nenhuma habilidade única restante para escolher!");
                break;
            }
            const randomIndex = Math.floor(Math.random() * availableAbilities.length);
            const potentialChosen = availableAbilities.splice(randomIndex, 1)[0];

            // Evita adicionar a mesma magia duas vezes se for um cartão "Nova Magia"
            if (potentialChosen && potentialChosen.name.startsWith("Nova Magia:")) {
                const spellName = potentialChosen.name.replace("Nova Magia: ", "");
                if (player.activeSpells.includes(spellName)) {
                    // Esta magia já está ativa, tenta outra
                    console.log(`generateAbilityCards: Magia "${spellName}" já ativa, pulando cartão.`);
                    potentialChosen = null; // Marca como inválido para esta tentativa
                }
            }
            chosen = potentialChosen;
            attempts++;
        } while (!chosen && attempts < maxAttempts);

        if (!chosen) {
            console.warn("generateAbilityCards: Não foi possível encontrar uma habilidade única para este slot.");
            continue; 
        }
        chosenCards.push(chosen); // Adiciona a carta escolhida válida
    }

    chosenCards.forEach(chosen => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('ability-card');
        cardElement.innerHTML = `<h3>${chosen.name}</h3><p>${chosen.description}</p>`;
        cardElement.addEventListener('click', () => {
            chosen.apply(); // Aplica a habilidade
            // Se for um novo cartão de magia, muda para ele
            if (chosen.name.startsWith("Nova Magia:")) {
                player.currentSpellIndex = player.activeSpells.indexOf(chosen.name.replace("Nova Magia: ", ""));
            }
            if (window.gameFunctions && typeof window.gameFunctions.updateHUD === 'function') {
                window.gameFunctions.updateHUD(player, window.gameStates.currentWave); // Atualiza o HUD após aplicar
            }
            if (window.gameFunctions && typeof window.gameFunctions.showScreen === 'function') {
                window.gameFunctions.showScreen(window.gameContent); // Volta para a tela do jogo
            }
            startNextWaveCallback(); // Inicia a próxima onda
        });
        abilityCardOptionsDiv.appendChild(cardElement);
    });
}
