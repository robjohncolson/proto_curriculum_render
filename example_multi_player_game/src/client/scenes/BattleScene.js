import Phaser from 'phaser';
import { PLAYER_CONFIG, ROUND_DURATION } from '../config.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        this.playerSprites = new Map();
        this.localPlayer = null;
        this.projectiles = [];
        this.teams = { red: [], blue: [] };
        this.teamScores = { red: 0, blue: 0 };
        this.timeLeft = ROUND_DURATION.BATTLE;
    }

    init(data) {
        this.previousScore = data.score || 0;
        this.buildGrid = data.buildGrid || [];
    }

    create() {
        this.gameManager = this.registry.get('gameManager');
        this.networkManager = this.registry.get('networkManager');

        // Set background
        this.cameras.main.setBackgroundColor('#c0392b');

        // Create arena
        this.createArena();

        // Create teams and players
        this.createTeams();

        // Create UI
        this.createBattleUI();

        // Setup controls
        this.setupControls();

        // Setup network listeners
        this.setupNetworkListeners();

        // Start timer
        this.startTimer();
    }

    createArena() {
        // Draw battle arena boundaries
        const graphics = this.add.graphics();

        // Team bases
        graphics.fillStyle(0xe74c3c, 0.3); // Red base
        graphics.fillRect(0, 0, 200, this.scale.height);

        graphics.fillStyle(0x3498db, 0.3); // Blue base
        graphics.fillRect(this.scale.width - 200, 0, 200, this.scale.height);

        // Center divider
        graphics.lineStyle(3, 0xffffff, 0.5);
        graphics.lineBetween(this.scale.width / 2, 0, this.scale.width / 2, this.scale.height);

        // Import blocks from build mode if available
        if (this.buildGrid.length > 0) {
            const cellSize = 30;
            for (let y = 0; y < this.buildGrid.length; y++) {
                if (this.buildGrid[y]) {
                    for (let x = 0; x < this.buildGrid[y].length; x++) {
                        if (this.buildGrid[y][x]) {
                            const block = this.add.graphics();
                            block.fillStyle(0x7f8c8d, 1);
                            block.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        }
                    }
                }
            }
        }

        // Create physics groups for projectiles
        this.projectileGroup = this.physics.add.group();
    }

    createTeams() {
        const currentUser = this.gameManager.getCurrentUser();

        // Assign local player to a team
        const localTeam = Math.random() < 0.5 ? 'red' : 'blue';

        // Create local player
        if (currentUser) {
            const x = localTeam === 'red' ? 100 : this.scale.width - 100;
            const y = this.scale.height / 2;

            this.localPlayer = this.createPlayer(
                currentUser.id,
                currentUser.username,
                x, y,
                localTeam,
                0
            );
            this.teams[localTeam].push(this.localPlayer);
        }

        // Create AI teammates and enemies
        for (let i = 0; i < 7; i++) {
            const team = i < 3 ? localTeam : (localTeam === 'red' ? 'blue' : 'red');
            const x = team === 'red' ?
                Phaser.Math.Between(50, 150) :
                Phaser.Math.Between(this.scale.width - 150, this.scale.width - 50);
            const y = Phaser.Math.Between(100, this.scale.height - 100);

            const player = this.createPlayer(
                `bot_${i}`,
                `Bot ${i + 1}`,
                x, y,
                team,
                i + 1
            );
            this.teams[team].push(player);
        }
    }

    createPlayer(id, name, x, y, team, colorIndex) {
        // Create player sprite
        const graphics = this.add.graphics();
        const color = team === 'red' ? 0xe74c3c : 0x3498db;
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, PLAYER_CONFIG.size / 2);

        // Add team indicator
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeCircle(0, 0, PLAYER_CONFIG.size / 2 + 3);

        // Create physics sprite
        const sprite = this.physics.add.sprite(x, y, null);
        sprite.setSize(PLAYER_CONFIG.size, PLAYER_CONFIG.size);
        sprite.setCollideWorldBounds(true);
        sprite.graphics = graphics;

        // Health bar
        const healthBarBg = this.add.graphics();
        healthBarBg.fillStyle(0x000000, 0.5);
        healthBarBg.fillRect(-20, -35, 40, 5);

        const healthBar = this.add.graphics();
        healthBar.fillStyle(0x00ff00, 1);
        healthBar.fillRect(-20, -35, 40, 5);

        // Add player name
        const nameText = this.add.text(x, y - 45, name, {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const player = {
            id,
            sprite,
            graphics,
            nameText,
            team,
            health: 100,
            healthBar,
            healthBarBg,
            attackCooldown: 0
        };

        this.playerSprites.set(id, player);

        // Add AI behavior for bots
        if (id.startsWith('bot_')) {
            this.addAIBehavior(player);
        }

        return player;
    }

    addAIBehavior(player) {
        // Simple AI that moves randomly and shoots at enemies
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (player.health > 0) {
                    // Random movement
                    player.sprite.setVelocity(
                        Phaser.Math.Between(-100, 100),
                        Phaser.Math.Between(-100, 100)
                    );

                    // Attack nearest enemy
                    const enemyTeam = player.team === 'red' ? 'blue' : 'red';
                    const enemies = this.teams[enemyTeam].filter(e => e.health > 0);

                    if (enemies.length > 0 && player.attackCooldown <= 0) {
                        const target = enemies[0];
                        this.createProjectile(player, target.sprite.x, target.sprite.y);
                        player.attackCooldown = 30;
                    }
                }
            },
            repeat: -1
        });
    }

    createBattleUI() {
        // Team scores
        this.redScoreText = this.add.text(20, 20, 'Red Team: 0', {
            fontSize: '24px',
            color: '#e74c3c',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });

        this.blueScoreText = this.add.text(this.scale.width - 20, 20, 'Blue Team: 0', {
            fontSize: '24px',
            color: '#3498db',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(1, 0);

        // Round info
        this.add.text(this.scale.width / 2, 20, '⚔️ BATTLE MODE', {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // Player score
        this.scoreText = this.add.text(20, this.scale.height - 50, `Your Score: ${this.previousScore}`, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });

        // Timer
        this.timerText = this.add.text(this.scale.width / 2, 60, 'Time: 2:30', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Ability cooldown indicator
        this.cooldownText = this.add.text(this.scale.width / 2, this.scale.height - 50, '', {
            fontSize: '18px',
            color: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        // Mouse controls for aiming
        this.input.on('pointerdown', (pointer) => {
            if (this.localPlayer && this.localPlayer.attackCooldown <= 0) {
                this.createProjectile(this.localPlayer, pointer.x, pointer.y);
                this.localPlayer.attackCooldown = 30;
            }
        });
    }

    setupNetworkListeners() {
        this.networkManager.on('playerHit', (data) => {
            this.onPlayerHit(data);
        });

        this.networkManager.on('playerEliminated', (data) => {
            this.onPlayerEliminated(data);
        });
    }

    createProjectile(player, targetX, targetY) {
        const angle = Phaser.Math.Angle.Between(
            player.sprite.x, player.sprite.y,
            targetX, targetY
        );

        const projectile = this.add.graphics();
        projectile.fillStyle(player.team === 'red' ? 0xff0000 : 0x0000ff, 1);
        projectile.fillCircle(0, 0, 5);

        const projectileSprite = this.physics.add.sprite(player.sprite.x, player.sprite.y, null);
        projectileSprite.setSize(10, 10);
        projectileSprite.graphics = projectile;
        projectileSprite.owner = player;

        const speed = 500;
        projectileSprite.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        this.projectileGroup.add(projectileSprite);
        this.projectiles.push(projectileSprite);

        // Destroy projectile after 2 seconds
        this.time.delayedCall(2000, () => {
            projectile.destroy();
            projectileSprite.destroy();
        });

        // Send to server
        this.networkManager.sendAction('shoot', {
            angle,
            x: player.sprite.x,
            y: player.sprite.y
        });
    }

    onPlayerHit(data) {
        const player = this.playerSprites.get(data.playerId);
        if (player) {
            player.health -= data.damage;
            this.updateHealthBar(player);

            // Create hit effect
            this.createHitEffect(player.sprite.x, player.sprite.y);

            if (player.health <= 0) {
                this.onPlayerEliminated({ playerId: data.playerId });
            }
        }
    }

    onPlayerEliminated(data) {
        const player = this.playerSprites.get(data.playerId);
        if (player) {
            player.health = 0;
            player.sprite.setVisible(false);
            player.graphics.setVisible(false);
            player.nameText.setVisible(false);
            player.healthBar.setVisible(false);
            player.healthBarBg.setVisible(false);

            // Update team scores
            const opposingTeam = player.team === 'red' ? 'blue' : 'red';
            this.teamScores[opposingTeam] += 10;
            this.updateScores();

            // Respawn after 3 seconds
            this.time.delayedCall(3000, () => {
                this.respawnPlayer(player);
            });
        }
    }

    respawnPlayer(player) {
        const x = player.team === 'red' ? 100 : this.scale.width - 100;
        const y = Phaser.Math.Between(100, this.scale.height - 100);

        player.sprite.setPosition(x, y);
        player.health = 100;
        player.sprite.setVisible(true);
        player.graphics.setVisible(true);
        player.nameText.setVisible(true);
        player.healthBar.setVisible(true);
        player.healthBarBg.setVisible(true);

        this.updateHealthBar(player);
        this.createRespawnEffect(x, y);
    }

    updateHealthBar(player) {
        const width = (player.health / 100) * 40;
        player.healthBar.clear();

        if (player.health > 60) {
            player.healthBar.fillStyle(0x00ff00, 1);
        } else if (player.health > 30) {
            player.healthBar.fillStyle(0xffff00, 1);
        } else {
            player.healthBar.fillStyle(0xff0000, 1);
        }

        player.healthBar.fillRect(-20, -35, width, 5);
    }

    createHitEffect(x, y) {
        const effect = this.add.graphics();
        effect.fillStyle(0xff0000, 1);
        effect.fillCircle(x, y, 20);

        this.tweens.add({
            targets: effect,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 300,
            onComplete: () => effect.destroy()
        });
    }

    createRespawnEffect(x, y) {
        const effect = this.add.graphics();
        effect.lineStyle(3, 0xffffff, 1);
        effect.strokeCircle(x, y, 30);

        this.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => effect.destroy()
        });
    }

    updateScores() {
        this.redScoreText.setText(`Red Team: ${this.teamScores.red}`);
        this.blueScoreText.setText(`Blue Team: ${this.teamScores.blue}`);

        // Update personal score
        if (this.localPlayer) {
            const killBonus = this.localPlayer.team === 'red' ?
                this.teamScores.red : this.teamScores.blue;
            this.scoreText.setText(`Your Score: ${this.previousScore + killBonus}`);
        }
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
                    this.endGame();
                }
            },
            repeat: ROUND_DURATION.BATTLE - 1
        });
    }

    endGame() {
        // Determine winner
        const winner = this.teamScores.red > this.teamScores.blue ? 'Red' : 'Blue';
        const finalScore = this.previousScore +
            (this.localPlayer.team === winner.toLowerCase() ? 100 : 50);

        // Show final results
        const resultBg = this.add.graphics();
        resultBg.fillStyle(0x000000, 0.8);
        resultBg.fillRect(0, 0, this.scale.width, this.scale.height);

        const resultText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50,
            `GAME OVER!\n${winner} Team Wins!\n\nFinal Score: ${finalScore}`, {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);

        // Play again button
        this.time.delayedCall(5000, () => {
            location.reload(); // Reload to play again
        });
    }

    update() {
        if (!this.localPlayer || this.localPlayer.health <= 0) return;

        // Handle player movement
        const speed = PLAYER_CONFIG.speed;
        let velocityX = 0;
        let velocityY = 0;

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

        // Update graphics positions
        this.localPlayer.graphics.x = this.localPlayer.sprite.x;
        this.localPlayer.graphics.y = this.localPlayer.sprite.y;
        this.localPlayer.nameText.x = this.localPlayer.sprite.x;
        this.localPlayer.nameText.y = this.localPlayer.sprite.y - 45;
        this.localPlayer.healthBar.x = this.localPlayer.sprite.x + 20;
        this.localPlayer.healthBar.y = this.localPlayer.sprite.y + 35;
        this.localPlayer.healthBarBg.x = this.localPlayer.sprite.x + 20;
        this.localPlayer.healthBarBg.y = this.localPlayer.sprite.y + 35;

        // Update attack cooldown
        if (this.localPlayer.attackCooldown > 0) {
            this.localPlayer.attackCooldown--;
            if (this.localPlayer.attackCooldown === 0) {
                this.cooldownText.setText('');
            } else if (this.localPlayer.attackCooldown % 10 === 0) {
                this.cooldownText.setText(`Cooldown: ${Math.ceil(this.localPlayer.attackCooldown / 30)}s`);
            }
        }

        // Handle space/action button for shooting
        if ((this.spaceKey.isDown || inputState.action) && this.localPlayer.attackCooldown <= 0) {
            // Shoot forward
            const angle = this.localPlayer.sprite.rotation;
            const targetX = this.localPlayer.sprite.x + Math.cos(angle) * 200;
            const targetY = this.localPlayer.sprite.y + Math.sin(angle) * 200;
            this.createProjectile(this.localPlayer, targetX, targetY);
            this.localPlayer.attackCooldown = 30;
        }

        // Update projectile graphics positions
        this.projectiles.forEach(proj => {
            if (proj.graphics) {
                proj.graphics.x = proj.x;
                proj.graphics.y = proj.y;
            }
        });

        // Update all AI players
        this.playerSprites.forEach(player => {
            if (player.id !== this.localPlayer.id && player.health > 0) {
                if (player.attackCooldown > 0) {
                    player.attackCooldown--;
                }
                // Update their graphics
                player.graphics.x = player.sprite.x;
                player.graphics.y = player.sprite.y;
                player.nameText.x = player.sprite.x;
                player.nameText.y = player.sprite.y - 45;
                player.healthBar.x = player.sprite.x + 20;
                player.healthBar.y = player.sprite.y + 35;
                player.healthBarBg.x = player.sprite.x + 20;
                player.healthBarBg.y = player.sprite.y + 35;
            }
        });

        // Check projectile collisions
        this.projectiles.forEach(proj => {
            this.playerSprites.forEach(player => {
                if (proj.owner && player.team !== proj.owner.team && player.health > 0) {
                    const dist = Phaser.Math.Distance.Between(
                        proj.x, proj.y,
                        player.sprite.x, player.sprite.y
                    );
                    if (dist < 30) {
                        // Hit detected
                        this.onPlayerHit({ playerId: player.id, damage: 25 });
                        proj.graphics.destroy();
                        proj.destroy();
                        this.projectiles = this.projectiles.filter(p => p !== proj);

                        // Award points to shooter
                        if (proj.owner === this.localPlayer) {
                            this.previousScore += 5;
                            this.scoreText.setText(`Your Score: ${this.previousScore}`);
                        }
                    }
                }
            });
        });
    }
}