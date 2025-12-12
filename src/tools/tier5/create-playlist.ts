/**
 * Tool: create_playlist_from_query
 * Tier: 5 (Spotify Control)
 *
 * Create a Spotify playlist from track URIs.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const createPlaylistInputSchema = z.object({
  playlist_name: z
    .string()
    .min(1)
    .max(100)
    .describe('Name for the new playlist'),
  playlist_description: z
    .string()
    .max(300)
    .optional()
    .describe('Optional description for the playlist'),
  track_uris: z
    .array(z.string().regex(/^spotify:track:[a-zA-Z0-9]{22}$/))
    .min(1)
    .max(100)
    .describe('Array of Spotify track URIs to add'),
  public: z
    .boolean()
    .default(false)
    .describe('Whether the playlist should be public'),
});

export type CreatePlaylistInput = z.infer<typeof createPlaylistInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface CreatePlaylistOutput {
  success: boolean;
  playlist_id: string;
  playlist_url: string;
  tracks_added: number;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const createPlaylistTool = {
  name: 'create_playlist_from_query',
  description: `Create a new Spotify playlist from track URIs.

Perfect for turning Your Spotify analytics results into playable playlists.

Example queries:
- "Create a playlist called 'Summer 2024' with my top 50 tracks"
- "Make a playlist from my affinity results with Sarah"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      playlist_name: {
        type: 'string',
        description: 'Name for the new playlist',
        minLength: 1,
        maxLength: 100,
      },
      playlist_description: {
        type: 'string',
        description: 'Optional description',
        maxLength: 300,
      },
      track_uris: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^spotify:track:[a-zA-Z0-9]{22}$',
        },
        description: 'Array of Spotify track URIs',
        minItems: 1,
        maxItems: 100,
      },
      public: {
        type: 'boolean',
        description: 'Whether playlist should be public',
        default: false,
      },
    },
    required: ['playlist_name', 'track_uris'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleCreatePlaylist(
  input: CreatePlaylistInput,
  client: SpotifyClient
): Promise<CreatePlaylistOutput> {
  // Get current user ID
  const userId = await client.getCurrentUserId();

  // Create the playlist
  const playlist = await client.post<{
    id: string;
    external_urls: { spotify: string };
  }>(`/users/${userId}/playlists`, {
    name: input.playlist_name,
    description: input.playlist_description || '',
    public: input.public,
  });

  // Add tracks to the playlist
  await client.post(`/playlists/${playlist.id}/tracks`, {
    uris: input.track_uris,
  });

  return {
    success: true,
    playlist_id: playlist.id,
    playlist_url: playlist.external_urls.spotify,
    tracks_added: input.track_uris.length,
    message: `Created playlist "${input.playlist_name}" with ${input.track_uris.length} tracks.`,
  };
}
