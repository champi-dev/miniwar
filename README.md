# VoxelWars - 2D Multiplayer Shooter

A lightweight, browser-based 2D top-down shooter where players join a single shared arena, compete in real-time combat, and climb the leaderboard.

## Technology Stack

### Frontend
- React 18 with TypeScript
- HTML5 Canvas for rendering
- Zustand for state management
- Socket.io-client for real-time communication
- Vite for fast development
- Tailwind CSS for styling

### Backend
- Node.js with TypeScript
- Express.js server
- Socket.io for WebSocket communication
- 60 TPS game loop

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies for all workspaces:
```bash
npm install
```

2. Start the development servers:

**Option 1: Start both servers together**
```bash
npm run dev
```

**Option 2: Start servers separately**

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm run dev
```

### Accessing the Game

- Client: http://localhost:5173
- Server: http://localhost:3001

## Game Controls

- **WASD** - Move your character
- **Mouse** - Aim your weapon
- **Left Click** - Shoot
- **TAB** - Toggle leaderboard

## Project Structure

```
voxelwars/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── UI/        # UI components (HUD, Leaderboard, StartScreen)
│   │   │   ├── Game.tsx   # Main game component
│   │   │   └── Canvas.tsx # Canvas renderer
│   │   ├── game/          # Game logic
│   │   │   ├── renderer.ts        # Canvas drawing
│   │   │   ├── input.ts           # Input handling
│   │   │   ├── interpolation.ts   # Smooth movement
│   │   │   └── particles.ts       # Effects system
│   │   ├── network/       # Socket.io client
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── game/          # Game engine
│   │   │   ├── GameEngine.ts      # Main game loop
│   │   │   ├── Player.ts          # Player entity
│   │   │   ├── Bullet.ts          # Bullet entity
│   │   │   ├── World.ts           # World state
│   │   │   ├── Physics.ts         # Collision detection
│   │   │   └── Terrain.ts         # Map generation
│   │   ├── network/       # Socket.io server
│   │   ├── services/      # Services (Leaderboard)
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── shared/                # Shared types between client/server
    └── types/
        └── index.ts       # Common interfaces
```

## Game Features

### Core Mechanics
- Real-time multiplayer combat
- 8-directional movement (WASD)
- Mouse-aim shooting
- Health system (100 HP)
- Respawn system (3 seconds)
- Scoring (+10 per kill, -5 on death)

### Terrain Elements
- **Walls**: Solid obstacles that block movement and bullets
- **Crates**: Destructible cover (50 HP)
- **Bushes**: Visual cover (semi-transparent, bullets pass through)

### Visual Features
- Top-down 2D perspective
- Minimalist geometric shapes
- Color-coded players (unique hue per player)
- Health bars above players
- Minimap in corner
- Bullet trails and effects

### Multiplayer Features
- Real-time synchronization
- Client-side prediction
- Server-authoritative physics
- Interpolation for smooth rendering
- Live leaderboard (top 10 players)
- Player count display

## Building for Production

### Build both client and server:
```bash
npm run build
```

### Build separately:

**Client:**
```bash
cd client
npm run build
```

**Server:**
```bash
cd server
npm run build
npm start
```

## Environment Variables

### Client (.env)
```
VITE_SERVER_URL=http://localhost:3001
```

### Server (.env)
```
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## Development Roadmap

### Phase 1: Core Infrastructure ✅
- Setup monorepo with client/server
- WebSocket connection established
- Basic player join/disconnect
- Canvas rendering

### Phase 2: Basic Gameplay ✅
- Player movement (WASD)
- Player shooting (mouse)
- Bullet physics
- Collision detection
- Health/damage system

### Phase 3: Multiplayer Sync ✅
- Client-side prediction
- Server reconciliation
- Interpolation for remote players

### Phase 4: Terrain & World ✅
- Generate static map
- Walls, crates, bushes
- Destructible objects
- Collision with terrain

### Phase 5: Polish & UI ✅
- Leaderboard implementation
- HUD (health, score)
- Death/respawn animations
- Minimap

### Phase 6: Future Enhancements
- Particle effects for impacts
- Audio feedback
- Power-ups (health, speed boost)
- Multiple game modes
- Persistent stats with Redis

## Performance Targets

- Client FPS: 60 (target) / 45 (minimum)
- Server TPS: 60 (target) / 30 (minimum)
- Network latency: <50ms (target) / <150ms (maximum)
- Max players per room: 30 (target) / 50 (maximum)
- Bundle size (gzipped): <150KB (target) / <300KB (maximum)
- Initial load time: <2s (target) / <4s (maximum)

## Contributing

This is a learning project following the technical specification in CLAUDE.md.

## License

MIT
