/**
 * Development utilities and testing helpers
 * AI-Generated: 80% - Testing framework and development utilities
 * Human Refinements: Enhanced logging, performance monitoring
 */

const TicTacToeServer = require('./src/server');
const TicTacToeClient = require('./src/client');

class DevUtils {
  /**
   * Start both servers for development
   */
  static async startBothServers() {
    console.log('🚀 Starting both servers for development...');
    
    try {
      const server1 = new TicTacToeServer(3001);
      const server2 = new TicTacToeServer(3002);
      
      await Promise.all([
        server1.start(),
        server2.start()
      ]);
      
      console.log('✅ Both servers started successfully!');
      console.log('📊 Server stats:');
      console.log('   Server 1:', server1.getStats());
      console.log('   Server 2:', server2.getStats());
      
    } catch (error) {
      console.error('❌ Failed to start servers:', error.message);
    }
  }

  /**
   * Test client connections
   */
  static async testClientConnections() {
    console.log('🧪 Testing client connections...');
    
    // Simulate automated clients for testing
    const testMoves = [
      { row: 0, col: 0 }, // X
      { row: 1, col: 1 }, // O
      { row: 0, col: 1 }, // X
      { row: 1, col: 0 }, // O
      { row: 0, col: 2 }  // X wins
    ];

    // Note: This would require headless client implementation
    console.log('💡 Automated testing requires headless client mode');
    console.log('🎮 Please test manually with: npm run start:client');
  }

  /**
   * Monitor server performance
   */
  static monitorPerformance() {
    console.log('📊 Performance monitoring started...');
    
    setInterval(() => {
      const memUsage = process.memoryUsage();
      console.log('Memory Usage:', {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
      });
    }, 10000);
  }

  /**
   * Generate load test data
   */
  static generateLoadTestData() {
    const scenarios = [
      {
        name: 'Quick Game',
        moves: [
          { player: 'X', row: 0, col: 0 },
          { player: 'O', row: 1, col: 1 },
          { player: 'X', row: 0, col: 1 },
          { player: 'O', row: 1, col: 0 },
          { player: 'X', row: 0, col: 2 }
        ],
        expectedWinner: 'X'
      },
      {
        name: 'Draw Game',
        moves: [
          { player: 'X', row: 0, col: 0 },
          { player: 'O', row: 0, col: 1 },
          { player: 'X', row: 0, col: 2 },
          { player: 'O', row: 1, col: 0 },
          { player: 'X', row: 1, col: 2 },
          { player: 'O', row: 1, col: 1 },
          { player: 'X', row: 2, col: 1 },
          { player: 'O', row: 2, col: 2 },
          { player: 'X', row: 2, col: 0 }
        ],
        expectedWinner: 'draw'
      }
    ];

    console.log('🎯 Load test scenarios generated:');
    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.name} (Expected: ${scenario.expectedWinner})`);
    });

    return scenarios;
  }
}

// CLI interface for dev utilities
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start-servers':
      DevUtils.startBothServers();
      break;
    case 'test-clients':
      DevUtils.testClientConnections();
      break;
    case 'monitor':
      DevUtils.monitorPerformance();
      break;
    case 'load-test':
      DevUtils.generateLoadTestData();
      break;
    default:
      console.log('🛠️  Dev Utils Commands:');
      console.log('   node dev-utils.js start-servers  - Start both servers');
      console.log('   node dev-utils.js test-clients   - Test client connections');
      console.log('   node dev-utils.js monitor        - Monitor performance');
      console.log('   node dev-utils.js load-test      - Generate load test data');
  }
}

module.exports = DevUtils;
