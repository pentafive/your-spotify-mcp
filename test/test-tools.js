#!/usr/bin/env node
/**
 * Test script for Your Spotify MCP Server
 *
 * Sends JSON-RPC messages to the MCP server to test tools.
 *
 * Usage:
 *   1. Start mock server: node test/mock-server.js
 *   2. Run this test: YOUR_SPOTIFY_API_URL=http://localhost:8765 YOUR_SPOTIFY_TOKEN=test node test/test-tools.js
 */

import { spawn } from 'child_process';
import readline from 'readline';

// Start the MCP server
const mcpServer = spawn('node', ['build/index.js'], {
  env: {
    ...process.env,
    YOUR_SPOTIFY_API_URL: process.env.YOUR_SPOTIFY_API_URL || 'http://localhost:8765',
    YOUR_SPOTIFY_TOKEN: process.env.YOUR_SPOTIFY_TOKEN || 'test_token',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

// Track stderr for debugging
mcpServer.stderr.on('data', (data) => {
  console.error(`[server stderr] ${data.toString().trim()}`);
});

// Create readline interface for reading responses
const rl = readline.createInterface({
  input: mcpServer.stdout,
  crlfDelay: Infinity,
});

let responseHandler = null;

rl.on('line', (line) => {
  console.log(`[server stdout] ${line}`);
  if (responseHandler) {
    try {
      const response = JSON.parse(line);
      responseHandler(response);
      responseHandler = null;
    } catch {
      // Not JSON, ignore
    }
  }
});

// Send a JSON-RPC message and wait for response
function sendMessage(message) {
  return new Promise((resolve) => {
    responseHandler = resolve;
    const jsonStr = JSON.stringify(message);
    console.log(`\n[client] Sending: ${jsonStr}`);
    mcpServer.stdin.write(jsonStr + '\n');
  });
}

// Wait a bit for server to start
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== Your Spotify MCP Server Test ===\n');
  console.log('Waiting for server to start...');
  await sleep(2000);

  // Test 1: Initialize
  console.log('\n--- Test 1: Initialize ---');
  const initResponse = await sendMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  });
  console.log('Init response:', JSON.stringify(initResponse, null, 2));

  // Send initialized notification
  mcpServer.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  }) + '\n');

  await sleep(500);

  // Test 2: List tools
  console.log('\n--- Test 2: List Tools ---');
  const listToolsResponse = await sendMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  console.log('Tools:', JSON.stringify(listToolsResponse, null, 2));

  // Test 3: Call get_top_tracks
  console.log('\n--- Test 3: Call get_top_tracks ---');
  const topTracksResponse = await sendMessage({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_top_tracks',
      arguments: {
        limit: 5,
      },
    },
  });
  console.log('Top tracks response:', JSON.stringify(topTracksResponse, null, 2));

  // Test 4: Call get_track_stats
  console.log('\n--- Test 4: Call get_track_stats ---');
  const trackStatsResponse = await sendMessage({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'get_track_stats',
      arguments: {
        track_id: '4cOdK2wGLETKBW3PvgPWqT',
      },
    },
  });
  console.log('Track stats response:', JSON.stringify(trackStatsResponse, null, 2));

  console.log('\n=== Tests Complete ===');

  // Clean shutdown
  mcpServer.stdin.end();
  mcpServer.kill();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  mcpServer.kill();
  process.exit(1);
});
