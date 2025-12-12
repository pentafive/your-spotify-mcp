#!/usr/bin/env node
/**
 * Mock Your Spotify API Server for Testing
 *
 * Run this to test the MCP server without needing real Your Spotify authentication.
 *
 * Usage:
 *   node test/mock-server.js
 *
 * Then set YOUR_SPOTIFY_API_URL=http://localhost:8765
 */

import http from 'http';

const PORT = process.env.MOCK_PORT || 8766;

// Mock data
const mockTracks = [
  {
    id: '4cOdK2wGLETKBW3PvgPWqT',
    name: 'Bohemian Rhapsody',
    artists: [{ id: '1dfeR4HaWDbWqFHLkxsg1d', name: 'Queen' }],
    album: { id: '1GbtB4zTqAsyfZEsm1RZfx', name: 'A Night at the Opera', release_date: '1975-11-21' },
    duration_ms: 354947,
    explicit: false,
    uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
  },
  {
    id: '3n3Ppam7vgaVa1iaRUc9Lp',
    name: 'Mr. Brightside',
    artists: [{ id: '0C0XlULifJtAgn6ZNCW2eu', name: 'The Killers' }],
    album: { id: '4piJq7R3gjUOxnYs6lDCTg', name: 'Hot Fuss', release_date: '2004-06-07' },
    duration_ms: 222973,
    explicit: false,
    uri: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
  },
  {
    id: '2tpWsVSb9UEmDRxAl1zhX1',
    name: 'Blinding Lights',
    artists: [{ id: '1Xyo4u8uXC1ZmMpatF05PJ', name: 'The Weeknd' }],
    album: { id: '4yP0hdKOZPNshxUOjY0cZj', name: 'After Hours', release_date: '2020-03-20' },
    duration_ms: 200040,
    explicit: false,
    uri: 'spotify:track:2tpWsVSb9UEmDRxAl1zhX1',
  },
  {
    id: '7qiZfU4dY1lWllzX7mPBI3',
    name: 'Shape of You',
    artists: [{ id: '6eUKZXaKkcviH0Ku9w2n3V', name: 'Ed Sheeran' }],
    album: { id: '3T4tUhGYeRNVUGevb0wThu', name: '÷ (Divide)', release_date: '2017-03-03' },
    duration_ms: 233713,
    explicit: false,
    uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3',
  },
  {
    id: '0VjIjW4GlUZAMYd2vXMi3b',
    name: 'Blinding Lights',
    artists: [{ id: '1Xyo4u8uXC1ZmMpatF05PJ', name: 'The Weeknd' }],
    album: { id: '4yP0hdKOZPNshxUOjY0cZj', name: 'After Hours', release_date: '2020-03-20' },
    duration_ms: 200040,
    explicit: true,
    uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
  },
];

const mockTopTracks = mockTracks.map((track, i) => ({
  track,
  play_count: 150 - i * 20,
}));

// Request handler
function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  console.log(`[mock] ${req.method} ${path}`);

  // Check for auth header (accept any token for mock)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // Route handling
  if (path === '/' || path === '') {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Mock Your Spotify API', version: '1.0.0' }));
    return;
  }

  if (path === '/me') {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 'mock_user_123',
      username: 'TestUser',
      settings: { timezone: 'America/Los_Angeles' },
    }));
    return;
  }

  // Track stats: /track/:id/stats
  const trackStatsMatch = path.match(/^\/track\/([a-zA-Z0-9]+)\/stats$/);
  if (trackStatsMatch) {
    const trackId = trackStatsMatch[1];
    const track = mockTracks.find(t => t.id === trackId) || mockTracks[0];

    res.writeHead(200);
    res.end(JSON.stringify({
      track,
      total_plays: 127,
      total_duration_ms: track.duration_ms * 127,
      first_played: '2023-06-15T14:32:00Z',
      last_played: '2025-12-03T22:15:00Z',
      average_plays_per_day: 0.23,
      peak_day: '2024-07-04',
      peak_day_plays: 8,
    }));
    return;
  }

  // Top tracks: /top/tracks
  if (path === '/top/tracks') {
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const startDate = url.searchParams.get('start_date') || '2020-01-01';
    const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    res.writeHead(200);
    res.end(JSON.stringify({
      tracks: mockTopTracks.slice(0, limit),
      period: { start: startDate, end: endDate },
      total_count: mockTopTracks.length,
    }));
    return;
  }

  // Top artists: /top/artists
  if (path === '/top/artists') {
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const startDate = url.searchParams.get('start_date') || '2020-01-01';
    const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    const artists = [
      { artist: { id: '1dfeR4HaWDbWqFHLkxsg1d', name: 'Queen' }, play_count: 450, listening_time_ms: 1500000 },
      { artist: { id: '0C0XlULifJtAgn6ZNCW2eu', name: 'The Killers' }, play_count: 380, listening_time_ms: 1200000 },
      { artist: { id: '1Xyo4u8uXC1ZmMpatF05PJ', name: 'The Weeknd' }, play_count: 320, listening_time_ms: 1000000 },
    ];

    res.writeHead(200);
    res.end(JSON.stringify({
      artists: artists.slice(0, limit),
      period: { start: startDate, end: endDate },
      total_count: artists.length,
    }));
    return;
  }

  // Custom Wrapped: /wrapped/custom
  if (path === '/wrapped/custom') {
    const startDate = url.searchParams.get('start_date') || '2024-06-01';
    const endDate = url.searchParams.get('end_date') || '2024-08-31';

    res.writeHead(200);
    res.end(JSON.stringify({
      period: { start: startDate, end: endDate },
      total_listening_time_ms: 8640000000, // 100 hours
      total_tracks_played: 2847,
      unique_tracks: 423,
      unique_artists: 89,
      top_tracks: mockTopTracks.slice(0, 5),
      top_artists: [
        { artist: { id: '1dfeR4HaWDbWqFHLkxsg1d', name: 'Queen' }, play_count: 156, listening_time_ms: 5400000 },
        { artist: { id: '0C0XlULifJtAgn6ZNCW2eu', name: 'The Killers' }, play_count: 134, listening_time_ms: 4200000 },
        { artist: { id: '1Xyo4u8uXC1ZmMpatF05PJ', name: 'The Weeknd' }, play_count: 98, listening_time_ms: 3600000 },
      ],
      top_albums: [
        { album: { id: '1GbtB4zTqAsyfZEsm1RZfx', name: 'A Night at the Opera', release_date: '1975-11-21' }, play_count: 87 },
        { album: { id: '4piJq7R3gjUOxnYs6lDCTg', name: 'Hot Fuss', release_date: '2004-06-07' }, play_count: 72 },
      ],
      listening_by_hour: { '9': 45, '12': 89, '15': 67, '18': 120, '21': 156 },
      listening_by_day: { '0': 245, '1': 312, '2': 298, '3': 278, '4': 334, '5': 389, '6': 291 },
      new_discoveries: {
        tracks: [mockTracks[2], mockTracks[3]],
        artists: [{ id: 'new1', name: 'New Discovery Artist' }],
      },
    }));
    return;
  }

  // Affinity: /collaborative/affinity
  if (path === '/collaborative/affinity') {
    const mode = url.searchParams.get('mode') || 'minima';
    const ids = (url.searchParams.get('ids') || '').split(',');

    res.writeHead(200);
    res.end(JSON.stringify({
      users: ids.map((id, i) => ({ id, username: `User${i + 1}` })),
      tracks: mockTracks.slice(0, 3).map((track, i) => ({
        track,
        score: 0.85 - (i * 0.15),
        play_counts: Object.fromEntries(ids.map((id, j) => [id, 50 - (i * 10) - (j * 5)])),
      })),
      stats: { overlap_percentage: 42 },
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found', message: `Unknown endpoint: ${path}` }));
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`[mock] Your Spotify Mock API running at http://localhost:${PORT}`);
  console.log(`[mock] Use any token for authentication`);
  console.log(`[mock] Press Ctrl+C to stop`);
});
