// Definindo classes para magias
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
        this.type = type; // 'projectile', 'aoe', 'aoe_dot', 'aoe_lightning', etc.
        this.cooldown = cooldown;
        this.manaCost = manaCost;
        this.duration = duration; // For AoE spells
        this.effect = effect; // For spells that apply status effects (e.g., 'slow', 'poison')
        this.pierce = pierce; // How many monsters a projectile can pierce
        this.hitMonsters = new Set(); // To track monsters hit by this spell to avoid multiple hits
    }

    move() {
        if (this.type === 'projectile') {
            this.y -= this.speed;
        }
        // AoE spells don't move, their duration decreases
        if (this.duration > 0) {
            this.duration -= 16; // Assuming 60 FPS, roughly 16ms per frame
        }
    }

    isExpired() {
        return (this.type === 'projectile' && this.y < -this.radius) ||
               (this.duration !== 0 && this.duration <= 0);
    }
}

class MonsterProjectile {
    constructor(x, y, targetX, targetY, damage, speed, size, color) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.size = size;
        this.color = color;
        
        // Calculate direction vector towards target
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

class PoisonCloud {
    constructor(x, y, radius, duration, damagePerSecond) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.damagePerSecond = damagePerSecond;
        this.lastDamageTick = performance.now();
        this.hitMonsters = new Set(); // To prevent multiple damage ticks per monster per interval
    }

    update() {
        this.duration -= 16; // Decay
    }

    isExpired() {
        return this.duration <= 0;
    }
}

// Global arrays para gerenciar as entidades
// (Agora referenciados de player.js, que por sua vez será um script carregado antes de main.js)
// Estas são apenas referências aos arrays declarados e expostos em player.js

// Variável global para controlar o último disparo de projéteis de monstros
window.lastMonsterProjectileSpawnTime = 0;

// Função para lançar uma magia
function castSpell(player, spellLastCastTime, monsters, applyDamageToMonsterCallback) {
    const now = performance.now();
    const activeSpellName = player.activeSpells[player.currentSpellIndex];
    const spellData = SPELLS_DATA[activeSpellName]; // SPELLS_DATA vem de constants.js

    if (!spellData) {
        console.error(`Dados da magia "${activeSpellName}" não encontrados.`);
        return;
    }

    // Aplica redução de cooldown do jogador
    const actualCooldown = spellData.cooldown * (1 - player.spellCooldownReduction);

    if (now - spellLastCastTime < actualCooldown) {
        // console.log("Magia em cooldown. Tempo restante:", (actualCooldown - (now - spellLastCastTime)).toFixed(0), "ms");
        return;
    }

    if (player.mana < spellData.manaCost) {
        // console.log("Mana insuficiente para lançar", activeSpellName);
        return;
    }

    player.mana -= spellData.manaCost;
    playerState.spellLastCastTime = now; // Atualiza o tempo do último cast

    // Aplica multiplicador de poder de feitiço do jogador
    const actualDamage = spellData.damage * player.spellPowerMultiplier;

    // Aplica chance de crítico
    let finalDamage = actualDamage;
    let isCritical = false;
    if (Math.random() < player.criticalChance) {
        finalDamage *= (1 + player.criticalDamageBonus);
        isCritical = true;
        // console.log(`CRÍTICO! Dano: ${finalDamage.toFixed(0)} (${activeSpellName})`);
    } else {
        // console.log(`Dano normal: ${finalDamage.toFixed(0)} (${activeSpellName})`);
    }

    const spellX = player.x + player.size / 2;
    const spellY = player.y;

    if (spellData.type === 'projectile' || spellData.type === 'homing') {
        spells.push(new Spell(
            activeSpellName, spellX, spellY, finalDamage, spellData.speed,
            spellData.radius, spellData.color, spellData.sprite, spellData.type,
            spellData.cooldown, spellData.manaCost, 0, spellData.effect, spellData.pierce
        ));
    } else if (spellData.type === 'aoe' || spellData.type === 'aoe_dot' || spellData.type === 'aoe_slow') {
        spells.push(new Spell(
            activeSpellName, spellX, spellY, finalDamage, 0, // AoE spells don't have speed
            spellData.radius, spellData.color, spellData.sprite, spellData.type,
            spellData.cooldown, spellData.manaCost, spellData.duration, spellData.effect
        ));
    } else if (spellData.type === 'aoe_lightning') {
        // Para raio, ele atinge o monstro mais próximo
        let closestMonster = null;
        let minDist = Infinity;
        monsters.forEach(monster => {
            const dist = Math.sqrt(Math.pow(monster.x - spellX, 2) + Math.pow(monster.y - spellY, 2));
            if (dist < minDist) {
                minDist = dist;
                closestMonster = monster;
            }
        });

        if (closestMonster) {
            // Cria um "feitiço" de raio que visualmente vai do player ao monstro
            spells.push(new Spell(
                activeSpellName, spellX, closestMonster.y + closestMonster.size / 2, finalDamage, 0,
                closestMonster.size / 2, spellData.color, spellData.sprite, spellData.type,
                spellData.cooldown, spellData.manaCost, spellData.duration
            ));
            // Aplica o dano diretamente
            applyDamageToMonsterCallback(closestMonster, finalDamage);
        }
    } else if (activeSpellName === 'Névoa Venenosa') {
        poisonClouds.push(new PoisonCloud(spellX, spellY, spellData.radius, spellData.duration, spellData.damage));
    }
}

// Função para mover todas as magias
function moveSpells() {
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];
        spell.move();
        if (spell.isExpired()) {
            spells.splice(i, 1);
        }
    }
    for (let i = poisonClouds.length - 1; i >= 0; i--) {
        let cloud = poisonClouds[i];
        cloud.update();
        if (cloud.isExpired()) {
            poisonClouds.splice(i, 1);
        }
    }
}

// Função para gerar projéteis de monstros (chamada de monsters.js ou main.js)
function spawnMonsterProjectile(monster, player) {
    const now = performance.now();
    const spawnInterval = 1500; // Tempo entre disparos de projéteis de monstro
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

    monsterProjectiles.push(new MonsterProjectile(startX, startY, targetX, targetY, projectileDamage, projectileSpeed, projectileSize, projectileColor));
    window.lastMonsterProjectileSpawnTime = now;
    // console.log("Projétil de monstro disparado.");
}

// Função para mover projéteis de monstros
function moveMonsterProjectiles() {
    for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = monsterProjectiles[i];
        projectile.move();
        if (projectile.isOffscreen()) {
            monsterProjectiles.splice(i, 1);
        }
    }
}

// Função para verificar colisões
function checkSpellCollisions(player, monsters, endGameCallback, handleMonsterDefeatCallback, applyDamageToMonsterCallback) {
    // Colisões de magias do jogador com monstros
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];

        if (spell.type === 'aoe' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow' || spell.type === 'aoe_lightning') {
            // Para magias de área (incluindo raio que já atingiu no cast)
            monsters.forEach(monster => {
                if (monster.isAlive && !spell.hitMonsters.has(monster)) { // Verifica se já atingiu este monstro
                    const dist = Math.sqrt(
                        Math.pow(spell.x - (monster.x + monster.size / 2), 2) +
                        Math.pow(spell.y - (monster.y + monster.size / 2), 2)
                    );
                    if (dist < spell.radius + monster.size / 2) {
                        applyDamageToMonsterCallback(monster, spell.damage);
                        if (spell.effect === 'slow') {
                            monster.speed *= 0.5; // Aplica lentidão
                        }
                        if (!monster.isAlive) {
                            handleMonsterDefeatCallback(monster, monsters.indexOf(monster), player, gainXP);
                        }
                        spell.hitMonsters.add(monster); // Marca o monstro como atingido por esta magia
                    }
                }
            });
        } else if (spell.type === 'projectile' || spell.type === 'homing') {
            let hit = false;
            for (let j = monsters.length - 1; j >= 0; j--) {
                let monster = monsters[j];
                if (monster.isAlive && !spell.hitMonsters.has(monster)) {
                    const dist = Math.sqrt(
                        Math.pow(spell.x - (monster.x + monster.size / 2), 2) +
                        Math.pow(spell.y - (monster.y + monster.size / 2), 2)
                    );
                    if (dist < spell.radius + monster.size / 2) {
                        applyDamageToMonsterCallback(monster, spell.damage);
                        if (!monster.isAlive) {
                            handleMonsterDefeatCallback(monster, j, player, gainXP);
                        }
                        spell.hitMonsters.add(monster);
                        hit = true;
                        // Se não tem pierce, remove a magia após o primeiro hit
                        if (spell.pierce === 0) break; 
                        else if (spell.hitMonsters.size > spell.pierce) break; // Se atingiu o limite de pierce
                    }
                }
            }
            if (hit && spell.pierce === 0) { // Se atingiu e não tem pierce
                spells.splice(i, 1);
            } else if (spell.hitMonsters.size > spell.pierce) { // Se atingiu o limite de pierce
                spells.splice(i, 1);
            }
        }
    }

    // Colisões de nuvens de veneno com monstros
    for (let i = poisonClouds.length - 1; i >= 0; i--) {
        let cloud = poisonClouds[i];
        if (performance.now() - cloud.lastDamageTick > 1000) { // Aplica dano a cada segundo
            monsters.forEach(monster => {
                if (monster.isAlive) {
                    const dist = Math.sqrt(
                        Math.pow(cloud.x - (monster.x + monster.size / 2), 2) +
                        Math.pow(cloud.y - (monster.y + monster.size / 2), 2)
                    );
                    if (dist < cloud.radius + monster.size / 2) {
                        applyDamageToMonsterCallback(monster, cloud.damagePerSecond); // Dano por segundo
                        if (!monster.isAlive) {
                            handleMonsterDefeatCallback(monster, monsters.indexOf(monster), player, gainXP);
                        }
                    }
                }
            });
            cloud.lastDamageTick = performance.now();
        }
    }

    // Inimigos do tipo 'shooter' disparam projéteis em direção ao jogador
    // Isso é feito aqui pois depende do player e de todos os monstros
    const now = performance.now();
    monsters.forEach(monster => {
        if (monster.type === 'shooter' && monster.isAlive && now - window.lastMonsterProjectileSpawnTime > MONSTER_SHOOTER_COOLDOWN) {
            spawnMonsterProjectile(monster, player);
            window.lastMonsterProjectileSpawnTime = now;
        }
    });
}
