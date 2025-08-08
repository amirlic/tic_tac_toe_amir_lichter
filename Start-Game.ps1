# PowerShell script for Real-Time Tic-Tac-Toe Game
# AI-Generated: 95% - PowerShell automation and process management
# Human Refinements: Error handling, colored output

param(
    [string]$Action = "menu"
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$White = "`e[37m"
$Reset = "`e[0m"

function Write-ColorText {
    param([string]$Text, [string]$Color = $White)
    Write-Host "$Color$Text$Reset"
}

function Test-Prerequisites {
    Write-ColorText "🔍 Checking prerequisites..." $Cyan
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-ColorText "✅ Node.js found: $nodeVersion" $Green
    }
    catch {
        Write-ColorText "❌ Node.js not found. Please install from https://nodejs.org/" $Red
        return $false
    }
    
    # Check Redis
    try {
        $redisResponse = redis-cli ping 2>$null
        if ($redisResponse -eq "PONG") {
            Write-ColorText "✅ Redis is running" $Green
        }
        else {
            Write-ColorText "⚠️  Redis is not responding" $Yellow
        }
    }
    catch {
        Write-ColorText "⚠️  Redis not found. Install with: choco install redis-64" $Yellow
        Write-ColorText "💡 Or download from: https://redis.io/download" $Blue
    }
    
    return $true
}

function Start-Server {
    param([int]$Port)
    
    Write-ColorText "🚀 Starting server on port $Port..." $Cyan
    Start-Process -FilePath "node" -ArgumentList "src/server.js", $Port -WindowStyle Normal
    Start-Sleep -Seconds 1
}

function Start-Client {
    Write-ColorText "🎮 Starting game client..." $Cyan
    Start-Process -FilePath "node" -ArgumentList "src/client.js" -WindowStyle Normal
}

function Show-Menu {
    Clear-Host
    Write-ColorText "🎮 ===============================================" $Magenta
    Write-ColorText "🎮 REAL-TIME TIC-TAC-TOE MULTIPLAYER GAME" $Magenta
    Write-ColorText "🎮 ===============================================" $Magenta
    Write-ColorText ""
    Write-ColorText "📋 Available Actions:" $White
    Write-ColorText "   1. Start Server A (port 3001)" $Green
    Write-ColorText "   2. Start Server B (port 3002)" $Green
    Write-ColorText "   3. Start both servers" $Green
    Write-ColorText "   4. Start game client" $Blue
    Write-ColorText "   5. Full development setup" $Yellow
    Write-ColorText "   6. Test game scenario" $Cyan
    Write-ColorText "   0. Exit" $Red
    Write-ColorText ""
}

function Start-DevEnvironment {
    Write-ColorText "🛠️  Starting full development environment..." $Yellow
    
    # Start both servers
    Start-Server -Port 3001
    Start-Sleep -Seconds 2
    Start-Server -Port 3002
    Start-Sleep -Seconds 2
    
    # Start two clients
    Start-Client
    Start-Sleep -Seconds 1
    Start-Client
    
    Write-ColorText "✅ Development environment ready!" $Green
    Write-ColorText "📊 2 servers running, 2 clients launched" $Blue
}

function Test-GameScenario {
    Write-ColorText "🧪 Testing game scenario..." $Cyan
    Write-ColorText "💡 This will demonstrate the game flow" $Blue
    Write-ColorText "📝 Manual testing required - follow the prompts in client windows" $Yellow
    
    Start-DevEnvironment
}

function Main {
    if (-not (Test-Prerequisites)) {
        return
    }
    
    if ($Action -ne "menu") {
        switch ($Action) {
            "server1" { Start-Server -Port 3001 }
            "server2" { Start-Server -Port 3002 }
            "servers" { 
                Start-Server -Port 3001
                Start-Server -Port 3002
            }
            "client" { Start-Client }
            "dev" { Start-DevEnvironment }
            "test" { Test-GameScenario }
            default { Write-ColorText "❌ Unknown action: $Action" $Red }
        }
        return
    }
    
    do {
        Show-Menu
        $choice = Read-Host "Enter your choice (0-6)"
        
        switch ($choice) {
            "1" { Start-Server -Port 3001 }
            "2" { Start-Server -Port 3002 }
            "3" { 
                Start-Server -Port 3001
                Start-Sleep -Seconds 1
                Start-Server -Port 3002
                Write-ColorText "✅ Both servers started!" $Green
            }
            "4" { Start-Client }
            "5" { Start-DevEnvironment }
            "6" { Test-GameScenario }
            "0" { 
                Write-ColorText "👋 Goodbye!" $Green
                break
            }
            default { 
                Write-ColorText "❌ Invalid choice. Please try again." $Red
                Start-Sleep -Seconds 2
            }
        }
        
        if ($choice -ne "0") {
            Write-ColorText ""
            Write-ColorText "Press any key to continue..." $Yellow
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        
    } while ($choice -ne "0")
}

# Run the main function
Main
