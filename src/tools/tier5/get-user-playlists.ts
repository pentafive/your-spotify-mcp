/**
 * Tool: get_user_playlists
 * Tier: 5 (Spotify Control)
 *
 * List user's Spotify playlists.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getUserPlaylistsInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Number of playlists to return'),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Index of first playlist to return'),
});

export type GetUserPlaylistsInput = z.infer<typeof getUserPlaylistsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetUserPlaylistsOutput {
  success: boolean;
  playlists: {
    id: string;
    name: string;
    description: string | null;
    tracks_total: number;
    public: boolean;
    uri: string;
  }[];
  total: number;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getUserPlaylistsTool = {
  name: 'get_user_playlists',
  description: `Get a list of your Spotify playlists.

Returns playlist names, IDs, track counts, and whether they're public.

Example queries:
- "Show me my Spotify playlists"
- "List my playlists"
- "What playlists do I have?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        description: 'Number of playlists (1-50)',
        minimum: 1,
        maximum: 50,
        default: 20,
      },
      offset: {
        type: 'number',
        description: 'Starting index',
        minimum: 0,
        default: 0,
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetUserPlaylists(
  input: GetUserPlaylistsInput,
  client: SpotifyClient
): Promise<GetUserPlaylistsOutput> {
  const response = await client.get<{
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      tracks: { total: number };
      public: boolean;
      uri: string;
    }>;
    total: number;
  }>('/me/playlists', {
    limit: input.limit || 20,
    offset: input.offset || 0,
  });

  return {
    success: true,
    playlists: response.items.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      tracks_total: p.tracks.total,
      public: p.public,
      uri: p.uri,
    })),
    total: response.total,
    message: `Found ${response.total} playlists. Showing ${response.items.length}.`,
  };
}
