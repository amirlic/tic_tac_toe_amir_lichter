#!/bin/bash
# Enhanced Setup Script for Dockerized Tic-Tac-Toe Game
# AI-Generated: 85% - Complete automation with error handling and monitoring
# Human Refinements: Production deployment patterns

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="tic-tac-toe"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    log "Prerequisites check completed ✓"
}

# Create environment file
create_env_file() {
    log "Creating environment configuration..."
    
    cat > $ENV_FILE << EOF
# Tic-Tac-Toe Game Environment Configuration
NODE_ENV=production

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Server Configuration
SERVER_A_PORT=3001
SERVER_B_PORT=3002

# Security
JWT_SECRET=your_jwt_secret_here_change_in_production

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Logging
LOG_LEVEL=info
EOF
    
    info "Environment file created: $ENV_FILE"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    docker-compose build --no-cache
    
    log "Docker images built successfully ✓"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start Redis first
    docker-compose up -d redis
    
    # Wait for Redis to be ready
    log "Waiting for Redis to be ready..."
    timeout 30 bash -c 'until docker-compose exec redis redis-cli ping | grep -q PONG; do sleep 1; done'
    
    # Start game servers
    docker-compose up -d server-a server-b
    
    # Wait for servers to be ready
    log "Waiting for game servers to be ready..."
    sleep 10
    
    # Start optional services
    if [ "$1" = "full" ]; then
        docker-compose up -d nginx prometheus grafana
        log "All services started including monitoring ✓"
    else
        log "Core services started ✓"
    fi
}

# Stop services
stop_services() {
    log "Stopping services..."
    docker-compose down
    log "Services stopped ✓"
}

# Show status
show_status() {
    log "Service Status:"
    docker-compose ps
    
    echo ""
    log "Service Health:"
    
    # Check Redis
    if docker-compose exec redis redis-cli ping &> /dev/null; then
        echo -e "  Redis: ${GREEN}✓ Healthy${NC}"
    else
        echo -e "  Redis: ${RED}✗ Unhealthy${NC}"
    fi
    
    # Check servers
    for port in 3001 3002; do
        if curl -f http://localhost:$port/health &> /dev/null; then
            echo -e "  Server $port: ${GREEN}✓ Healthy${NC}"
        else
            echo -e "  Server $port: ${RED}✗ Unhealthy${NC}"
        fi
    done
}

# Show logs
show_logs() {
    if [ -z "$1" ]; then
        docker-compose logs -f --tail=100
    else
        docker-compose logs -f --tail=100 "$1"
    fi
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Build test image
    docker build -t tic-tac-toe-test -f Dockerfile.test .
    
    # Run tests
    docker run --rm \
        --network="${PROJECT_NAME}_tic-tac-toe-network" \
        -e REDIS_HOST=redis \
        tic-tac-toe-test npm test
    
    log "Tests completed ✓"
}

# Clean up
cleanup() {
    log "Cleaning up..."
    
    # Stop and remove containers
    docker-compose down -v
    
    # Remove images
    docker-compose down --rmi all
    
    # Remove volumes
    docker volume prune -f
    
    log "Cleanup completed ✓"
}

# Install game client
install_client() {
    log "Installing game client..."
    
    # Create client script
    cat > play-game.sh << 'EOF'
#!/bin/bash
# Game Client Launcher

echo "🎮 Tic-Tac-Toe Game Client"
echo "=========================="
echo ""
echo "Choose server to connect:"
echo "1. Server A (localhost:3001)"
echo "2. Server B (localhost:3002)"
echo "3. Load Balanced (localhost:80)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1) SERVER_URL="ws://localhost:3001" ;;
    2) SERVER_URL="ws://localhost:3002" ;;
    3) SERVER_URL="ws://localhost:80" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

docker run --rm -it \
    --network="tic-tac-toe_tic-tac-toe-network" \
    -e SERVER_URL="$SERVER_URL" \
    tic-tac-toe:latest \
    node src/client.js
EOF
    
    chmod +x play-game.sh
    log "Game client installed: ./play-game.sh ✓"
}

# Show help
show_help() {
    cat << EOF
🎮 Tic-Tac-Toe Docker Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    setup           Full setup (build + start)
    setup-full      Full setup with monitoring
    build           Build Docker images
    start           Start core services
    start-full      Start all services including monitoring
    stop            Stop all services
    restart         Restart services
    status          Show service status
    logs [service]  Show logs (optionally for specific service)
    test            Run tests
    client          Install and run game client
    cleanup         Stop services and clean up
    help            Show this help message

Examples:
    $0 setup           # Quick setup for development
    $0 setup-full      # Full setup with monitoring
    $0 logs server-a   # Show logs for server A
    $0 client          # Launch game client

Services:
    - Redis (localhost:6379)
    - Server A (localhost:3001)
    - Server B (localhost:3002)
    - Nginx Load Balancer (localhost:80)
    - Prometheus Monitoring (localhost:9090)
    - Grafana Dashboard (localhost:3000)

For more information, visit: https://github.com/your-repo
EOF
}

# Main script logic
main() {
    case "$1" in
        setup)
            check_prerequisites
            create_env_file
            build_images
            start_services
            install_client
            show_status
            log "🎉 Setup completed! Use './play-game.sh' to start playing."
            ;;
        setup-full)
            check_prerequisites
            create_env_file
            build_images
            start_services full
            install_client
            show_status
            log "🎉 Full setup completed with monitoring! Use './play-game.sh' to start playing."
            ;;
        build)
            check_prerequisites
            build_images
            ;;
        start)
            check_prerequisites
            start_services
            ;;
        start-full)
            check_prerequisites
            start_services full
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        test)
            run_tests
            ;;
        client)
            install_client
            ./play-game.sh
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
