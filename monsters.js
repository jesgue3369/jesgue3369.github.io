// Variáveis que precisarão ser acessíveis de outros arquivos
// Serão inicializadas em main.js e passadas ou acessadas via objeto global
let monsters = [];
let monsterProjectiles = [];

let lastMonsterSpawnTime = 0;

function spawnMonster(currentWave, monstersInWave, spawnedMonstersCount, GAME_WIDTH, GAME_HEIGHT) {
    if (spawnedMonstersCount >= monstersInWave) {
        return;
    }

    const now = Date.now();
    let monsterSpawnDelay = Math.max(500, 1500 - (currentWave * 100)); // Adjusted dynamically

    if (now - lastMonsterSpawnTime > monsterSpawnDelay) {
        const x = Math.random() * (GAME_WIDTH - ACTUAL_MONSTER_BASE_SIZE);

        let monsterTypeKeys = Object.keys(MONSTER_TYPES);
        let availableTypes = monsterTypeKeys.filter(type =>
            currentWave >= 1 || (type !== 'healer' && type !== 'exploder' && type !== 'ghost' && type !== 'giant_worm')
        );

        let monsterTypeKey;
        const rand = Math.random();
        if (currentWave >= 4 && rand < 0.1) {
            monsterTypeKey = 'giant_worm';
        } else if (currentWave >= 3 && rand < 0.2) {
            monsterTypeKey = 'ghost';
        } else if (currentWave >= 2.5 && rand < 0.3) {
            monsterTypeKey = 'exploder';
        } else if (currentWave >= 2 && rand < 0.4) {
            monsterTypeKey = 'healer';
        } else if (rand < 0.5 + (currentWave * 0.05)) {
            const basicTypes = ['basic', 'shooter', 'tank', 'fast'];
            monsterTypeKey = basicTypes[Math.floor(Math.random() * basicTypes.length)];
        } else {
            monsterTypeKey = 'basic';
        }

        if (!availableTypes.includes(monsterTypeKey)) {
            monsterTypeKey = 'basic';
        }

        const typeData = MONSTER_TYPES[monsterTypeKey];
        const monsterSize = ACTUAL_MONSTER_BASE_SIZE * typeData.sizeMultiplier * (1 + currentWave * 0.02);
        const monsterHealth = 20 * (1 + currentWave * 0.2) * typeData.healthMultiplier;
        const monsterSpeed = INITIAL_MONSTER_SPEED * (1 + (currentWave - 1) * 0.05) * typeData.speedMultiplier;

        monsters.push({
            x: x,
            y: -monsterSize,
            health: monsterHealth,
            maxHealth: monsterHealth,
            speed: monsterSpeed,
            type: monsterTypeKey,
            color: typeData.color,
            initial: typeData.initial,
            size: monsterSize,
            canShoot: typeData.canShoot,
            projectileColor: typeData.projectileColor,
            projectileDamage: typeData.projectileDamage,
            shootInterval: typeData.shootInterval,
            lastShotTime: typeData.lastShotTime || 0,
            xpValue: typeData.xp + (currentWave * 2),
            contactDamage: typeData.contactDamage * (1 + currentWave * 0.05),
            healAmount: typeData.healAmount || 0,
            healRadius: typeData.healRadius || 0,
            healInterval: typeData.healInterval || 0,
            lastHealTime: typeData.lastHealTime || 0,
            explosionRadius: typeData.explosionRadius || 0,
            evadeChance: typeData.evadeChance || 0,
            isSlowed: false,
            slowTimer: 0,
            sprite: typeData.sprite,
            projectileSpeed: typeData.projectileSpeed,
            projectileSize: typeData.projectileSize,
            targetY: GAME_HEIGHT * 0.3 + (Math.random() * GAME_HEIGHT * 0.2),
            animationOffset: 0,
            animationStartTime: now
        });
        lastMonsterSpawnTime = now;
        return true; // Indicates a monster was spawned
    }
    return false; // No monster spawned
}

function moveMonsters(player, endGameCallback) {
    const now = Date.now();
    for (let i = monsters.length - 1; i >= 0; i--) {
        let monster = monsters[i];
        let currentMonsterSpeed = monster.speed;
        if (monster.isSlowed && now < monster.slowTimer) {
            currentMonsterSpeed *= SPELLS_DATA['Explosão Congelante'].slowFactor;
        }

        monster.animationOffset = ENTITY_ANIMATION_AMPLITUDE * Math.sin((now - monster.animationStartTime) * ENTITY_ANIMATION_SPEED * 0.001);

        let nextX = monster.x;
        let nextY = monster.y;

        if (monster.y < monster.targetY) {
            nextY += currentMonsterSpeed;
        } else {
            const monsterCenterX = monster.x + monster.size / 2;
            const playerCenterX = player.x + player.size / 2;

            if (monsterCenterX < playerCenterX) {
                nextX += currentMonsterSpeed;
            } else if (monsterCenterX > playerCenterX) {
                nextX -= currentMonsterSpeed;
            }
        }

        const tempRect = { x: nextX, y: nextY, width: monster.size, height: monster.size };

        for (let j = 0; j < monsters.length; j++) {
            if (j === i) continue;

            const other = monsters[j];
            const otherRect = { x: other.x, y: other.y, width: other.size, height: other.size };

            if (tempRect.x < otherRect.x + otherRect.width &&
                tempRect.x + tempRect.width > otherRect.x &&
                tempRect.y < otherRect.y + otherRect.height &&
                tempRect.y + tempRect.height > otherRect.y)
            {
                const dx = tempRect.x - otherRect.x;
                const dy = tempRect.y - otherRect.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    nextX += (dx / dist) * 0.5;
                    nextY += (dy / dist) * 0.5;
                }
                break;
            }
        }

        monster.x = nextX;
        monster.y = nextY;

        // Monster Shooting Logic
        if (monster.canShoot && now - monster.lastShotTime > monster.shootInterval && monster.y > 0 && monster.y < GAME_HEIGHT * 0.7) {
            const monsterCenterX = monster.x + monster.size / 2;
            const monsterCenterY = monster.y + monster.size / 2;
            const playerCenterX = player.x + player.size / 2;
            const playerCenterY = player.y + player.size / 2;

            const dx = playerCenterX - monsterCenterX;
            const dy = playerCenterY - monsterCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const vx = (dx / distance) * monster.projectileSpeed;
            const vy = (dy / distance) * monster.projectileSpeed;

            monsterProjectiles.push({
                x: monsterCenterX,
                y: monsterCenterY,
                color: monster.projectileColor,
                damage: monster.projectileDamage,
                size: monster.projectileSize,
                vx: vx,
                vy: vy
            });
            monster.lastShotTime = now;
        }

        if (monster.type === 'healer' && now - monster.lastHealTime > monster.healInterval) {
            monsters.forEach(otherMonster => {
                const dist = Math.sqrt(
                    Math.pow((monster.x + monster.size / 2) - (otherMonster.x + otherMonster.size / 2), 2) +
                    Math.pow((monster.y + monster.size / 2) - (otherMonster.y + otherMonster.size / 2), 2)
                );
                if (monster !== otherMonster && dist < monster.healRadius) {
                    otherMonster.health = Math.min(otherMonster.maxHealth, otherMonster.health + monster.healAmount);
                }
            });
            monster.lastHealTime = now;
        }

        if (monster.y > GAME_HEIGHT) {
            if (monster.type === 'exploder') {
                monsters.splice(i, 1);
                continue;
            }
            if (monster.type !== 'shooter') {
                takeDamage(player, monster.contactDamage, endGameCallback);
            }
            monsters.splice(i, 1);
        }
    }
}

function moveMonsterProjectiles() {
    for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
        let projectile = monsterProjectiles[i];
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        if (projectile.y < 0 || projectile.y > GAME_HEIGHT || projectile.x < 0 || projectile.x > GAME_WIDTH) {
            monsterProjectiles.splice(i, 1);
        }
    }
}

function handleMonsterDefeat(monster, index, player, gainXPCallback) {
    if (monster.type === 'exploder') {
        monsters.forEach(otherMonster => {
            const dist = Math.sqrt(
                Math.pow((monster.x + monster.size / 2) - (otherMonster.x + otherMonster.size / 2), 2) +
                Math.pow((monster.y + monster.size / 2) - (otherMonster.y + otherMonster.size / 2), 2)
            );
            if (monster !== otherMonster && dist < monster.explosionRadius) {
                applyDamageToMonster(otherMonster, monster.contactDamage * 0.5);
                if (otherMonster.health <= 0) {
                    const otherIndex = monsters.indexOf(otherMonster);
                    if (otherIndex > -1) {
                        monsters.splice(otherIndex, 1);
                        if (otherIndex < index) index--; // Adjust index if monster before current was removed
                    }
                }
            }
        });
        takeDamage(player, monster.contactDamage * 0.5, () => {}); // Exploder does self-damage/player damage on death too, no game over
    }
    gainXPCallback(player, monster.xpValue);
    monsters.splice(index, 1);
    gameStates.monstersKilledInWave++; // Access global game state
}
