import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom } from './GameRoom.js';
import { GameState } from './GameState.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173', '*'],
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Game state management
const rooms = new Map();
const playerRooms = new Map();

// Generate room codes
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Find or create room for quick match
function findAvailableRoom() {
    for (const [code, room] of rooms.entries()) {
        if (room.playerCount < 16 && !room.isPrivate && !room.gameStarted) {
            return code;
        }
    }
    // Create new public room if none available
    const code = generateRoomCode();
    const room = new GameRoom(code, false);
    rooms.set(code, room);
    return code;
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('quickMatch', ({ username }, callback) => {
        try {
            const roomCode = findAvailableRoom();
            const room = rooms.get(roomCode);

            const player = room.addPlayer(socket.id, username);
            socket.join(roomCode);
            playerRooms.set(socket.id, roomCode);

            // Notify others in room
            socket.to(roomCode).emit('playerJoined', player);

            callback({
                success: true,
                roomCode,
                playerId: socket.id,
                players: room.getPlayers()
            });

            // Start game if enough players
            if (room.playerCount >= 2 && !room.gameStarted) {
                setTimeout(() => {
                    startGame(roomCode);
                }, 3000);
            }
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('createRoom', ({ username }, callback) => {
        try {
            const roomCode = generateRoomCode();
            const room = new GameRoom(roomCode, true);

            const player = room.addPlayer(socket.id, username);
            rooms.set(roomCode, room);
            socket.join(roomCode);
            playerRooms.set(socket.id, roomCode);

            callback({
                success: true,
                roomCode,
                playerId: socket.id
            });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('joinRoom', ({ roomCode, username }, callback) => {
        try {
            const room = rooms.get(roomCode.toUpperCase());

            if (!room) {
                throw new Error('Room not found');
            }

            if (room.playerCount >= 16) {
                throw new Error('Room is full');
            }

            if (room.gameStarted) {
                throw new Error('Game already started');
            }

            const player = room.addPlayer(socket.id, username);
            socket.join(roomCode);
            playerRooms.set(socket.id, roomCode);

            // Notify others in room
            socket.to(roomCode).emit('playerJoined', player);

            callback({
                success: true,
                roomCode,
                playerId: socket.id,
                players: room.getPlayers()
            });

            // Start game if enough players
            if (room.playerCount >= 2 && !room.gameStarted) {
                setTimeout(() => {
                    startGame(roomCode);
                }, 3000);
            }
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('playerInput', (data) => {
        const roomCode = playerRooms.get(socket.id);
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room && room.gameState) {
                room.gameState.updatePlayerInput(socket.id, data.input);
            }
        }
    });

    socket.on('playerAction', (data) => {
        const roomCode = playerRooms.get(socket.id);
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room && room.gameState) {
                const result = room.gameState.handleAction(socket.id, data.action, data.data);

                // Broadcast action results
                if (result) {
                    io.to(roomCode).emit(data.action + 'Result', result);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        const roomCode = playerRooms.get(socket.id);
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room) {
                room.removePlayer(socket.id);
                socket.to(roomCode).emit('playerLeft', socket.id);

                // Clean up empty rooms
                if (room.playerCount === 0) {
                    rooms.delete(roomCode);
                }
            }
            playerRooms.delete(socket.id);
        }
    });
});

function startGame(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || room.gameStarted) return;

    room.startGame();

    // Start with race mode
    io.to(roomCode).emit('roundStart', {
        mode: 'race',
        duration: 120
    });

    // Start game loop
    const gameLoop = setInterval(() => {
        if (!rooms.has(roomCode)) {
            clearInterval(gameLoop);
            return;
        }

        const state = room.gameState.getState();
        io.to(roomCode).emit('gameStateUpdate', state);
    }, 1000 / 30); // 30 FPS

    // Schedule round transitions
    setTimeout(() => {
        io.to(roomCode).emit('roundEnd', room.gameState.getScores());

        setTimeout(() => {
            io.to(roomCode).emit('roundStart', {
                mode: 'build',
                duration: 180
            });
        }, 3000);
    }, 120000); // 2 minutes for race

    setTimeout(() => {
        io.to(roomCode).emit('roundEnd', room.gameState.getScores());

        setTimeout(() => {
            io.to(roomCode).emit('roundStart', {
                mode: 'battle',
                duration: 150
            });
        }, 3000);
    }, 303000); // 2 min race + 3 sec break + 3 min build

    setTimeout(() => {
        io.to(roomCode).emit('gameEnd', room.gameState.getFinalScores());
        clearInterval(gameLoop);
        room.endGame();
    }, 456000); // Total game time
}

server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});