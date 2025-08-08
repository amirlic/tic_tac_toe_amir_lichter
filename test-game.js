/**
 * Simple test suite for game logic validation
 * AI-Generated: 100% - Test cases for game validation and win detection
 * Human Refinements: None - AI generated comprehensive test coverage
 */

const TicTacToeGame = require('./src/gameLogic');

class GameTester {
  constructor() {
    this.passedTests = 0;
    this.totalTests = 0;
  }

  test(description, testFunction) {
    this.totalTests++;
    try {
      testFunction();
      console.log(`✅ ${description}`);
      this.passedTests++;
    } catch (error) {
      console.log(`❌ ${description}: ${error.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  runAllTests() {
    console.log('🧪 Running Tic-Tac-Toe Game Logic Tests...\n');

    this.testGameInitialization();
    this.testPlayerJoining();
    this.testMoveValidation();
    this.testWinConditions();
    this.testDrawCondition();
    this.testGameState();

    console.log(`\n📊 Test Results: ${this.passedTests}/${this.totalTests} passed`);
    
    if (this.passedTests === this.totalTests) {
      console.log('🎉 All tests passed! Game logic is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
  }

  testGameInitialization() {
    this.test('Game initializes with empty board', () => {
      const game = new TicTacToeGame();
      const state = game.getGameState();
      
      this.assert(state.board.length === 3, 'Board should have 3 rows');
      this.assert(state.board[0].length === 3, 'Board should have 3 columns');
      this.assert(state.currentPlayer === 'X', 'First player should be X');
      this.assert(state.gameStatus === 'waiting', 'Initial status should be waiting');
      this.assert(state.players.length === 0, 'Should start with no players');
    });
  }

  testPlayerJoining() {
    this.test('Players can join the game', () => {
      const game = new TicTacToeGame();
      
      const result1 = game.addPlayer('player1');
      this.assert(result1.success, 'First player should join successfully');
      this.assert(result1.playerSymbol === 'X', 'First player should be X');
      
      const result2 = game.addPlayer('player2');
      this.assert(result2.success, 'Second player should join successfully');
      this.assert(result2.playerSymbol === 'O', 'Second player should be O');
      
      const state = game.getGameState();
      this.assert(state.gameStatus === 'playing', 'Game should be playing with 2 players');
    });

    this.test('Cannot join when game is full', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      game.addPlayer('player2');
      
      const result = game.addPlayer('player3');
      this.assert(!result.success, 'Third player should not be able to join');
    });
  }

  testMoveValidation() {
    this.test('Move validation works correctly', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      game.addPlayer('player2');
      
      // Valid move
      const result1 = game.makeMove(0, 0, 'player1');
      this.assert(result1.success, 'Valid move should succeed');
      
      // Invalid: same cell
      const result2 = game.makeMove(0, 0, 'player2');
      this.assert(!result2.success, 'Cannot move to occupied cell');
      
      // Invalid: wrong turn
      const result3 = game.makeMove(1, 1, 'player1');
      this.assert(!result3.success, 'Cannot move when not your turn');
      
      // Invalid: out of bounds
      const result4 = game.makeMove(3, 3, 'player2');
      this.assert(!result4.success, 'Cannot move out of bounds');
    });
  }

  testWinConditions() {
    this.test('Horizontal win detection', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      game.addPlayer('player2');
      
      // X wins horizontally in first row
      game.makeMove(0, 0, 'player1'); // X
      game.makeMove(1, 0, 'player2'); // O
      game.makeMove(0, 1, 'player1'); // X
      game.makeMove(1, 1, 'player2'); // O
      const result = game.makeMove(0, 2, 'player1'); // X wins
      
      this.assert(result.gameOver, 'Game should be over');
      this.assert(result.winner === 'X', 'X should win');
    });

    this.test('Vertical win detection', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      game.addPlayer('player2');
      
      // O wins vertically in first column
      game.makeMove(0, 0, 'player1'); // X
      game.makeMove(0, 1, 'player2'); // O
      game.makeMove(1, 0, 'player1'); // X
      game.makeMove(1, 1, 'player2'); // O
      game.makeMove(0, 2, 'player1'); // X
      const result = game.makeMove(2, 1, 'player2'); // O wins
      
      this.assert(result.gameOver, 'Game should be over');
      this.assert(result.winner === 'O', 'O should win');
    });

    this.test('Diagonal win detection', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      game.addPlayer('player2');
      
      // X wins diagonally
      game.makeMove(0, 0, 'player1'); // X
      game.makeMove(0, 1, 'player2'); // O
      game.makeMove(1, 1, 'player1'); // X
      game.makeMove(0, 2, 'player2'); // O
      const result = game.makeMove(2, 2, 'player1'); // X wins
      
      this.assert(result.gameOver, 'Game should be over');
      this.assert(result.winner === 'X', 'X should win');
    });
  }

  testDrawCondition() {
    this.test('Draw condition detection', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      game.addPlayer('player2');
      
      // Create a draw scenario
      const moves = [
        {player: 'player1', row: 0, col: 0}, // X
        {player: 'player2', row: 0, col: 1}, // O
        {player: 'player1', row: 0, col: 2}, // X
        {player: 'player2', row: 1, col: 0}, // O
        {player: 'player1', row: 1, col: 2}, // X
        {player: 'player2', row: 1, col: 1}, // O
        {player: 'player1', row: 2, col: 1}, // X
        {player: 'player2', row: 2, col: 2}, // O
        {player: 'player1', row: 2, col: 0}  // X (draw)
      ];
      
      let result;
      for (const move of moves) {
        result = game.makeMove(move.row, move.col, move.player);
      }
      
      this.assert(result.gameOver, 'Game should be over');
      this.assert(result.winner === 'draw', 'Game should end in draw');
    });
  }

  testGameState() {
    this.test('Game state management', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      
      let state = game.getGameState();
      this.assert(state.moveCount === 0, 'Initial move count should be 0');
      
      game.addPlayer('player2');
      game.makeMove(1, 1, 'player1');
      
      state = game.getGameState();
      this.assert(state.moveCount === 1, 'Move count should increment');
      this.assert(state.currentPlayer === 'O', 'Turn should switch to O');
      this.assert(state.board[1][1] === 'X', 'Board should reflect the move');
    });

    this.test('Game reset functionality', () => {
      const game = new TicTacToeGame();
      game.addPlayer('player1');
      game.addPlayer('player2');
      game.makeMove(1, 1, 'player1');
      
      game.resetGame();
      
      const state = game.getGameState();
      this.assert(state.moveCount === 0, 'Move count should reset');
      this.assert(state.currentPlayer === 'X', 'Should reset to X');
      this.assert(state.board[1][1] === '', 'Board should be empty');
    });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new GameTester();
  tester.runAllTests();
}

module.exports = GameTester;
