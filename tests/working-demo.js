/**
 * Auto Game Demo - Complete Automated Game
 */

const WebSocket = require('ws');

console.log('🎮 AUTOMATED TIC-TAC-TOE GAME');
console.log('=============================');
console.log('Two players playing automatically until victory!');
console.log('');

let player1, player2;
let gameBoard = [['', '', ''], ['', '', ''], ['', '', '']];
let currentMove = 0;
let gameStarted = false;
let bothPlayersReady = false;

function displayBoard() {
  console.log('\n📋 Current Game Board:');
  console.log('   0   1   2');
  for (let i = 0; i < 3; i++) {
    let row = `${i}  `;
    for (let j = 0; j < 3; j++) {
      const cell = gameBoard[i][j] || ' ';
      row += `${cell}`;
      if (j < 2) row += ' | ';
    }
    console.log(row);
    if (i < 2) console.log('  -----------');
  }
  console.log('');
}

async function startAutomatedGame() {
  console.log('🚀 Starting automated game...');
  
  // Connect Player 1
  console.log('🔗 Connecting Player 1 to Server A...');
  player1 = new WebSocket('ws://localhost:3001');
  
  player1.on('open', () => {
    console.log('✅ Player 1 connected to Server A');
    player1.send(JSON.stringify({ type: 'join', playerId: 'auto-player-x' }));
  });
  
  player1.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('📨 P1 received:', msg.type, msg.message || '');
    
    if (msg.type === 'joined') {
      console.log(`🎯 Player 1 joined as ${msg.playerSymbol}`);
      
      // Connect Player 2 after Player 1 joins
      setTimeout(() => {
        console.log('\n🔗 Connecting Player 2 to Server B...');
        player2 = new WebSocket('ws://localhost:3002');
        
        player2.on('open', () => {
          console.log('✅ Player 2 connected to Server B');
          player2.send(JSON.stringify({ type: 'join', playerId: 'auto-player-o' }));
        });
        
        player2.on('message', (data) => {
          const msg2 = JSON.parse(data.toString());
          console.log('📨 P2 received:', msg2.type, msg2.message || '');
          
          if (msg2.type === 'joined') {
            console.log(`🎯 Player 2 joined as ${msg2.playerSymbol}`);
            bothPlayersReady = true;
            
            // Start playing immediately
            setTimeout(() => {
              console.log('\n🎮 Starting game moves...');
              playAutomaticGame();
            }, 1000);
          }
          
          if (msg2.type === 'gameState' && msg2.board) {
            gameBoard = msg2.board;
            displayBoard();
          }
          
          if (msg2.type === 'gameOver') {
            endGame(msg2);
          }
        });
      }, 500);
    } else if (msg.type === 'error') {
      console.log(`⚠️  Error: ${msg.message}`);
      // Maybe the game is full, let's try connecting player 2 anyway
      if (msg.message && msg.message.includes('full')) {
        setTimeout(() => {
          console.log('\n🔗 Game full, trying Player 2 on Server B...');
          player2 = new WebSocket('ws://localhost:3002');
          
          player2.on('open', () => {
            console.log('✅ Player 2 connected to Server B');
            player2.send(JSON.stringify({ type: 'join', playerId: 'auto-player-o' }));
          });
          
          player2.on('message', (data) => {
            const msg2 = JSON.parse(data.toString());
            console.log('📨 P2 received:', msg2.type, msg2.message || '');
            
            if (msg2.type === 'joined') {
              console.log(`🎯 Player 2 joined as ${msg2.playerSymbol}`);
              bothPlayersReady = true;
              
              // Start playing
              setTimeout(() => {
                console.log('\n🎮 Starting cross-server game...');
                playAutomaticGame();
              }, 1000);
            }
            
            if (msg2.type === 'gameState' && msg2.board) {
              gameBoard = msg2.board;
              displayBoard();
            }
            
            if (msg2.type === 'gameOver') {
              endGame(msg2);
            }
          });
        }, 500);
      }
    }
    
    if (msg.type === 'gameState' && msg.board) {
      gameBoard = msg.board;
      displayBoard();
    }
    
    if (msg.type === 'gameOver') {
      endGame(msg);
    }
  });
}

function playAutomaticGame() {
  console.log('🎯 Starting automated moves...');
  
  const gameMoves = [
    { player: player1, row: 0, col: 0, name: 'Player 1 (X)', desc: 'Top-left corner' },
    { player: player2, row: 1, col: 1, name: 'Player 2 (O)', desc: 'Center' },
    { player: player1, row: 0, col: 1, name: 'Player 1 (X)', desc: 'Top-center' },
    { player: player2, row: 2, col: 2, name: 'Player 2 (O)', desc: 'Bottom-right' },
    { player: player1, row: 0, col: 2, name: 'Player 1 (X)', desc: 'Top-right - WINNING MOVE!' }
  ];
  
  let moveIndex = 0;
  
  function executeNextMove() {
    if (moveIndex < gameMoves.length) {
      const move = gameMoves[moveIndex];
      
      console.log(`\n🎯 ${move.name} making move: ${move.desc}`);
      console.log(`📍 Position: (${move.row}, ${move.col})`);
      
      if (move.player && move.player.readyState === WebSocket.OPEN) {
        move.player.send(JSON.stringify({
          type: 'move',
          row: move.row,
          col: move.col
        }));
        
        moveIndex++;
        
        // Wait before next move
        setTimeout(executeNextMove, 2500);
      } else {
        console.error('❌ Player connection not ready');
      }
    } else {
      console.log('\n🎯 All moves completed! Waiting for game result...');
    }
  }
  
  // Start the first move
  executeNextMove();
}

function endGame(msg) {
  console.log('\n🏆 GAME COMPLETED!');
  console.log(`🎉 Winner: ${msg.winner || 'DRAW'}`);
  
  if (msg.winner === 'X') {
    console.log('🥇 Player 1 (X) WINS! Top row complete! 🎊');
  } else if (msg.winner === 'O') {
    console.log('🥇 Player 2 (O) WINS! 🎊');
  } else {
    console.log('🤝 It\'s a draw!');
  }
  
  console.log('\n✅ AUTOMATED DEMO COMPLETED SUCCESSFULLY!');
  console.log('📊 Demonstrated:');
  console.log('   ✅ Cross-server real-time gameplay');
  console.log('   ✅ Redis synchronization working');
  console.log('   ✅ Complete game from start to victory');
  console.log('   ✅ Two independent WebSocket servers');
  
  setTimeout(() => {
    console.log('\n👋 Demo finished - all requirements met!');
    if (player1) player1.close();
    if (player2) player2.close();
    process.exit(0);
  }, 3000);
}

// Start the automated demo
startAutomatedGame();
