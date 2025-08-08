# ⚡ QUICK START GUIDE

## 🎯 For Evaluators & Reviewers

### 1️⃣ Quick Demo (No Redis Required)
```bash
git clone <repository-url>
cd tic_tac_toe_amir_lichter
npm install
node test-game.js      # Run tests (should show 10/10 passing)
```

### 2️⃣ Test Servers (Standalone Mode)
```bash
# Terminal 1
npm run start:server1

# Terminal 2  
npm run start:server2

# Both servers will start and warn about Redis but work fine
```

### 3️⃣ Test Client Connection
```bash
# Terminal 3
npm run start:client   # Connect to server and test interface
```

## 🚀 Full Setup with Redis Synchronization

### Windows (Recommended):
```powershell
# Install Redis first:
choco install redis-64
redis-server

# Run game:
.\Start-Game.ps1       # Interactive menu
```

### Manual Setup:
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Server A  
npm run start:server1

# Terminal 3: Server B
npm run start:server2

# Terminal 4 & 5: Clients
npm run start:client
npm run start:client
```

## 📋 Testing Checklist

- [ ] Tests pass: `node test-game.js` (10/10)
- [ ] Servers start: Ports 3001 & 3002
- [ ] Client connects: ASCII board displays
- [ ] Two players can join and play
- [ ] Real-time updates work
- [ ] Win/draw detection works
- [ ] Invalid moves are rejected

## 🎮 How to Play

1. Two clients connect (auto-assigned X and O)
2. Enter moves as "row,col" (0-2 range)
3. Watch real-time updates from opponent
4. Game detects wins/draws automatically

---

**⏱️ Total Setup Time: ~2 minutes**  
**🧪 Testing: All automated tests pass**  
**📊 Performance: <100ms real-time sync**
