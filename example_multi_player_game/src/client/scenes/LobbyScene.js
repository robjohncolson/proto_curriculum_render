import Phaser from 'phaser';
import { PLAYER_CONFIG } from '../config.js';

export class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
        this.players = new Map();
        this.roomCodeText = null;
    }

    create() {
        this.gameManager = this.registry.get('gameManager');
        this.networkManager = this.registry.get('networkManager');

        // Create background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Add title
        this.add.text(this.scale.width / 2, 50, 'LOBBY', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Show room code
        const roomCode = this.networkManager.getRoomCode();
        if (roomCode) {
            this.roomCodeText = this.add.text(this.scale.width / 2, 120, `Room Code: ${roomCode}`, {
                fontSize: '32px',
                color: '#ffff00',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        // Waiting for players text
        this.waitingText = this.add.text(this.scale.width / 2, 200, 'Waiting for players...', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Player list area
        this.playerListY = 280;

        // Setup network listeners
        this.setupNetworkListeners();

        // Add current player
        const currentUser = this.gameManager.getCurrentUser();
        if (currentUser) {
            this.addPlayerToLobby(currentUser);
        }

        // Simulate game start after some players join (for testing)
        this.time.delayedCall(5000, () => {
            this.startGame();
        });
    }

    setupNetworkListeners() {
        this.networkManager.on('playerJoined', (player) => {
            this.addPlayerToLobby(player);
        });

        this.networkManager.on('playerLeft', (playerId) => {
            this.removePlayerFromLobby(playerId);
        });

        this.networkManager.on('roundStart', (mode) => {
            this.startRound(mode);
        });
    }

    addPlayerToLobby(player) {
        if (this.players.has(player.id)) return;

        const index = this.players.size;
        const x = this.scale.width / 2;
        const y = this.playerListY + (index * 40);

        // Create player display
        const colorIndex = index % PLAYER_CONFIG.colors.length;
        const color = PLAYER_CONFIG.colors[colorIndex];

        // Player icon (circle)
        const graphics = this.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(x - 150, y, 15);

        // Player name
        const nameText = this.add.text(x - 100, y, player.username || 'Guest', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);

        // Ready indicator
        const readyText = this.add.text(x + 100, y, '✓ Ready', {
            fontSize: '20px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);

        this.players.set(player.id, {
            player,
            graphics,
            nameText,
            readyText,
            color
        });

        this.updatePlayerCount();
    }

    removePlayerFromLobby(playerId) {
        const playerData = this.players.get(playerId);
        if (playerData) {
            playerData.graphics.destroy();
            playerData.nameText.destroy();
            playerData.readyText.destroy();
            this.players.delete(playerId);
            this.updatePlayerCount();
            this.reorganizePlayers();
        }
    }

    reorganizePlayers() {
        let index = 0;
        this.players.forEach((playerData) => {
            const y = this.playerListY + (index * 40);
            playerData.graphics.clear();
            playerData.graphics.fillStyle(playerData.color, 1);
            playerData.graphics.fillCircle(this.scale.width / 2 - 150, y, 15);
            playerData.nameText.setY(y);
            playerData.readyText.setY(y);
            index++;
        });
    }

    updatePlayerCount() {
        const count = this.players.size;
        this.waitingText.setText(`${count}/16 Players - Waiting to start...`);

        // Start countdown if we have enough players
        if (count >= 2) {
            this.startCountdown();
        }
    }

    startCountdown() {
        let countdown = 3;
        this.countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, countdown.toString(), {
            fontSize: '72px',
            color: '#ff0000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                countdown--;
                if (countdown > 0) {
                    this.countdownText.setText(countdown.toString());
                } else {
                    this.countdownText.setText('GO!');
                    this.time.delayedCall(500, () => {
                        this.startGame();
                    });
                }
            },
            repeat: 2
        });
    }

    startGame() {
        // Start with Race mode
        this.startRound('race');
    }

    startRound(mode) {
        const sceneMap = {
            'race': 'RaceScene',
            'build': 'BuildScene',
            'battle': 'BattleScene'
        };

        const sceneName = sceneMap[mode] || 'RaceScene';
        this.scene.start(sceneName, { players: this.players });
    }

    update() {
        // Any continuous updates for the lobby
    }
}