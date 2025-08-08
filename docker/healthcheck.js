/**
 * Docker Health Check Script
 * Simple TCP connection test instead of WebSocket
 */

const net = require('net');

// Health check for server port
const port = process.env.PORT || 3001;

const client = new net.Socket();
const timeout = setTimeout(() => {
  console.log('Health check timeout');
  client.destroy();
  process.exit(1);
}, 5000);

client.connect(port, '127.0.0.1', () => {
  console.log('Health check passed - Server port is accessible');
  clearTimeout(timeout);
  client.end();
  process.exit(0);
});

client.on('error', (err) => {
  console.log(`Health check failed: ${err.message}`);
  clearTimeout(timeout);
  process.exit(1);
});
