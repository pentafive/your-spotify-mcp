/**
 * Tool: add_tracks_to_playlist
 * Tier: 5 (Spotify Control)
 *
 * Add tracks to an existing Spotify playlist.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const addTracksToPlaylistInputSchema = z.object({
  playlist_id: z
    .string()
    .regex(/^[a-zA-Z0-9]{22}$/)
    .describe('Spotify playlist ID'),
  track_uris: z
    .array(z.string().regex(/^spotify:track:[a-zA-Z0-9]{22}$/))
    .min(1)
    .max(100)
    .describe('Array of Spotify track URIs to add'),
  position: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Position to insert tracks (0 = start, omit = end)'),
});

export type AddTracksToPlaylistInput = z.infer<typeof addTracksToPlaylistInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface AddTracksToPlaylistOutput {
  success: boolean;
  snapshot_id: string;
  tracks_added: number;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const addTracksToPlaylistTool = {
  name: 'add_tracks_to_playlist',
  description: `Add tracks to an existing Spotify playlist.

Use this to append new discoveries or favorites to your playlists.

Example queries:
- "Add my top 10 tracks from this month to my 'Favorites 2024' playlist"
- "Append these songs to my workout playlist"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      playlist_id: {
        type: 'string',
        description: 'Spotify playlist ID',
        pattern: '^[a-zA-Z0-9]{22}$',
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
      position: {
        type: 'number',
        description: 'Position to insert (0 = start, omit = end)',
        minimum: 0,
      },
    },
    required: ['playlist_id', 'track_uris'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleAddTracksToPlaylist(
  input: AddTracksToPlaylistInput,
  client: SpotifyClient
): Promise<AddTracksToPlaylistOutput> {
  const body: { uris: string[]; position?: number } = {
    uris: input.track_uris,
  };
  if (input.position !== undefined) {
    body.position = input.position;
  }

  const response = await client.post<{ snapshot_id: string }>(
    `/playlists/${input.playlist_id}/tracks`,
    body
  );

  return {
    success: true,
    snapshot_id: response.snapshot_id,
    tracks_added: input.track_uris.length,
    message: `Added ${input.track_uris.length} tracks to playlist.`,
  };
}
