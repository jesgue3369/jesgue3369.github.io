// Este arquivo agora acessará elementos DOM e variáveis globais SOMENTE via o objeto 'window'
// A responsabilidade de declarar e expor esses elementos é de main.js.

let loadedAssets = {};

// --- Asset Loading ---
function loadAssets() {
    return new Promise(resolve => {
        let loadedCount = 0;
        const totalAssets = Object.keys(ASSET_PATHS).length; // ASSET_PATHS vem de constants.js

        if (totalAssets === 0) {
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
// 'canvas' é passado como argumento; outras referências DOM via 'window'
function resizeCanvas(canvas, player) {
    const mobileControlsBarElement = window.mobileControlsBar; // Acessa do window
    let currentControllerBarHeight = 0;
    if (mobileControlsBarElement && mobileControlsBarElement.style.display !== 'none') { 
        currentControllerBarHeight = mobileControlsBarElement.offsetHeight;
    }
    window.CONTROLLER_BAR_HEIGHT = currentControllerBarHeight;

    console.log("CONTROLLER_BAR_HEIGHT calculado:", window.CONTROLLER_BAR_HEIGHT);

    const gameContentElement = window.gameContent; // Acessa do window
    if (gameContentElement) {
        canvas.width = gameContentElement.clientWidth;
        const hudElement = document.getElementById('hud'); // HUD ainda pode ser obtido aqui ou globalmente
        const hudHeight = hudElement ? hudElement.offsetHeight : 0;
        console.log("hudHeight calculado:", hudHeight);

        canvas.height = gameContentElement.clientHeight - hudHeight - window.CONTROLLER_BAR_HEIGHT;
        console.log(`gameContentClientWidth: ${gameContentElement.clientWidth}, gameContentClientHeight: ${gameContentElement.clientHeight}`);
    } else {
        console.warn("window.gameContent não encontrado! Usando window.innerWidth/innerHeight como fallback para resizeCanvas.");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - window.CONTROLLER_BAR_HEIGHT;
    }

    if (canvas.width <= 0 || canvas.height <= 0) {
        console.error(`ERRO: Canvas tem dimensões inválidas: ${canvas.width}x${canvas.height}`);
    }

    window.GAME_WIDTH = canvas.width;
    window.GAME_HEIGHT = canvas.height;

    console.log(`Canvas final size: ${window.GAME_WIDTH}x${window.GAME_HEIGHT}`);

    if (player) {
        player.x = window.GAME_WIDTH / 2 - player.size / 2;
        player.y = window.GAME_HEIGHT - player.size - 20;
    }
    console.log(`Canvas redimensionado para: ${window.GAME_WIDTH}x${window.GAME_HEIGHT}. Altura dos controles: ${window.CONTROLLER_BAR_HEIGHT}`);
}

// --- Screen Display Functions ---
function showScreen(screenElement) {
    const allScreens = document.querySelectorAll('.game-screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    if (screenElement) {
        screenElement.classList.add('active');
        console.log(`Exibindo tela: ${screenElement.id}`);
        
        // Ajusta a visibilidade da barra de controle móvel com base na tela ativa
        if (screenElement === window.gameContent) { // Se for a tela do jogo (canvas + HUD)
            if (window.mobileControlsBar) {
                window.mobileControlsBar.style.display = 'flex'; // Mostra a barra de controle
                console.log("Mobile controls bar set to 'flex'.");
            }
        } else { // Se for qualquer outra tela (menu, game over, escolha de habilidade)
            if (window.mobileControlsBar) {
                window.mobileControlsBar.style.display = 'none'; // Esconde a barra de controle
                console.log("Mobile controls bar set to 'none'.");
            }
        }
    } else {
        console.error("Erro: Tentando mostrar uma tela nula ou indefinida.");
    }
}

// --- Drawing Functions ---
function drawPlayer(player, animationOffset) {
    if (!window.ctx) {
        console.error("ERRO: window.ctx não está definido em drawPlayer!");
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

    if (player.shield > 0) {
        window.ctx.strokeStyle = 'cyan';
        window.ctx.lineWidth = 3;
        window.ctx.beginPath();
        window.ctx.arc(player.x + player.size / 2, playerYAdjusted + player.size / 2, player.size / 2 + 5, 0, Math.PI * 2);
        window.ctx.stroke();
    }
}

function drawMonsters(monsters) {
    if (!window.ctx) {
        console.error("ERRO: window.ctx não está definido em drawMonsters!");
        return;
    }
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
    if (!window.ctx) {
        console.error("ERRO: window.ctx não está definido em drawSpells!");
        return;
    }
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
    if (!window.ctx) {
        console.error("ERRO: window.ctx não está definido em drawMonsterProjectiles!");
        return;
    }
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
    if (!window.ctx) {
        console.error("ERRO: window.ctx não está definido em drawPoisonClouds!");
        return;
    }
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
    if (window.hudHealthValue) window.hudHealthValue.textContent = `${player.health}/${player.maxHealth}${player.shield > 0 ? ` (+${player.shield})` : ''}`;
    if (window.hudManaValue) window.hudManaValue.textContent = `${player.mana.toFixed(0)}/${player.maxMana.toFixed(0)}`;
    if (window.hudLevelValue) window.hudLevelValue.textContent = player.level;
    if (window.hudXpValue) window.hudXpValue.textContent = `${player.xp}/${player.xpToNextLevel}`;
    if (window.hudSpellName) window.hudSpellName.textContent = player.activeSpells[player.currentSpellIndex];
    if (window.hudWaveValue) window.hudWaveValue.textContent = currentWave;
}

function takeDamage(player, amount, endGameCallback) {
    console.log(`Jogador recebeu ${amount} de dano. Vida antes: ${player.health}, Escudo: ${player.shield}`);
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
    console.log(`Vida atual: ${player.health}, Escudo atual: ${player.shield}`);

    if (player.health <= 0) {
        console.log("Vida do jogador chegou a zero. Chamando endGameCallback.");
        endGameCallback();
    }
}

function applyDamageToMonster(monster, damage) {
    if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
        return;
    }
    monster.health -= damage;
}

function gainXP(player, amount, levelUpCallback) {
    player.xp += amount;
    if (player.xp >= player.xpToNextLevel) {
        levelUpCallback();
    }
}

function generateAbilityCards(player, startNextWaveCallback) {
    const abilityCardOptionsDiv = window.abilityCardOptionsDiv; // Acessa do window
    if (!abilityCardOptionsDiv) {
        console.error("Erro: window.abilityCardOptionsDiv não encontrado para gerar cartas de habilidade.");
        return;
    }
    abilityCardOptionsDiv.innerHTML = '';
    const chosenCards = [];

    const availableAbilities = [...ABILITY_CARDS]; // ABILITY_CARDS vem de constants.js

    const cardsToGenerate = Math.min(3, availableAbilities.length); 

    for (let i = 0; i < cardsToGenerate; i++) {
        let chosen;
        let attempts = 0;
        const maxAttempts = availableAbilities.length * 2; 

        do {
            if (availableAbilities.length === 0) {
                console.warn("Nenhuma habilidade disponível para escolher!");
                break;
            }
            const randomIndex = Math.floor(Math.random() * availableAbilities.length);
            chosen = availableAbilities.splice(randomIndex, 1)[0];

            if (chosen && chosen.name.startsWith("Nova Magia:") && player.activeSpells.includes(chosen.name.replace("Nova Magia: ", ""))) {
                chosen = null;
            }
            attempts++;
        } while (!chosen && attempts < maxAttempts);

        if (!chosen) {
            console.warn("Não foi possível encontrar uma habilidade única para escolher.");
            continue; 
        }

        const cardElement = document.createElement('div');
        cardElement.classList.add('ability-card');
        cardElement.innerHTML = `<h3>${chosen.name}</h3><p>${chosen.description}</p>`;
        cardElement.addEventListener('click', () => {
            chosen.apply();
            if (chosen.name.startsWith("Nova Magia:")) {
                player.currentSpellIndex = player.activeSpells.indexOf(chosen.name.replace("Nova Magia: ", ""));
            }
            updateHUD(player, window.gameStates.currentWave);
            showScreen(window.gameContent); // Usa window.gameContent
            startNextWaveCallback();
        });
        abilityCardOptionsDiv.appendChild(cardElement);
    }
}
