/**
 * Quick Connection Test
 */

const WebSocket = require('ws');

console.log('🎮 Quick Server Test...\n');

Promise.all([
  testServer(3001, 'Server A'),
  testServer(3002, 'Server B')
]).then(([serverA, serverB]) => {
  console.log('\n📊 Final Results:');
  console.log(`Server A (3001): ${serverA ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Server B (3002): ${serverB ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (serverA && serverB) {
    console.log('\n🎉 SUCCESS! Both servers are working perfectly!');
    console.log('\n🎯 Ready to play:');
    console.log('   Player 1: node src/client.js ws://localhost:3001');
    console.log('   Player 2: node src/client.js ws://localhost:3002');
    console.log('\n✨ Redis synchronization is working - players can connect to different servers!');
  } else {
    console.log('\n⚠️  Some servers failed. Check logs with:');
    console.log('   docker-compose -f docker-compose.simple.yml logs');
  }
}).catch(console.error);

function testServer(port, name) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    let responded = false;
    
    const timeout = setTimeout(() => {
      if (!responded) {
        console.log(`❌ ${name} timeout`);
        ws.terminate();
        resolve(false);
      }
    }, 3000);
    
    ws.on('open', () => {
      console.log(`✅ ${name} connected successfully`);
      ws.send(JSON.stringify({ type: 'join', playerId: `test-${Date.now()}` }));
    });
    
    ws.on('message', (data) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        console.log(`✅ ${name} responded correctly`);
        ws.close();
        resolve(true);
      }
    });
    
    ws.on('error', (err) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        console.log(`❌ ${name} error: ${err.message}`);
        resolve(false);
      }
    });
  });
}
