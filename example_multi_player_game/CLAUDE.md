# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based multiplayer party game supporting up to 16 players, designed to run on school laptops without installation. The game features three rotating game modes (Race, Build, Battle) with WebSocket-based real-time networking.

**Current Status**: Early planning stage with HTML mockup. No actual implementation exists yet.

## Tech Stack

- **Frontend**: HTML5 Canvas, Phaser.js (planned), Socket.io-client, Supabase JS SDK
- **Backend**: Node.js/Express with Socket.io (planned for Railway deployment)
- **Database**: Supabase for auth, database, and realtime signaling
- **Deployment**: Frontend on Vercel, Backend on Railway

## Development Commands

Since the project lacks package.json, initial setup required:
```bash
# Initialize project
npm init -y

# Install core dependencies (when ready to implement)
npm install phaser socket.io-client @supabase/supabase-js
npm install --save-dev express socket.io nodemon

# Development (after setup)
npm start  # Will serve index.html and connect to dev backend
```

## Architecture

### Game Flow
1. **Lobby System**: Players join via shareable codes
2. **Multi-Round Format**:
   - Round 1: Race Mode - Real-time movement and objectives
   - Round 2: Build Mode - Collaborative/destructive building
   - Round 3: Battle Mode - Team-based skirmishes
3. **Scoring**: Points accumulate across all rounds

### Planned Structure
```
/src
  /client
    game.js       # Core game loop and Phaser setup
    network.js    # Socket.io client and networking
    /rounds       # Individual round logic
  /server
    index.js      # Express + Socket.io server
    gameState.js  # Authoritative game state
/public           # Static assets (sprites, sounds)
```

### Networking Architecture
- **Primary**: WebSocket via Socket.io (20-30Hz updates)
- **Fallback**: WebRTC for small groups (<6 players)
- **Server Authority**: All game state validated server-side for anti-cheat

## Key Implementation Considerations

1. **Canvas Rendering**: Currently set to 800x600 in index.html. Game must scale responsively.
2. **Team Management**: Players auto-split into teams to manage 16-player chaos.
3. **Performance**: Target 30 FPS on low-end hardware (school laptops).
4. **Network Optimization**: Implement delta compression for position updates.

## Current Files

- `index.html`: Basic game mockup with canvas and placeholder controls
- `README.md`: Comprehensive project documentation and technical specs