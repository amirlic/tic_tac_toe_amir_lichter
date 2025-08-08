/**
 * Core Game Logic Engine for Tic-Tac-Toe
 * AI-Generated: 100% - Game state management, win detection, validation
 * Human Refinements: Enhanced error handling, edge case management
 */

class TicTacToeGame {
  constructor() {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'X';
    this.gameStatus = 'waiting'; // waiting, playing, finished
    this.winner = null;
    this.players = new Set();
    this.moveCount = 0;
  }

  createEmptyBoard() {
    return Array(3).fill().map(() => Array(3).fill(''));
  }

  /**
   * Add a player to the game with global player counting
   * @param {string} playerId - Unique player identifier
   * @param {number} globalPlayerCount - Total players across all servers
   * @returns {object} Player assignment result
   */
  addPlayer(playerId, globalPlayerCount = 0) {
    // Use global count to determine symbol, not local count
    const totalPlayers = Math.max(this.players.size, globalPlayerCount);
    
    if (totalPlayers >= 2) {
      return { success: false, message: 'Game is full' };
    }

    if (this.players.has(playerId)) {
      return { success: false, message: 'Player already in game' };
    }

    // First player globally gets X, second gets O
    const playerSymbol = totalPlayers === 0 ? 'X' : 'O';
    this.players.add(playerId);
    
    if (this.players.size === 2) {
      this.gameStatus = 'playing';
    }

    return { 
      success: true, 
      playerSymbol, 
      gameStatus: this.gameStatus,
      globalPlayerCount: totalPlayers + 1,
      message: `You are player ${playerSymbol}` 
    };
  }

  /**
   * Remove a player from the game
   * @param {string} playerId - Player to remove
   */
  removePlayer(playerId) {
    this.players.delete(playerId);
    if (this.players.size < 2 && this.gameStatus === 'playing') {
      this.gameStatus = 'waiting';
    }
  }

  /**
   * Make a move on the board
   * @param {number} row - Row index (0-2)
   * @param {number} col - Column index (0-2)
   * @param {string} playerId - Player making the move
   * @returns {object} Move result
   */
  makeMove(row, col, playerId) {
    // Validation checks
    const validation = this.validateMove(row, col, playerId);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    // Make the move
    const playerSymbol = this.getPlayerSymbol(playerId);
    this.board[row][col] = playerSymbol;
    this.moveCount++;

    // Check for win condition
    const winResult = this.checkWinCondition();
    if (winResult.hasWinner) {
      this.gameStatus = 'finished';
      this.winner = winResult.winner;
      return {
        success: true,
        gameState: this.getGameState(),
        gameOver: true,
        winner: winResult.winner,
        winningLine: winResult.winningLine
      };
    }

    // Check for draw
    if (this.moveCount === 9) {
      this.gameStatus = 'finished';
      return {
        success: true,
        gameState: this.getGameState(),
        gameOver: true,
        winner: 'draw'
      };
    }

    // Switch turns
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

    return {
      success: true,
      gameState: this.getGameState(),
      gameOver: false
    };
  }

  /**
   * Validate a move attempt
   * @param {number} row - Row index
   * @param {number} col - Column index  
   * @param {string} playerId - Player making the move
   * @returns {object} Validation result
   */
  validateMove(row, col, playerId) {
    // Check if game is in playing state
    if (this.gameStatus !== 'playing') {
      return { valid: false, message: 'Game is not in playing state' };
    }

    // Check if it's player's turn
    const playerSymbol = this.getPlayerSymbol(playerId);
    if (playerSymbol !== this.currentPlayer) {
      return { valid: false, message: `It's not your turn. Current player: ${this.currentPlayer}` };
    }

    // Check bounds
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      return { valid: false, message: 'Move out of bounds. Use 0-2 for row and column' };
    }

    // Check if cell is empty
    if (this.board[row][col] !== '') {
      return { valid: false, message: 'Cell is already occupied' };
    }

    return { valid: true };
  }

  /**
   * Get player symbol for a given player ID
   * @param {string} playerId - Player ID
   * @returns {string} Player symbol (X or O)
   */
  getPlayerSymbol(playerId) {
    const playersArray = Array.from(this.players);
    const playerIndex = playersArray.indexOf(playerId);
    return playerIndex === 0 ? 'X' : 'O';
  }

  /**
   * Check for win conditions
   * @returns {object} Win check result
   */
  checkWinCondition() {
    const lines = [
      // Rows
      [[0,0], [0,1], [0,2]],
      [[1,0], [1,1], [1,2]],
      [[2,0], [2,1], [2,2]],
      // Columns
      [[0,0], [1,0], [2,0]],
      [[0,1], [1,1], [2,1]],
      [[0,2], [1,2], [2,2]],
      // Diagonals
      [[0,0], [1,1], [2,2]],
      [[0,2], [1,1], [2,0]]
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      const valueA = this.board[a[0]][a[1]];
      const valueB = this.board[b[0]][b[1]];
      const valueC = this.board[c[0]][c[1]];

      if (valueA && valueA === valueB && valueA === valueC) {
        return {
          hasWinner: true,
          winner: valueA,
          winningLine: line
        };
      }
    }

    return { hasWinner: false };
  }

  /**
   * Get current game state
   * @returns {object} Complete game state
   */
  getGameState() {
    return {
      board: this.board.map(row => [...row]), // Deep copy
      currentPlayer: this.currentPlayer,
      gameStatus: this.gameStatus,
      winner: this.winner,
      players: Array.from(this.players),
      moveCount: this.moveCount
    };
  }

  /**
   * Reset the game to initial state
   */
  resetGame() {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'X';
    this.gameStatus = this.players.size === 2 ? 'playing' : 'waiting';
    this.winner = null;
    this.moveCount = 0;
  }

  /**
   * Update game state from external source (for synchronization)
   * @param {object} newState - New game state
   */
  updateState(newState) {
    this.board = newState.board;
    this.currentPlayer = newState.currentPlayer;
    this.gameStatus = newState.gameStatus;
    this.winner = newState.winner;
    this.moveCount = newState.moveCount;
    
    // Update players set from array
    if (newState.players && Array.isArray(newState.players)) {
      this.players = new Set(newState.players);
    }
  }
}

module.exports = TicTacToeGame;
