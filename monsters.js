// monsters.js - Define a classe Monster e as funções relacionadas aos monstros.

// Monster Class Definition
class Monster {
    constructor(type, x, y, size, health, speed, color, initial, sprite, contactDamage = 10, evadeChance = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.color = color;
        this.initial = initial; // Initial for fallback drawing
        this.sprite = sprite; // Key for loadedAssets (from gameUtils)
        this.contactDamage = contactDamage; // Damage on collision with player
        this.evadeChance = evadeChance; // For Ghost type

        this.animationOffset = 0; // For floating animation
        this.isAlive = true;
        this.isSlowed = false; // For slow effects (not fully implemented in movement logic yet, but property exists)
    }

    move(player) {
        if (!this.isAlive) return;

        // Monstros se movem em direção ao jogador (apenas no eixo X para simplificar)
        if (this.x < player.x) {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }

        this.y += this.speed; // Monstros se movem para baixo

        // Verifica se o monstro passou da parte inferior da tela
        if (this.y > window.GAME_HEIGHT + this.size) { // GAME_HEIGHT do window
            this.isAlive = false; // Marca para remoção
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isAlive = false;
        }
    }
}

// Variável global para controlar o tempo de spawn dos monstros
window.lastMonsterSpawnTime = 0;

// Função para gerar um novo monstro
function spawnMonster(currentWave, monstersInWave, spawnedMonstersCount, gameWidth, gameHeight) {
    const now = performance.now();
    // Spawns mais rápidos em ondas mais altas, mínimo de 100ms de intervalo
    const spawnInterval = Math.max(100, 1000 - (currentWave * 20)); 
    
    if (now - window.lastMonsterSpawnTime < spawnInterval) {
        return false; // Não passou tempo suficiente
    }

    if (spawnedMonstersCount >= monstersInWave) {
        return false; // Todos os monstros desta onda já foram gerados
    }

    let monsterType = 'basic';
    let monsterSize = 30;
    let monsterSpeed = 1;
    let monsterHealth = 20;
    let monsterColor = 'red';
    let monsterInitial = 'B';
    let monsterSprite = 'monster_basic';
    let contactDamage = 10;
    let evadeChance = 0;

    // Escala a dificuldade com as ondas
    if (currentWave >= 2) {
        monsterHealth += (currentWave - 1) * 5;
        monsterSpeed += (currentWave - 1) * 0.2;
    }
    if (currentWave >= 3) {
        const rand = Math.random();
        if (rand < 0.2) { // 20% de chance para shooter
            monsterType = 'shooter';
            monsterSize = 40;
            monsterHealth *= 1.5;
            monsterSpeed = 0.8; 
            monsterColor = 'purple';
            monsterInitial = 'S';
            monsterSprite = 'monster_shooter';
            contactDamage = 0; // Shooters causam dano com projéteis
        } else if (rand < 0.4) { // 20% de chance para ghost (total 40%)
            monsterType = 'ghost';
            monsterSize = 35;
            monsterHealth *= 0.8; // Ghosts têm menos vida, mas podem evadir
            monsterSpeed = 1.2; 
            monsterColor = 'cyan';
            monsterInitial = 'G';
            monsterSprite = 'monster_ghost';
            contactDamage = 5;
            evadeChance = 0.3; // 30% de chance de evadir magias do jogador
        } else if (rand < 0.6 && currentWave >= 5) { // 20% de chance para exploder (total 60% com outros)
            monsterType = 'exploder';
            monsterSize = 45;
            monsterHealth *= 1.2;
            monsterSpeed = 0.9; 
            monsterColor = 'orange';
            monsterInitial = 'E';
            monsterSprite = 'monster_exploder';
            contactDamage = 30; // Explode em contato
        }
    }

    const x = Math.random() * (gameWidth - monsterSize);
    const y = -monsterSize; // Spawna acima da tela

    const newMonster = new Monster(monsterType, x, y, monsterSize, monsterHealth, monsterSpeed, monsterColor, monsterInitial, monsterSprite, contactDamage, evadeChance);
    window.monsters.push(newMonster); // Adiciona ao array global de monstros
    window.lastMonsterSpawnTime = now;
    console.log(`Monstro ${newMonster.type} (Onda ${currentWave}) spawna. Total: ${window.monsters.length}`);
    return true; // Monstro foi gerado
}

// Função para mover todos os monstros ativos e lidar com aqueles que saem dos limites
function handleMonstersMovement(player, endGameCallback) {
    for (let i = window.monsters.length - 1; i >= 0; i--) {
        let monster = window.monsters[i];
        
        // Atualiza o deslocamento da animação
        monster.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(performance.now() * ENTITY_ANIMATION_SPEED * 0.001 + monster.x);
        
        monster.move(player);

        // Se o monstro passou da tela, remove-o e potencialmente causa dano ao jogador
        if (!monster.isAlive && monster.y > window.GAME_HEIGHT + monster.size) {
            if (window.gameFunctions && typeof window.gameFunctions.takeDamage === 'function') {
                 window.gameFunctions.takeDamage(player, 10, endGameCallback); // Causa 10 de dano por monstro que escapa
                 console.log("Monstro escapou! Vida do jogador:", player.health);
            }
            window.monsters.splice(i, 1);
        }
    }
}

// Função para aplicar dano a um monstro
function applyDamageToMonster(monster, damage) {
    if (monster.type === 'ghost' && Math.random() < monster.evadeChance) {
        console.log("Monstro fantasma evadiu o ataque!");
        return;
    }
    monster.health -= damage;
    if (monster.health <= 0) {
        monster.isAlive = false;
        console.log(`Monstro ${monster.type} derrotado.`);
    }
}

// Função para lidar com a derrota de um monstro (chamada de colisão de feitiço)
function handleMonsterDefeat(monster, index, player) { // Removed gainXPCallback, will call window.gameFunctions.gainXP directly
    if (!monster.isAlive) {
        window.monsters.splice(index, 1); // Remove monstro do array
        window.gameStates.monstersKilledInWave++; // Incrementa o contador de monstros derrotados
        if (window.gameFunctions && typeof window.gameFunctions.gainXP === 'function') {
            window.gameFunctions.gainXP(player, MONSTER_XP_VALUES[monster.type] || 10); // Ganha XP
        }
    }
}
