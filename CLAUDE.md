- 2D Multiplayer Shooter - Complete Technical Specification
Executive Summary
A lightweight, browser-based 2D top-down shooter where players join a single shared arena, compete in real-time combat, and climb the leaderboard. Built for performance with WebSocket communication and HTML5 Canvas rendering.

Technology Stack
Frontend

Framework: React 18 with TypeScript
Rendering: HTML5 Canvas (native - no Pixi.js needed for performance)
State Management: Zustand (lightweight, ~1KB)
WebSocket Client: Socket.io-client
Build Tool: Vite
Styling: Tailwind CSS

Backend

Runtime: Node.js 20+
Framework: Express.js
WebSocket: Socket.io
Game Loop: Custom tick-based system (60 TPS)
Language: TypeScript

Deployment & Infrastructure

Hosting: Railway / Render (backend), Vercel (frontend)
Database: Redis (for leaderboard persistence) - optional
Environment: Docker-ready

Asset Generation (Optional)

Visual Assets: OpenAI DALL-E API for sprite generation
Fallback: SVG procedural generation or sprite sheets


System Architecture
┌─────────────────┐         WebSocket          ┌──────────────────┐
│                 │◄──────────────────────────►│                  │
│  React Client   │      Socket.io (WS)        │  Node.js Server  │
│  (Canvas Game)  │                            │  (Game Engine)   │
│                 │                            │                  │
└─────────────────┘                            └──────────────────┘
        │                                              │
        │                                              │
        ▼                                              ▼
┌─────────────────┐                          ┌──────────────────┐
│ Canvas Renderer │                          │   Redis Cache    │
│ Input Handler   │                          │  (Leaderboard)   │
└─────────────────┘                          └──────────────────┘

Game Design Specification
Core Mechanics

Movement: 8-directional WASD controls
Shooting: Mouse aim + click to shoot
Health System: 100 HP, respawn on death
Scoring: +10 points per kill, -5 on death
Map: Single 2000x2000px arena with obstacles

Terrain Elements

Walls: Solid obstacles (rectangles)
Crates: Destructible cover (50 HP each)
Bushes: Visual cover (semi-transparent)
Spawn Points: 4 corners of map

Visual Style

Top-down 2D perspective
Minimalist geometric shapes (circles for players, rectangles for terrain)
Color-coded players (unique hue per player)
Particle effects for bullets, explosions, damage


User Stories & Acceptance Criteria
Epic 1: Player Onboarding
US-1.1: As a new player, I want to enter a username so I can join the game

AC1: Username input screen appears on load
AC2: Username must be 3-16 characters
AC3: Player spawns immediately after entering valid username
AC4: Username displays above player character

US-1.2: As a player, I want to see game controls so I know how to play

AC1: Controls overlay shows on first join (WASD + Mouse)
AC2: Can dismiss overlay with ESC or click
AC3: Controls accessible via "?" button anytime


Epic 2: Core Gameplay
US-2.1: As a player, I want to move my character so I can navigate the arena

AC1: WASD keys move character at 200px/s
AC2: Movement stops when hitting walls/obstacles
AC3: Character rotation follows mouse cursor
AC4: Movement is smooth (60 FPS interpolation)

US-2.2: As a player, I want to shoot bullets so I can damage opponents

AC1: Left-click fires bullet towards mouse cursor
AC2: Fire rate: 1 bullet per 500ms (cooldown)
AC3: Bullets travel 600px/s for max 1000px
AC4: Bullets deal 20 damage on hit
AC5: Visual feedback: muzzle flash + bullet trail

US-2.3: As a player, I want to take damage and die so combat has consequences

AC1: Health bar displays above character (100 HP)
AC2: Screen flashes red when hit
AC3: Character dies at 0 HP with explosion animation
AC4: Respawn after 3 seconds at random spawn point
AC5: Death message shows "{killer} eliminated {victim}"

US-2.4: As a player, I want to use terrain strategically

AC1: Walls block bullets and movement
AC2: Crates block bullets, can be destroyed (3 hits)
AC3: Bushes provide visual cover but not bullet protection
AC4: Terrain renders under players (correct z-index)


Epic 3: Multiplayer Synchronization
US-3.1: As a player, I want to see other players in real-time

AC1: All players visible with unique colors
AC2: Other players' positions update <100ms latency
AC3: Usernames display above all characters
AC4: Player count shows in UI (e.g., "12 players online")

US-3.2: As a player, I want smooth gameplay without lag

AC1: Client-side prediction for own movement
AC2: Server reconciliation for authoritative positions
AC3: Interpolation for other players (smooth rendering)
AC4: Game maintains 60 FPS with 20+ players

US-3.3: As a player, I want to see combat actions from others

AC1: Other players' shots visible with bullet animations
AC2: Damage numbers appear when hitting enemies
AC3: Death animations play for all players


Epic 4: Scoring & Leaderboard
US-4.1: As a player, I want to see my score so I can track performance

AC1: Score displays in top-left corner
AC2: Score updates immediately on kill/death
AC3: K/D ratio shown next to score

US-4.2: As a player, I want to see the leaderboard so I can compare rankings

AC1: Live leaderboard shows top 10 players
AC2: Updates every 2 seconds
AC3: Current player highlighted if in top 10
AC4: Shows: Rank, Username, Kills, Deaths, Score
AC5: Leaderboard accessible via TAB key or UI button

US-4.3: As a player, I want persistent stats across sessions (optional)

AC1: Stats save when player disconnects
AC2: Stats load when player rejoins with same username
AC3: All-time leaderboard accessible from main menu


Epic 5: Visual Feedback & Polish
US-5.1: As a player, I want animations so the game feels alive

AC1: Bullet fire: muzzle flash (150ms)
AC2: Bullet impact: spark particles (300ms)
AC3: Death: explosion animation (500ms)
AC4: Damage: screen shake + red overlay

US-5.2: As a player, I want audio feedback (optional Phase 2)

AC1: Gunshot sound on fire
AC2: Hit confirmation sound
AC3: Death sound
AC4: Background ambient music (toggle on/off)

US-5.3: As a player, I want visual clarity in chaos

AC1: Own character has distinct outline/glow
AC2: Enemy bullets colored differently than own
AC3: Low health warning (HP < 30): pulsing red border
AC4: Minimap shows player positions (100x100px corner)


Technical Requirements
Performance Benchmarks
MetricTargetMaximumClient FPS6045Server TPS6030Network latency<50ms<150msMax players/room3050Bundle size (gzipped)<150KB<300KBInitial load time<2s<4s
Network Protocol (Socket.io Events)
Client → Server:
typescript'player:join' { username: string }
'player:move' { x: number, y: number, angle: number }
'player:shoot' { angle: number, timestamp: number }
'player:disconnect' { }
Server → Client:
typescript'game:init' { playerId: string, worldState: WorldState }
'game:update' { players: Player[], bullets: Bullet[], terrain: Terrain[] }
'player:hit' { playerId: string, damage: number, shooterId: string }
'player:death' { playerId: string, killerId: string }
'leaderboard:update' { entries: LeaderboardEntry[] }
Data Models
typescript// Player
interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  score: number;
  kills: number;
  deaths: number;
  color: string; // hex color
  isAlive: boolean;
  lastShot: number; // timestamp
}

// Bullet
interface Bullet {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  ownerId: string;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
}

// TerrainObject
interface TerrainObject {
  id: string;
  type: 'wall' | 'crate' | 'bush';
  x: number;
  y: number;
  width: number;
  height: number;
  health?: number; // for destructibles
  blocking: boolean;
}

// WorldState
interface WorldState {
  players: Map<string, Player>;
  bullets: Bullet[];
  terrain: TerrainObject[];
  worldSize: { width: number; height: number };
}

Game Loop Architecture
Server (Authoritative)
typescript// 60 TPS (Ticks Per Second)
const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

function gameLoop() {
  const now = Date.now();
  
  // 1. Process inputs
  processPlayerInputs();
  
  // 2. Update physics
  updatePlayerPositions();
  updateBullets();
  checkCollisions();
  
  // 3. Apply game rules
  processDamage();
  checkDeaths();
  updateScores();
  
  // 4. Broadcast state
  broadcastGameState();
  
  // 5. Schedule next tick
  setTimeout(gameLoop, TICK_INTERVAL);
}
Client (Prediction + Interpolation)
typescript// 60 FPS rendering
function renderLoop() {
  // 1. Client-side prediction for local player
  predictOwnMovement();
  
  // 2. Interpolate other players (render delay buffer)
  interpolateRemotePlayers();
  
  // 3. Render scene
  clearCanvas();
  renderTerrain();
  renderBullets();
  renderPlayers();
  renderUI();
  
  requestAnimationFrame(renderLoop);
}
```

---

## File Structure
```
project/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Game.tsx               # Main game component
│   │   │   ├── Canvas.tsx             # Canvas renderer
│   │   │   ├── UI/
│   │   │   │   ├── Leaderboard.tsx
│   │   │   │   ├── HUD.tsx            # Health, score, ammo
│   │   │   │   └── StartScreen.tsx    # Username input
│   │   ├── game/
│   │   │   ├── renderer.ts            # Canvas drawing logic
│   │   │   ├── input.ts               # Keyboard/mouse handlers
│   │   │   ├── interpolation.ts       # Smooth movement
│   │   │   └── particles.ts           # Effects system
│   │   ├── network/
│   │   │   └── socket.ts              # Socket.io client
│   │   ├── store/
│   │   │   └── gameStore.ts           # Zustand store
│   │   └── types/
│   │       └── game.types.ts          # Shared types
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── game/
│   │   │   ├── GameEngine.ts          # Main game loop
│   │   │   ├── Player.ts              # Player entity
│   │   │   ├── Bullet.ts              # Bullet entity
│   │   │   ├── World.ts               # World state manager
│   │   │   ├── Physics.ts             # Collision detection
│   │   │   └── Terrain.ts             # Map generation
│   │   ├── network/
│   │   │   └── SocketManager.ts       # Socket.io server
│   │   ├── services/
│   │   │   └── LeaderboardService.ts  # Redis/memory store
│   │   └── types/
│   │       └── game.types.ts          # Shared types
│   └── package.json
│
└── shared/
    └── types/
        └── index.ts                    # Common interfaces

Development Phases
Phase 1: Core Infrastructure (Week 1)

 Setup monorepo with client/server
 WebSocket connection established
 Basic player join/disconnect
 Empty canvas rendering

Phase 2: Basic Gameplay (Week 2)

 Player movement (WASD)
 Player shooting (mouse)
 Bullet physics
 Collision detection
 Health/damage system

Phase 3: Multiplayer Sync (Week 3)

 Client-side prediction
 Server reconciliation
 Interpolation for remote players
 Optimize network traffic

Phase 4: Terrain & World (Week 3-4)

 Generate static map
 Walls, crates, bushes
 Destructible objects
 Collision with terrain

Phase 5: Polish & UI (Week 4)

 Leaderboard implementation
 HUD (health, score)
 Death/respawn animations
 Particle effects
 Minimap

Phase 6: Optimization (Week 5)

 Performance profiling
 Reduce bundle size
 Optimize rendering
 Load testing (30+ players)


OpenAI Integration (Optional Asset Generation)
Sprite Generation Workflow
typescript// Generate player sprite
const prompt = "pixel art top-down view of a futuristic soldier character, 
               32x32 pixels, transparent background, simple design";

// DALL-E API call
const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: prompt,
  size: "1024x1024",
  quality: "standard",
  n: 1,
});

// Convert to sprite sheet (manual crop or use Canvas API)
Alternative: Procedural SVG Generation
typescript// Generate player as SVG circle with weapon
function generatePlayerSVG(color: string): string {
  return `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="${color}" stroke="#000" stroke-width="2"/>
      <line x1="16" y1="16" x2="28" y2="16" stroke="#000" stroke-width="3"/>
    </svg>
  `;
}

Success Criteria (MVP)
Must Have

✅ 10+ players can play simultaneously
✅ <100ms input latency
✅ Stable 60 FPS on mid-range devices
✅ Working leaderboard with live updates
✅ Complete game loop (join, play, kill, die, respawn)
✅ Mobile responsive (touch controls)

Nice to Have

🎯 Persistent leaderboard across sessions
🎯 Audio effects
🎯 Custom skins via OpenAI
🎯 Power-ups (health, speed boost)
🎯 Multiple game modes


Deployment Checklist

 Environment variables configured
 CORS properly set for production
 WebSocket URL configurable (env var)
 Redis connection (if using persistence)
 Error logging (Sentry/LogRocket)
 Health check endpoint (/health)
 Rate limiting on socket connections
 Docker compose for local dev