/**
 * Quick Demo Script - Test the servers without Redis
 * AI-Generated: 80% - Demo automation and testing utilities
 * Human Refinements: Enhanced user experience, error handling
 */

const TicTacToeServer = require('../src/server');
const WebSocket = require('ws');

class QuickDemo {
  constructor() {
    this.servers = [];
    this.clients = [];
  }

  async runDemo() {
    console.log('🎮 Starting Quick Demo - Real-Time Tic-Tac-Toe');
    console.log('📝 This demo shows the servers working without Redis dependency\n');

    try {
      // Start servers
      await this.startServers();
      
      // Wait for servers to be ready
      await this.sleep(2000);
      
      // Test WebSocket connections
      await this.testConnections();
      
      // Cleanup
      await this.cleanup();
      
      console.log('\n✅ Demo completed successfully!');
      console.log('🚀 Ready for production use with Redis synchronization');
      
    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
    }
  }

  async startServers() {
    console.log('🚀 Starting WebSocket servers...');
    
    // Start Server A
    const serverA = new TicTacToeServer(3001);
    this.servers.push(serverA);
    
    // Start Server B  
    const serverB = new TicTacToeServer(3002);
    this.servers.push(serverB);
    
    // Start servers (they'll warn about Redis but continue working)
    const promises = this.servers.map(server => server.start());
    await Promise.all(promises);
    
    console.log('✅ Both servers started on ports 3001 and 3002');
  }

  async testConnections() {
    console.log('\n🔗 Testing WebSocket connections...');
    
    // Connect to Server A
    const clientA = new WebSocket('ws://localhost:3001');
    this.clients.push(clientA);
    
    // Connect to Server B
    const clientB = new WebSocket('ws://localhost:3002');
    this.clients.push(clientB);
    
    // Set up connection handlers
    const connectionPromises = this.clients.map((client, index) => {
      return new Promise((resolve, reject) => {
        const serverName = index === 0 ? 'Server A (3001)' : 'Server B (3002)';
        
        client.on('open', () => {
          console.log(`✅ Connected to ${serverName}`);
          
          // Send join message
          client.send(JSON.stringify({ type: 'join' }));
          resolve();
        });
        
        client.on('message', (message) => {
          const data = JSON.parse(message.toString());
          console.log(`📨 ${serverName} response:`, data.type);
        });
        
        client.on('error', (error) => {
          console.error(`❌ ${serverName} error:`, error.message);
          reject(error);
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error(`Connection timeout for ${serverName}`));
        }, 5000);
      });
    });
    
    await Promise.all(connectionPromises);
    console.log('✅ All connections established successfully');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    // Close client connections
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    
    // Shutdown servers gracefully
    for (const server of this.servers) {
      if (server.wss) {
        server.wss.close();
      }
    }
    
    console.log('✅ Cleanup completed');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run demo if executed directly
if (require.main === module) {
  const demo = new QuickDemo();
  demo.runDemo().catch(console.error);
}

module.exports = QuickDemo;
