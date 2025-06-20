// --- Configurações do Jogo ---
const PLAYER_SIZE = 50;
const INITIAL_MONSTER_SIZE = 40;
const ACTUAL_PLAYER_SIZE = PLAYER_SIZE * 0.4;
const ACTUAL_MONSTER_BASE_SIZE = INITIAL_MONSTER_SIZE * 0.4;
const SPELL_SIZE = 20;
const PLAYER_SPEED = 5;
const PROJECTILE_BASE_SPEED = 7; // Base speed for projectiles
const INITIAL_MONSTER_SPEED = 1;
const XP_PER_MONSTER = 10;
const LEVEL_UP_XP_BASE = 100;
const LEVEL_UP_XP_MULTIPLIER = 1.2;

let CONTROLLER_BAR_HEIGHT = 120; // Default, will be updated in resizeCanvas

const ASSET_PATHS = {
    player: './assets/player.png',
    projectile_player: './assets/projectile_player.png',
    projectile_monster: './assets/projectile_monster.png',
    monster_basic: './assets/monster_basic.png',
    monster_tank: './assets/monster_tank.png',
    monster_shooter: './assets/monster_shooter.png',
    monster_fast: './assets/monster_fast.png',
    monster_healer: './assets/monster_healer.png',
    monster_exploder: './assets/monster_exploder.png',
    monster_ghost: './assets/monster_ghost.png',
    monster_giant_worm: './assets/monster_giant_worm.png',
    spell_fagulha: './assets/spell_fagulha.png',
    spell_bola_de_fogo: './assets/spell_bola_de_fogo.png',
    spell_estilhaco_de_gelo: './assets/spell_estilhaco_de_gelo.png',
    background: './assets/background.png'
};

const ENTITY_ANIMATION_AMPLITUDE = 5;
const ENTITY_ANIMATION_SPEED = 5;

const SPELLS_DATA = {
    'Fagulha': { damage: 10, cost: 5, color: 'yellow', cooldown: 100, sprite: 'spell_fagulha', description: "Pequena explosão de energia mágica." },
    'Bola de Fogo': { damage: 30, cost: 15, color: 'orange', cooldown: 500, sprite: 'spell_bola_de_fogo', description: "Lança uma bola de fogo poderosa." },
    'Estilhaço de Gelo': { damage: 25, cost: 12, color: 'lightblue', cooldown: 400, sprite: 'spell_estilhaco_de_gelo', description: "Atira um estilhaço que causa dano de gelo." },
    'Rajada Arcana': { damage: 15, cost: 8, color: 'purple', cooldown: 150, description: "Uma rápida rajada de energia arcana." },
    'Cura Menor': { heal: 30, cost: 20, color: 'lime', cooldown: 1000, type: 'heal', description: "Recupera uma pequena quantidade de vida." },
    'Escudo Arcano': { shieldAmount: 50, cost: 25, color: 'cyan', cooldown: 1500, type: 'shield', description: "Cria um escudo temporário." },
    'Relâmpago': { damage: 40, cost: 30, color: 'gold', cooldown: 800, type: 'aoe_lightning', radius: 100, description: "Um raio atinge inimigos próximos ao jogador." },
    'Névoa Venenosa': { damagePerTick: 5, tickInterval: 500, duration: 3000, radius: 80, cost: 25, color: 'darkgreen', cooldown: 1200, type: 'aoe_dot', description: "Cria uma nuvem venenosa que causa dano ao longo do tempo." },
    'Explosão Congelante': { damage: 35, slowFactor: 0.5, slowDuration: 2000, radius: 70, cost: 28, color: 'skyblue', cooldown: 1000, type: 'aoe_slow', description: "Explosão que causa dano e retarda inimigos." },
    'Drenar Vida': { damage: 20, lifeSteal: 0.5, cost: 18, color: 'darkred', cooldown: 600, type: 'lifesteal', description: "Drena vida dos inimigos para o jogador." },
    'Tempestade de Meteoros': { damage: 20, numProjectiles: 5, spread: 100, cost: 40, color: 'brown', cooldown: 2000, type: 'multishot', description: "Chuva de meteoros que atinge múltiplos inimigos." }
};

const MONSTER_TYPES = {
    'basic': {
        color: '#f00', initial: 'B', sizeMultiplier: 1, healthMultiplier: 1, speedMultiplier: 1, canShoot: true, projectileColor: 'red', projectileDamage: 10, shootInterval: 2500, projectileSpeed: PROJECTILE_BASE_SPEED, projectileSize: SPELL_SIZE / 2, xp: 10, contactDamage: 10, sprite: 'monster_basic', animationOffset: 0
    },
    'tank': {
        color: '#8B4513', initial: 'T', sizeMultiplier: 1.5, healthMultiplier: 3, speedMultiplier: 0.7, canShoot: true, projectileColor: '#A0522D', projectileDamage: 15, shootInterval: 3500, projectileSpeed: PROJECTILE_BASE_SPEED * 0.7, projectileSize: SPELL_SIZE * 0.8, xp: 30, contactDamage: 20, sprite: 'monster_tank', animationOffset: 0
    },
    'shooter': {
        color: '#6A5ACD', initial: 'S', sizeMultiplier: 1.1, healthMultiplier: 1.2, speedMultiplier: 0.9, canShoot: true, projectileColor: 'purple', projectileDamage: 12, shootInterval: 1800, projectileSpeed: PROJECTILE_BASE_SPEED * 1.2, projectileSize: SPELL_SIZE * 0.6, xp: 20, contactDamage: 0, sprite: 'monster_shooter', animationOffset: 0
    },
    'fast': {
        color: '#00FFFF', initial: 'F', sizeMultiplier: 0.8, healthMultiplier: 0.7, speedMultiplier: 1.5, canShoot: true, projectileColor: 'cyan', projectileDamage: 8, shootInterval: 2000, projectileSpeed: PROJECTILE_BASE_SPEED * 1.5, projectileSize: SPELL_SIZE * 0.4, xp: 15, contactDamage: 8, sprite: 'monster_fast', animationOffset: 0
    },
    'healer': {
        color: '#00FF00', initial: 'H', sizeMultiplier: 1.0, healthMultiplier: 1.5, speedMultiplier: 0.8, canShoot: false, xp: 25, contactDamage: 5, healAmount: 5, healRadius: 150, healInterval: 1500, lastHealTime: 0, type: 'healer', sprite: 'monster_healer', animationOffset: 0
    },
    'exploder': {
        color: '#FF4500', initial: 'E', sizeMultiplier: 1.2, healthMultiplier: 0.8, speedMultiplier: 1.0, canShoot: false, xp: 20, contactDamage: 30, explosionRadius: 80, type: 'exploder', sprite: 'monster_exploder', animationOffset: 0
    },
    'ghost': {
        color: 'rgba(255,255,255,0.4)', initial: 'G', sizeMultiplier: 0.9, healthMultiplier: 0.9, speedMultiplier: 1.2, canShoot: true, projectileColor: 'lightgray', projectileDamage: 10, shootInterval: 2800, projectileSpeed: PROJECTILE_BASE_SPEED * 1.1, projectileSize: SPELL_SIZE * 0.5, xp: 20, contactDamage: 12, evadeChance: 0.2, type: 'ghost', sprite: 'monster_ghost', animationOffset: 0
    },
    'giant_worm': {
        color: '#A52A2A', initial: 'W', sizeMultiplier: 2.0, healthMultiplier: 5.0, speedMultiplier: 0.5, canShoot: true, projectileColor: 'brown', projectileDamage: 25, shootInterval: 3000, projectileSpeed: PROJECTILE_BASE_SPEED * 0.6, projectileSize: SPELL_SIZE * 1.5, xp: 50, contactDamage: 40, type: 'giant_worm', sprite: 'monster_giant_worm', animationOffset: 0
    }
};

const ABILITY_CARDS = [
    { name: "Aumento de Vida Máxima", description: "+25 Vida Máxima", apply: () => { playerState.player.maxHealth += 25; playerState.player.health += 25; } },
    { name: "Aumento de Mana Máxima", description: "+20 Mana Máxima", apply: () => { playerState.player.maxMana += 20; playerState.player.mana += 20; } },
    { name: "Regeneração de Mana Aprimorada", description: "+0.05 Mana/Tick", apply: () => { playerState.player.manaRegenRate += 0.05; } },
    { name: "Poder Mágico Aumentado", description: "+0.1 Poder Mágico", apply: () => { playerState.player.spellPower += 0.1; } },
    { name: "Redução de Recarga", description: "-5% Recarga de Magias", apply: () => { playerState.player.cooldownReduction = Math.min(0.5, playerState.player.cooldownReduction + 0.05); } },
    { name: "Chance Crítica", description: "+5% Chance Crítica", apply: () => { playerState.player.criticalChance = Math.min(0.5, playerState.player.criticalChance + 0.05); } },
    { name: "Velocidade de Movimento", description: "+1 Velocidade de Movimento", apply: () => { playerState.player.movementSpeedBonus += 1; } },
    { name: "Fagulha Aprimorada", description: "Aumento de dano da Fagulha", apply: () => { SPELLS_DATA['Fagulha'].damage += 5; } },
    { name: "Bola de Fogo Aprimorada", description: "Aumento de dano da Bola de Fogo", apply: () => { SPELLS_DATA['Bola de Fogo'].damage += 10; } },
    { name: "Estilhaço de Gelo Aprimorado", description: "Aumento de dano do Estilhaço de Gelo", apply: () => { SPELLS_DATA['Estilhaço de Gelo'].damage += 8; } },
    { name: "Nova Magia: Rajada Arcana", description: "Aprende Rajada Arcana", apply: () => { if (!playerState.player.activeSpells.includes('Rajada Arcana')) playerState.player.activeSpells.push('Rajada Arcana'); } },
    { name: "Nova Magia: Cura Menor", description: "Aprende Cura Menor", apply: () => { if (!playerState.player.activeSpells.includes('Cura Menor')) playerState.player.activeSpells.push('Cura Menor'); } },
    { name: "Nova Magia: Escudo Arcano", description: "Aprende Escudo Arcano", apply: () => { if (!playerState.player.activeSpells.includes('Escudo Arcano')) playerState.player.activeSpells.push('Escudo Arcano'); } },
    { name: "Nova Magia: Relâmpago", description: "Aprende Relâmpago", apply: () => { if (!playerState.player.activeSpells.includes('Relâmpago')) playerState.player.activeSpells.push('Relâmpago'); } },
    { name: "Nova Magia: Névoa Venenosa", description: "Aprende Névoa Venenosa", apply: () => { if (!playerState.player.activeSpells.includes('Névoa Venenosa')) playerState.player.activeSpells.push('Névoa Venenosa'); } },
    { name: "Nova Magia: Explosão Congelante", description: "Aprende Explosão Congelante", apply: () => { if (!playerState.player.activeSpells.includes('Explosão Congelante')) playerState.player.activeSpells.push('Explosão Congelante'); } },
    { name: "Nova Magia: Drenar Vida", description: "Aprende Drenar Vida", apply: () => { if (!playerState.player.activeSpells.includes('Drenar Vida')) playerState.player.activeSpells.push('Drenar Vida'); } },
    { name: "Nova Magia: Tempestade de Meteoros", description: "Aprende Tempestade de Meteoros", apply: () => { if (!playerState.player.activeSpells.includes('Tempestade de Meteoros')) playerState.player.activeSpells.push('Tempestade de Meteoros'); } }
];
