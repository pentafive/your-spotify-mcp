/**
 * Tool: play_tracks
 * Tier: 5 (Spotify Control)
 *
 * Start playing specific tracks or context.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const playTracksInputSchema = z.object({
  uris: z
    .array(z.string().regex(/^spotify:track:[a-zA-Z0-9]{22}$/))
    .max(100)
    .optional()
    .describe('Spotify track URIs to play'),
  context_uri: z
    .string()
    .regex(/^spotify:(album|playlist|artist):[a-zA-Z0-9]{22}$/)
    .optional()
    .describe('Album/playlist URI (alternative to uris)'),
  offset_position: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Position to start in context'),
  device_id: z
    .string()
    .optional()
    .describe('Target device ID'),
});

export type PlayTracksInput = z.infer<typeof playTracksInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface PlayTracksOutput {
  success: boolean;
  tracks_queued?: number;
  context?: string;
  device_id?: string;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const playTracksTool = {
  name: 'play_tracks',
  description: `Start playing specific tracks, an album, or a playlist.

Provide either track URIs or a context URI (album/playlist/artist).

Example queries:
- "Play my affinity tracks"
- "Play the album OK Computer"
- "Start playing my Discover Weekly"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      uris: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^spotify:track:[a-zA-Z0-9]{22}$',
        },
        description: 'Track URIs to play',
        maxItems: 100,
      },
      context_uri: {
        type: 'string',
        description: 'Album/playlist/artist URI',
        pattern: '^spotify:(album|playlist|artist):[a-zA-Z0-9]{22}$',
      },
      offset_position: {
        type: 'number',
        description: 'Starting position in context',
        minimum: 0,
      },
      device_id: {
        type: 'string',
        description: 'Target device ID',
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handlePlayTracks(
  input: PlayTracksInput,
  client: SpotifyClient
): Promise<PlayTracksOutput> {
  if (!input.uris && !input.context_uri) {
    throw new Error('Either uris or context_uri is required');
  }

  const body: Record<string, unknown> = {};

  if (input.uris) {
    body.uris = input.uris;
  }

  if (input.context_uri) {
    body.context_uri = input.context_uri;
    if (input.offset_position !== undefined) {
      body.offset = { position: input.offset_position };
    }
  }

  const params = input.device_id ? `?device_id=${input.device_id}` : '';
  await client.put(`/me/player/play${params}`, body);

  return {
    success: true,
    tracks_queued: input.uris?.length,
    context: input.context_uri,
    device_id: input.device_id,
    message: input.uris
      ? `Started playing ${input.uris.length} tracks`
      : `Started playing ${input.context_uri}`,
  };
}
