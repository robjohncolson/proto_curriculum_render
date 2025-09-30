# Hybrid Party Battle - Quick Start Guide

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Start the Game

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Start the frontend** (in one terminal):
```bash
npm run dev
```
The game will be available at http://localhost:3000

3. **Start the backend server** (in another terminal):
```bash
node src/server/index.js
```
The WebSocket server will run on port 3001

## 🎮 How to Play

### Quick Play (Anonymous)
1. Open http://localhost:3000
2. Enter an optional username
3. Click "Quick Play" to join a public game

### Create/Join Private Room
1. Click "Create Room" to get a 6-digit code
2. Share the code with friends
3. Friends click "Join Room" and enter the code

### Register for Power-ups
1. Click "Login / Register"
2. Create a username and 4-digit PIN
3. Registered users get access to special power-ups!

## 🎯 Game Modes

### Round 1: Race Mode (2 minutes)
- Collect golden coins
- Navigate around obstacles
- Each coin = 10 points

### Round 2: Build Mode (3 minutes)
- Place blocks strategically
- Choose from: Wall, Floor, Trap, Boost blocks
- Build structures for the battle round

### Round 3: Battle Mode (2.5 minutes)
- Team-based combat (Red vs Blue)
- Shoot projectiles at enemies
- Use structures from Build mode as cover
- Respawn after 3 seconds if eliminated

## 🎮 Controls

### Desktop
- **Movement**: Arrow keys or WASD
- **Action**: Space or Mouse click
  - Race: Speed boost (if available)
  - Build: Place block
  - Battle: Shoot projectile

### Mobile
- **Movement**: Touch control pad
- **Action**: Lightning button

## 📱 Cross-Device Play

- Your username persists across devices via localStorage
- Registered users can login from any device
- Game automatically adapts to screen size
- Touch controls appear on mobile devices

## 🏆 Scoring

- **Race Mode**: 10 points per coin
- **Build Mode**: 3-10 points per block placed
- **Battle Mode**: 5 points per hit, 10 points per elimination
- **Win Bonus**: 100 points for winning team

## 🔧 Development

### Project Structure
```
src/
├── client/          # Frontend (Phaser.js game)
│   ├── scenes/      # Game scenes (Race, Build, Battle)
│   ├── utils/       # Auth & Network managers
│   └── main.js      # Entry point
├── server/          # Backend (Socket.io server)
│   ├── GameRoom.js  # Room management
│   ├── GameState.js # Game logic
│   └── index.js     # Server entry
```

### Environment Variables (for production)
Create a `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
RAILWAY_API_URL=your_railway_backend_url
```

## 🚢 Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables

### Backend (Railway)
1. Create new project on Railway
2. Connect GitHub repo
3. Set start command: `node src/server/index.js`
4. Railway will auto-detect port from environment

### Database (Supabase)
1. Create new Supabase project
2. Use provided URL and anon key
3. Enable Realtime for lobby management
4. Set up auth tables for persistent accounts

## 🐛 Troubleshooting

- **Can't connect to server**: Make sure both frontend and backend are running
- **Game doesn't load**: Check browser console for errors
- **Touch controls not showing**: Refresh page on mobile device
- **Room code not working**: Codes are case-sensitive (all uppercase)

## 📝 Notes

- Game currently works locally without Supabase
- Auth data stored in localStorage for MVP
- For production, integrate Supabase for persistence
- WebSocket fallback to polling if connection fails

Enjoy the game! 🎮