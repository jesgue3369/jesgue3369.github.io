// constants.js - Define valores e dados imutáveis do jogo.

// Game Constants
const PLAYER_SIZE = 50;
const SPELL_SIZE = 20; // Default size for projectile spells
const ENTITY_ANIMATION_AMPLITUDE = 5; // How much entities float up/down
const ENTITY_ANIMATION_SPEED = 2; // How fast entities float

const MONSTER_SHOOTER_COOLDOWN = 1500; // Milliseconds between shooter monster attacks

// XP values for different monster types
const MONSTER_XP_VALUES = {
    'basic': 10,
    'shooter': 15,
    'ghost': 20,
    'exploder': 25
};

// Asset Paths - Substitua com os caminhos corretos para suas imagens
const ASSET_PATHS = {
    player: 'assets/player.png', 
    monster_basic: 'assets/monster_basic.png',
    monster_shooter: 'assets/monster_shooter.png',
    monster_ghost: 'assets/monster_ghost.png',
    monster_exploder: 'assets/monster_exploder.png',
    spell_spark: 'assets/spell_spark.png', 
    spell_fireball: 'assets/spell_fireball.png',
    spell_icebolt: 'assets/spell_icebolt.png',
    spell_poison: 'assets/spell_poison.png',
    spell_lightning: 'assets/spell_lightning.png',
    projectile_monster: 'assets/projectile_monster.png',
    background: 'assets/background.jpg' // Certifique-se de ter essa imagem!
};

// Spell Data
const SPELLS_DATA = {
    'Fagulha': {
        damage: 20,
        speed: 10,
        radius: 10,
        color: 'yellow',
        sprite: 'spell_spark',
        type: 'projectile',
        cooldown: 300,
        manaCost: 5,
        pierce: 0
    },
    'Flecha de Gelo': {
        damage: 30,
        speed: 12,
        radius: 12,
        color: 'lightblue',
        sprite: 'spell_icebolt',
        type: 'projectile',
        cooldown: 500,
        manaCost: 15,
        pierce: 1, // Can pierce one monster
        effect: 'slow' 
    },
    'Bola de Fogo': {
        damage: 50,
        speed: 8,
        radius: 20,
        color: 'orange',
        sprite: 'spell_fireball',
        type: 'projectile',
        cooldown: 800,
        manaCost: 25,
        pierce: 0
    },
    'Névoa Venenosa': {
        damage: 5, // Damage per second
        radius: 70,
        color: 'purple',
        sprite: 'spell_poison',
        type: 'aoe_dot', // Area of Effect, Damage Over Time
        cooldown: 1500,
        manaCost: 40,
        duration: 5000, // 5 seconds
        effect: 'poison'
    },
    'Raio em Cadeia': {
        damage: 40,
        radius: 0, 
        color: 'white',
        sprite: 'spell_lightning',
        type: 'aoe_lightning', // Direct hit on closest, visual effect
        cooldown: 1000,
        manaCost: 30,
        duration: 100 // Short duration for visual effect (milliseconds)
    }
};

// Ability Card Data
// Cada habilidade tem um método `apply` que será chamado.
// Note que eles acessam `window.playerState.player`, que é definido em `main.js` e `player.js`.
const ABILITY_CARDS = [
    {
        name: "Aumento de Vida",
        description: "Aumenta sua vida máxima em 20 e cura 20 de vida.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.maxHealth += 20;
                window.playerState.player.health = Math.min(window.playerState.player.maxHealth, window.playerState.player.health + 20);
                console.log("Habilidade 'Aumento de Vida' aplicada.");
            }
        }
    },
    {
        name: "Aumento de Mana",
        description: "Aumenta sua mana máxima em 20 e recupera 20 de mana.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.maxMana += 20;
                window.playerState.player.mana = Math.min(window.playerState.player.maxMana, window.playerState.player.mana + 20);
                console.log("Habilidade 'Aumento de Mana' aplicada.");
            }
        }
    },
    {
        name: "Nova Magia: Flecha de Gelo",
        description: "Adiciona Flecha de Gelo às suas magias. Causa lentidão.",
        apply: () => {
            if (window.playerState && window.playerState.player && !window.playerState.player.activeSpells.includes('Flecha de Gelo')) {
                window.playerState.player.activeSpells.push('Flecha de Gelo');
                console.log("Habilidade 'Nova Magia: Flecha de Gelo' aplicada.");
            }
        }
    },
    {
        name: "Nova Magia: Bola de Fogo",
        description: "Adiciona Bola de Fogo às suas magias. Grande dano em área.",
        apply: () => {
            if (window.playerState && window.playerState.player && !window.playerState.player.activeSpells.includes('Bola de Fogo')) {
                window.playerState.player.activeSpells.push('Bola de Fogo');
                console.log("Habilidade 'Nova Magia: Bola de Fogo' aplicada.");
            }
        }
    },
    {
        name: "Aumento de Dano Mágico",
        description: "Aumenta o dano de todas as suas magias em 10%.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.spellPowerMultiplier += 0.1;
                console.log("Habilidade 'Aumento de Dano Mágico' aplicada.");
            }
        }
    },
    {
        name: "Redução de Cooldown",
        description: "Reduz o tempo de recarga de todas as suas magias em 5%.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.spellCooldownReduction = Math.min(0.5, window.playerState.player.spellCooldownReduction + 0.05); // Max 50%
                console.log("Habilidade 'Redução de Cooldown' aplicada.");
            }
        }
    },
    {
        name: "Escudo Temporário",
        description: "Ganha 50 de escudo que absorve dano.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.shield += 50;
                console.log("Habilidade 'Escudo Temporário' aplicada.");
            }
        }
    },
    {
        name: "Nova Magia: Névoa Venenosa",
        description: "Adiciona Névoa Venenosa. Causa dano contínuo em área.",
        apply: () => {
            if (window.playerState && window.playerState.player && !window.playerState.player.activeSpells.includes('Névoa Venenosa')) {
                window.playerState.player.activeSpells.push('Névoa Venenosa');
                console.log("Habilidade 'Nova Magia: Névoa Venenosa' aplicada.");
            }
        }
    },
    {
        name: "Nova Magia: Raio em Cadeia",
        description: "Adiciona Raio em Cadeia. Ataca o inimigo mais próximo.",
        apply: () => {
            if (window.playerState && window.playerState.player && !window.playerState.player.activeSpells.includes('Raio em Cadeia')) {
                window.playerState.player.activeSpells.push('Raio em Cadeia');
                console.log("Habilidade 'Nova Magia: Raio em Cadeia' aplicada.");
            }
        }
    },
    {
        name: "Bônus de Velocidade",
        description: "Aumenta sua velocidade de movimento em 10%.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.movementSpeedBonus += 0.1;
                console.log("Habilidade 'Bônus de Velocidade' aplicada.");
            }
        }
    },
    {
        name: "Chance de Crítico",
        description: "Ganha 5% de chance de causar dano crítico.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.criticalChance = Math.min(0.5, window.playerState.player.criticalChance + 0.05); // Max 50%
                console.log("Habilidade 'Chance de Crítico' aplicada.");
            }
        }
    },
    {
        name: "Regeneração de Vida",
        description: "Ganha 1 de vida por segundo.",
        apply: () => {
            if (window.playerState && window.playerState.player) {
                window.playerState.player.healthRegenRate += 1/60; // 1 health per second (approx) assuming 60FPS
                console.log("Habilidade 'Regeneração de Vida' aplicada.");
            }
        }
    }
];
