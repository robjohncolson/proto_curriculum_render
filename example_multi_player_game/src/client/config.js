export const GAME_CONFIG = {
    width: window.innerWidth,
    height: window.innerHeight,
    maxPlayers: 16,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%'
    }
};

export const GAME_MODES = {
    RACE: 'race',
    BUILD: 'build',
    BATTLE: 'battle'
};

export const ROUND_DURATION = {
    RACE: 120,    // 2 minutes
    BUILD: 180,   // 3 minutes
    BATTLE: 150   // 2.5 minutes
};

export const PLAYER_CONFIG = {
    speed: 300,
    size: 30,
    colors: [
        0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00,
        0xFF00FF, 0x00FFFF, 0xFFA500, 0x800080,
        0x008000, 0x000080, 0x800000, 0x808000,
        0xFF69B4, 0x4B0082, 0x2E8B57, 0xDC143C
    ]
};

export const POWER_UPS = {
    SPEED_BOOST: { duration: 3000, multiplier: 1.5 },
    SHIELD: { duration: 5000 },
    DOUBLE_POINTS: { duration: 10000, multiplier: 2 },
    TELEPORT: { cooldown: 15000 }
};

export const NETWORK_CONFIG = {
    updateRate: 30, // Hz
    interpolation: true,
    predictionStrength: 0.2
};