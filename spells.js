// spells.js - Define as classes Spell, MonsterProjectile e PoisonCloud,
// e as funções relacionadas a magias e colisões.

// Spell Class Definition
class Spell {
    constructor(name, x, y, damage, speed, radius, color, sprite, type = 'projectile', cooldown = 500, manaCost = 10, duration = 0, effect = null, pierce = 0) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.radius = radius;
        this.color = color;
        this.sprite = sprite;
        this.type = type; // 'projectile', 'aoe', 'aoe_dot', 'aoe_lightning'
        this.cooldown = cooldown;
        this.manaCost = manaCost;
        this.duration = duration; // For AoE spells, in milliseconds
        this.effect = effect; // For spells that apply status effects (e.g., 'slow', 'poison')
        this.pierce = pierce; // How many monsters a projectile can pierce (0 for no pierce)
        this.hitMonsters = new Set(); // To track monsters hit by this spell to avoid multiple hits per cast (for pierce)
    }

    move() {
        if (this.type === 'projectile' || this.type === 'homing') {
            this.y -= this.speed;
        }
        // Magias AoE não se movem, sua duração diminui
        if (this.duration > 0) {
            this.duration -= (1000 / 60); // Diminui a duração aproximadamente por frame (assumindo 60 FPS)
        }
    }

    isExpired() {
        return (this.type === 'projectile' || this.type === 'homing') && this.y < -this.radius ||
               (this.duration !== 0 && this.duration <= 0);
    }
}

// Monster Projectile Class Definition
class MonsterProjectile {
    constructor(x, y, targetX, targetY, damage, speed, size, color) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.size = size;
        this.color = color;
        
        // Calcula o vetor de direção em direção ao alvo
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
    }

    isOffscreen() {
        return this.x < -this.size || this.x > window.GAME_WIDTH + this.size ||
               this.y < -this.size || this.y > window.GAME_HEIGHT + this.size;
    }
}

// Poison Cloud Class Definition (for persistent AoE)
class PoisonCloud {
    constructor(x, y, radius, duration, damagePerSecond) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration; // in milliseconds
        this.damagePerSecond = damagePerSecond;
        this.lastDamageTick = performance.now();
    }

    update() {
        this.duration -= (1000 / 60); // Diminui por frame
    }

    isExpired() {
        return this.duration <= 0;
    }
}

// Variável global para controlar o tempo do último disparo de projéteis de monstro
window.lastMonsterProjectileSpawnTime = 0;

// Função para lançar uma magia
function castSpell(player, monsters, applyDamageToMonsterCallback) {
    const now = performance.now();
    const activeSpellName = player.activeSpells[player.currentSpellIndex];
    const spellData = SPELLS_DATA[activeSpellName]; // SPELLS_DATA de constants.js

    if (!spellData) {
        console.error(`Dados da magia "${activeSpellName}" não encontrados.`);
        return;
    }

    // Aplica a redução de cooldown do jogador
    const actualCooldown = spellData.cooldown * (1 - player.spellCooldownReduction);

    if (now - window.playerState.spellLastCastTime < actualCooldown) { // Usa window.playerState.spellLastCastTime global
        console.log("Magia em cooldown. Tempo restante:", (actualCooldown - (now - window.playerState.spellLastCastTime)).toFixed(0), "ms");
        return;
    }

    if (player.mana < spellData.manaCost) {
        console.log("Mana insuficiente para lançar", activeSpellName);
        return;
    }

    player.mana -= spellData.manaCost;
    window.playerState.spellLastCastTime = now; // Atualiza o tempo do último cast

    // Aplica o multiplicador de poder de feitiço do jogador
    let finalDamage = spellData.damage * player.spellPowerMultiplier;

    // Aplica chance de crítico
    let isCritical = false;
    if (Math.random() < player.criticalChance) {
        finalDamage *= (1 + player.criticalDamageBonus);
        isCritical = true;
        console.log(`CRÍTICO! Dano: ${finalDamage.toFixed(0)} (${activeSpellName})`);
    } else {
        // console.log(`Dano normal: ${finalDamage.toFixed(0)} (${activeSpellName})`);
    }

    const spellX = player.x + player.size / 2;
    const spellY = player.y;

    if (spellData.type === 'projectile' || spellData.type === 'homing') {
        window.spells.push(new Spell( // Adiciona ao array global de magias
            activeSpellName, spellX, spellY, finalDamage, spellData.speed,
            spellData.radius, spellData.color, spellData.sprite, spellData.type,
            spellData.cooldown, spellData.manaCost, 0, spellData.effect, spellData.pierce
        ));
    } else if (spellData.type === 'aoe' || spellData.type === 'aoe_dot' || spellData.type === 'aoe_slow') {
        window.spells.push(new Spell( // Adiciona ao array global de magias
            activeSpellName, spellX, spellY, finalDamage, 0, // Magias AoE não têm velocidade de movimento
            spellData.radius, spellData.color, spellData.sprite, spellData.type,
            spellData.cooldown, spellData.manaCost, spellData.duration, spellData.effect
        ));
    } else if (spellData.type === 'aoe_lightning') {
        // Para raio, ele atinge o monstro mais próximo diretamente
        let closestMonster = null;
        let minDist = Infinity;
        monsters.forEach(monster => { // Array de monstros passado como argumento
            if (monster.isAlive) {
                const dist = Math.sqrt(Math.pow(monster.x - spellX, 2) + Math.pow(monster.y - spellY, 2));
                if (dist < minDist) {
                    minDist = dist;
                    closestMonster = monster;
                }
            }
        });

        if (closestMonster) {
            // Cria um objeto "spell" para efeito visual (duração curta)
            window.spells.push(new Spell(
                activeSpellName, spellX, closestMonster.y + closestMonster.size / 2, finalDamage, 0,
                closestMonster.size / 2, spellData.color, spellData.sprite, spellData.type,
                spellData.cooldown, spellData.manaCost, spellData.duration 
            ));
            // Aplica o dano diretamente
            applyDamageToMonsterCallback(closestMonster, finalDamage);
        }
    } else if (activeSpellName === 'Névoa Venenosa') {
        window.poisonClouds.push(new PoisonCloud(spellX, spellY, spellData.radius, spellData.duration, spellData.damage)); // Adiciona ao array global poisonClouds
    }
}

// Função para atualizar as posições/durações de todas as magias
function handleSpellsUpdate() {
    for (let i = window.spells.length - 1; i >= 0; i--) {
        let spell = window.spells[i];
        spell.move();
        if (spell.isExpired()) {
            window.spells.splice(i, 1);
        }
    }
    for (let i = window.poisonClouds.length - 1; i >= 0; i--) {
        let cloud = window.poisonClouds[i];
        cloud.update();
        if (cloud.isExpired()) {
            window.poisonClouds.splice(i, 1);
        }
    }
}

// Função para gerar um projétil de monstro (chamada pela lógica do monstro, se necessário)
function spawnMonsterProjectile(monster, player) {
    const now = performance.now();
    const spawnInterval = MONSTER_SHOOTER_COOLDOWN; // De constants.js
    if (now - window.lastMonsterProjectileSpawnTime < spawnInterval) {
        return;
    }

    const projectileSize = 10;
    const projectileSpeed = 3;
    const projectileDamage = 15;
    const projectileColor = 'yellow';

    // Dispara do centro do monstro em direção ao centro do jogador
    const startX = monster.x + monster.size / 2;
    const startY = monster.y + monster.size / 2;
    const targetX = player.x + player.size / 2;
    const targetY = player.y + player.size / 2;

    window.monsterProjectiles.push(new MonsterProjectile(startX, startY, targetX, targetY, projectileDamage, projectileSpeed, projectileSize, projectileColor)); // Adiciona ao array global monsterProjectiles
    window.lastMonsterProjectileSpawnTime = now;
    console.log("Projétil de monstro disparado.");
}

// Função para atualizar as posições de todos os projéteis de monstro
function handleMonsterProjectilesUpdate() {
    for (let i = window.monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = window.monsterProjectiles[i];
        projectile.move();
        if (projectile.isOffscreen()) {
            window.monsterProjectiles.splice(i, 1);
        }
    }
}

// Função para verificar colisões entre magias do jogador e monstros, e projéteis de monstro e jogador
function checkCollisions(player, monsters, endGameCallback) {
    // 1. Magias do jogador vs. Monstros
    for (let i = window.spells.length - 1; i >= 0; i--) {
        let spell = window.spells[i];

        if (spell.type === 'aoe' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow' || spell.type === 'aoe_lightning') {
            // Para magias de área
            window.monsters.forEach(monster => {
                if (monster.isAlive && !spell.hitMonsters.has(monster)) {
                    const dist = Math.sqrt(
                        Math.pow(spell.x - (monster.x + monster.size / 2), 2) +
                        Math.pow(spell.y - (monster.y + monster.size / 2), 2)
                    );
                    if (dist < spell.radius + monster.size / 2) {
                        if (window.gameFunctions && typeof window.gameFunctions.applyDamageToMonster === 'function') {
                            window.gameFunctions.applyDamageToMonster(monster, spell.damage);
                        }
                        if (spell.effect === 'slow' && !monster.isSlowed) { // Aplica lentidão se não estiver lento
                            monster.isSlowed = true;
                            monster.speed *= 0.5; 
                            console.log(`Monstro ${monster.type} ficou lento!`);
                        }
                        if (!monster.isAlive) {
                            if (window.gameFunctions && typeof window.gameFunctions.handleMonsterDefeat === 'function') {
                                window.gameFunctions.handleMonsterDefeat(monster, window.monsters.indexOf(monster), player);
                            }
                        }
                        if (spell.type !== 'aoe_dot') { // AoE_dot lida com seu próprio dano contínuo
                            spell.hitMonsters.add(monster); // Marca como atingido por esta instância de magia
                        }
                    }
                }
            });
        } else if (spell.type === 'projectile' || spell.type === 'homing') {
            let hitThisFrame = false;
            for (let j = window.monsters.length - 1; j >= 0; j--) {
                let monster = window.monsters[j];
                if (monster.isAlive && !spell.hitMonsters.has(monster)) {
                    const dist = Math.sqrt(
                        Math.pow(spell.x - (monster.x + monster.size / 2), 2) +
                        Math.pow(spell.y - (monster.y + monster.size / 2), 2)
                    );
                    if (dist < SPELL_SIZE / 2 + monster.size / 2) { // Usa SPELL_SIZE de constants
                        if (window.gameFunctions && typeof window.gameFunctions.applyDamageToMonster === 'function') {
                            window.gameFunctions.applyDamageToMonster(monster, spell.damage);
                        }
                        if (!monster.isAlive) {
                            if (window.gameFunctions && typeof window.gameFunctions.handleMonsterDefeat === 'function') {
                                window.gameFunctions.handleMonsterDefeat(monster, j, player);
                            }
                        }
                        spell.hitMonsters.add(monster);
                        hitThisFrame = true;
                        if (spell.pierce === 0 || spell.hitMonsters.size > spell.pierce) {
                            break; // Para de verificar por mais acertos para esta magia
                        }
                    }
                }
            }
            if (hitThisFrame && (spell.pierce === 0 || spell.hitMonsters.size > spell.pierce)) {
                window.spells.splice(i, 1); // Remove a magia se o limite de acertos for atingido ou não tiver perfuração
            }
        }
    }

    // 2. Nuvens Venenosas vs. Monstros (dano contínuo)
    for (let i = window.poisonClouds.length - 1; i >= 0; i--) {
        let cloud = window.poisonClouds[i];
        if (performance.now() - cloud.lastDamageTick > 1000) { // Causa dano a cada 1 segundo
            window.monsters.forEach(monster => {
                if (monster.isAlive) {
                    const dist = Math.sqrt(
                        Math.pow(cloud.x - (monster.x + monster.size / 2), 2) +
                        Math.pow(cloud.y - (monster.y + monster.size / 2), 2)
                    );
                    if (dist < cloud.radius + monster.size / 2) {
                        if (window.gameFunctions && typeof window.gameFunctions.applyDamageToMonster === 'function') {
                            window.gameFunctions.applyDamageToMonster(monster, cloud.damagePerSecond);
                        }
                        if (!monster.isAlive) {
                            if (window.gameFunctions && typeof window.gameFunctions.handleMonsterDefeat === 'function') {
                                window.gameFunctions.handleMonsterDefeat(monster, window.monsters.indexOf(monster), player);
                            }
                        }
                    }
                }
            });
            cloud.lastDamageTick = performance.now();
        }
    }

    // 3. Projéteis de Monstro vs. Jogador
    for (let i = window.monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = window.monsterProjectiles[i];
        const projCenterX = projectile.x + projectile.size / 2;
        const projCenterY = projectile.y + projectile.size / 2;
        const playerCenterX = player.x + player.size / 2;
        const playerCenterY = player.y + player.size / 2;

        const dist = Math.sqrt(
            Math.pow(projCenterX - playerCenterX, 2) +
            Math.pow(projCenterY - playerCenterY, 2)
        );

        if (dist < (projectile.size / 2 + player.size / 2)) {
            if (window.gameFunctions && typeof window.gameFunctions.takeDamage === 'function') {
                window.gameFunctions.takeDamage(player, projectile.damage, endGameCallback);
            }
            window.monsterProjectiles.splice(i, 1);
        }
    }

    // 4. Monstros (contato) vs. Jogador
    for (let i = window.monsters.length - 1; i >= 0; i--) {
        let monster = window.monsters[i];
        if (!monster.isAlive) continue; 

        // Atiradores disparam projéteis em vez de causar dano de contato direto
        if (monster.type === 'shooter') {
            spawnMonsterProjectile(monster, player); 
            continue;
        }

        // Colisão de caixa delimitadora simples para dano de contato
        if (monster.x < player.x + player.size &&
            monster.x + monster.size > player.x &&
            monster.y < player.y + player.size &&
            monster.y + monster.size > player.y) {

            if (monster.type === 'exploder') {
                if (window.gameFunctions && typeof window.gameFunctions.takeDamage === 'function') {
                    window.gameFunctions.takeDamage(player, monster.contactDamage, endGameCallback);
                }
                if (window.gameFunctions && typeof window.gameFunctions.handleMonsterDefeat === 'function') {
                    window.gameFunctions.handleMonsterDefeat(monster, i, player); // Exploder morre em contato
                }
            } else {
                // Monstros regulares podem causar dano contínuo ou um único hit
                // Por enquanto, assumimos dano único em contato.
                if (window.gameFunctions && typeof window.gameFunctions.takeDamage === 'function') {
                    window.gameFunctions.takeDamage(player, monster.contactDamage, endGameCallback);
                }
            }
        }
    }
}
