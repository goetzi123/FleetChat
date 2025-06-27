#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚛 FleetChat Complete Demo');
console.log('==========================\n');

console.log('This demo shows how Samsara fleet events are translated into WhatsApp messages for drivers.\n');

console.log('Demo components:');
console.log('1. Message Broker Service (headless API)');
console.log('2. Samsara Event Simulator (generates fleet events)');
console.log('3. WhatsApp Driver Interface (visual demo)');
console.log('');

// Start the message broker in the background
console.log('🔧 Starting FleetChat Message Broker...');
const broker = spawn('npx', ['tsx', 'server/message-broker.ts'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  cwd: process.cwd()
});

broker.stdout.on('data', (data) => {
  console.log(`[Broker] ${data.toString().trim()}`);
});

broker.stderr.on('data', (data) => {
  console.error(`[Broker Error] ${data.toString().trim()}`);
});

// Wait for broker to start
setTimeout(() => {
  console.log('\n📱 Opening WhatsApp Driver Interface...');
  console.log('➡️  Open: demo/whatsapp-driver-interface.html in your browser');
  console.log('');
  
  console.log('🎮 Demo Controls:');
  console.log('- Use the buttons on the right side of the WhatsApp interface');
  console.log('- Each button simulates a different Samsara fleet event');
  console.log('- Watch how events are translated into driver-friendly messages');
  console.log('');
  
  console.log('📋 Available Samsara Events:');
  console.log('• Route Assignment - New delivery route assigned to driver');
  console.log('• Pickup Reminder - Automated reminder before pickup window');
  console.log('• Location Request - Request driver location for ETA updates');
  console.log('• Arrival Notification - Geofence entry at pickup location');
  console.log('• Delivery Due - Notification when delivery is approaching');
  console.log('• HOS Warning - Hours of Service compliance alert');
  console.log('');
  
  console.log('💬 Driver Response Simulation:');
  console.log('- Click buttons in WhatsApp messages to simulate driver responses');
  console.log('- Type messages in the input field to test free-text responses');
  console.log('- Responses are processed and would update Samsara in real deployment');
  console.log('');
  
  // Test broker health
  console.log('🔍 Testing Message Broker...');
  const testBroker = spawn('curl', ['-s', 'http://localhost:3000/health'], {
    stdio: 'pipe'
  });
  
  testBroker.stdout.on('data', (data) => {
    try {
      const health = JSON.parse(data.toString());
      console.log('✅ Message Broker Status:', health.status);
      console.log('📊 Service Health:', JSON.stringify(health.services, null, 2));
    } catch (error) {
      console.log('⚠️  Broker health check response:', data.toString().trim());
    }
  });
  
  setTimeout(() => {
    console.log('\n🎯 Demo Instructions:');
    console.log('1. Open demo/whatsapp-driver-interface.html in your browser');
    console.log('2. Use the demo control buttons to simulate Samsara events');
    console.log('3. Interact with WhatsApp messages as a driver would');
    console.log('4. Observe the realistic message flow and response handling');
    console.log('');
    console.log('🔄 To simulate real Samsara events via API:');
    console.log('   npx tsx demo/samsara-event-simulator.ts [event-type]');
    console.log('');
    console.log('📈 Message Broker Logs:');
    console.log('   Watch the broker console output for event processing details');
    console.log('');
    console.log('Press Ctrl+C to stop the demo');
  }, 3000);
  
}, 2000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping FleetChat Demo...');
  broker.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping FleetChat Demo...');
  broker.kill('SIGTERM');
  process.exit(0);
});