// Definindo uma classe Monster
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
        this.sprite = sprite; // Key for loadedAssets
        this.contactDamage = contactDamage; // Damage on collision with player
        this.evadeChance = evadeChance; // For Ghost type

        this.animationOffset = 0; // For floating animation
        this.isAlive = true;
        this.deathTime = 0; // Timestamp when monster died
    }

    move(player) {
        if (!this.isAlive) return;

        // Monsters move towards the player (only on X-axis for simplicity)
        if (this.x < player.x) {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }

        this.y += this.speed; // Monsters move downwards

        // Check if monster has moved past the player's y-position
        // (This indicates it passed the bottom of the screen)
        if (this.y > window.GAME_HEIGHT + this.size) { // Assumindo window.GAME_HEIGHT é a altura do canvas
            this.isAlive = false; // Mark for removal
            // console.log(`Monstro ${this.type} passou da tela e foi marcado para remoção.`);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isAlive = false;
            this.deathTime = performance.now(); // Record time of death
        }
    }
}

// Função para gerar monstros em uma onda
// monsters array é global (do main.js)
// window.gameStates.currentWave etc. são globais (do main.js)
window.lastMonsterSpawnTime = 0; // Controla o tempo entre spawns

function spawnMonster(currentWave, monstersInWave, spawnedMonstersCount, gameWidth, gameHeight) {
    const now = performance.now();
    const spawnInterval = 1000 - (currentWave * 20); // Faster spawns in higher waves (min 100ms)
    
    if (now - window.lastMonsterSpawnTime < spawnInterval) {
        return false; // Not enough time has passed
    }

    if (spawnedMonstersCount >= monstersInWave) {
        return false; // All monsters for this wave have been spawned
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

    // Aumenta a dificuldade com as ondas
    if (currentWave >= 2) {
        monsterHealth += (currentWave - 1) * 5;
        monsterSpeed += (currentWave - 1) * 0.2;
    }
    if (currentWave >= 3) {
        // Chance de spawnar um monstro shooter ou ghost
        const rand = Math.random();
        if (rand < 0.2) { // 20% chance for shooter
            monsterType = 'shooter';
            monsterSize = 40;
            monsterHealth *= 1.5;
            monsterSpeed *= 0.8;
            monsterColor = 'purple';
            monsterInitial = 'S';
            monsterSprite = 'monster_shooter';
            contactDamage = 0; // Shooters deal damage with projectiles
        } else if (rand < 0.4) { // 20% chance for ghost (total 40%)
            monsterType = 'ghost';
            monsterSize = 35;
            monsterHealth *= 0.8; // Ghosts have less health but can evade
            monsterSpeed *= 1.2;
            monsterColor = 'cyan';
            monsterInitial = 'G';
            monsterSprite = 'monster_ghost';
            contactDamage = 5;
            evadeChance = 0.3; // 30% chance to evade player spells
        } else if (rand < 0.6 && currentWave >= 5) { // 20% chance for exploder (total 60% with others)
            monsterType = 'exploder';
            monsterSize = 45;
            monsterHealth *= 1.2;
            monsterSpeed *= 0.9;
            monsterColor = 'orange';
            monsterInitial = 'E';
            monsterSprite = 'monster_exploder';
            contactDamage = 30; // Explodes on contact
        }
    }

    const x = Math.random() * (gameWidth - monsterSize);
    const y = -monsterSize; // Spawn above the screen

    const newMonster = new Monster(monsterType, x, y, monsterSize, monsterHealth, monsterSpeed, monsterColor, monsterInitial, monsterSprite, contactDamage, evadeChance);
    monsters.push(newMonster);
    window.lastMonsterSpawnTime = now;
    // console.log(`Monstro ${newMonster.type} (Onda ${currentWave}) spawna. Total: ${monsters.length}`);
    return true; // Monster was spawned
}

// Função para mover todos os monstros
function moveMonsters(player, endGameCallback) {
    for (let i = monsters.length - 1; i >= 0; i--) {
        let monster = monsters[i];
        monster.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin(performance.now() * ENTITY_ANIMATION_SPEED * 0.001 + monster.x);
        monster.move(player);

        // Se o monstro passou da tela, causa dano ao jogador
        if (!monster.isAlive && monster.y > window.GAME_HEIGHT + monster.size) {
            takeDamage(player, 10, endGameCallback); // Perde 10 de vida por monstro que escapa
            monsters.splice(i, 1);
            // console.log("Monstro escapou! Vida do jogador:", player.health);
        }
    }
}

// Função para lidar com a derrota de um monstro
function handleMonsterDefeat(monster, index, player, gainXPCallback) {
    if (!monster.isAlive) {
        monsters.splice(index, 1); // Remove o monstro do array
        window.gameStates.monstersKilledInWave++; // Incrementa o contador de monstros mortos
        gainXPCallback(player, MONSTER_XP_VALUES[monster.type] || 10, () => player.levelUp()); // XP baseada no tipo, chama player.levelUp()
        // console.log(`Monstro ${monster.type} derrotado! Monstros restantes na onda: ${monsters.length}`);
    }
}
