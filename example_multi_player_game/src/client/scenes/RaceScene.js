import Phaser from 'phaser';
import { PLAYER_CONFIG, ROUND_DURATION } from '../config.js';

export class RaceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RaceScene' });
        this.players = new Map();
        this.coins = [];
        this.playerSprites = new Map();
        this.localPlayer = null;
        this.score = 0;
        this.timeLeft = ROUND_DURATION.RACE;
    }

    init(data) {
        if (data.players) {
            this.playersData = data.players;
        }
    }

    create() {
        this.gameManager = this.registry.get('gameManager');
        this.networkManager = this.registry.get('networkManager');

        // Set background color
        this.cameras.main.setBackgroundColor('#2d3436');

        // Create race track boundaries
        this.createTrack();

        // Create coins
        this.createCoins();

        // Create players
        this.createPlayers();

        // Create HUD
        this.createHUD();

        // Setup controls
        this.setupControls();

        // Setup network listeners
        this.setupNetworkListeners();

        // Start timer
        this.startTimer();
    }

    createTrack() {
        // Draw track boundaries
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 1);

        // Outer boundary
        graphics.strokeRect(50, 50, this.scale.width - 100, this.scale.height - 100);

        // Inner obstacles
        graphics.fillStyle(0x636e72, 1);

        // Add some obstacles
        graphics.fillRect(200, 200, 100, 100);
        graphics.fillRect(500, 300, 80, 80);
        graphics.fillRect(300, 450, 120, 60);
        graphics.fillRect(600, 150, 60, 120);

        // Create physics bodies for obstacles
        this.obstacles = this.physics.add.staticGroup();

        this.obstacles.create(250, 250, null).setSize(100, 100).setVisible(false);
        this.obstacles.create(540, 340, null).setSize(80, 80).setVisible(false);
        this.obstacles.create(360, 480, null).setSize(120, 60).setVisible(false);
        this.obstacles.create(630, 210, null).setSize(60, 120).setVisible(false);
    }

    createCoins() {
        this.coinGroup = this.physics.add.group();

        // Create 20 coins randomly placed
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(100, this.scale.width - 100);
            const y = Phaser.Math.Between(100, this.scale.height - 100);

            // Create coin graphics
            const coin = this.add.graphics();
            coin.fillStyle(0xffd700, 1);
            coin.fillCircle(0, 0, 10);

            const coinSprite = this.physics.add.sprite(x, y, null);
            coinSprite.setSize(20, 20);
            coinSprite.graphics = coin;

            // Position graphics at sprite location
            coin.x = x;
            coin.y = y;

            this.coinGroup.add(coinSprite);
            this.coins.push({ sprite: coinSprite, graphics: coin, collected: false });

            // Add spinning animation
            this.tweens.add({
                targets: coin,
                angle: 360,
                duration: 2000,
                repeat: -1
            });
        }
    }

    createPlayers() {
        const currentUser = this.gameManager.getCurrentUser();

        // Create local player
        if (currentUser) {
            const x = Phaser.Math.Between(100, this.scale.width - 100);
            const y = Phaser.Math.Between(100, this.scale.height - 100);

            this.localPlayer = this.createPlayer(currentUser.id, currentUser.username, x, y, 0);
        }

        // Create other players
        let index = 1;
        if (this.playersData) {
            this.playersData.forEach((playerData, playerId) => {
                if (playerId !== currentUser?.id) {
                    const x = Phaser.Math.Between(100, this.scale.width - 100);
                    const y = Phaser.Math.Between(100, this.scale.height - 100);
                    this.createPlayer(playerId, playerData.player.username, x, y, index);
                    index++;
                }
            });
        }
    }

    createPlayer(id, name, x, y, colorIndex) {
        // Create player sprite (circle)
        const graphics = this.add.graphics();
        const color = PLAYER_CONFIG.colors[colorIndex % PLAYER_CONFIG.colors.length];
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, PLAYER_CONFIG.size / 2);

        // Create physics sprite
        const sprite = this.physics.add.sprite(x, y, null);
        sprite.setSize(PLAYER_CONFIG.size, PLAYER_CONFIG.size);
        sprite.setCollideWorldBounds(true);
        sprite.graphics = graphics;

        // Add player name
        const nameText = this.add.text(x, y - 30, name, {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const player = {
            id,
            sprite,
            graphics,
            nameText,
            score: 0
        };

        this.playerSprites.set(id, player);

        // Setup collisions
        if (sprite === this.localPlayer?.sprite) {
            this.physics.add.collider(sprite, this.obstacles);
            this.physics.add.overlap(sprite, this.coinGroup, this.collectCoin, null, this);
        }

        return player;
    }

    createHUD() {
        // Score display
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });

        // Timer display
        this.timerText = this.add.text(this.scale.width / 2, 20, 'Time: 2:00', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0);

        // Round info
        this.add.text(this.scale.width - 20, 20, '🏃 RACE MODE', {
            fontSize: '24px',
            color: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    }

    setupNetworkListeners() {
        this.networkManager.on('gameStateUpdate', (state) => {
            this.updateNetworkPlayers(state);
        });

        this.networkManager.on('coinCollected', (data) => {
            this.onCoinCollected(data);
        });
    }

    updateNetworkPlayers(state) {
        if (!state.players) return;

        state.players.forEach(playerData => {
            if (playerData.id !== this.localPlayer?.id) {
                const player = this.playerSprites.get(playerData.id);
                if (player) {
                    // Smooth interpolation
                    this.tweens.add({
                        targets: player.sprite,
                        x: playerData.x,
                        y: playerData.y,
                        duration: 100,
                        ease: 'Linear'
                    });
                }
            }
        });
    }

    collectCoin(playerSprite, coinSprite) {
        const coin = this.coins.find(c => c.sprite === coinSprite);
        if (coin && !coin.collected) {
            coin.collected = true;
            coin.graphics.destroy();
            coinSprite.destroy();

            this.score += 10;
            this.scoreText.setText(`Score: ${this.score}`);

            // Send to server
            this.networkManager.sendAction('collectCoin', {
                coinId: this.coins.indexOf(coin)
            });

            // Create collection effect
            this.createCollectionEffect(coinSprite.x, coinSprite.y);
        }
    }

    onCoinCollected(data) {
        if (data.playerId !== this.localPlayer?.id) {
            const coin = this.coins[data.coinId];
            if (coin && !coin.collected) {
                coin.collected = true;
                coin.graphics.destroy();
                coin.sprite.destroy();
            }
        }
    }

    createCollectionEffect(x, y) {
        const effect = this.add.graphics();
        effect.fillStyle(0xffd700, 1);
        effect.fillCircle(x, y, 10);

        this.tweens.add({
            targets: effect,
            alpha: 0,
            scaleX: 3,
            scaleY: 3,
            duration: 300,
            onComplete: () => effect.destroy()
        });
    }

    startTimer() {
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                const minutes = Math.floor(this.timeLeft / 60);
                const seconds = this.timeLeft % 60;
                this.timerText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);

                if (this.timeLeft <= 0) {
                    this.endRound();
                }
            },
            repeat: ROUND_DURATION.RACE - 1
        });
    }

    endRound() {
        // Show results
        const resultText = this.add.text(this.scale.width / 2, this.scale.height / 2,
            `Round Complete!\nYour Score: ${this.score}`, {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);

        // Transition to next round after delay
        this.time.delayedCall(3000, () => {
            this.scene.start('BuildScene', { score: this.score });
        });
    }

    update() {
        if (!this.localPlayer) return;

        // Handle player movement
        const speed = PLAYER_CONFIG.speed;
        let velocityX = 0;
        let velocityY = 0;

        // Get input from GameManager (includes touch controls)
        const inputState = this.gameManager.getInputState();

        if (this.cursors.left.isDown || this.wasd.A.isDown || inputState.left) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown || inputState.right) {
            velocityX = speed;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown || inputState.up) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown || inputState.down) {
            velocityY = speed;
        }

        this.localPlayer.sprite.setVelocity(velocityX, velocityY);

        // Update graphics position to match sprite
        this.localPlayer.graphics.x = this.localPlayer.sprite.x;
        this.localPlayer.graphics.y = this.localPlayer.sprite.y;
        this.localPlayer.nameText.x = this.localPlayer.sprite.x;
        this.localPlayer.nameText.y = this.localPlayer.sprite.y - 30;

        // Send position to server
        if (velocityX !== 0 || velocityY !== 0) {
            this.networkManager.sendInput({
                x: this.localPlayer.sprite.x,
                y: this.localPlayer.sprite.y,
                vx: velocityX,
                vy: velocityY
            });
        }
    }
}