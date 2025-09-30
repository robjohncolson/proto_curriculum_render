import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import { RaceScene } from './scenes/RaceScene.js';
import { BuildScene } from './scenes/BuildScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { GameManager } from './GameManager.js';
import { AuthManager } from './utils/AuthManager.js';
import { NetworkManager } from './utils/NetworkManager.js';

class Game {
    constructor() {
        this.authManager = new AuthManager();
        this.networkManager = new NetworkManager();
        this.gameManager = new GameManager(this.authManager, this.networkManager);

        this.setupMenuHandlers();
        this.initGame();
    }

    setupMenuHandlers() {
        // Main menu handlers
        document.getElementById('quick-play').addEventListener('click', () => {
            const username = document.getElementById('username').value || 'Guest' + Math.floor(Math.random() * 10000);
            this.startQuickPlay(username);
        });

        document.getElementById('create-room').addEventListener('click', () => {
            const username = document.getElementById('username').value || 'Guest' + Math.floor(Math.random() * 10000);
            this.createRoom(username);
        });

        document.getElementById('join-room').addEventListener('click', () => {
            this.showRoomMenu();
        });

        document.getElementById('login-btn').addEventListener('click', () => {
            this.showAuthMenu();
        });

        // Auth menu handlers
        document.getElementById('register').addEventListener('click', () => {
            this.handleRegister();
        });

        document.getElementById('signin').addEventListener('click', () => {
            this.handleSignIn();
        });

        document.getElementById('back-menu').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Room menu handlers
        document.getElementById('join-room-confirm').addEventListener('click', () => {
            this.joinRoomWithCode();
        });

        document.getElementById('back-main').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Touch controls
        this.setupTouchControls();
    }

    setupTouchControls() {
        const controls = {
            'touch-left': 'left',
            'touch-right': 'right',
            'touch-up': 'up',
            'touch-down': 'down',
            'touch-action': 'action'
        };

        Object.entries(controls).forEach(([id, action]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.gameManager.handleInput(action, true);
                });
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.gameManager.handleInput(action, false);
                });
                button.addEventListener('mousedown', () => {
                    this.gameManager.handleInput(action, true);
                });
                button.addEventListener('mouseup', () => {
                    this.gameManager.handleInput(action, false);
                });
            }
        });
    }

    async startQuickPlay(username) {
        this.showLoading();
        this.gameManager.setUsername(username);

        try {
            await this.networkManager.quickMatch(username);
            this.startGame();
        } catch (error) {
            this.showError('Failed to find match: ' + error.message);
        }
    }

    async createRoom(username) {
        this.showLoading();
        this.gameManager.setUsername(username);

        try {
            const roomCode = await this.networkManager.createRoom(username);
            this.showMessage(`Room created! Code: ${roomCode}`, 'success');
            this.startGame();
        } catch (error) {
            this.showError('Failed to create room: ' + error.message);
        }
    }

    async joinRoomWithCode() {
        const roomCode = document.getElementById('room-code').value.toUpperCase();
        const username = document.getElementById('username').value || 'Guest' + Math.floor(Math.random() * 10000);

        if (roomCode.length !== 6) {
            this.showError('Room code must be 6 characters');
            return;
        }

        this.showLoading();
        this.gameManager.setUsername(username);

        try {
            await this.networkManager.joinRoom(roomCode, username);
            this.startGame();
        } catch (error) {
            this.showError('Failed to join room: ' + error.message);
        }
    }

    async handleRegister() {
        const username = document.getElementById('auth-username').value;
        const pin = document.getElementById('auth-pin').value;

        if (!username || username.length < 3) {
            this.showError('Username must be at least 3 characters');
            return;
        }

        if (!pin || pin.length !== 4) {
            this.showError('PIN must be exactly 4 digits');
            return;
        }

        try {
            await this.authManager.register(username, pin);
            this.showMessage('Registration successful! You can now sign in.', 'success');
            document.getElementById('auth-username').value = '';
            document.getElementById('auth-pin').value = '';
        } catch (error) {
            this.showError('Registration failed: ' + error.message);
        }
    }

    async handleSignIn() {
        const username = document.getElementById('auth-username').value;
        const pin = document.getElementById('auth-pin').value;

        if (!username || !pin) {
            this.showError('Please enter username and PIN');
            return;
        }

        try {
            const user = await this.authManager.signIn(username, pin);
            this.gameManager.setAuthenticatedUser(user);
            this.showMessage('Signed in successfully! Power-ups unlocked! 🚀', 'success');
            document.getElementById('username').value = username;
            this.showMainMenu();
        } catch (error) {
            this.showError('Sign in failed: ' + error.message);
        }
    }

    showMainMenu() {
        document.getElementById('main-menu').style.display = 'block';
        document.getElementById('auth-menu').style.display = 'none';
        document.getElementById('room-menu').style.display = 'none';
        this.clearMessage();
    }

    showAuthMenu() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('auth-menu').style.display = 'block';
        document.getElementById('room-menu').style.display = 'none';
        this.clearMessage();
    }

    showRoomMenu() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('auth-menu').style.display = 'none';
        document.getElementById('room-menu').style.display = 'block';
        this.clearMessage();
    }

    showLoading() {
        document.getElementById('menu-container').classList.add('hidden');
        document.getElementById('loading').style.display = 'block';
    }

    showError(message) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = 'error-message';
        messageEl.style.display = 'block';
    }

    showMessage(message, type = 'error') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = type === 'success' ? 'success-message' : 'error-message';
        messageEl.style.display = 'block';
    }

    clearMessage() {
        document.getElementById('message').style.display = 'none';
    }

    startGame() {
        document.getElementById('menu-container').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('game-container').classList.add('active');

        if (this.phaserGame) {
            this.phaserGame.destroy(true);
        }

        this.initPhaserGame();
    }

    initGame() {
        // Check for saved session
        const savedSession = this.authManager.getSavedSession();
        if (savedSession) {
            document.getElementById('username').value = savedSession.username;
            this.gameManager.setAuthenticatedUser(savedSession);
        }
    }

    initPhaserGame() {
        const config = {
            ...GAME_CONFIG,
            scene: [MenuScene, LobbyScene, RaceScene, BuildScene, BattleScene],
            callbacks: {
                preBoot: () => {
                    // Pass managers to scenes via registry
                    if (this.phaserGame) {
                        this.phaserGame.registry.set('authManager', this.authManager);
                        this.phaserGame.registry.set('networkManager', this.networkManager);
                        this.phaserGame.registry.set('gameManager', this.gameManager);
                    }
                }
            }
        };

        this.phaserGame = new Phaser.Game(config);

        // Store managers in registry after game creation
        this.phaserGame.registry.set('authManager', this.authManager);
        this.phaserGame.registry.set('networkManager', this.networkManager);
        this.phaserGame.registry.set('gameManager', this.gameManager);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});