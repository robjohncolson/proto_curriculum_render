Hybrid Party Battle
Overview
Hybrid Party Battle is a browser-based multiplayer game designed for up to 16 players (e.g., a whole class on school laptops). It combines elements from racing, building (Minecraft-inspired), and strategy/sports (RTS/NBA2K/Madden-inspired) into a multi-round party arena. Players compete in teams or individually across rotating rounds, accumulating points for an overall winner. The game emphasizes fun, short sessions (10-20 mins), and real-time collaboration/competition without installations—runs entirely in the web browser.
Key goals:

Fun for All Interests: Blend genres to appeal to sports sims, racing, building, and strategy fans.
Scalable Multiplayer: Supports 16 players via lobbies, with team-based modes to manage chaos.
Lightweight Perf: Optimized for low-end school laptops using HTML5 Canvas and JS libraries.
Tech Stack: Vercel (frontend hosting), Supabase (auth, database, realtime signaling/lobbies), Railway (backend compute for WebSockets/game logic).

Game Structure
Core Mechanics

Lobby System: Players join via shareable code (Supabase Realtime). Up to 16 players, auto-split into teams (e.g., 4 teams of 4).
Multi-Round Format:

Round 1: Race Mode – Quick dash to objectives (e.g., collect items on a track). Real-time movement syncing.
Round 2: Build Mode – Collaborative/destructive building on a shared grid (place blocks, create structures/defenses).
Round 3: Battle Mode – Team skirmish with simple units/abilities (attack, defend objectives).
Rounds rotate randomly or by vote. Points awarded per round based on performance (e.g., fastest racer, strongest build, most kills).


Win Condition: Highest team/individual score after 3-5 rounds. Tiebreakers via sudden-death mini-games.
Features: Chat, spectator mode, power-ups, AI bots for uneven numbers. Persistent profiles/scores via Supabase.

Tech Architecture

Frontend (Vercel): React/Vanilla JS app in src/ or root. Use Canvas for rendering (e.g., via Phaser.js for game loops/physics). Handle UI for lobbies, rounds, and HUD.
Backend (Railway): Node.js/Express with Socket.io for real-time sync (player inputs, state broadcasts). Authoritative server for anti-cheat (validate moves, resolve combats).
Database (Supabase): Store user data, game sessions, leaderboards. Use Realtime for lobby signaling and non-critical updates (e.g., chat).
Multiplayer Implementation:

WebSockets (primary) for 16-player scale—server broadcasts at 20-30Hz.
Fallback P2P via WebRTC for small subgroups if latency is low.


Directories:

/public: Static assets (images, sounds).
/src: JS modules (e.g., game.js for core loop, network.js for sockets, rounds/ for mode-specific logic).
/server: Backend code (if local dev; deploy to Railway).


Dependencies: Phaser.js (game framework), Socket.io-client (networking), Supabase JS SDK.

Development Setup

Clone repo: git clone [repo-url].
Install deps: npm install.
Set env vars: Supabase URL/key, Railway API details.
Run locally: npm start (serves index.html, connects to dev backend).
Deploy: Push to Vercel for frontend; deploy backend to Railway.

Roadmap

MVP: Basic lobby + one round type (race).
Next: Add build/battle rounds, scoring, UI polish.
Future: Custom modes, mobile support, teacher admin tools (e.g., reset games).

Contributions welcome—focus on browser compatibility and low latency. For questions, open an issue.