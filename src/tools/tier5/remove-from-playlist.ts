/**
 * Tool: remove_from_playlist
 * Tier: 5 (Spotify Control)
 *
 * Remove tracks from a Spotify playlist.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const removeFromPlaylistInputSchema = z.object({
  playlist_id: z
    .string()
    .regex(/^[a-zA-Z0-9]{22}$/)
    .describe('Spotify playlist ID'),
  track_uris: z
    .array(z.string().regex(/^spotify:track:[a-zA-Z0-9]{22}$/))
    .min(1)
    .max(100)
    .describe('Track URIs to remove'),
  snapshot_id: z
    .string()
    .optional()
    .describe('Playlist version for safe removal'),
});

export type RemoveFromPlaylistInput = z.infer<typeof removeFromPlaylistInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface RemoveFromPlaylistOutput {
  success: boolean;
  snapshot_id: string;
  tracks_removed: number;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const removeFromPlaylistTool = {
  name: 'remove_from_playlist',
  description: `Remove specific tracks from a Spotify playlist.

Example queries:
- "Remove all Christmas songs from my 'Year Round' playlist"
- "Delete this song from my favorites playlist"`,
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
        description: 'Track URIs to remove',
        minItems: 1,
        maxItems: 100,
      },
      snapshot_id: {
        type: 'string',
        description: 'Playlist version (optional)',
      },
    },
    required: ['playlist_id', 'track_uris'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleRemoveFromPlaylist(
  input: RemoveFromPlaylistInput,
  client: SpotifyClient
): Promise<RemoveFromPlaylistOutput> {
  const body: Record<string, unknown> = {
    tracks: input.track_uris.map(uri => ({ uri })),
  };

  if (input.snapshot_id) {
    body.snapshot_id = input.snapshot_id;
  }

  const response = await client.delete<{ snapshot_id: string }>(
    `/playlists/${input.playlist_id}/tracks`,
    body
  );

  return {
    success: true,
    snapshot_id: response.snapshot_id,
    tracks_removed: input.track_uris.length,
    message: `Removed ${input.track_uris.length} tracks from playlist.`,
  };
}
