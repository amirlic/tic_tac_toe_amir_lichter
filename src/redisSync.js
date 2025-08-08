/**
 * Redis Pub/Sub Synchronization Layer
 * AI-Generated: 95% - Pub/sub implementation for server-to-server communication
 * Human Refinements: Error handling, reconnection logic, message validation
 */

const redis = require('redis');

class RedisSyncManager {
  constructor(serverId, gameInstance) {
    this.serverId = serverId;
    this.gameInstance = gameInstance;
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.channelName = 'tic-tac-toe-sync';
  }

  /**
   * Initialize Redis connections
   */
  async initialize() {
    try {
      // Create publisher client
      this.publisher = redis.createClient({
        host: 'localhost',
        port: 6379,
        retry_unfulfilled_commands: true
      });

      // Create subscriber client  
      this.subscriber = redis.createClient({
        host: 'localhost', 
        port: 6379,
        retry_unfulfilled_commands: true
      });

      // Set up error handlers
      this.publisher.on('error', (err) => this.handleRedisError('Publisher', err));
      this.subscriber.on('error', (err) => this.handleRedisError('Subscriber', err));

      // Set up reconnection handlers
      this.publisher.on('connect', () => {
        console.log(`[${this.serverId}] Redis Publisher connected`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.subscriber.on('connect', () => {
        console.log(`[${this.serverId}] Redis Subscriber connected`);
      });

      // Connect to Redis
      await this.publisher.connect();
      await this.subscriber.connect();

      // Subscribe to sync channel
      await this.subscriber.subscribe(this.channelName, (message) => {
        this.handleSyncMessage(message);
      });

      console.log(`[${this.serverId}] Redis sync initialized successfully`);
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Failed to initialize Redis:`, error.message);
      return false;
    }
  }

  /**
   * Handle incoming sync messages from other servers
   * @param {string} message - Raw Redis message
   */
  handleSyncMessage(message) {
    try {
      const data = JSON.parse(message);
      
      // Ignore messages from this server (avoid loops)
      if (data.serverId === this.serverId) {
        return;
      }

      console.log(`[${this.serverId}] Received sync message:`, data.type);

      switch (data.type) {
        case 'stateUpdate':
          this.handleStateUpdate(data);
          break;
        case 'playerJoin':
          this.handlePlayerJoin(data);
          break;
        case 'playerLeave':
          this.handlePlayerLeave(data);
          break;
        case 'move':
          this.handleMoveSync(data);
          break;
        case 'gameReset':
          this.handleGameReset(data);
          break;
        default:
          console.warn(`[${this.serverId}] Unknown sync message type:`, data.type);
      }

    } catch (error) {
      console.error(`[${this.serverId}] Error processing sync message:`, error.message);
    }
  }

  /**
   * Handle state update from another server
   * @param {object} data - State update data
   */
  handleStateUpdate(data) {
    if (data.gameState) {
      this.gameInstance.updateState(data.gameState);
      console.log(`[${this.serverId}] Game state synchronized from ${data.serverId}`);
    }
  }

  /**
   * Handle player join from another server
   * @param {object} data - Player join data
   */
  handlePlayerJoin(data) {
    // The other server already has this player, just sync the state
    if (data.gameState) {
      this.gameInstance.updateState(data.gameState);
    }
  }

  /**
   * Handle player leave from another server
   * @param {object} data - Player leave data
   */
  handlePlayerLeave(data) {
    if (data.playerId) {
      this.gameInstance.removePlayer(data.playerId);
    }
  }

  /**
   * Handle move synchronization from another server
   * @param {object} data - Move data
   */
  handleMoveSync(data) {
    if (data.gameState) {
      this.gameInstance.updateState(data.gameState);
      console.log(`[${this.serverId}] Move synchronized from ${data.serverId}`);
    }
  }

  /**
   * Handle game reset from another server
   * @param {object} data - Reset data
   */
  handleGameReset(data) {
    this.gameInstance.resetGame();
    console.log(`[${this.serverId}] Game reset synchronized from ${data.serverId}`);
  }

  /**
   * Publish state update to other servers
   * @param {object} gameState - Current game state
   */
  async publishStateUpdate(gameState) {
    if (!this.isConnected) {
      console.warn(`[${this.serverId}] Cannot publish - Redis not connected`);
      return false;
    }

    try {
      const message = {
        type: 'stateUpdate',
        serverId: this.serverId,
        gameState: gameState,
        timestamp: Date.now()
      };

      await this.publisher.publish(this.channelName, JSON.stringify(message));
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Error publishing state update:`, error.message);
      return false;
    }
  }

  /**
   * Publish player join event
   * @param {string} playerId - Player ID
   * @param {object} gameState - Current game state
   */
  async publishPlayerJoin(playerId, gameState) {
    if (!this.isConnected) return false;

    try {
      const message = {
        type: 'playerJoin',
        serverId: this.serverId,
        playerId: playerId,
        gameState: gameState,
        timestamp: Date.now()
      };

      await this.publisher.publish(this.channelName, JSON.stringify(message));
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Error publishing player join:`, error.message);
      return false;
    }
  }

  /**
   * Publish player leave event
   * @param {string} playerId - Player ID
   */
  async publishPlayerLeave(playerId) {
    if (!this.isConnected) return false;

    try {
      const message = {
        type: 'playerLeave',
        serverId: this.serverId,
        playerId: playerId,
        timestamp: Date.now()
      };

      await this.publisher.publish(this.channelName, JSON.stringify(message));
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Error publishing player leave:`, error.message);
      return false;
    }
  }

  /**
   * Publish move event
   * @param {object} moveData - Move information
   * @param {object} gameState - Updated game state
   */
  async publishMove(moveData, gameState) {
    if (!this.isConnected) return false;

    try {
      const message = {
        type: 'move',
        serverId: this.serverId,
        move: moveData,
        gameState: gameState,
        timestamp: Date.now()
      };

      await this.publisher.publish(this.channelName, JSON.stringify(message));
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Error publishing move:`, error.message);
      return false;
    }
  }

  /**
   * Publish game reset event
   */
  async publishGameReset() {
    if (!this.isConnected) return false;

    try {
      const message = {
        type: 'gameReset',
        serverId: this.serverId,
        timestamp: Date.now()
      };

      await this.publisher.publish(this.channelName, JSON.stringify(message));
      return true;

    } catch (error) {
      console.error(`[${this.serverId}] Error publishing game reset:`, error.message);
      return false;
    }
  }

  /**
   * Handle Redis connection errors
   * @param {string} clientType - Publisher or Subscriber
   * @param {Error} error - Redis error
   */
  handleRedisError(clientType, error) {
    // Only log first error and when reconnect attempts are made
    if (this.reconnectAttempts === 0) {
      console.warn(`[${this.serverId}] Redis ${clientType} unavailable - will operate without synchronization`);
    }
    this.isConnected = false;

    // Attempt reconnection with rate limiting
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      if (this.reconnectAttempts === 1) {
        console.log(`[${this.serverId}] Attempting Redis reconnection...`);
      }
      
      setTimeout(() => {
        this.initialize();
      }, 5000 * this.reconnectAttempts); // Longer delays to reduce spam
    } else if (this.reconnectAttempts === this.maxReconnectAttempts) {
      console.warn(`[${this.serverId}] Redis connection failed after ${this.maxReconnectAttempts} attempts. Operating in standalone mode.`);
      this.reconnectAttempts++; // Prevent further attempts
    }
  }

  /**
   * Clean up Redis connections
   */
  async cleanup() {
    try {
      if (this.subscriber) {
        await this.subscriber.unsubscribe(this.channelName);
        await this.subscriber.disconnect();
      }
      
      if (this.publisher) {
        await this.publisher.disconnect();
      }
      
      console.log(`[${this.serverId}] Redis connections cleaned up`);
    } catch (error) {
      console.error(`[${this.serverId}] Error during Redis cleanup:`, error.message);
    }
  }
}

module.exports = RedisSyncManager;
