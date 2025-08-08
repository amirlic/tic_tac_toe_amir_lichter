# Scripts Directory

This directory contains all the batch files for easy game management.

## 🎮 Main Controller
- **`game-controller.bat`** - Main menu with all options

## 🚀 Server Management  
- **`start-game.bat`** - Start Docker containers and servers
- **`stop-game.bat`** - Stop all containers and cleanup

## 🎯 Game Play
- **`play-game.bat`** - Interactive game client

## 🧪 Testing
- **`test-all.bat`** - Verify all components are working

## Usage

1. **First time setup:**
   ```cmd
   .\start-game.bat
   ```

2. **Play the game:**
   ```cmd
   .\play-game.bat
   ```

3. **Or use the master controller:**
   ```cmd
   .\game-controller.bat
   ```

4. **When done:**
   ```cmd
   .\stop-game.bat
   ```

## Requirements
- Docker Desktop running
- Node.js 18+ installed
- Windows environment

All scripts automatically handle dependencies and error checking.
