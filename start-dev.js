const { spawn } = require('child_process');
const path = require('path');

console.log('=== Starting AURYN Development Environment ===');

// 1. Start WebSocket Event Engine
const wsServerPath = path.join(__dirname, 'ws-server.js');
const wsProcess = spawn('node', [wsServerPath], { stdio: 'inherit', shell: true });

wsProcess.on('error', (err) => {
  console.error('Failed to start WebSockets server:', err);
});

// 2. Start Next.js App Router Server
const nextProcess = spawn('npx', ['next', 'dev'], { stdio: 'inherit', shell: true });

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\nShutting down DineFlow AI services...');
  wsProcess.kill();
  nextProcess.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('\nShutting down DineFlow AI services...');
  wsProcess.kill();
  nextProcess.kill();
  process.exit();
});
