#!/usr/bin/env node
/**
 * Test with Real Your Spotify API
 */

import { spawn } from 'child_process';
import readline from 'readline';

const TOKEN = process.env.YOUR_SPOTIFY_TOKEN || 'f9b431d6-5bc3-400e-9891-021b7195da43';
const API_URL = process.env.YOUR_SPOTIFY_API_URL || 'https://ms-api.pentafive.net';

// Start the MCP server
const mcpServer = spawn('node', ['build/index.js'], {
  env: {
    ...process.env,
    YOUR_SPOTIFY_API_URL: API_URL,
    YOUR_SPOTIFY_TOKEN: TOKEN,
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

mcpServer.stderr.on('data', (data) => {
  console.error(`[server] ${data.toString().trim()}`);
});

const rl = readline.createInterface({
  input: mcpServer.stdout,
  crlfDelay: Infinity,
});

let responseHandler = null;

rl.on('line', (line) => {
  if (responseHandler) {
    try {
      const response = JSON.parse(line);
      responseHandler(response);
      responseHandler = null;
    } catch {
      // Not JSON
    }
  }
});

function sendMessage(message) {
  return new Promise((resolve) => {
    responseHandler = resolve;
    mcpServer.stdin.write(JSON.stringify(message) + '\n');
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== Testing with REAL Your Spotify API ===\n');
  await sleep(2000);

  // Initialize
  console.log('1. Initializing...');
  await sendMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' },
    },
  });

  mcpServer.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  }) + '\n');

  await sleep(500);

  // Test get_top_tracks with real data
  console.log('\n2. Getting your REAL top 5 tracks (2024)...');
  const topTracksResponse = await sendMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'get_top_tracks',
      arguments: {
        start_date: '2024-01-01',
        limit: 5,
      },
    },
  });

  if (topTracksResponse.result?.content?.[0]?.text) {
    const data = JSON.parse(topTracksResponse.result.content[0].text);
    console.log('\n' + data.message);
    console.log('\nYour Top 5 Tracks of 2024:');
    data.tracks.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.track.name} - ${t.track.artists.join(', ')} (${t.play_count} plays)`);
    });
  } else {
    console.log('Response:', JSON.stringify(topTracksResponse, null, 2));
  }

  console.log('\n=== Real API Test Complete ===');
  mcpServer.stdin.end();
  mcpServer.kill();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Error:', err);
  mcpServer.kill();
  process.exit(1);
});
