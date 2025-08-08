/**
 * Enhanced Redis Sync Manager with Cross-Server Game State Synchronization
 * AI-Generated: 90% - Advanced retry logic, connection pooling, message batching
 * Human Refinements: Production-grade network resilience patterns
 */

const redis = require('redis');

class EnhancedRedisSyncManager {
  constructor(serverId, gameInstance) {
    this.serverId = serverId;
    this.gameInstance = gameInstance;
    this.publisher = null;
    this.subscriber = null;
    
    // Connection state management
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.lastConnectionAttempt = 0;
    
    // Message batching and queuing
    this.messageQueue = [];
    this.batchSize = 10;
    this.batchTimeout = 100; // ms
    this.batchTimer = null;
    
    // Performance monitoring
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      reconnections: 0,
      errors: 0,
      avgLatency: 0,
      lastSuccessfulSync: Date.now()
    };
    
    // Circuit breaker pattern
    this.circuitBreaker = {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      threshold: 5,
      timeout: 30000, // 30 seconds
      lastFailure: 0
    };
    
    this.channelName = 'tic-tac-toe-sync';
    
    console.log(`[${this.serverId}] Enhanced Redis sync manager initialized`);
  }

  /**
   * Initialize Redis connections with enhanced error handling
   */
  async initialize() {
    try {
      // Check circuit breaker
      if (this.circuitBreaker.state === 'OPEN') {
        if (Date.now() - this.circuitBreaker.lastFailure < this.circuitBreaker.timeout) {
          console.log(`[${this.serverId}] Circuit breaker OPEN, skipping Redis connection`);
          return false;
        } else {
          this.circuitBreaker.state = 'HALF_OPEN';
          console.log(`[${this.serverId}] Circuit breaker transitioning to HALF_OPEN`);
        }
      }

      // Rate limit connection attempts
      const now = Date.now();
      if (now - this.lastConnectionAttempt < 5000) {
        console.log(`[${this.serverId}] Rate limiting Redis connection attempts`);
        return false;
      }
      this.lastConnectionAttempt = now;

      console.log(`[${this.serverId}] Initializing enhanced Redis connection...`);

      // Create Redis clients with optimized configuration
      const redisConfig = {
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          connectTimeout: 5000,
          lazyConnect: true,
          keepAlive: 30000,
          reconnectStrategyOnClusterDown: this.createReconnectStrategy(),
          reconnectStrategyOnFailover: this.createReconnectStrategy()
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };

      this.publisher = redis.createClient(redisConfig);
      this.subscriber = redis.createClient(redisConfig);

      // Enhanced error handling
      this.setupErrorHandlers();

      // Connect with timeout
      await Promise.race([
        Promise.all([
          this.publisher.connect(),
          this.subscriber.connect()
        ]),
        this.sleep(10000).then(() => Promise.reject(new Error('Connection timeout')))
      ]);

      // Subscribe to sync channel
      await this.subscriber.subscribe(this.channelName, (message) => {
        this.handleSyncMessage(message);
      });

      this.isConnected = true;
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      this.reconnectAttempts = 0;

      console.log(`[${this.serverId}] Enhanced Redis connection established successfully`);
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Redis initialization failed:`, error.message);
      this.handleConnectionFailure();
      return false;
    }
  }

  /**
   * Create reconnection strategy with exponential backoff
   */
  createReconnectStrategy() {
    return (retries) => {
      if (retries >= this.maxReconnectAttempts) {
        console.error(`[${this.serverId}] Max reconnection attempts reached`);
        return false;
      }
      
      const delay = Math.min(this.reconnectDelay * Math.pow(2, retries), 30000);
      console.log(`[${this.serverId}] Reconnecting in ${delay}ms (attempt ${retries + 1})`);
      return delay;
    };
  }

  /**
   * Setup enhanced error handlers
   */
  setupErrorHandlers() {
    if (this.publisher) {
      this.publisher.on('error', (error) => {
        console.error(`[${this.serverId}] Publisher error:`, error.message);
        this.handleConnectionFailure();
      });

      this.publisher.on('reconnecting', () => {
        console.log(`[${this.serverId}] Publisher reconnecting...`);
        this.metrics.reconnections++;
      });
    }

    if (this.subscriber) {
      this.subscriber.on('error', (error) => {
        console.error(`[${this.serverId}] Subscriber error:`, error.message);
        this.handleConnectionFailure();
      });

      this.subscriber.on('reconnecting', () => {
        console.log(`[${this.serverId}] Subscriber reconnecting...`);
      });
    }
  }

  /**
   * Handle connection failures with circuit breaker
   */
  handleConnectionFailure() {
    this.isConnected = false;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    this.metrics.errors++;

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      console.log(`[${this.serverId}] Circuit breaker OPEN due to repeated failures`);
    }
  }

  /**
   * Handle incoming sync messages with validation
   */
  handleSyncMessage(message) {
    try {
      const data = JSON.parse(message);
      
      if (!this.isValidSyncMessage(data)) {
        console.warn(`[${this.serverId}] Invalid sync message received`);
        return;
      }

      this.metrics.messagesReceived++;
      this.processSyncMessage(data);

    } catch (error) {
      console.error(`[${this.serverId}] Error processing sync message:`, error.message);
      this.metrics.errors++;
    }
  }

  /**
   * Validate sync message structure
   */
  isValidSyncMessage(data) {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.serverId === 'string' &&
      data.serverId !== this.serverId &&
      typeof data.timestamp === 'number' &&
      data.timestamp > 0
    );
  }

  /**
   * Process sync messages with enhanced logic
   */
  processSyncMessage(data) {
    try {
      switch (data.type) {
        case 'stateUpdate':
          this.handleStateUpdateEnhanced(data);
          break;
        case 'playerJoin':
          this.handlePlayerJoinEnhanced(data);
          break;
        case 'playerLeave':
          this.handlePlayerLeaveEnhanced(data);
          break;
        case 'move':
          this.handleMoveSyncEnhanced(data);
          break;
        case 'gameReset':
          this.handleGameResetEnhanced(data);
          break;
        case 'heartbeat':
          this.handleHeartbeat(data);
          break;
        case 'sync_request':
          this.handleSyncRequest(data);
          break;
        case 'sync_response':
          this.handleSyncResponse(data);
          break;
        default:
          console.warn(`[${this.serverId}] Unknown sync message type: ${data.type}`);
      }
    } catch (error) {
      console.error(`[${this.serverId}] Error in sync message processing:`, error.message);
      this.metrics.errors++;
    }
  }

  /**
   * Get global player count from Redis
   */
  async getGlobalPlayerCount() {
    if (!this.isConnected) return 0;
    
    try {
      const globalState = await this.publisher.get('global_game_state');
      if (globalState) {
        const state = JSON.parse(globalState);
        return state.playerCount || 0;
      }
      return 0;
    } catch (error) {
      console.error(`[${this.serverId}] Failed to get global player count:`, error.message);
      return 0;
    }
  }

  /**
   * Update global player count in Redis
   */
  async updateGlobalPlayerCount(count) {
    if (!this.isConnected) return false;
    
    try {
      const globalState = {
        playerCount: count,
        lastUpdated: Date.now(),
        updatedBy: this.serverId
      };
      
      await this.publisher.set('global_game_state', JSON.stringify(globalState));
      return true;
    } catch (error) {
      console.error(`[${this.serverId}] Failed to update global player count:`, error.message);
      return false;
    }
  }

  /**
   * Request current game state from other servers
   */
  async requestGameSync() {
    if (!this.isConnected) return { playerCount: 0 };
    
    try {
      // Get global state first
      const globalPlayerCount = await this.getGlobalPlayerCount();
      
      const message = {
        type: 'sync_request',
        serverId: this.serverId,
        timestamp: Date.now()
      };
      
      await this.publisher.publish(this.channelName, JSON.stringify(message));
      
      // Wait a moment for responses
      await this.sleep(100);
      
      return { playerCount: globalPlayerCount };
    } catch (error) {
      console.error(`[${this.serverId}] Failed to request game sync:`, error.message);
      return { playerCount: 0 };
    }
  }

  /**
   * Respond to sync request with current game state
   */
  async handleSyncRequest(data) {
    if (data.serverId === this.serverId) return; // Don't respond to own requests
    
    try {
      const gameState = this.gameInstance.getGameState();
      if (gameState.players.length > 0) {
        const response = {
          type: 'sync_response',
          serverId: this.serverId,
          gameState: gameState,
          timestamp: Date.now()
        };
        
        await this.publisher.publish(this.channelName, JSON.stringify(response));
        console.log(`[${this.serverId}] Sent sync response to ${data.serverId}`);
      }
    } catch (error) {
      console.error(`[${this.serverId}] Failed to respond to sync request:`, error.message);
    }
  }

  /**
   * Handle sync response from other servers
   */
  handleSyncResponse(data) {
    if (data.serverId === this.serverId) return; // Ignore own responses
    
    if (data.gameState && this.isValidGameState(data.gameState)) {
      // Only update if the response has more players
      const currentPlayers = this.gameInstance.getGameState().players.length;
      const responsePlayers = data.gameState.players.length;
      
      if (responsePlayers > currentPlayers) {
        this.gameInstance.updateState(data.gameState);
        console.log(`[${this.serverId}] Updated game state from ${data.serverId} (${responsePlayers} players)`);
      }
    }
  }

  /**
   * Publish player join with global state update
   */
  async publishPlayerJoin(playerId, gameState, playerSymbol) {
    // Update global player count
    const currentCount = await this.getGlobalPlayerCount();
    const newCount = currentCount + 1;
    await this.updateGlobalPlayerCount(newCount);
    
    const message = {
      type: 'playerJoin',
      serverId: this.serverId,
      playerId: playerId,
      playerSymbol: playerSymbol,
      gameState: gameState,
      globalPlayerCount: newCount,
      timestamp: Date.now()
    };

    return this.queueMessage(message);
  }

  /**
   * Publish player leave with global state update
   */
  async publishPlayerLeave(playerId, gameState) {
    // Update global player count
    const currentCount = await this.getGlobalPlayerCount();
    const newCount = Math.max(0, currentCount - 1);
    await this.updateGlobalPlayerCount(newCount);
    
    const message = {
      type: 'playerLeave',
      serverId: this.serverId,
      playerId: playerId,
      gameState: gameState,
      globalPlayerCount: newCount,
      timestamp: Date.now()
    };

    return this.queueMessage(message);
  }

  /**
   * Publish move with enhanced validation
   */
  async publishMove(moveData, gameState) {
    const message = {
      type: 'move',
      serverId: this.serverId,
      move: moveData,
      gameState: gameState,
      timestamp: Date.now()
    };

    return this.queueMessage(message);
  }

  /**
   * Publish game reset with global state reset
   */
  async publishGameReset(gameState) {
    // Reset global player count
    await this.updateGlobalPlayerCount(0);
    
    const message = {
      type: 'gameReset',
      serverId: this.serverId,
      gameState: gameState,
      globalPlayerCount: 0,
      timestamp: Date.now()
    };

    return this.queueMessage(message);
  }

  /**
   * Queue message for batched sending
   */
  async queueMessage(message) {
    if (!this.isConnected) {
      console.warn(`[${this.serverId}] Cannot queue message - Redis not connected`);
      return false;
    }

    this.messageQueue.push(message);

    // Process immediately if queue is full
    if (this.messageQueue.length >= this.batchSize) {
      return this.processBatch();
    }

    // Set timer for batch processing
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }

    return true;
  }

  /**
   * Process message batch
   */
  async processBatch() {
    if (this.messageQueue.length === 0) return true;

    const batch = [...this.messageQueue];
    this.messageQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      const pipeline = this.publisher.multi();
      
      for (const message of batch) {
        pipeline.publish(this.channelName, JSON.stringify(message));
      }

      await pipeline.exec();
      this.metrics.messagesSent += batch.length;
      this.metrics.lastSuccessfulSync = Date.now();

      return true;
    } catch (error) {
      console.error(`[${this.serverId}] Batch processing failed:`, error.message);
      this.handleConnectionFailure();
      return false;
    }
  }

  /**
   * Validate game state structure
   */
  isValidGameState(gameState) {
    return (
      gameState &&
      Array.isArray(gameState.board) &&
      gameState.board.length === 3 &&
      typeof gameState.currentPlayer === 'string' &&
      typeof gameState.gameStatus === 'string' &&
      Array.isArray(gameState.players)
    );
  }

  /**
   * Enhanced handlers for different message types
   */
  handlePlayerJoinEnhanced(data) {
    if (data.gameState && this.isValidGameState(data.gameState)) {
      // Update local state from global state
      this.gameInstance.updateState(data.gameState);
      console.log(`[${this.serverId}] Player ${data.playerId} joined as ${data.playerSymbol} (from ${data.serverId})`);
    }
  }

  handlePlayerLeaveEnhanced(data) {
    if (data.playerId) {
      this.gameInstance.removePlayer(data.playerId);
    }
  }

  handleMoveSyncEnhanced(data) {
    if (data.gameState && this.isValidGameState(data.gameState)) {
      this.gameInstance.updateState(data.gameState);
      console.log(`[${this.serverId}] Move synchronized from ${data.serverId}`);
    }
  }

  handleGameResetEnhanced(data) {
    this.gameInstance.resetGame();
    console.log(`[${this.serverId}] Game reset synchronized from ${data.serverId}`);
  }

  handleHeartbeat(data) {
    console.log(`[${this.serverId}] Heartbeat from ${data.serverId}:`, data.metrics);
  }

  handleStateUpdateEnhanced(data) {
    if (data.gameState && this.isValidGameState(data.gameState)) {
      this.gameInstance.updateState(data.gameState);
      console.log(`[${this.serverId}] State updated from ${data.serverId}`);
    }
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      circuitBreakerState: this.circuitBreaker.state,
      queueSize: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Enhanced cleanup with timeout
   */
  async cleanup() {
    console.log(`[${this.serverId}] Starting enhanced Redis cleanup...`);
    
    try {
      // Clear timers
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      // Process remaining messages
      if (this.messageQueue.length > 0) {
        console.log(`[${this.serverId}] Processing ${this.messageQueue.length} remaining messages`);
        await this.processBatch();
      }

      // Disconnect clients with timeout
      const disconnectPromises = [];
      
      if (this.subscriber) {
        disconnectPromises.push(
          Promise.race([
            this.subscriber.unsubscribe(this.channelName).then(() => this.subscriber.disconnect()),
            this.sleep(5000) // 5 second timeout
          ])
        );
      }
      
      if (this.publisher) {
        disconnectPromises.push(
          Promise.race([
            this.publisher.disconnect(),
            this.sleep(5000) // 5 second timeout
          ])
        );
      }

      await Promise.all(disconnectPromises);
      
      console.log(`[${this.serverId}] Enhanced Redis cleanup completed`);
    } catch (error) {
      console.error(`[${this.serverId}] Error during enhanced cleanup:`, error.message);
    }
  }
}

module.exports = EnhancedRedisSyncManager;