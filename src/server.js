/**
 * WebSocket Server Implementation for Real-Time Tic-Tac-Toe
 * AI-Generated: 90% - Server setup, connection handling, message routing
 * Human Refinements: Enhanced error handling, connection management, logging
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const TicTacToeGame = require('./gameLogic');
const RedisSyncManager = require('./redisSync');

class TicTacToeServer {
  constructor(port) {
    this.port = port;
    this.serverId = `server-${port}`;
    this.wss = null;
    this.game = new TicTacToeGame();
    this.clients = new Map(); // websocket -> client info
    this.playerClients = new Map(); // playerId -> websocket
    this.syncManager = new RedisSyncManager(this.serverId, this.game);
    
    console.log(`[${this.serverId}] Initializing Tic-Tac-Toe Server on port ${port}`);
  }

  /**
   * Start the WebSocket server
   */
  async start() {
    try {
      // Initialize Redis synchronization
      const redisConnected = await this.syncManager.initialize();
      if (!redisConnected) {
        console.warn(`[${this.serverId}] Starting without Redis synchronization`);
      }

      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        port: this.port,
        perMessageDeflate: false // Better performance for small messages
      });

      // Set up connection handling
      this.wss.on('connection', (ws, req) => {
        this.handleNewConnection(ws, req);
      });

      // Graceful shutdown handling
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());

      console.log(`[${this.serverId}] WebSocket server started successfully on port ${this.port}`);
      console.log(`[${this.serverId}] Waiting for players to connect...`);

    } catch (error) {
      console.error(`[${this.serverId}] Failed to start server:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {object} req - HTTP request object
   */
  handleNewConnection(ws, req) {
    const clientId = uuidv4();
    const clientInfo = {
      id: clientId,
      playerId: null,
      ip: req.socket.remoteAddress,
      connectedAt: new Date()
    };

    this.clients.set(ws, clientInfo);
    
    console.log(`[${this.serverId}] New client connected: ${clientId} from ${clientInfo.ip}`);

    // Set up message handling
    ws.on('message', (rawMessage) => {
      this.handleMessage(ws, rawMessage);
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      this.handleDisconnection(ws, code, reason);
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`[${this.serverId}] WebSocket error for client ${clientId}:`, error.message);
    });

    // Send welcome message
    this.sendMessage(ws, {
      type: 'connected',
      serverId: this.serverId,
      clientId: clientId,
      message: 'Connected to Tic-Tac-Toe server'
    });

    // Send current game state
    this.sendGameState(ws);
  }

  /**
   * Handle incoming WebSocket messages
   * @param {WebSocket} ws - WebSocket connection
   * @param {Buffer} rawMessage - Raw message buffer
   */
  handleMessage(ws, rawMessage) {
    try {
      const message = JSON.parse(rawMessage.toString());
      const clientInfo = this.clients.get(ws);

      console.log(`[${this.serverId}] Message from ${clientInfo.id}:`, message.type);

      switch (message.type) {
        case 'join':
          this.handlePlayerJoin(ws, message);
          break;
        case 'move':
          this.handlePlayerMove(ws, message);
          break;
        case 'reset':
          this.handleGameReset(ws, message);
          break;
        case 'ping':
          this.sendMessage(ws, { type: 'pong' });
          break;
        default:
          this.sendError(ws, `Unknown message type: ${message.type}`);
      }

    } catch (error) {
      console.error(`[${this.serverId}] Error processing message:`, error.message);
      this.sendError(ws, 'Invalid message format');
    }
  }

  /**
   * Handle player join request
   * @param {WebSocket} ws - WebSocket connection
   * @param {object} message - Join message
   */
  async handlePlayerJoin(ws, message) {
    const clientInfo = this.clients.get(ws);
    
    // Generate player ID if not provided
    const playerId = message.playerId || `player-${clientInfo.id}`;
    
    // Add player to game
    const result = this.game.addPlayer(playerId);
    
    if (result.success) {
      // Update client info
      clientInfo.playerId = playerId;
      this.playerClients.set(playerId, ws);

      // Send join confirmation
      this.sendMessage(ws, {
        type: 'joined',
        playerId: playerId,
        playerSymbol: result.playerSymbol,
        message: result.message
      });

      // Broadcast updated game state to all clients
      this.broadcastGameState();

      // Sync with other servers
      await this.syncManager.publishPlayerJoin(playerId, this.game.getGameState());

      console.log(`[${this.serverId}] Player ${playerId} joined as ${result.playerSymbol}`);

    } else {
      this.sendError(ws, result.message);
    }
  }

  /**
   * Handle player move
   * @param {WebSocket} ws - WebSocket connection  
   * @param {object} message - Move message
   */
  async handlePlayerMove(ws, message) {
    const clientInfo = this.clients.get(ws);
    
    if (!clientInfo.playerId) {
      this.sendError(ws, 'You must join the game first');
      return;
    }

    const { row, col } = message;
    
    // Validate input format
    if (typeof row !== 'number' || typeof col !== 'number') {
      this.sendError(ws, 'Row and column must be numbers');
      return;
    }

    // Make the move
    const result = this.game.makeMove(row, col, clientInfo.playerId);

    if (result.success) {
      // Broadcast updated game state
      this.broadcastGameState();

      // Sync move with other servers
      await this.syncManager.publishMove(
        { row, col, playerId: clientInfo.playerId },
        result.gameState
      );

      console.log(`[${this.serverId}] Move by ${clientInfo.playerId}: (${row},${col})`);

      // Handle game over
      if (result.gameOver) {
        this.broadcastGameOver(result);
      }

    } else {
      this.sendError(ws, result.message);
    }
  }

  /**
   * Handle game reset request
   * @param {WebSocket} ws - WebSocket connection
   * @param {object} message - Reset message
   */
  async handleGameReset(ws, message) {
    this.game.resetGame();
    this.broadcastGameState();
    
    // Sync reset with other servers
    await this.syncManager.publishGameReset();
    
    console.log(`[${this.serverId}] Game reset`);
  }

  /**
   * Handle client disconnection
   * @param {WebSocket} ws - WebSocket connection
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  async handleDisconnection(ws, code, reason) {
    const clientInfo = this.clients.get(ws);
    
    if (clientInfo) {
      console.log(`[${this.serverId}] Client ${clientInfo.id} disconnected: ${code} ${reason}`);
      
      if (clientInfo.playerId) {
        // Remove player from game
        this.game.removePlayer(clientInfo.playerId);
        this.playerClients.delete(clientInfo.playerId);
        
        // Sync player leave with other servers
        await this.syncManager.publishPlayerLeave(clientInfo.playerId);
        
        // Broadcast updated game state
        this.broadcastGameState();
      }
    }

    this.clients.delete(ws);
  }

  /**
   * Send message to a specific client
   * @param {WebSocket} ws - WebSocket connection
   * @param {object} message - Message to send
   */
  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`[${this.serverId}] Error sending message:`, error.message);
      }
    }
  }

  /**
   * Send error message to client
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} errorMessage - Error message
   */
  sendError(ws, errorMessage) {
    this.sendMessage(ws, {
      type: 'error',
      message: errorMessage
    });
  }

  /**
   * Send current game state to a specific client
   * @param {WebSocket} ws - WebSocket connection
   */
  sendGameState(ws) {
    this.sendMessage(ws, {
      type: 'gameState',
      ...this.game.getGameState()
    });
  }

  /**
   * Broadcast game state to all connected clients
   */
  broadcastGameState() {
    const gameState = {
      type: 'gameState',
      ...this.game.getGameState()
    };

    this.clients.forEach((clientInfo, ws) => {
      this.sendMessage(ws, gameState);
    });
  }

  /**
   * Broadcast game over message to all clients
   * @param {object} result - Game over result
   */
  broadcastGameOver(result) {
    const message = {
      type: 'gameOver',
      winner: result.winner,
      winningLine: result.winningLine
    };

    this.clients.forEach((clientInfo, ws) => {
      this.sendMessage(ws, message);
    });
  }

  /**
   * Get server statistics
   * @returns {object} Server stats
   */
  getStats() {
    return {
      serverId: this.serverId,
      port: this.port,
      connectedClients: this.clients.size,
      activePlayers: this.game.players.size,
      gameStatus: this.game.gameStatus,
      currentPlayer: this.game.currentPlayer
    };
  }

  /**
   * Graceful server shutdown
   */
  async gracefulShutdown() {
    console.log(`[${this.serverId}] Shutting down gracefully...`);

    // Close all WebSocket connections
    this.clients.forEach((clientInfo, ws) => {
      ws.close(1001, 'Server shutting down');
    });

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Clean up Redis connections
    await this.syncManager.cleanup();

    console.log(`[${this.serverId}] Server shutdown complete`);
    process.exit(0);
  }
}

// Start server if run directly
if (require.main === module) {
  const port = process.argv[2] || 3001;
  const server = new TicTacToeServer(parseInt(port));
  server.start();
}

module.exports = TicTacToeServer;
