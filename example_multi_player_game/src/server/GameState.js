export class GameState {
    constructor(players) {
        this.players = new Map(players);
        this.objects = [];
        this.currentMode = 'race';
        this.teamScores = { red: 0, blue: 0 };
        this.coins = this.generateCoins();
        this.blocks = [];
        this.projectiles = [];

        this.initializePositions();
    }

    initializePositions() {
        let index = 0;
        this.players.forEach(player => {
            player.x = 100 + (index % 4) * 150;
            player.y = 100 + Math.floor(index / 4) * 100;
            player.vx = 0;
            player.vy = 0;
            index++;
        });
    }

    generateCoins() {
        const coins = [];
        for (let i = 0; i < 20; i++) {
            coins.push({
                id: i,
                x: Math.random() * 800,
                y: Math.random() * 600,
                collected: false
            });
        }
        return coins;
    }

    updatePlayerInput(playerId, input) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Update player position based on input
        if (input.x !== undefined) player.x = input.x;
        if (input.y !== undefined) player.y = input.y;
        if (input.vx !== undefined) player.vx = input.vx;
        if (input.vy !== undefined) player.vy = input.vy;

        // Check collisions based on current mode
        if (this.currentMode === 'race') {
            this.checkCoinCollisions(player);
        }
    }

    checkCoinCollisions(player) {
        this.coins.forEach(coin => {
            if (!coin.collected) {
                const dist = Math.sqrt(
                    Math.pow(player.x - coin.x, 2) +
                    Math.pow(player.y - coin.y, 2)
                );

                if (dist < 30) {
                    coin.collected = true;
                    player.score += 10;
                }
            }
        });
    }

    handleAction(playerId, action, data) {
        const player = this.players.get(playerId);
        if (!player) return null;

        switch (action) {
            case 'collectCoin':
                return this.collectCoin(player, data.coinId);

            case 'placeBlock':
                return this.placeBlock(player, data.x, data.y, data.type);

            case 'shoot':
                return this.createProjectile(player, data.angle, data.x, data.y);

            case 'useBoost':
                return this.activateBoost(player);

            default:
                return null;
        }
    }

    collectCoin(player, coinId) {
        if (this.coins[coinId] && !this.coins[coinId].collected) {
            this.coins[coinId].collected = true;
            player.score += 10;
            return { playerId: player.id, coinId, score: player.score };
        }
        return null;
    }

    placeBlock(player, x, y, type) {
        const block = {
            x,
            y,
            type,
            owner: player.id
        };
        this.blocks.push(block);
        player.score += 5;
        return { playerId: player.id, x, y, type };
    }

    createProjectile(player, angle, x, y) {
        const projectile = {
            id: Date.now(),
            owner: player.id,
            team: player.team,
            x,
            y,
            angle,
            speed: 10,
            damage: 25
        };
        this.projectiles.push(projectile);
        return { playerId: player.id, projectile };
    }

    activateBoost(player) {
        player.powerUps.push({
            type: 'speed_boost',
            endTime: Date.now() + 3000
        });
        return { playerId: player.id, powerUp: 'speed_boost' };
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    getState() {
        return {
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                username: p.username,
                x: p.x,
                y: p.y,
                score: p.score,
                health: p.health,
                team: p.team
            })),
            objects: this.currentMode === 'race' ? this.coins :
                    this.currentMode === 'build' ? this.blocks :
                    this.projectiles,
            teamScores: this.teamScores,
            mode: this.currentMode
        };
    }

    getScores() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id,
            username: p.username,
            score: p.score
        })).sort((a, b) => b.score - a.score);
    }

    getFinalScores() {
        const scores = this.getScores();
        return {
            winner: scores[0],
            scores,
            teamScores: this.teamScores
        };
    }

    setMode(mode) {
        this.currentMode = mode;

        if (mode === 'race') {
            this.coins = this.generateCoins();
        } else if (mode === 'build') {
            this.blocks = [];
        } else if (mode === 'battle') {
            this.projectiles = [];
            // Reset player health
            this.players.forEach(p => p.health = 100);
        }
    }

    update(deltaTime) {
        // Update projectile positions
        this.projectiles = this.projectiles.filter(proj => {
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;

            // Check collisions with players
            let hit = false;
            this.players.forEach(player => {
                if (player.id !== proj.owner && player.team !== proj.team) {
                    const dist = Math.sqrt(
                        Math.pow(player.x - proj.x, 2) +
                        Math.pow(player.y - proj.y, 2)
                    );

                    if (dist < 30) {
                        player.health -= proj.damage;
                        if (player.health <= 0) {
                            player.health = 0;
                            this.teamScores[proj.team === 'red' ? 'red' : 'blue'] += 10;
                        }
                        hit = true;
                    }
                }
            });

            // Remove if hit or out of bounds
            return !hit && proj.x > 0 && proj.x < 1000 && proj.y > 0 && proj.y < 800;
        });

        // Update power-ups
        const now = Date.now();
        this.players.forEach(player => {
            player.powerUps = player.powerUps.filter(p => p.endTime > now);
        });
    }
}