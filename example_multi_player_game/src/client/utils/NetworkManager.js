import { io } from 'socket.io-client';
import { NETWORK_CONFIG } from '../config.js';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.playerId = null;
        this.listeners = new Map();
        this.isConnected = false;
        this.lastUpdateTime = 0;
        this.updateInterval = 1000 / NETWORK_CONFIG.updateRate;
    }

    async connect(serverUrl = 'http://localhost:3001') {
        return new Promise((resolve, reject) => {
            // For development, use localhost
            // For production, this will be your Railway URL
            this.socket = io(serverUrl, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                this.isConnected = true;
                console.log('Connected to server');
                resolve();
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                console.log('Disconnected from server');
                this.emit('disconnected');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.setupSocketListeners();

            // Timeout connection attempt
            setTimeout(() => {
                if (!this.isConnected) {
                    reject(new Error('Connection timeout'));
                }
            }, 5000);
        });
    }

    setupSocketListeners() {
        // Room events
        this.socket.on('roomCreated', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this.emit('roomCreated', data);
        });

        this.socket.on('roomJoined', (data) => {
            this.roomCode = data.roomCode;
            this.playerId = data.playerId;
            this.emit('roomJoined', data);
        });

        this.socket.on('playerJoined', (player) => {
            this.emit('playerJoined', player);
        });

        this.socket.on('playerLeft', (playerId) => {
            this.emit('playerLeft', playerId);
        });

        // Game state updates
        this.socket.on('gameStateUpdate', (state) => {
            this.emit('gameStateUpdate', state);
        });

        this.socket.on('roundStart', (data) => {
            this.emit('roundStart', data.mode, data.duration);
        });

        this.socket.on('roundEnd', (scores) => {
            this.emit('roundEnd', scores);
        });

        // Power-up events
        this.socket.on('powerUpSpawned', (powerUp) => {
            this.emit('powerUpSpawned', powerUp);
        });

        this.socket.on('powerUpCollected', (data) => {
            this.emit('powerUpCollected', data);
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Server error:', error);
            this.emit('error', error);
        });
    }

    async quickMatch(username) {
        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.socket.emit('quickMatch', { username }, (response) => {
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.playerId = response.playerId;
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    async createRoom(username) {
        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.socket.emit('createRoom', { username }, (response) => {
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.playerId = response.playerId;
                    resolve(response.roomCode);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    async joinRoom(roomCode, username) {
        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.socket.emit('joinRoom', { roomCode, username }, (response) => {
                if (response.success) {
                    this.roomCode = roomCode;
                    this.playerId = response.playerId;
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    sendInput(inputState) {
        // Throttle updates
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = now;

        if (this.socket && this.isConnected) {
            this.socket.emit('playerInput', {
                playerId: this.playerId,
                input: inputState,
                timestamp: now
            });
        }
    }

    sendAction(action, data = {}) {
        if (this.socket && this.isConnected) {
            this.socket.emit('playerAction', {
                playerId: this.playerId,
                action,
                data,
                timestamp: Date.now()
            });
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                callback(...args);
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.roomCode = null;
        this.playerId = null;
    }

    getRoomCode() {
        return this.roomCode;
    }

    getPlayerId() {
        return this.playerId;
    }

    isConnectedToServer() {
        return this.isConnected;
    }
}