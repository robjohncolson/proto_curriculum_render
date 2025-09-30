import { GAME_MODES, ROUND_DURATION } from './config.js';

export class GameManager {
    constructor(authManager, networkManager) {
        this.authManager = authManager;
        this.networkManager = networkManager;

        this.currentUser = null;
        this.currentRoom = null;
        this.players = new Map();
        this.currentMode = null;
        this.score = 0;
        this.team = null;
        this.roundTimer = null;
        this.inputState = {
            left: false,
            right: false,
            up: false,
            down: false,
            action: false
        };

        this.powerUps = new Set();
        this.isAuthenticated = false;

        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        this.networkManager.on('playerJoined', (player) => {
            this.players.set(player.id, player);
            this.updateHUD();
        });

        this.networkManager.on('playerLeft', (playerId) => {
            this.players.delete(playerId);
            this.updateHUD();
        });

        this.networkManager.on('gameStateUpdate', (state) => {
            this.updateGameState(state);
        });

        this.networkManager.on('roundStart', (mode, duration) => {
            this.startRound(mode, duration);
        });

        this.networkManager.on('roundEnd', (scores) => {
            this.endRound(scores);
        });

        this.networkManager.on('powerUpCollected', (powerUp) => {
            if (this.isAuthenticated) {
                this.activatePowerUp(powerUp);
            }
        });
    }

    setUsername(username) {
        this.currentUser = {
            username,
            id: this.generateUserId(),
            isGuest: true
        };
        this.updateHUD();
    }

    setAuthenticatedUser(user) {
        this.currentUser = {
            ...user,
            isGuest: false
        };
        this.isAuthenticated = true;
        this.updateHUD();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    handleInput(action, isPressed) {
        this.inputState[action] = isPressed;

        // Send input to server
        this.networkManager.sendInput(this.inputState);

        // Handle special actions
        if (action === 'action' && isPressed) {
            this.handleAction();
        }
    }

    handleAction() {
        // Action depends on current game mode
        if (this.currentMode === GAME_MODES.BUILD) {
            this.placeBlock();
        } else if (this.currentMode === GAME_MODES.BATTLE) {
            this.attack();
        } else if (this.currentMode === GAME_MODES.RACE) {
            this.boost();
        }
    }

    placeBlock() {
        this.networkManager.sendAction('placeBlock', {
            x: this.currentUser.x,
            y: this.currentUser.y
        });
    }

    attack() {
        this.networkManager.sendAction('attack', {
            direction: this.getPlayerDirection()
        });
    }

    boost() {
        if (this.powerUps.has('speed_boost')) {
            this.networkManager.sendAction('useBoost');
        }
    }

    activatePowerUp(powerUp) {
        this.powerUps.add(powerUp.type);

        setTimeout(() => {
            this.powerUps.delete(powerUp.type);
        }, powerUp.duration);

        // Visual feedback
        this.showPowerUpNotification(powerUp);
    }

    showPowerUpNotification(powerUp) {
        // This will be handled by the Phaser scenes
        console.log(`Power-up activated: ${powerUp.type}`);
    }

    startRound(mode, duration) {
        this.currentMode = mode;
        this.updateRoundInfo(mode, duration);
        this.startTimer(duration);
    }

    endRound(scores) {
        clearInterval(this.roundTimer);
        this.updateScores(scores);
    }

    startTimer(duration) {
        let timeLeft = duration;

        this.roundTimer = setInterval(() => {
            timeLeft--;
            this.updateTimer(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(this.roundTimer);
            }
        }, 1000);
    }

    updateGameState(state) {
        // Update player positions
        state.players.forEach(playerData => {
            if (this.players.has(playerData.id)) {
                const player = this.players.get(playerData.id);
                Object.assign(player, playerData);
            }
        });

        // Update game objects based on mode
        if (state.objects) {
            this.updateGameObjects(state.objects);
        }
    }

    updateGameObjects(objects) {
        // This will be handled by the Phaser scenes
        // Each scene will interpret objects differently
    }

    updateHUD() {
        if (this.currentUser) {
            document.getElementById('player-name').textContent =
                this.currentUser.username + (this.isAuthenticated ? ' ⭐' : '');
            document.getElementById('score').textContent = this.score;
        }
    }

    updateRoundInfo(mode, duration) {
        const modeNames = {
            [GAME_MODES.RACE]: '🏃 Race Mode',
            [GAME_MODES.BUILD]: '🔨 Build Mode',
            [GAME_MODES.BATTLE]: '⚔️ Battle Mode'
        };

        document.getElementById('round-info').textContent = modeNames[mode] || 'Waiting...';
    }

    updateTimer(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('timer').textContent =
            `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    updateScores(scores) {
        const myScore = scores.find(s => s.id === this.currentUser.id);
        if (myScore) {
            this.score = myScore.score;
            this.updateHUD();
        }
    }

    getPlayerDirection() {
        if (this.inputState.up) return 'up';
        if (this.inputState.down) return 'down';
        if (this.inputState.left) return 'left';
        if (this.inputState.right) return 'right';
        return 'none';
    }

    getInputState() {
        return { ...this.inputState };
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    getCurrentMode() {
        return this.currentMode;
    }

    getScore() {
        return this.score;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    hasPowerUp(type) {
        return this.powerUps.has(type);
    }
}