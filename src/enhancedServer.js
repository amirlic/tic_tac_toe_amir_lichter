/**
 * Enhanced WebSocket Server with Performance Optimizations & Robust Error Handling
 * AI-Generated: 85% - Advanced performance patterns and error resilience
 * Human Refinements: Production-grade optimizations and monitoring
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const TicTacToeGame = require('./gameLogic');
const EnhancedRedisSyncManager = require('./enhancedRedisSync');

class EnhancedTicTacToeServer {
  constructor(port) {
    this.port = port;
    this.serverId = `server-${port}`;
    this.wss = null;
    this.game = new TicTacToeGame();
    this.clients = new Map();
    this.playerClients = new Map();
    this.syncManager = new EnhancedRedisSyncManager(this.serverId, this.game);
    
    // Performance & Monitoring
    this.metrics = {
      connections: 0,
      messagesProcessed: 0,
      errorsHandled: 0,
      avgResponseTime: 0,
      lastActivity: Date.now()
    };
    
    // Rate limiting & throttling
    this.rateLimiter = new Map(); // clientId -> { count, lastReset }
    this.messageQueue = [];
    this.isProcessingQueue = false;
    
    // Health monitoring
    this.healthCheckInterval = null;
    this.startHealthMonitoring();
    
    console.log(`[${this.serverId}] Enhanced server initializing with performance optimizations`);
  }

  /**
   * Start the enhanced WebSocket server
   */
  async start() {
    try {
      // Initialize Redis with retry logic
      const redisConnected = await this.initializeRedisWithRetry();
      if (!redisConnected) {
        console.warn(`[${this.serverId}] Starting in standalone mode (Redis unavailable)`);
      }

      // Create WebSocket server with performance options
      this.wss = new WebSocket.Server({ 
        port: this.port,
        host: '0.0.0.0', // Bind to all interfaces for Docker
        perMessageDeflate: {
          threshold: 1024,
          concurrencyLimit: 10,
          memLevel: 7
        },
        maxPayload: 16 * 1024, // 16KB max message size
        skipUTF8Validation: false // Keep validation for security
      });

      // Connection handling with rate limiting
      this.wss.on('connection', (ws, req) => {
        this.handleNewConnectionWithRateLimit(ws, req);
      });

      // Server health monitoring
      this.wss.on('error', (error) => {
        console.error(`[${this.serverId}] WebSocket server error:`, error.message);
        this.metrics.errorsHandled++;
      });

      // Graceful shutdown handling
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('uncaughtException', (error) => this.handleUncaughtException(error));
      process.on('unhandledRejection', (reason) => this.handleUnhandledRejection(reason));

      console.log(`[${this.serverId}] Enhanced server started on port ${this.port}`);
      console.log(`[${this.serverId}] Performance features: rate limiting, message queuing, health monitoring`);

    } catch (error) {
      console.error(`[${this.serverId}] Failed to start enhanced server:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize Redis with exponential backoff retry
   */
  async initializeRedisWithRetry(maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const connected = await this.syncManager.initialize();
        if (connected) return true;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`[${this.serverId}] Redis retry ${attempt}/${maxRetries} in ${delay}ms`);
          await this.sleep(delay);
        }
      } catch (error) {
        console.warn(`[${this.serverId}] Redis attempt ${attempt} failed:`, error.message);
      }
    }
    return false;
  }

  /**
   * Handle new connection with rate limiting and validation
   */
  handleNewConnectionWithRateLimit(ws, req) {
    const clientIp = req.socket.remoteAddress;
    const clientId = uuidv4();
    
    // IP-based rate limiting
    if (this.isRateLimited(clientIp)) {
      console.warn(`[${this.serverId}] Rate limited connection from ${clientIp}`);
      ws.close(1008, 'Rate limited');
      return;
    }

    // Connection limit check
    if (this.clients.size >= 100) { // Max 100 concurrent connections
      console.warn(`[${this.serverId}] Connection limit reached, rejecting ${clientIp}`);
      ws.close(1013, 'Server overloaded');
      return;
    }

    const clientInfo = {
      id: clientId,
      playerId: null,
      ip: clientIp,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      isAlive: true
    };

    this.clients.set(ws, clientInfo);
    this.metrics.connections++;

    console.log(`[${this.serverId}] Enhanced connection: ${clientId} from ${clientIp} (${this.clients.size} total)`);

    // Enhanced message handling with error boundaries
    ws.on('message', (rawMessage) => {
      this.handleMessageSafely(ws, rawMessage);
    });

    // Connection health monitoring
    ws.on('pong', () => {
      clientInfo.isAlive = true;
      clientInfo.lastActivity = Date.now();
    });

    // Enhanced disconnect handling
    ws.on('close', (code, reason) => {
      this.handleDisconnectionSafely(ws, code, reason);
    });

    ws.on('error', (error) => {
      console.error(`[${this.serverId}] Client ${clientId} error:`, error.message);
      this.metrics.errorsHandled++;
    });

    // Send welcome with server capabilities
    this.sendMessage(ws, {
      type: 'connected',
      serverId: this.serverId,
      clientId: clientId,
      serverCapabilities: {
        rateLimiting: true,
        healthMonitoring: true,
        messageQueuing: true,
        compressionEnabled: true
      },
      message: 'Connected to enhanced Tic-Tac-Toe server'
    });

    this.sendGameState(ws);
  }

  /**
   * Check if IP is rate limited
   */
  isRateLimited(ip) {
    const now = Date.now();
    const limit = this.rateLimiter.get(ip);
    
    if (!limit) {
      this.rateLimiter.set(ip, { count: 1, lastReset: now });
      return false;
    }

    // Reset counter every minute
    if (now - limit.lastReset > 60000) {
      this.rateLimiter.set(ip, { count: 1, lastReset: now });
      return false;
    }

    // Allow max 30 connections per minute per IP
    if (limit.count >= 30) {
      return true;
    }

    limit.count++;
    return false;
  }

  /**
   * Handle messages with error boundaries and performance tracking
   */
  handleMessageSafely(ws, rawMessage) {
    const startTime = Date.now();
    const clientInfo = this.clients.get(ws);
    
    if (!clientInfo) return;

    try {
      // Message size validation
      if (rawMessage.length > 16 * 1024) {
        this.sendError(ws, 'Message too large');
        return;
      }

      // Rate limiting per client
      clientInfo.messageCount++;
      if (clientInfo.messageCount > 100) { // Max 100 messages per connection
        this.sendError(ws, 'Message rate exceeded');
        ws.close(1008, 'Rate limited');
        return;
      }

      const message = JSON.parse(rawMessage.toString());
      clientInfo.lastActivity = Date.now();

      // Add to message queue for processing
      this.queueMessage(ws, message, clientInfo);

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateResponseTimeMetrics(processingTime);

    } catch (error) {
      console.error(`[${this.serverId}] Message processing error:`, error.message);
      this.metrics.errorsHandled++;
      this.sendError(ws, 'Invalid message format');
    }
  }

  /**
   * Queue messages for batch processing
   */
  queueMessage(ws, message, clientInfo) {
    this.messageQueue.push({ ws, message, clientInfo, timestamp: Date.now() });
    
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }

  /**
   * Process message queue with batching
   */
  async processMessageQueue() {
    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const batch = this.messageQueue.splice(0, 10); // Process 10 messages at once
      
      await Promise.all(batch.map(async ({ ws, message, clientInfo }) => {
        try {
          await this.processMessage(ws, message, clientInfo);
          this.metrics.messagesProcessed++;
        } catch (error) {
          console.error(`[${this.serverId}] Batch processing error:`, error.message);
          this.metrics.errorsHandled++;
        }
      }));

      // Small delay to prevent overwhelming
      if (this.messageQueue.length > 0) {
        await this.sleep(1);
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Process individual message
   */
  async processMessage(ws, message, clientInfo) {
    console.log(`[${this.serverId}] Processing ${message.type} from ${clientInfo.id}`);

    switch (message.type) {
      case 'join':
        await this.handlePlayerJoinEnhanced(ws, message, clientInfo);
        break;
      case 'move':
        await this.handlePlayerMoveEnhanced(ws, message, clientInfo);
        break;
      case 'reset':
        await this.handleGameResetEnhanced(ws, message, clientInfo);
        break;
      case 'ping':
        this.sendMessage(ws, { type: 'pong', timestamp: Date.now() });
        break;
      case 'getStats':
        this.sendMessage(ws, { type: 'stats', ...this.getDetailedStats() });
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Enhanced player join with cross-server sync
   */
  async handlePlayerJoinEnhanced(ws, message, clientInfo) {
    try {
      const playerId = message.playerId || `player-${clientInfo.id}`;
      
      // Get current global state
      const syncResult = await this.syncManager.requestGameSync();
      const globalPlayerCount = syncResult.playerCount || 0;
      
      console.log(`[${this.serverId}] Global player count: ${globalPlayerCount}`);
      
      const result = this.game.addPlayer(playerId, globalPlayerCount);
      
      if (result.success) {
        clientInfo.playerId = playerId;
        this.playerClients.set(playerId, ws);

        this.sendMessage(ws, {
          type: 'joined',
          playerId: playerId,
          playerSymbol: result.playerSymbol,
          message: result.message,
          gameState: this.game.getGameState()
        });

        this.broadcastGameState();
        await this.syncManager.publishPlayerJoin(playerId, this.game.getGameState(), result.playerSymbol);

        console.log(`[${this.serverId}] Player ${playerId} joined as ${result.playerSymbol} (global count: ${result.globalPlayerCount})`);
      } else {
        this.sendError(ws, result.message);
      }
    } catch (error) {
      console.error(`[${this.serverId}] Join error:`, error.message);
      this.sendError(ws, 'Failed to join game');
    }
  }

  /**
   * Enhanced move handling with validation
   */
  async handlePlayerMoveEnhanced(ws, message, clientInfo) {
    try {
      if (!clientInfo.playerId) {
        this.sendError(ws, 'You must join the game first');
        return;
      }

      const { row, col } = message;
      
      if (typeof row !== 'number' || typeof col !== 'number') {
        this.sendError(ws, 'Row and column must be numbers');
        return;
      }

      const result = this.game.makeMove(row, col, clientInfo.playerId);

      if (result.success) {
        this.broadcastGameState();
        await this.syncManager.publishMove(
          { row, col, playerId: clientInfo.playerId },
          result.gameState
        );

        console.log(`[${this.serverId}] Move by ${clientInfo.playerId}: (${row},${col})`);

        if (result.gameOver) {
          this.broadcastGameOver(result);
        }
      } else {
        this.sendError(ws, result.message);
      }
    } catch (error) {
      console.error(`[${this.serverId}] Move error:`, error.message);
      this.sendError(ws, 'Failed to process move');
    }
  }

  /**
   * Enhanced game reset
   */
  async handleGameResetEnhanced(ws, message, clientInfo) {
    try {
      this.game.resetGame();
      this.broadcastGameState();
      await this.syncManager.publishGameReset(this.game.getGameState());
      
      console.log(`[${this.serverId}] Game reset by ${clientInfo.playerId || clientInfo.id}`);
    } catch (error) {
      console.error(`[${this.serverId}] Reset error:`, error.message);
      this.sendError(ws, 'Failed to reset game');
    }
  }

  /**
   * Safe disconnect handling
   */
  async handleDisconnectionSafely(ws, code, reason) {
    try {
      const clientInfo = this.clients.get(ws);
      
      if (clientInfo) {
        console.log(`[${this.serverId}] Client ${clientInfo.id} disconnected: ${code} ${reason || ''}`);
        
        if (clientInfo.playerId) {
          this.game.removePlayer(clientInfo.playerId);
          this.playerClients.delete(clientInfo.playerId);
          await this.syncManager.publishPlayerLeave(clientInfo.playerId, this.game.getGameState());
          this.broadcastGameState();
        }
      }

      this.clients.delete(ws);
    } catch (error) {
      console.error(`[${this.serverId}] Disconnect handling error:`, error.message);
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
      this.cleanupStaleConnections();
      this.logHealthMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform health check on all connections
   */
  performHealthCheck() {
    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        clientInfo.isAlive = false;
        ws.ping();
      }
    });
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections() {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes instead of 5

    this.clients.forEach((clientInfo, ws) => {
      if (!clientInfo.isAlive || (now - clientInfo.lastActivity) > staleThreshold) {
        console.log(`[${this.serverId}] Cleaning up stale connection: ${clientInfo.id}`);
        ws.terminate();
        this.clients.delete(ws);
        
        if (clientInfo.playerId) {
          this.game.removePlayer(clientInfo.playerId);
          this.playerClients.delete(clientInfo.playerId);
        }
      }
    });
  }

  /**
   * Enhanced message sending with error handling
   */
  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const serialized = JSON.stringify(message);
        ws.send(serialized);
        return true;
      } catch (error) {
        console.error(`[${this.serverId}] Send error:`, error.message);
        this.metrics.errorsHandled++;
        return false;
      }
    }
    return false;
  }

  /**
   * Send game state to specific client
   */
  sendGameState(ws) {
    const gameState = {
      type: 'gameState',
      ...this.game.getGameState(),
      serverMetrics: this.getBasicMetrics()
    };
    
    this.sendMessage(ws, gameState);
  }

  /**
   * Send error message to client
   */
  sendError(ws, message) {
    this.sendMessage(ws, { type: 'error', message: message });
  }

  /**
   * Broadcast game over message
   */
  broadcastGameOver(result) {
    const message = {
      type: 'gameOver',
      winner: result.winner,
      winningLine: result.winningLine,
      gameState: result.gameState
    };

    this.clients.forEach((clientInfo, ws) => {
      this.sendMessage(ws, message);
    });
  }

  /**
   * Broadcast with error resilience
   */
  broadcastGameState() {
    const gameState = {
      type: 'gameState',
      ...this.game.getGameState(),
      serverMetrics: this.getBasicMetrics()
    };

    let successCount = 0;
    this.clients.forEach((clientInfo, ws) => {
      if (this.sendMessage(ws, gameState)) {
        successCount++;
      }
    });

    console.log(`[${this.serverId}] Broadcast sent to ${successCount}/${this.clients.size} clients`);
  }

  /**
   * Get detailed server statistics
   */
  getDetailedStats() {
    return {
      serverId: this.serverId,
      port: this.port,
      connectedClients: this.clients.size,
      activePlayers: this.game.players.size,
      gameStatus: this.game.gameStatus,
      currentPlayer: this.game.currentPlayer,
      metrics: {
        ...this.metrics,
        uptime: Date.now() - this.startTime || Date.now(),
        memoryUsage: process.memoryUsage(),
        queueSize: this.messageQueue.length
      }
    };
  }

  /**
   * Get basic metrics for clients
   */
  getBasicMetrics() {
    return {
      connectedClients: this.clients.size,
      activePlayers: this.game.players.size,
      avgResponseTime: this.metrics.avgResponseTime
    };
  }

  /**
   * Update response time metrics
   */
  updateResponseTimeMetrics(responseTime) {
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * 0.9) + (responseTime * 0.1);
  }

  /**
   * Log health metrics
   */
  logHealthMetrics() {
    const stats = this.getDetailedStats();
    console.log(`[${this.serverId}] Health: ${stats.connectedClients} clients, ${stats.metrics.messagesProcessed} msgs processed, ${stats.metrics.errorsHandled} errors handled`);
  }

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException(error) {
    console.error(`[${this.serverId}] Uncaught exception:`, error);
    this.metrics.errorsHandled++;
    
    // Log error but don't shutdown for demo purposes
    console.log(`[${this.serverId}] Continuing operation despite error`);
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(reason) {
    console.error(`[${this.serverId}] Unhandled rejection:`, reason);
    this.metrics.errorsHandled++;
  }

  /**
   * Enhanced graceful shutdown - only on signal
   */
  async gracefulShutdown() {
    console.log(`[${this.serverId}] Starting enhanced graceful shutdown...`);

    // Stop accepting new connections
    if (this.wss) {
      this.wss.close();
    }

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all client connections gracefully
    const closePromises = [];
    this.clients.forEach((clientInfo, ws) => {
      closePromises.push(new Promise((resolve) => {
        ws.close(1001, 'Server shutting down');
        setTimeout(resolve, 1000); // Max 1 second wait
      }));
    });

    await Promise.all(closePromises);

    // Clean up Redis connections
    await this.syncManager.cleanup();

    console.log(`[${this.serverId}] Enhanced shutdown complete`);
    process.exit(0);
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start server if run directly
if (require.main === module) {
  const port = process.env.PORT || process.argv[2] || 3001;
  const server = new EnhancedTicTacToeServer(parseInt(port));
  server.start();
}

module.exports = EnhancedTicTacToeServer;
