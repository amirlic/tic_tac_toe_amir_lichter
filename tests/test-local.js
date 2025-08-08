/**
 * Local Test Runner - Verify everything works before Docker
 */

const { spawn } = require('child_process');

console.log('🧪 Starting Local Test...\n');

// Test 1: Start Enhanced Server
console.log('1️⃣ Testing Enhanced Server Start...');
const server = spawn('node', ['src/enhancedServer.js', '3001'], {
  stdio: 'pipe',
  cwd: process.cwd()
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log(`Server: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`Server Error: ${data.toString().trim()}`);
});

// Give server time to start, then test connection
setTimeout(() => {
  console.log('\n2️⃣ Testing WebSocket Connection...');
  
  const testConnection = spawn('node', ['-e', `
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection successful!');
      ws.close();
      process.exit(0);
    });
    
    ws.on('error', (err) => {
      console.log('❌ WebSocket connection failed:', err.message);
      process.exit(1);
    });
    
    setTimeout(() => {
      console.log('❌ Connection timeout');
      process.exit(1);
    }, 5000);
  `], { stdio: 'inherit' });
  
  testConnection.on('close', (code) => {
    console.log(`\n📊 Connection test ${code === 0 ? 'PASSED' : 'FAILED'}`);
    
    // Clean up
    server.kill();
    process.exit(code);
  });
  
}, 3000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  server.kill();
  process.exit(1);
});
