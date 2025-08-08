# 🐳 Docker Deployment Guide

## Enhanced Real-Time Tic-Tac-Toe with Docker

This guide covers the Dockerized deployment of the enhanced Tic-Tac-Toe game with performance optimizations, robust error handling, and production-ready configuration.

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
# Clone and setup
git clone <repository-url>
cd tic_tac_toe_amir_lichter

# Full automated setup
.\setup.ps1 -Action setup

# Play the game
.\play-game.bat
```

### Linux/macOS (Bash)
```bash
# Clone and setup
git clone <repository-url>
cd tic_tac_toe_amir_lichter

# Full automated setup
chmod +x setup.sh
./setup.sh setup

# Play the game
./play-game.sh
```

## 📦 What's Included

### Core Services
- **Redis** - Message synchronization between servers
- **Server A** - WebSocket server on port 3001 
- **Server B** - WebSocket server on port 3002

### Optional Services (Full Setup)
- **Nginx** - Load balancer on port 80
- **Prometheus** - Metrics collection on port 9090
- **Grafana** - Monitoring dashboard on port 3000

## 🛠️ Setup Commands

### Windows PowerShell
```powershell
# Basic setup (core services only)
.\setup.ps1 -Action setup

# Full setup with monitoring
.\setup.ps1 -Action setup-full

# View service status
.\setup.ps1 -Action status

# View logs
.\setup.ps1 -Action logs -Service server-a

# Stop services
.\setup.ps1 -Action stop

# Clean up everything
.\setup.ps1 -Action cleanup
```

### Linux/macOS Bash
```bash
# Basic setup
./setup.sh setup

# Full setup with monitoring
./setup.sh setup-full

# View status
./setup.sh status

# View logs
./setup.sh logs server-a

# Stop services
./setup.sh stop

# Clean up
./setup.sh cleanup
```

## 🎮 Playing the Game

### Method 1: Automated Client (Recommended)
```bash
# Windows
.\play-game.bat

# Linux/macOS
./play-game.sh
```

### Method 2: Docker Client
```bash
# Connect to Server A
docker run --rm -it \
  --network="tic-tac-toe_tic-tac-toe-network" \
  tic-tac-toe:latest \
  node src/client.js

# Connect to Server B (in another terminal)
docker run --rm -it \
  --network="tic-tac-toe_tic-tac-toe-network" \
  tic-tac-toe:latest \
  node src/client.js
```

### Method 3: Load Balanced Connection
```bash
# Connect through Nginx load balancer
docker run --rm -it \
  --network="tic-tac-toe_tic-tac-toe-network" \
  -e SERVER_URL="ws://nginx:80" \
  tic-tac-toe:latest \
  node src/client.js
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Node.js Environment
NODE_ENV=production

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here

# Server Ports
SERVER_A_PORT=3001
SERVER_B_PORT=3002

# Security
JWT_SECRET=your_jwt_secret_here

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Docker Compose Override
Create `docker-compose.override.yml` for local customizations:
```yaml
version: '3.8'
services:
  server-a:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./logs:/usr/src/app/logs
```

## 📊 Monitoring & Metrics

### Access Monitoring Services
- **Grafana Dashboard**: http://localhost:3000 (admin/admin123)
- **Prometheus Metrics**: http://localhost:9090
- **Server Health**: http://localhost:3001/health, http://localhost:3002/health

### Key Metrics
- Connection count per server
- Message processing latency
- Redis synchronization performance
- Error rates and patterns
- Memory and CPU usage

## 🧪 Testing

### Run Automated Tests
```bash
# Windows
.\setup.ps1 -Action test

# Linux/macOS  
./setup.sh test
```

### Manual Testing
1. Start the services
2. Connect two clients to different servers
3. Play a complete game
4. Verify real-time synchronization
5. Test error scenarios (disconnect/reconnect)

## 🔍 Troubleshooting

### Common Issues

#### Docker not running
```bash
# Windows: Start Docker Desktop
# Linux: sudo systemctl start docker
# macOS: Start Docker Desktop app
```

#### Port conflicts
```bash
# Check what's using the ports
netstat -an | grep :3001
netstat -an | grep :3002

# Kill conflicting processes or change ports in .env
```

#### Redis connection issues
```bash
# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

#### Server health check failures
```bash
# Check server logs
docker-compose logs server-a
docker-compose logs server-b

# Check server status
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Debugging Commands
```bash
# View all container logs
docker-compose logs -f

# Inspect network connectivity
docker network inspect tic-tac-toe_tic-tac-toe-network

# Check resource usage
docker stats

# Access container shell
docker-compose exec server-a sh
```

## 🚀 Production Deployment

### Security Checklist
- [ ] Set strong Redis password
- [ ] Enable SSL/TLS (uncomment HTTPS in nginx.conf)
- [ ] Change default JWT secret
- [ ] Configure firewall rules
- [ ] Set up log rotation
- [ ] Enable monitoring alerts

### Performance Tuning
- [ ] Adjust Redis memory limits
- [ ] Configure Nginx worker processes
- [ ] Set Node.js memory limits
- [ ] Enable horizontal scaling
- [ ] Configure auto-restart policies

### Scaling
```bash
# Scale servers horizontally
docker-compose up -d --scale server-a=2 --scale server-b=2

# Add more server instances
# Edit docker-compose.yml to add server-c, server-d, etc.
```

## 📈 Performance Features

### Enhanced Server Capabilities
- **Rate Limiting**: Per-IP and per-client message throttling
- **Circuit Breaker**: Automatic Redis failover protection
- **Message Batching**: Optimized Redis pub/sub performance
- **Health Monitoring**: Automatic connection cleanup
- **Error Resilience**: Comprehensive error handling

### Redis Optimizations
- **Connection Pooling**: Efficient connection management
- **Retry Logic**: Exponential backoff reconnection
- **Message Validation**: Prevention of malformed data
- **Memory Management**: Optimized for real-time gaming

## 🤝 Sharing with Friends

### Email Package Instructions
1. **Zip the entire project folder**
2. **Include this README** in the email
3. **Provide these simple instructions**:

```
Hi! I've built a real-time multiplayer Tic-Tac-Toe game. Here's how to run it:

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Extract the zip file
3. Open PowerShell/Terminal in the extracted folder
4. Run: .\setup.ps1 -Action setup (Windows) or ./setup.sh setup (Mac/Linux)
5. Play: .\play-game.bat (Windows) or ./play-game.sh (Mac/Linux)

That's it! No need to install Node.js, Redis, or any dependencies.
The game supports real-time multiplayer across two independent servers.

Have fun! 🎮
```

---

**🏆 Ready for production deployment and easy sharing with zero-dependency setup!**
