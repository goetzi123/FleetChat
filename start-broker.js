#!/usr/bin/env node

// Simple startup script for FleetChat Message Broker
const { spawn } = require('child_process');
const path = require('path');

console.log('🚛 Starting FleetChat Message Broker...');
console.log('📡 Headless service - no user interface');
console.log('🔗 Webhook endpoints for Samsara ↔ WhatsApp communication');
console.log('');

// Start the message broker service
const broker = spawn('npx', ['tsx', 'server/message-broker.ts'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

broker.on('error', (error) => {
  console.error('Failed to start message broker:', error);
  process.exit(1);
});

broker.on('close', (code) => {
  console.log(`Message broker exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down FleetChat Message Broker...');
  broker.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down FleetChat Message Broker...');
  broker.kill('SIGTERM');
});