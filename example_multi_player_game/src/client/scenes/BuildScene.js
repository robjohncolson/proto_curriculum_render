import Phaser from 'phaser';
import { PLAYER_CONFIG, ROUND_DURATION } from '../config.js';

export class BuildScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BuildScene' });
        this.blocks = [];
        this.selectedBlockType = 'wall';
        this.playerSprites = new Map();
        this.localPlayer = null;
        this.grid = [];
        this.gridSize = 20;
        this.timeLeft = ROUND_DURATION.BUILD;
    }

    init(data) {
        this.previousScore = data.score || 0;
    }

    create() {
        this.gameManager = this.registry.get('gameManager');
        this.networkManager = this.registry.get('networkManager');

        // Set background
        this.cameras.main.setBackgroundColor('#27ae60');

        // Create building grid
        this.createGrid();

        // Create players
        this.createPlayers();

        // Create UI
        this.createBuildUI();

        // Setup controls
        this.setupControls();

        // Setup network listeners
        this.setupNetworkListeners();

        // Start timer
        this.startTimer();
    }

    createGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x2ecc71, 0.3);

        const cellSize = 30;
        const gridWidth = Math.floor(this.scale.width / cellSize);
        const gridHeight = Math.floor(this.scale.height / cellSize);

        // Initialize grid array
        for (let y = 0; y < gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                this.grid[y][x] = null;
                // Draw grid lines
                graphics.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        this.cellSize = cellSize;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
    }

    createPlayers() {
        const currentUser = this.gameManager.getCurrentUser();

        // Create local player
        if (currentUser) {
            const x = this.scale.width / 2;
            const y = this.scale.height / 2;

            this.localPlayer = this.createPlayer(currentUser.id, currentUser.username, x, y, 0);
        }

        // Create other players (simplified for Build mode)
        let index = 1;
        for (let i = 0; i < 3; i++) {
            const x = Phaser.Math.Between(100, this.scale.width - 100);
            const y = Phaser.Math.Between(100, this.scale.height - 100);
            this.createPlayer(`bot_${i}`, `Bot ${i + 1}`, x, y, index);
            index++;
        }
    }

    createPlayer(id, name, x, y, colorIndex) {
        // Create player cursor (smaller in build mode)
        const graphics = this.add.graphics();
        const color = PLAYER_CONFIG.colors[colorIndex % PLAYER_CONFIG.colors.length];
        graphics.lineStyle(3, color, 1);
        graphics.strokeRect(-15, -15, 30, 30);

        // Create physics sprite
        const sprite = this.physics.add.sprite(x, y, null);
        sprite.setSize(30, 30);
        sprite.setCollideWorldBounds(true);
        sprite.graphics = graphics;

        // Add player name
        const nameText = this.add.text(x, y - 25, name, {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);

        const player = {
            id,
            sprite,
            graphics,
            nameText,
            color
        };

        this.playerSprites.set(id, player);
        return player;
    }

    createBuildUI() {
        // Block type selector
        const blockTypes = [
            { type: 'wall', color: 0x95a5a6, name: 'Wall' },
            { type: 'floor', color: 0x3498db, name: 'Floor' },
            { type: 'trap', color: 0xe74c3c, name: 'Trap' },
            { type: 'boost', color: 0xf39c12, name: 'Boost' }
        ];

        const startY = 60;
        blockTypes.forEach((block, index) => {
            const y = startY + (index * 50);

            // Block preview
            const preview = this.add.graphics();
            preview.fillStyle(block.color, 1);
            preview.fillRect(20, y, 30, 30);

            // Block name
            const text = this.add.text(60, y + 15, block.name, {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);

            // Selection indicator
            if (index === 0) {
                this.selectionIndicator = this.add.graphics();
                this.selectionIndicator.lineStyle(3, 0xffffff, 1);
                this.selectionIndicator.strokeRect(15, y - 5, 100, 40);
            }

            // Make clickable
            preview.setInteractive(new Phaser.Geom.Rectangle(20, y, 100, 40), Phaser.Geom.Rectangle.Contains);
            preview.on('pointerdown', () => {
                this.selectedBlockType = block.type;
                this.selectedBlockColor = block.color;
                this.selectionIndicator.setPosition(0, y - startY);
            });
        });

        this.selectedBlockColor = blockTypes[0].color;

        // Instructions
        this.add.text(this.scale.width / 2, 30, '🔨 BUILD MODE - Click to place blocks!', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Score display
        this.scoreText = this.add.text(this.scale.width - 20, 20, `Score: ${this.previousScore}`, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);

        // Timer
        this.timerText = this.add.text(this.scale.width / 2, this.scale.height - 30, 'Time: 3:00', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Preview block (follows mouse)
        this.previewBlock = this.add.graphics();
        this.previewBlock.fillStyle(this.selectedBlockColor, 0.5);
        this.previewBlock.fillRect(0, 0, this.cellSize, this.cellSize);
        this.previewBlock.setVisible(false);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        // Mouse controls for building
        this.input.on('pointermove', (pointer) => {
            if (this.localPlayer) {
                // Move player cursor to mouse position
                this.localPlayer.sprite.x = pointer.x;
                this.localPlayer.sprite.y = pointer.y;

                // Update preview block position
                const gridX = Math.floor(pointer.x / this.cellSize);
                const gridY = Math.floor(pointer.y / this.cellSize);
                this.previewBlock.x = gridX * this.cellSize;
                this.previewBlock.y = gridY * this.cellSize;
                this.previewBlock.setVisible(true);
            }
        });

        this.input.on('pointerdown', (pointer) => {
            this.placeBlock(pointer.x, pointer.y);
        });

        // Touch support
        this.input.on('pointerup', () => {
            const inputState = this.gameManager.getInputState();
            if (inputState.action) {
                this.placeBlock(this.localPlayer.sprite.x, this.localPlayer.sprite.y);
            }
        });
    }

    setupNetworkListeners() {
        this.networkManager.on('blockPlaced', (data) => {
            this.onBlockPlaced(data);
        });

        this.networkManager.on('blockDestroyed', (data) => {
            this.onBlockDestroyed(data);
        });
    }

    placeBlock(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);

        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            if (!this.grid[gridY][gridX]) {
                // Create block
                const block = this.add.graphics();
                block.fillStyle(this.selectedBlockColor, 1);
                block.fillRect(gridX * this.cellSize, gridY * this.cellSize, this.cellSize, this.cellSize);

                this.grid[gridY][gridX] = {
                    type: this.selectedBlockType,
                    graphics: block,
                    owner: this.localPlayer.id
                };

                // Add score based on block type
                const scores = { wall: 5, floor: 3, trap: 10, boost: 8 };
                this.previousScore += scores[this.selectedBlockType] || 5;
                this.scoreText.setText(`Score: ${this.previousScore}`);

                // Send to server
                this.networkManager.sendAction('placeBlock', {
                    x: gridX,
                    y: gridY,
                    type: this.selectedBlockType
                });

                // Create placement effect
                this.createPlacementEffect(gridX * this.cellSize + this.cellSize / 2,
                                        gridY * this.cellSize + this.cellSize / 2);
            }
        }
    }

    onBlockPlaced(data) {
        if (data.playerId !== this.localPlayer?.id) {
            const block = this.add.graphics();
            const color = this.getBlockColor(data.type);
            block.fillStyle(color, 1);
            block.fillRect(data.x * this.cellSize, data.y * this.cellSize, this.cellSize, this.cellSize);

            this.grid[data.y][data.x] = {
                type: data.type,
                graphics: block,
                owner: data.playerId
            };
        }
    }

    onBlockDestroyed(data) {
        if (this.grid[data.y] && this.grid[data.y][data.x]) {
            const block = this.grid[data.y][data.x];
            block.graphics.destroy();
            this.grid[data.y][data.x] = null;
        }
    }

    getBlockColor(type) {
        const colors = {
            wall: 0x95a5a6,
            floor: 0x3498db,
            trap: 0xe74c3c,
            boost: 0xf39c12
        };
        return colors[type] || 0x95a5a6;
    }

    createPlacementEffect(x, y) {
        const effect = this.add.graphics();
        effect.lineStyle(3, 0xffffff, 1);
        effect.strokeRect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, this.cellSize);

        this.tweens.add({
            targets: effect,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
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
            repeat: ROUND_DURATION.BUILD - 1
        });
    }

    endRound() {
        // Count blocks for bonus score
        let blockCount = 0;
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] && this.grid[y][x].owner === this.localPlayer?.id) {
                    blockCount++;
                }
            }
        }

        const bonus = blockCount * 2;
        this.previousScore += bonus;

        // Show results
        const resultText = this.add.text(this.scale.width / 2, this.scale.height / 2,
            `Round Complete!\nBlocks Placed: ${blockCount}\nTotal Score: ${this.previousScore}`, {
            fontSize: '36px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Transition to Battle mode
        this.time.delayedCall(3000, () => {
            this.scene.start('BattleScene', { score: this.previousScore, buildGrid: this.grid });
        });
    }

    update() {
        if (!this.localPlayer) return;

        // Update graphics position
        this.localPlayer.graphics.x = this.localPlayer.sprite.x;
        this.localPlayer.graphics.y = this.localPlayer.sprite.y;
        this.localPlayer.nameText.x = this.localPlayer.sprite.x;
        this.localPlayer.nameText.y = this.localPlayer.sprite.y - 25;

        // Keyboard movement (alternative to mouse)
        const inputState = this.gameManager.getInputState();
        const speed = PLAYER_CONFIG.speed;

        if (this.cursors.left.isDown || this.wasd.A.isDown || inputState.left) {
            this.localPlayer.sprite.x -= speed * 0.016;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown || inputState.right) {
            this.localPlayer.sprite.x += speed * 0.016;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown || inputState.up) {
            this.localPlayer.sprite.y -= speed * 0.016;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown || inputState.down) {
            this.localPlayer.sprite.y += speed * 0.016;
        }

        // Place block with spacebar or action button
        if (this.spaceKey.isDown || inputState.action) {
            this.placeBlock(this.localPlayer.sprite.x, this.localPlayer.sprite.y);
        }
    }
}