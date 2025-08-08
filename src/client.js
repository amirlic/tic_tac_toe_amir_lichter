/**
 * CLI WebSocket Client for Real-Time Tic-Tac-Toe
 * AI-Generated: 85% - Terminal-based game board display and user input handling
 * Human Refinements: Enhanced UX, colored output, better error handling
 */

const WebSocket = require('ws');
const readline = require('readline');

class TicTacToeClient {
  constructor() {
    this.ws = null;
    this.rl = null;
    this.playerId = null;
    this.playerSymbol = null;
    this.gameState = null;
    this.isConnected = false;
    this.serverUrl = null;
  }

  /**
   * Start the client and connect to server
   */
  async start() {
    // Set up readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Display welcome message
    this.displayWelcome();

    // Get server selection from user
    const serverChoice = await this.getServerChoice();
    this.serverUrl = serverChoice === '1' ? 'ws://localhost:3001' : 'ws://localhost:3002';

    // Connect to server
    await this.connectToServer();
  }

  /**
   * Display welcome message and instructions
   */
  displayWelcome() {
    console.clear();
    console.log('🎮 ' + '='.repeat(50));
    console.log('🎮 REAL-TIME TIC-TAC-TOE MULTIPLAYER GAME');
    console.log('🎮 ' + '='.repeat(50));
    console.log('');
    console.log('📋 How to play:');
    console.log('   • Two players needed to start');
    console.log('   • Enter moves as "row,col" (0-2 range)');
    console.log('   • Watch real-time updates from opponent');
    console.log('   • Type "quit" to exit');
    console.log('');
  }

  /**
   * Get server selection from user
   * @returns {Promise<string>} Server choice
   */
  getServerChoice() {
    return new Promise((resolve) => {
      console.log('🌐 Choose server to connect to:');
      console.log('   1. Server A (localhost:3001)');
      console.log('   2. Server B (localhost:3002)');
      console.log('');
      
      this.rl.question('Enter choice (1 or 2): ', (answer) => {
        const choice = answer.trim();
        if (choice === '1' || choice === '2') {
          resolve(choice);
        } else {
          console.log('❌ Invalid choice. Defaulting to Server A.');
          resolve('1');
        }
      });
    });
  }

  /**
   * Connect to the WebSocket server
   */
  connectToServer() {
    return new Promise((resolve, reject) => {
      console.log(`🔗 Connecting to ${this.serverUrl}...`);

      this.ws = new WebSocket(this.serverUrl);

      this.ws.on('open', () => {
        this.isConnected = true;
        console.log('✅ Connected to server successfully!');
        this.joinGame();
        this.startInputHandler();
        resolve();
      });

      this.ws.on('message', (rawMessage) => {
        this.handleServerMessage(rawMessage);
      });

      this.ws.on('close', (code, reason) => {
        this.isConnected = false;
        console.log(`❌ Connection closed: ${code} ${reason}`);
        this.handleDisconnection();
      });

      this.ws.on('error', (error) => {
        console.error('❌ Connection error:', error.message);
        console.log('💡 Make sure the server is running and Redis is available');
        reject(error);
      });

      // Connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Send join game request
   */
  joinGame() {
    this.sendMessage({
      type: 'join'
    });
  }

  /**
   * Handle messages from server
   * @param {Buffer} rawMessage - Raw message from server
   */
  handleServerMessage(rawMessage) {
    try {
      const message = JSON.parse(rawMessage.toString());

      switch (message.type) {
        case 'connected':
          console.log(`🔗 ${message.message}`);
          break;

        case 'joined':
          this.playerId = message.playerId;
          this.playerSymbol = message.playerSymbol;
          console.log(`🎯 ${message.message}`);
          console.log(`👤 Your symbol: ${this.getColoredSymbol(this.playerSymbol)}`);
          break;

        case 'gameState':
          this.handleGameStateUpdate(message);
          break;

        case 'gameOver':
          this.handleGameOver(message);
          break;

        case 'error':
          console.log(`❌ Error: ${message.message}`);
          break;

        case 'pong':
          // Handle ping/pong for connection health
          break;

        default:
          console.log('📨 Received:', message);
      }

    } catch (error) {
      console.error('❌ Error parsing server message:', error.message);
    }
  }

  /**
   * Handle game state updates
   * @param {object} gameState - New game state
   */
  handleGameStateUpdate(gameState) {
    this.gameState = gameState;
    this.displayGameBoard();
    this.displayGameStatus();
  }

  /**
   * Handle game over
   * @param {object} result - Game over result
   */
  handleGameOver(result) {
    console.log('\n🎊 ' + '='.repeat(30));
    
    if (result.winner === 'draw') {
      console.log('🤝 Game ended in a DRAW!');
    } else if (result.winner === this.playerSymbol) {
      console.log('🏆 YOU WON! Congratulations! 🎉');
    } else {
      console.log(`😔 You lost. ${result.winner} wins!`);
    }
    
    console.log('🎊 ' + '='.repeat(30));
    
    this.promptNewGame();
  }

  /**
   * Display the game board with colors
   */
  displayGameBoard() {
    if (!this.gameState) return;

    console.clear();
    this.displayWelcome();
    
    console.log('🎲 Current Game Board:');
    console.log('');
    
    // Display column headers
    console.log('     0   1   2');
    
    // Display board rows
    for (let row = 0; row < 3; row++) {
      let rowDisplay = `  ${row} `;
      
      for (let col = 0; col < 3; col++) {
        const cell = this.gameState.board[row][col];
        const cellDisplay = cell ? this.getColoredSymbol(cell) : ' ';
        rowDisplay += ` ${cellDisplay} `;
        
        if (col < 2) rowDisplay += '│';
      }
      
      console.log(rowDisplay);
      
      if (row < 2) {
        console.log('    ───┼───┼───');
      }
    }
    
    console.log('');
  }

  /**
   * Display current game status
   */
  displayGameStatus() {
    if (!this.gameState) return;

    console.log(`🎯 Game Status: ${this.gameState.gameStatus.toUpperCase()}`);
    console.log(`👥 Players: ${this.gameState.players.length}/2`);
    
    if (this.gameState.gameStatus === 'playing') {
      const currentPlayerColor = this.getColoredSymbol(this.gameState.currentPlayer);
      console.log(`⏰ Current Turn: ${currentPlayerColor}`);
      
      if (this.gameState.currentPlayer === this.playerSymbol) {
        console.log('🎯 YOUR TURN! Enter your move (row,col):');
      } else {
        console.log('⏳ Waiting for opponent\'s move...');
      }
    } else if (this.gameState.gameStatus === 'waiting') {
      console.log('⏳ Waiting for another player to join...');
    }
    
    console.log('');
  }

  /**
   * Get colored symbol for display
   * @param {string} symbol - X or O
   * @returns {string} Colored symbol
   */
  getColoredSymbol(symbol) {
    // Using ANSI color codes for terminal colors
    if (symbol === 'X') {
      return '\x1b[31mX\x1b[0m'; // Red
    } else if (symbol === 'O') {
      return '\x1b[34mO\x1b[0m'; // Blue
    }
    return symbol;
  }

  /**
   * Start input handler for user commands
   */
  startInputHandler() {
    this.rl.on('line', (input) => {
      this.handleUserInput(input.trim());
    });
  }

  /**
   * Handle user input
   * @param {string} input - User input
   */
  handleUserInput(input) {
    if (!input) return;

    // Handle special commands
    if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
      this.quit();
      return;
    }

    if (input.toLowerCase() === 'reset') {
      this.resetGame();
      return;
    }

    if (input.toLowerCase() === 'help') {
      this.showHelp();
      return;
    }

    // Handle move input
    this.handleMoveInput(input);
  }

  /**
   * Handle move input from user
   * @param {string} input - Move input (e.g., "1,2")
   */
  handleMoveInput(input) {
    // Check if it's player's turn
    if (!this.gameState || this.gameState.currentPlayer !== this.playerSymbol) {
      console.log('⏳ It\'s not your turn yet!');
      return;
    }

    // Parse move input
    const parts = input.split(',').map(s => s.trim());
    
    if (parts.length !== 2) {
      console.log('❌ Invalid format. Use: row,col (e.g., 1,2)');
      return;
    }

    const row = parseInt(parts[0]);
    const col = parseInt(parts[1]);

    // Validate numbers
    if (isNaN(row) || isNaN(col)) {
      console.log('❌ Row and column must be numbers (0-2)');
      return;
    }

    // Send move to server
    this.sendMessage({
      type: 'move',
      row: row,
      col: col
    });
  }

  /**
   * Reset the game
   */
  resetGame() {
    this.sendMessage({
      type: 'reset'
    });
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('\n📖 Help:');
    console.log('   • Enter moves as "row,col" (e.g., 1,2)');
    console.log('   • Row and column range: 0-2');
    console.log('   • Commands: quit, reset, help');
    console.log('');
  }

  /**
   * Prompt for new game
   */
  promptNewGame() {
    setTimeout(() => {
      this.rl.question('\n🎮 Start new game? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          this.resetGame();
        } else {
          this.quit();
        }
      });
    }, 2000);
  }

  /**
   * Send message to server
   * @param {object} message - Message to send
   */
  sendMessage(message) {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Error sending message:', error.message);
      }
    } else {
      console.log('❌ Not connected to server');
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnection() {
    console.log('🔄 Attempting to reconnect...');
    
    setTimeout(() => {
      this.connectToServer().catch(() => {
        console.log('❌ Reconnection failed. Please restart the client.');
        this.quit();
      });
    }, 3000);
  }

  /**
   * Quit the client
   */
  quit() {
    console.log('\n👋 Thanks for playing Tic-Tac-Toe!');
    
    if (this.ws) {
      this.ws.close();
    }
    
    if (this.rl) {
      this.rl.close();
    }
    
    process.exit(0);
  }
}

// Start client if run directly
if (require.main === module) {
  const client = new TicTacToeClient();
  client.start().catch((error) => {
    console.error('❌ Failed to start client:', error.message);
    process.exit(1);
  });
}

module.exports = TicTacToeClient;
