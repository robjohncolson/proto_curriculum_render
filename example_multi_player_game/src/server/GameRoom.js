import { GameState } from './GameState.js';

export class GameRoom {
    constructor(code, isPrivate = false) {
        this.code = code;
        this.isPrivate = isPrivate;
        this.players = new Map();
        this.gameState = null;
        this.gameStarted = false;
        this.currentRound = 0;
        this.maxPlayers = 16;
    }

    addPlayer(id, username) {
        if (this.players.size >= this.maxPlayers) {
            throw new Error('Room is full');
        }

        const player = {
            id,
            username: username || `Guest${Math.floor(Math.random() * 10000)}`,
            team: this.assignTeam(),
            score: 0,
            x: Math.random() * 800,
            y: Math.random() * 600,
            health: 100,
            powerUps: []
        };

        this.players.set(id, player);
        return player;
    }

    removePlayer(id) {
        this.players.delete(id);
        if (this.gameState) {
            this.gameState.removePlayer(id);
        }
    }

    assignTeam() {
        const teams = { red: 0, blue: 0 };

        this.players.forEach(player => {
            if (player.team === 'red') teams.red++;
            else if (player.team === 'blue') teams.blue++;
        });

        return teams.red <= teams.blue ? 'red' : 'blue';
    }

    startGame() {
        if (this.gameStarted) return;

        this.gameStarted = true;
        this.gameState = new GameState(this.players);
        this.currentRound = 1;
    }

    endGame() {
        this.gameStarted = false;
        this.gameState = null;
        this.currentRound = 0;
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    get playerCount() {
        return this.players.size;
    }
}