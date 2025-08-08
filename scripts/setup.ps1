# Enhanced Windows Setup Script for Dockerized Tic-Tac-Toe Game
# AI-Generated: 90% - Windows Docker automation with error handling
# Human Refinements: Windows-specific optimizations

param(
    [string]$Action = "help",
    [string]$Service = ""
)

# Configuration
$ProjectName = "tic-tac-toe"
$DockerComposeFile = "docker-compose.yml"
$EnvFile = ".env"

# Colors for PowerShell output
function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    
    $ColorMap = @{
        "Red" = "Red"
        "Green" = "Green" 
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "White" = "White"
    }
    
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Text" -ForegroundColor $ColorMap[$Color]
}

function Log { param([string]$Message) Write-ColorText "✓ $Message" "Green" }
function Warn { param([string]$Message) Write-ColorText "⚠ WARNING: $Message" "Yellow" }
function Error { param([string]$Message) Write-ColorText "✗ ERROR: $Message" "Red" }
function Info { param([string]$Message) Write-ColorText "ℹ INFO: $Message" "Blue" }

# Check prerequisites
function Test-Prerequisites {
    Log "Checking prerequisites..."
    
    # Check Docker
    try {
        $dockerVersion = docker --version 2>$null
        if (-not $dockerVersion) {
            throw "Docker not found"
        }
        Info "Docker found: $dockerVersion"
    }
    catch {
        Error "Docker is not installed. Please install Docker Desktop for Windows."
        Write-Host "Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version 2>$null
        if (-not $composeVersion) {
            throw "Docker Compose not found"
        }
        Info "Docker Compose found: $composeVersion"
    }
    catch {
        Error "Docker Compose is not available. Please ensure Docker Desktop is properly installed."
        exit 1
    }
    
    # Check if Docker is running
    try {
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker daemon not running"
        }
    }
    catch {
        Error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    }
    
    Log "Prerequisites check completed"
}

# Create environment file
function New-EnvironmentFile {
    Log "Creating environment configuration..."
    
    $envContent = @"
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
"@
    
    $envContent | Out-File -FilePath $EnvFile -Encoding UTF8
    Info "Environment file created: $EnvFile"
}

# Build Docker images
function Build-Images {
    Log "Building Docker images..."
    
    try {
        docker-compose build --no-cache
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Log "Docker images built successfully"
    }
    catch {
        Error "Failed to build Docker images: $_"
        exit 1
    }
}

# Start services
function Start-Services {
    param([bool]$FullSetup = $false)
    
    Log "Starting services..."
    
    try {
        # Start Redis first
        docker-compose up -d redis
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to start Redis"
        }
        
        # Wait for Redis to be ready
        Log "Waiting for Redis to be ready..."
        $timeout = 30
        $elapsed = 0
        do {
            Start-Sleep 1
            $elapsed++
            $redisStatus = docker-compose exec redis redis-cli ping 2>$null
        } while ($redisStatus -notlike "*PONG*" -and $elapsed -lt $timeout)
        
        if ($elapsed -ge $timeout) {
            throw "Redis failed to start within timeout"
        }
        
        # Start game servers
        docker-compose up -d server-a server-b
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to start game servers"
        }
        
        # Wait for servers to be ready
        Log "Waiting for game servers to be ready..."
        Start-Sleep 10
        
        # Start optional services
        if ($FullSetup) {
            docker-compose up -d nginx prometheus grafana
            if ($LASTEXITCODE -ne 0) {
                Warn "Some optional services failed to start"
            }
            Log "All services started including monitoring"
        } else {
            Log "Core services started"
        }
    }
    catch {
        Error "Failed to start services: $_"
        exit 1
    }
}

# Stop services
function Stop-Services {
    Log "Stopping services..."
    
    try {
        docker-compose down
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to stop services"
        }
        Log "Services stopped"
    }
    catch {
        Error "Failed to stop services: $_"
    }
}

# Show status
function Show-Status {
    Log "Service Status:"
    docker-compose ps
    
    Write-Host ""
    Log "Service Health:"
    
    # Check Redis
    try {
        $redisHealth = docker-compose exec redis redis-cli ping 2>$null
        if ($redisHealth -like "*PONG*") {
            Write-ColorText "  Redis: ✓ Healthy" "Green"
        } else {
            Write-ColorText "  Redis: ✗ Unhealthy" "Red"
        }
    }
    catch {
        Write-ColorText "  Redis: ✗ Unhealthy" "Red"
    }
    
    # Check servers
    foreach ($port in @(3001, 3002)) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-ColorText "  Server $port`: ✓ Healthy" "Green"
            } else {
                Write-ColorText "  Server $port`: ✗ Unhealthy" "Red"
            }
        }
        catch {
            Write-ColorText "  Server $port`: ✗ Unhealthy" "Red"
        }
    }
}

# Show logs
function Show-Logs {
    param([string]$ServiceName = "")
    
    if ($ServiceName -eq "") {
        docker-compose logs -f --tail=100
    } else {
        docker-compose logs -f --tail=100 $ServiceName
    }
}

# Run tests
function Invoke-Tests {
    Log "Running tests..."
    
    try {
        # Build test image
        docker build -t tic-tac-toe-test -f Dockerfile.test .
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to build test image"
        }
        
        # Run tests
        docker run --rm --network="${ProjectName}_tic-tac-toe-network" -e REDIS_HOST=redis tic-tac-toe-test npm test
        if ($LASTEXITCODE -ne 0) {
            throw "Tests failed"
        }
        
        Log "Tests completed"
    }
    catch {
        Error "Test execution failed: $_"
        exit 1
    }
}

# Clean up
function Invoke-Cleanup {
    Log "Cleaning up..."
    
    try {
        # Stop and remove containers
        docker-compose down -v
        
        # Remove images
        docker-compose down --rmi all
        
        # Remove volumes
        docker volume prune -f
        
        Log "Cleanup completed"
    }
    catch {
        Error "Cleanup failed: $_"
    }
}

# Install game client
function Install-Client {
    Log "Installing game client..."
    
    $clientScript = @'
@echo off
echo 🎮 Tic-Tac-Toe Game Client
echo ==========================
echo.
echo Choose server to connect:
echo 1. Server A (localhost:3001)
echo 2. Server B (localhost:3002)
echo 3. Load Balanced (localhost:80)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" set SERVER_URL=ws://localhost:3001
if "%choice%"=="2" set SERVER_URL=ws://localhost:3002
if "%choice%"=="3" set SERVER_URL=ws://localhost:80

if "%SERVER_URL%"=="" (
    echo Invalid choice
    pause
    exit /b 1
)

docker run --rm -it --network="tic-tac-toe_tic-tac-toe-network" -e SERVER_URL="%SERVER_URL%" tic-tac-toe:latest node src/client.js
'@
    
    $clientScript | Out-File -FilePath "play-game.bat" -Encoding ASCII
    Log "Game client installed: play-game.bat"
}

# Show help
function Show-Help {
    Write-Host @"
🎮 Tic-Tac-Toe Docker Deployment Script (Windows)

Usage: .\setup.ps1 -Action [COMMAND] [-Service SERVICE]

Commands:
    setup           Full setup (build + start)
    setup-full      Full setup with monitoring
    build           Build Docker images
    start           Start core services
    start-full      Start all services including monitoring
    stop            Stop all services
    restart         Restart services
    status          Show service status
    logs            Show logs (use -Service to specify service)
    test            Run tests
    client          Install and run game client
    cleanup         Stop services and clean up
    help            Show this help message

Examples:
    .\setup.ps1 -Action setup
    .\setup.ps1 -Action setup-full
    .\setup.ps1 -Action logs -Service server-a
    .\setup.ps1 -Action client

Services:
    - Redis (localhost:6379)
    - Server A (localhost:3001)
    - Server B (localhost:3002)
    - Nginx Load Balancer (localhost:80)
    - Prometheus Monitoring (localhost:9090)
    - Grafana Dashboard (localhost:3000)

Note: Requires Docker Desktop for Windows to be installed and running.
"@ -ForegroundColor White
}

# Main script logic
function Main {
    switch ($Action.ToLower()) {
        "setup" {
            Test-Prerequisites
            New-EnvironmentFile
            Build-Images
            Start-Services
            Install-Client
            Show-Status
            Log "🎉 Setup completed! Use 'play-game.bat' to start playing."
        }
        "setup-full" {
            Test-Prerequisites
            New-EnvironmentFile
            Build-Images
            Start-Services -FullSetup $true
            Install-Client
            Show-Status
            Log "🎉 Full setup completed with monitoring! Use 'play-game.bat' to start playing."
        }
        "build" {
            Test-Prerequisites
            Build-Images
        }
        "start" {
            Test-Prerequisites
            Start-Services
        }
        "start-full" {
            Test-Prerequisites
            Start-Services -FullSetup $true
        }
        "stop" {
            Stop-Services
        }
        "restart" {
            Stop-Services
            Start-Services
        }
        "status" {
            Show-Status
        }
        "logs" {
            Show-Logs -ServiceName $Service
        }
        "test" {
            Invoke-Tests
        }
        "client" {
            Install-Client
            Start-Process -FilePath "play-game.bat" -Wait
        }
        "cleanup" {
            Invoke-Cleanup
        }
        "help" {
            Show-Help
        }
        default {
            Error "Unknown command: $Action"
            Write-Host ""
            Show-Help
            exit 1
        }
    }
}

# Run main function
try {
    Main
}
catch {
    Error "Script execution failed: $_"
    exit 1
}
