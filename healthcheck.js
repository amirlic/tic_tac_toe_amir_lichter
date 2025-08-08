/**
 * Docker Health Check Script
 * AI-Generated: 90% - Container health monitoring for WebSocket servers
 * Human Refinements: WebSocket-specific health check
 */

const WebSocket = require('ws');

// Health check for WebSocket server
const port = process.env.PORT || 3001;
const ws = new WebSocket(`ws://localhost:${port}`);

const timeout = setTimeout(() => {
  console.log('Health check timeout');
  ws.terminate();
  process.exit(1);
}, 5000);

ws.on('open', () => {
  console.log('Health check passed - WebSocket connection successful');
  clearTimeout(timeout);
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.log(`Health check failed: ${err.message}`);
  clearTimeout(timeout);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
