#!/usr/bin/env node

// Simple connectivity test for the Tic-Tac-Toe servers
const WebSocket = require('ws');

async function testServer(port, serverName) {
    return new Promise((resolve) => {
        console.log(`\n🔍 Testing ${serverName} (port ${port})...`);
        
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        ws.on('open', () => {
            console.log(`✅ ${serverName} connection successful!`);
            
            // Test joining game
            ws.send(JSON.stringify({
                type: 'join',
                playerId: `test-player-${Date.now()}`
            }));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log(`📨 ${serverName} response:`, message.type);
                
                if (message.type === 'joined' || message.type === 'gameState') {
                    console.log(`✅ ${serverName} game logic working!`);
                    ws.close();
                    resolve(true);
                }
            } catch (error) {
                console.log(`❌ ${serverName} message parse error:`, error.message);
                ws.close();
                resolve(false);
            }
        });
        
        ws.on('error', (error) => {
            console.log(`❌ ${serverName} connection failed:`, error.message);
            resolve(false);
        });
        
        ws.on('close', () => {
            console.log(`🔌 ${serverName} connection closed`);
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
                console.log(`⏰ ${serverName} test timeout`);
                resolve(false);
            }
        }, 5000);
    });
}

async function runTests() {
    console.log('🎮 Testing Tic-Tac-Toe Servers...\n');
    
    const serverA = await testServer(3001, 'Server A');
    const serverB = await testServer(3002, 'Server B');
    
    console.log('\n📊 Test Results:');
    console.log(`Server A (3001): ${serverA ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Server B (3002): ${serverB ? '✅ WORKING' : '❌ FAILED'}`);
    
    if (serverA && serverB) {
        console.log('\n🎉 All servers are working! Your game is ready to play!');
        console.log('\n🎯 To play the game:');
        console.log('   Player 1: node src/client.js ws://localhost:3001');
        console.log('   Player 2: node src/client.js ws://localhost:3002');
    } else {
        console.log('\n⚠️  Some servers are not responding. Check Docker logs:');
        console.log('   docker-compose -f docker-compose.simple.yml logs');
    }
}

runTests().catch(console.error);
