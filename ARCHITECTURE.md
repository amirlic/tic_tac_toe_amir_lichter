# 🏗️ System Architecture Documentation

## 📋 Overview

This is a **distributed real-time multiplayer Tic-Tac-Toe game** that demonstrates:
- Independent WebSocket servers with shared state
- Redis pub/sub for real-time synchronization
- Cross-server gameplay capabilities
- Scalable distributed game architecture

## 🎯 Architecture Design

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DISTRIBUTED GAME SYSTEM                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐    ┌──────────────┐    ┌─────────┐    ┌──────────────┐    │
│  │Client A │◄──►│  Server A    │◄──►│ Redis   │◄──►│  Server B    │    │
│  │(Player1)│    │  (Port 3001) │    │ Pub/Sub │    │  (Port 3002) │    │
│  └─────────┘    └──────────────┘    └─────────┘    └──────────────┘    │
│                                                            ▲            │
│                                                            │            │
│                                                     ┌─────────┐         │
│                                                     │Client B │         │
│                                                     │(Player2)│         │
│                                                     └─────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **WebSocket Servers** (`src/enhancedServer.js`)
- **Purpose**: Handle client connections and game logic
- **Technology**: Node.js with `ws` library
- **Features**:
  - Real-time WebSocket communication
  - Game state validation
  - Player management
  - Cross-server synchronization via Redis

#### 2. **Redis Pub/Sub** (`src/enhancedRedisSync.js`)
- **Purpose**: Synchronize game state between servers
- **Technology**: Redis with Node.js `redis` client
- **Features**:
  - Publish game events to all servers
  - Subscribe to updates from other servers
  - Real-time state synchronization
  - Connection resilience with retry logic

#### 3. **Game Logic Engine** (`src/gameLogic.js`)
- **Purpose**: Core game rules and state management
- **Features**:
  - Move validation
  - Win/draw detection
  - Board state management
  - Player turn management

#### 4. **CLI Client** (`src/client.js`)
- **Purpose**: Interactive terminal-based game interface
- **Features**:
  - ASCII art game board
  - Real-time updates
  - User input handling
  - Connection management

## 🔄 Communication Protocols

### 1. Client-Server Communication (WebSocket)
```json
// Client → Server Messages
{
  "type": "join",
  "playerId": "auto-generated-uuid"
}

{
  "type": "move", 
  "row": 1,
  "col": 2
}

// Server → Client Messages  
{
  "type": "gameState",
  "board": [["X","",""], ["","O",""], ["","",""]],
  "currentPlayer": "X",
  "gameStatus": "playing",
  "players": {"X": "player1", "O": "player2"}
}

{
  "type": "error",
  "message": "Invalid move: cell already occupied"
}

{
  "type": "gameOver",
  "winner": "X",
  "reason": "three in a row",
  "winningCells": [[0,0], [1,1], [2,2]]
}
```

### 2. Server-Server Communication (Redis Pub/Sub)
```json
// State Synchronization
{
  "type": "stateUpdate",
  "gameState": {
    "board": [...],
    "currentPlayer": "X", 
    "gameStatus": "playing",
    "players": {...}
  },
  "serverId": "server-3001",
  "timestamp": "2025-01-01T12:00:00Z"
}

// Player Events
{
  "type": "playerJoin",
  "playerId": "player-uuid",
  "playerSymbol": "X",
  "serverId": "server-3001"
}

{
  "type": "playerMove", 
  "move": {"row": 1, "col": 2},
  "playerId": "player-uuid",
  "serverId": "server-3001"
}
```

## 🎮 Game Flow

### Typical Game Session
1. **Initialization**: Servers start and connect to Redis
2. **Player Join**: Client connects to any server via WebSocket
3. **Game Start**: When 2 players connected (can be on different servers)
4. **Move Execution**:
   - Player makes move via CLI
   - Server validates move
   - Server updates local state
   - Server publishes update to Redis
   - Other servers receive update and sync state
   - All clients receive updated game state
5. **Game End**: Win/draw detection, game reset option

### Cross-Server Synchronization
1. Player on Server A makes a move
2. Server A validates and applies move locally
3. Server A publishes move to Redis channel
4. Server B receives Redis message
5. Server B updates its game state
6. Player on Server B sees the move immediately

## 🚀 Scalability Design

### Current Capabilities
- **2 Independent Servers**: Can handle multiple concurrent games
- **Redis Pub/Sub**: Enables adding more servers easily
- **Stateless Servers**: Game state synchronized via Redis
- **Client Flexibility**: Clients can connect to any available server

### Future Scaling Options
- **Load Balancer**: Route clients to least-loaded server
- **Multiple Game Rooms**: Support concurrent games
- **Redis Cluster**: Scale Redis for higher throughput
- **Server Pool**: Add/remove servers dynamically

## 🔧 Technical Implementation Details

### Server Architecture (`enhancedServer.js`)
```javascript
// Key components:
- WebSocket server setup
- Redis connection and pub/sub handling  
- Game state management
- Client connection lifecycle
- Message routing and validation
```

### Redis Integration (`enhancedRedisSync.js`)
```javascript
// Features:
- Connection retry logic
- Message publishing/subscribing
- Error handling and reconnection
- State synchronization protocols
```

### Game Logic (`gameLogic.js`)
```javascript
// Core functions:
- Board state validation
- Move legality checking
- Win condition detection
- Game lifecycle management
```

## 🧪 Testing Strategy

### Unit Tests
- Game logic validation
- Move validation
- Win/draw detection
- State management

### Integration Tests  
- Server-to-server communication
- Redis pub/sub messaging
- Client-server WebSocket communication
- Cross-server game synchronization

### Load Testing
- Multiple concurrent connections
- High-frequency move submissions
- Redis message throughput
- Server performance under load

---

**Architecture designed for:** Distributed gaming, real-time synchronization, scalable multiplayer systems
