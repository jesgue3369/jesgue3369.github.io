// Variáveis que precisarão ser acessíveis de outros arquivos
// Serão inicializadas em main.js e passadas ou acessadas via objeto global
let spells = [];
let poisonClouds = [];

// Adaptação: agora recebe applyDamageToMonsterCallback (passado de main.js)
function castSpell(player, spellLastCastTime, monsters, applyDamageToMonsterCallback) {
    const currentSpellName = player.activeSpells[player.currentSpellIndex];
    const spellData = SPELLS_DATA[currentSpellName];
    const now = Date.now();
    const effectiveCooldown = spellData.cooldown * (1 - player.cooldownReduction);

    if (player.mana >= spellData.cost && (now - spellLastCastTime[currentSpellName] > effectiveCooldown)) {
        player.mana -= spellData.cost;
        spellLastCastTime[currentSpellName] = now;

        const spellX = player.x + player.size / 2;
        const spellY = player.y;

        let finalDamage = spellData.damage * player.spellPower;
        if (spellData.damage && Math.random() < player.criticalChance) { // Check if spell has damage before critical
            finalDamage *= 2;
            console.log("CRÍTICO!");
        }

        switch (spellData.type) {
            case 'heal':
                player.health = Math.min(player.maxHealth + player.shield, player.health + spellData.heal);
                break;
            case 'shield':
                player.shield += spellData.shieldAmount;
                break;
            case 'aoe_lightning':
                spells.push({ x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, radius: spellData.radius, spawnTime: now });
                monsters.forEach(monster => {
                    const dist = Math.sqrt(Math.pow(spellX - (monster.x + monster.size / 2), 2) + Math.pow(spellY - (monster.y + monster.size / 2), 2));
                    if (dist < spellData.radius) {
                        applyDamageToMonsterCallback(monster, finalDamage);
                    }
                });
                break;
            case 'aoe_dot':
                poisonClouds.push({
                    x: spellX, y: spellY, damagePerTick: finalDamage, tickInterval: spellData.tickInterval, duration: spellData.duration, radius: spellData.radius, color: spellData.color, lastTickTime: now
                });
                break;
            case 'aoe_slow':
                spells.push({ x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, radius: spellData.radius, spawnTime: now });
                monsters.forEach(monster => {
                    const dist = Math.sqrt(Math.pow(spellX - (monster.x + monster.size / 2), 2) + Math.pow(spellY - (monster.y + monster.size / 2), 2));
                    if (dist < spellData.radius) {
                        applyDamageToMonsterCallback(monster, finalDamage);
                        monster.isSlowed = true;
                        monster.slowTimer = now + spellData.slowDuration;
                    }
                });
                break;
            case 'lifesteal':
                // For lifesteal, the projectile itself will handle the lifesteal on hit
                spells.push({ x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, lifeSteal: spellData.lifeSteal, sprite: spellData.sprite || 'projectile_player' });
                break;
            case 'multishot':
                for (let i = 0; i < spellData.numProjectiles; i++) {
                    const offsetX = (Math.random() - 0.5) * spellData.spread;
                    spells.push({ x: spellX + offsetX, y: spellY, damage: finalDamage, color: spellData.color, sprite: spellData.sprite || 'projectile_player' });
                }
                break;
            default: // Normal projectiles
                spells.push({
                    x: spellX, y: spellY, damage: finalDamage, color: spellData.color, type: spellData.type, sprite: spellData.sprite || 'projectile_player'
                });
                break;
        }
    }
}

function moveSpells() {
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];
        if (spell.type === 'aoe_lightning' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
            if (!spell.spawnTime) spell.spawnTime = Date.now(); // Should be set by castSpell, fallback
            if (Date.now() - spell.spawnTime > 200) { // Duration for visual effect of AoE spells
                spells.splice(i, 1);
            }
        } else {
            spell.y -= PROJECTILE_BASE_SPEED; // Using base speed for consistency
            if (spell.y < 0) {
                spells.splice(i, 1);
            }
        }
    }
}

// Adaptação: agora recebe endGameCallback, handleMonsterDefeatCallback, applyDamageToMonsterCallback (passados de main.js)
function checkSpellCollisions(player, monsters, endGameCallback, handleMonsterDefeatCallback, applyDamageToMonsterCallback) {
    const now = Date.now();
    // Player spells vs Monsters
    for (let i = spells.length - 1; i >= 0; i--) {
        let spell = spells[i];
        if (spell.type === 'aoe_lightning' || spell.type === 'aoe_dot' || spell.type === 'aoe_slow') {
            continue; // AoE damage is applied directly in castSpell or through poisonClouds
        }

        for (let j = monsters.length - 1; j >= 0; j--) {
            let monster = monsters[j];
            // Simple AABB collision detection for projectiles
            if (spell.x < monster.x + monster.size &&
                spell.x + SPELL_SIZE > monster.x &&
                spell.y < monster.y + monster.size &&
                spell.y + SPELL_SIZE > monster.y) {

                applyDamageToMonsterCallback(monster, spell.damage);

                if (spell.type === 'lifesteal') {
                    player.health = Math.min(player.maxHealth + player.shield, player.health + (spell.damage * spell.lifeSteal));
                }

                spells.splice(i, 1); // Remove projectile on hit
                
                if (monster.health <= 0) {
                    handleMonsterDefeatCallback(monster, j, player, gainXP);
                    // Adjust index 'i' if a monster before current 'j' was removed
                    if (j < i) i--;
                }
                break; // Stop checking against other monsters once spell hits one
            }
        }
    }

    // Poison Clouds (DOT) vs Monsters
    for (let i = poisonClouds.length - 1; i >= 0; i--) {
        let cloud = poisonClouds[i];
        if (now - cloud.lastTickTime > cloud.tickInterval) {
            for (let j = monsters.length - 1; j >= 0; j--) {
                let monster = monsters[j];
                const dist = Math.sqrt(
                    Math.pow((cloud.x) - (monster.x + monster.size / 2), 2) +
                    Math.pow((cloud.y) - (monster.y + monster.size / 2), 2),
                );
                if (dist < cloud.radius) {
                    applyDamageToMonsterCallback(monster, cloud.damagePerTick);
                    if (monster.health <= 0) {
                        handleMonsterDefeatCallback(monster, j, player, gainXP);
                        // Adjust index 'j' if a monster was removed
                        if (j < monsters.length - 1) j++; // Re-evaluate current index after splice
                    }
                }
            }
            cloud.lastTickTime = now;
        }
        cloud.duration -= (now - (cloud.lastDurationUpdate || now));
        cloud.lastDurationUpdate = now;
        if (cloud.duration <= 0) {
            poisonClouds.splice(i, 1);
        }
    }
}
