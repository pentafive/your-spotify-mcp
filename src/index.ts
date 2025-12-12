#!/usr/bin/env node
/**
 * Your Spotify MCP Server
 *
 * A Model Context Protocol server that connects AI assistants to:
 * - Your Spotify API (analytics, history, affinity) - Tiers 1-4
 * - Spotify Web API (playlists, playback) - Tier 5 (optional)
 *
 * Transport: STDIO (for Claude Desktop integration)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { createYourSpotifyClient, YourSpotifyClient } from './lib/your-spotify-client.js';
import { createSpotifyClient, SpotifyClient } from './lib/spotify-client.js';
import { YourSpotifyService } from './services/your-spotify-service.js';

// Tier 1 Tools
import {
  getTrackStatsTool, getTrackStatsInputSchema, handleGetTrackStats,
  getTopTracksTool, getTopTracksInputSchema, handleGetTopTracks,
  getArtistStatsTool, getArtistStatsInputSchema, handleGetArtistStats,
  getTopArtistsTool, getTopArtistsInputSchema, handleGetTopArtists,
  searchListeningHistoryTool, searchListeningHistoryInputSchema, handleSearchListeningHistory,
} from './tools/tier1/index.js';

// Tier 2 Tools
import {
  createCustomWrappedTool, createCustomWrappedInputSchema, handleCreateCustomWrapped,
  analyzeAffinityTool, analyzeAffinityInputSchema, handleAnalyzeAffinity,
  getListeningTimelineTool, getListeningTimelineInputSchema, handleGetListeningTimeline,
  getArtistRankTool, getArtistRankInputSchema, handleGetArtistRank,
  getTrackRankTool, getTrackRankInputSchema, handleGetTrackRank,
} from './tools/tier2/index.js';

// Tier 3 Tools
import {
  analyzeListeningPatternsTool, analyzeListeningPatternsInputSchema, handleAnalyzeListeningPatterns,
  getDiscoveryInsightsTool, getDiscoveryInsightsInputSchema, handleGetDiscoveryInsights,
  compareListeningPeriodsTool, compareListeningPeriodsInputSchema, handleCompareListeningPeriods,
  exportListeningDataTool, exportListeningDataInputSchema, handleExportListeningData,
} from './tools/tier3/index.js';

// Tier 4 Tools
import {
  updateUserSettingsTool, updateUserSettingsInputSchema, handleUpdateUserSettings,
  renameAccountTool, renameAccountInputSchema, handleRenameAccount,
  generatePublicShareLinkTool, generatePublicShareLinkInputSchema, handleGeneratePublicShareLink,
  revokePublicAccessTool, revokePublicAccessInputSchema, handleRevokePublicAccess,
} from './tools/tier4/index.js';

// Tier 5 Tools
import {
  createPlaylistTool, createPlaylistInputSchema, handleCreatePlaylist,
  addTracksToPlaylistTool, addTracksToPlaylistInputSchema, handleAddTracksToPlaylist,
  searchSpotifyCatalogTool, searchSpotifyCatalogInputSchema, handleSearchSpotifyCatalog,
  getCurrentPlaybackTool, getCurrentPlaybackInputSchema, handleGetCurrentPlayback,
  controlPlaybackTool, controlPlaybackInputSchema, handleControlPlayback,
  playTracksTool, playTracksInputSchema, handlePlayTracks,
  queueTracksTool, queueTracksInputSchema, handleQueueTracks,
  getUserPlaylistsTool, getUserPlaylistsInputSchema, handleGetUserPlaylists,
  updatePlaylistDetailsTool, updatePlaylistDetailsInputSchema, handleUpdatePlaylistDetails,
  removeFromPlaylistTool, removeFromPlaylistInputSchema, handleRemoveFromPlaylist,
} from './tools/tier5/index.js';

// ============================================================
// Server Configuration
// ============================================================

const SERVER_INFO = {
  name: 'your-spotify-mcp',
  version: '0.2.0',
};

const SERVER_CAPABILITIES = {
  tools: {},
};

// ============================================================
// Helper: Register Tool
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerYourSpotifyTool(
  server: McpServer,
  tool: { name: string; description: string; inputSchema: unknown },
  schema: z.ZodSchema<any>,
  handler: (input: any, service: YourSpotifyService) => Promise<unknown>,
  service: YourSpotifyService
) {
  server.registerTool(
    tool.name,
    { description: tool.description, inputSchema: schema },
    async (args) => {
      try {
        const validatedInput = schema.parse(args);
        const result = await handler(validatedInput, service);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerSpotifyTool(
  server: McpServer,
  tool: { name: string; description: string; inputSchema: unknown },
  schema: z.ZodSchema<any>,
  handler: (input: any, client: SpotifyClient) => Promise<unknown>,
  client: SpotifyClient
) {
  server.registerTool(
    tool.name,
    { description: tool.description, inputSchema: schema },
    async (args) => {
      try {
        const validatedInput = schema.parse(args);
        const result = await handler(validatedInput, client);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}

// ============================================================
// Main Entry Point
// ============================================================

async function main(): Promise<void> {
  console.error('[your-spotify-mcp] Starting server...');

  // Initialize clients
  let yourSpotifyClient: YourSpotifyClient;
  let spotifyClient: SpotifyClient | null = null;

  try {
    yourSpotifyClient = createYourSpotifyClient();
    console.error('[your-spotify-mcp] Your Spotify client initialized');
  } catch (error) {
    console.error('[your-spotify-mcp] Failed to initialize Your Spotify client:', error);
    console.error('[your-spotify-mcp] Required environment variables:');
    console.error('  YOUR_SPOTIFY_API_URL - URL to your Your Spotify API');
    console.error('  YOUR_SPOTIFY_TOKEN - Your Your Spotify API token');
    process.exit(1);
  }

  try {
    spotifyClient = createSpotifyClient();
    if (spotifyClient) {
      console.error('[your-spotify-mcp] Spotify Web API client initialized (Tier 5 enabled)');
    } else {
      console.error('[your-spotify-mcp] Spotify Web API not configured (Tier 5 disabled)');
    }
  } catch (error) {
    console.error('[your-spotify-mcp] Failed to initialize Spotify client:', error);
  }

  const yourSpotifyService = new YourSpotifyService(yourSpotifyClient);

  // Create MCP server
  const server = new McpServer(SERVER_INFO, {
    capabilities: SERVER_CAPABILITIES,
    instructions: `Your Spotify MCP Server v0.2.0 - Complete 28-tool suite

Tiers 1-4 (Your Spotify API - Analytics & Management):
- Query unlimited listening history
- Get detailed stats for any track or artist
- Generate custom "Spotify Wrapped" for any date range
- Analyze listening patterns and discover insights
- Manage account settings and public sharing

${spotifyClient ? `Tier 5 (Spotify Web API - Control):
- Create playlists from analytics results
- Control playback (play, pause, skip, volume)
- Search Spotify catalog
- Manage queue and playlists` : 'Tier 5 (Spotify Web API) is not configured.'}`,
  });

  // ============================================================
  // Register Tier 1 Tools: Core Analytics
  // ============================================================

  registerYourSpotifyTool(server, getTrackStatsTool, getTrackStatsInputSchema, handleGetTrackStats, yourSpotifyService);
  registerYourSpotifyTool(server, getTopTracksTool, getTopTracksInputSchema, handleGetTopTracks, yourSpotifyService);
  registerYourSpotifyTool(server, getArtistStatsTool, getArtistStatsInputSchema, handleGetArtistStats, yourSpotifyService);
  registerYourSpotifyTool(server, getTopArtistsTool, getTopArtistsInputSchema, handleGetTopArtists, yourSpotifyService);
  registerYourSpotifyTool(server, searchListeningHistoryTool, searchListeningHistoryInputSchema, handleSearchListeningHistory, yourSpotifyService);

  console.error('[your-spotify-mcp] Registered 5 Tier 1 tools (Core Analytics)');

  // ============================================================
  // Register Tier 2 Tools: Enhanced Analytics
  // ============================================================

  registerYourSpotifyTool(server, createCustomWrappedTool, createCustomWrappedInputSchema, handleCreateCustomWrapped, yourSpotifyService);
  registerYourSpotifyTool(server, analyzeAffinityTool, analyzeAffinityInputSchema, handleAnalyzeAffinity, yourSpotifyService);
  registerYourSpotifyTool(server, getListeningTimelineTool, getListeningTimelineInputSchema, handleGetListeningTimeline, yourSpotifyService);
  registerYourSpotifyTool(server, getArtistRankTool, getArtistRankInputSchema, handleGetArtistRank, yourSpotifyService);
  registerYourSpotifyTool(server, getTrackRankTool, getTrackRankInputSchema, handleGetTrackRank, yourSpotifyService);

  console.error('[your-spotify-mcp] Registered 5 Tier 2 tools (Enhanced Analytics)');

  // ============================================================
  // Register Tier 3 Tools: Power Analytics
  // ============================================================

  registerYourSpotifyTool(server, analyzeListeningPatternsTool, analyzeListeningPatternsInputSchema, handleAnalyzeListeningPatterns, yourSpotifyService);
  registerYourSpotifyTool(server, getDiscoveryInsightsTool, getDiscoveryInsightsInputSchema, handleGetDiscoveryInsights, yourSpotifyService);
  registerYourSpotifyTool(server, compareListeningPeriodsTool, compareListeningPeriodsInputSchema, handleCompareListeningPeriods, yourSpotifyService);
  registerYourSpotifyTool(server, exportListeningDataTool, exportListeningDataInputSchema, handleExportListeningData, yourSpotifyService);

  console.error('[your-spotify-mcp] Registered 4 Tier 3 tools (Power Analytics)');

  // ============================================================
  // Register Tier 4 Tools: Your Spotify Management
  // ============================================================

  registerYourSpotifyTool(server, updateUserSettingsTool, updateUserSettingsInputSchema, handleUpdateUserSettings, yourSpotifyService);
  registerYourSpotifyTool(server, renameAccountTool, renameAccountInputSchema, handleRenameAccount, yourSpotifyService);
  registerYourSpotifyTool(server, generatePublicShareLinkTool, generatePublicShareLinkInputSchema, handleGeneratePublicShareLink, yourSpotifyService);
  registerYourSpotifyTool(server, revokePublicAccessTool, revokePublicAccessInputSchema, handleRevokePublicAccess, yourSpotifyService);

  console.error('[your-spotify-mcp] Registered 4 Tier 4 tools (Management)');

  // ============================================================
  // Register Tier 5 Tools: Spotify Control (if configured)
  // ============================================================

  if (spotifyClient) {
    registerSpotifyTool(server, createPlaylistTool, createPlaylistInputSchema, handleCreatePlaylist, spotifyClient);
    registerSpotifyTool(server, addTracksToPlaylistTool, addTracksToPlaylistInputSchema, handleAddTracksToPlaylist, spotifyClient);
    registerSpotifyTool(server, searchSpotifyCatalogTool, searchSpotifyCatalogInputSchema, handleSearchSpotifyCatalog, spotifyClient);
    registerSpotifyTool(server, getCurrentPlaybackTool, getCurrentPlaybackInputSchema, handleGetCurrentPlayback, spotifyClient);
    registerSpotifyTool(server, controlPlaybackTool, controlPlaybackInputSchema, handleControlPlayback, spotifyClient);
    registerSpotifyTool(server, playTracksTool, playTracksInputSchema, handlePlayTracks, spotifyClient);
    registerSpotifyTool(server, queueTracksTool, queueTracksInputSchema, handleQueueTracks, spotifyClient);
    registerSpotifyTool(server, getUserPlaylistsTool, getUserPlaylistsInputSchema, handleGetUserPlaylists, spotifyClient);
    registerSpotifyTool(server, updatePlaylistDetailsTool, updatePlaylistDetailsInputSchema, handleUpdatePlaylistDetails, spotifyClient);
    registerSpotifyTool(server, removeFromPlaylistTool, removeFromPlaylistInputSchema, handleRemoveFromPlaylist, spotifyClient);

    console.error('[your-spotify-mcp] Registered 10 Tier 5 tools (Spotify Control)');
  }

  // ============================================================
  // Connect to Transport
  // ============================================================

  const transport = new StdioServerTransport();

  server.server.onclose = () => {
    console.error('[your-spotify-mcp] Server closed');
    process.exit(0);
  };

  await server.connect(transport);
  console.error(`[your-spotify-mcp] Server ready with ${spotifyClient ? 28 : 18} tools`);
}

// Run the server
main().catch((error) => {
  console.error('[your-spotify-mcp] Fatal error:', error);
  process.exit(1);
});
