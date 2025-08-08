/**
 * Enhanced Redis Sync Manager with Network Resilience & Performance Optimizations
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
      this.setupConnectionHandlers();

      // Connect with timeout
      const connectionPromise = Promise.all([
        this.connectWithTimeout(this.publisher, 'Publisher'),
        this.connectWithTimeout(this.subscriber, 'Subscriber')
      ]);

      await connectionPromise;

      // Subscribe to sync channel
      await this.subscriber.subscribe(this.channelName, (message) => {
        this.handleSyncMessageSafely(message);
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      
      console.log(`[${this.serverId}] Enhanced Redis sync initialized successfully`);
      this.startBatchProcessor();
      
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Enhanced Redis initialization failed:`, error.message);
      this.handleConnectionFailure(error);
      return false;
    }
  }

  /**
   * Create reconnection strategy with exponential backoff
   */
  createReconnectStrategy() {
    return (retries) => {
      if (retries > this.maxReconnectAttempts) {
        console.error(`[${this.serverId}] Max Redis reconnection attempts reached`);
        return false;
      }
      
      const delay = Math.min(this.reconnectDelay * Math.pow(2, retries), 30000);
      console.log(`[${this.serverId}] Redis reconnection attempt ${retries + 1} in ${delay}ms`);
      return delay;
    };
  }

  /**
   * Connect with timeout wrapper
   */
  async connectWithTimeout(client, type, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${type} connection timeout after ${timeout}ms`));
      }, timeout);

      client.connect()
        .then(() => {
          clearTimeout(timeoutId);
          console.log(`[${this.serverId}] Redis ${type} connected successfully`);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Setup enhanced error handlers
   */
  setupErrorHandlers() {
    this.publisher.on('error', (err) => this.handleRedisError('Publisher', err));
    this.subscriber.on('error', (err) => this.handleRedisError('Subscriber', err));
    
    this.publisher.on('end', () => {
      console.log(`[${this.serverId}] Redis Publisher connection ended`);
      this.isConnected = false;
    });
    
    this.subscriber.on('end', () => {
      console.log(`[${this.serverId}] Redis Subscriber connection ended`);
    });
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    this.publisher.on('ready', () => {
      console.log(`[${this.serverId}] Redis Publisher ready`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.metrics.reconnections++;
    });

    this.subscriber.on('ready', () => {
      console.log(`[${this.serverId}] Redis Subscriber ready`);
    });

    this.publisher.on('reconnecting', () => {
      console.log(`[${this.serverId}] Redis Publisher reconnecting...`);
      this.isConnected = false;
    });

    this.subscriber.on('reconnecting', () => {
      console.log(`[${this.serverId}] Redis Subscriber reconnecting...`);
    });
  }

  /**
   * Handle sync messages with error boundaries
   */
  handleSyncMessageSafely(message) {
    const startTime = Date.now();
    
    try {
      const data = JSON.parse(message);
      
      // Ignore messages from this server (avoid loops)
      if (data.serverId === this.serverId) {
        return;
      }

      // Validate message structure
      if (!this.validateSyncMessage(data)) {
        console.warn(`[${this.serverId}] Invalid sync message format`);
        return;
      }

      console.log(`[${this.serverId}] Received sync message: ${data.type} from ${data.serverId}`);

      this.processSyncMessage(data);
      
      // Update metrics
      this.metrics.messagesReceived++;
      this.metrics.lastSuccessfulSync = Date.now();
      this.updateLatencyMetrics(Date.now() - startTime);

    } catch (error) {
      console.error(`[${this.serverId}] Error processing sync message:`, error.message);
      this.metrics.errors++;
    }
  }

  /**
   * Validate sync message structure
   */
  validateSyncMessage(data) {
    return (
      data &&
      typeof data.type === 'string' &&
      typeof data.serverId === 'string' &&
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
        default:
          console.warn(`[${this.serverId}] Unknown sync message type: ${data.type}`);
      }
    } catch (error) {
      console.error(`[${this.serverId}] Error in sync message processing:`, error.message);
      this.metrics.errors++;
    }
  }

  /**
   * Enhanced state update handling
   */
  handleStateUpdateEnhanced(data) {
    if (data.gameState && this.isValidGameState(data.gameState)) {
      const currentTimestamp = this.gameInstance.getGameState().timestamp || 0;
      const incomingTimestamp = data.timestamp;
      
      // Only apply if incoming state is newer
      if (incomingTimestamp > currentTimestamp) {
        this.gameInstance.updateState(data.gameState);
        console.log(`[${this.serverId}] Game state synchronized from ${data.serverId}`);
      }
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
      typeof gameState.gameStatus === 'string'
    );
  }

  /**
   * Enhanced message publishing with batching and retry
   */
  async publishMessage(message) {
    if (!this.isConnected) {
      console.warn(`[${this.serverId}] Cannot publish - Redis not connected`);
      return false;
    }

    if (this.circuitBreaker.state === 'OPEN') {
      console.warn(`[${this.serverId}] Cannot publish - Circuit breaker OPEN`);
      return false;
    }

    try {
      // Add message to batch queue
      this.messageQueue.push({
        ...message,
        timestamp: Date.now(),
        retryCount: 0
      });

      // Trigger batch processing
      this.triggerBatchProcess();
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Error queueing message:`, error.message);
      this.handlePublishError(error);
      return false;
    }
  }

  /**
   * Trigger batch processing with debouncing
   */
  triggerBatchProcess() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // If queue is full, process immediately
    if (this.messageQueue.length >= this.batchSize) {
      this.processBatch();
    } else {
      // Otherwise, wait for batch timeout
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }

  /**
   * Process message batch
   */
  async processBatch() {
    if (this.messageQueue.length === 0) return;

    const batch = this.messageQueue.splice(0, this.batchSize);
    
    try {
      // Process batch in parallel with retry logic
      const publishPromises = batch.map(message => this.publishSingleMessage(message));
      await Promise.allSettled(publishPromises);
      
      this.metrics.messagesSent += batch.length;
      
    } catch (error) {
      console.error(`[${this.serverId}] Batch processing error:`, error.message);
      
      // Re-queue failed messages
      batch.forEach(message => {
        if (message.retryCount < 3) {
          message.retryCount++;
          this.messageQueue.unshift(message);
        }
      });
    }
  }

  /**
   * Publish single message with retry
   */
  async publishSingleMessage(message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.publisher.publish(this.channelName, JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`[${this.serverId}] Publish attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          this.handlePublishError(error);
          throw error;
        }
        
        // Wait before retry
        await this.sleep(100 * attempt);
      }
    }
  }

  /**
   * Start batch processor
   */
  startBatchProcessor() {
    // Process any remaining messages every 5 seconds
    setInterval(() => {
      if (this.messageQueue.length > 0) {
        this.processBatch();
      }
    }, 5000);
  }

  /**
   * Enhanced publish methods with the new batching system
   */
  async publishStateUpdate(gameState) {
    return this.publishMessage({
      type: 'stateUpdate',
      serverId: this.serverId,
      gameState: gameState
    });
  }

  async publishPlayerJoin(playerId, gameState) {
    return this.publishMessage({
      type: 'playerJoin',
      serverId: this.serverId,
      playerId: playerId,
      gameState: gameState
    });
  }

  async publishPlayerLeave(playerId) {
    return this.publishMessage({
      type: 'playerLeave',
      serverId: this.serverId,
      playerId: playerId
    });
  }

  async publishMove(moveData, gameState) {
    return this.publishMessage({
      type: 'move',
      serverId: this.serverId,
      move: moveData,
      gameState: gameState
    });
  }

  async publishGameReset() {
    return this.publishMessage({
      type: 'gameReset',
      serverId: this.serverId
    });
  }

  async publishHeartbeat() {
    return this.publishMessage({
      type: 'heartbeat',
      serverId: this.serverId,
      metrics: this.getMetrics()
    });
  }

  /**
   * Handle Redis connection errors with circuit breaker
   */
  handleRedisError(clientType, error) {
    this.metrics.errors++;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      console.error(`[${this.serverId}] Circuit breaker OPEN after ${this.circuitBreaker.failures} failures`);
    }

    // Only log first error to avoid spam
    if (this.reconnectAttempts === 0) {
      console.error(`[${this.serverId}] Redis ${clientType} error:`, error.message);
    }
    
    this.isConnected = false;
    this.scheduleReconnection();
  }

  /**
   * Handle publish errors
   */
  handlePublishError(error) {
    this.metrics.errors++;
    console.error(`[${this.serverId}] Publish error:`, error.message);
  }

  /**
   * Handle connection failures
   */
  handleConnectionFailure(error) {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[${this.serverId}] Max reconnection attempts reached`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    setTimeout(() => {
      if (!this.isConnected) {
        console.log(`[${this.serverId}] Attempting Redis reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.initialize();
      }
    }, delay);
  }

  /**
   * Update latency metrics
   */
  updateLatencyMetrics(latency) {
    this.metrics.avgLatency = (this.metrics.avgLatency * 0.9) + (latency * 0.1);
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

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced handlers for different message types
  handlePlayerJoinEnhanced(data) {
    if (data.gameState && this.isValidGameState(data.gameState)) {
      this.gameInstance.updateState(data.gameState);
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
}

module.exports = EnhancedRedisSyncManager;
