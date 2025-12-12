/**
 * Tool: queue_tracks
 * Tier: 5 (Spotify Control)
 *
 * Add tracks to playback queue.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const queueTracksInputSchema = z.object({
  track_uris: z
    .array(z.string().regex(/^spotify:track:[a-zA-Z0-9]{22}$/))
    .min(1)
    .max(50)
    .describe('Spotify track URIs to add to queue'),
  device_id: z
    .string()
    .optional()
    .describe('Target device ID'),
});

export type QueueTracksInput = z.infer<typeof queueTracksInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface QueueTracksOutput {
  success: boolean;
  tracks_queued: number;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const queueTracksTool = {
  name: 'queue_tracks',
  description: `Add tracks to your Spotify playback queue.

Queued tracks play after the current track and any other queued items.

Example queries:
- "Queue my top 5 tracks from last month"
- "Add this song to my queue"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      track_uris: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^spotify:track:[a-zA-Z0-9]{22}$',
        },
        description: 'Track URIs to queue',
        minItems: 1,
        maxItems: 50,
      },
      device_id: {
        type: 'string',
        description: 'Target device ID',
      },
    },
    required: ['track_uris'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleQueueTracks(
  input: QueueTracksInput,
  client: SpotifyClient
): Promise<QueueTracksOutput> {
  // Spotify API only allows queueing one track at a time
  let queued = 0;
  for (const uri of input.track_uris) {
    const params = new URLSearchParams({ uri });
    if (input.device_id) {
      params.set('device_id', input.device_id);
    }
    await client.post(`/me/player/queue?${params.toString()}`, undefined);
    queued++;
  }

  return {
    success: true,
    tracks_queued: queued,
    message: `Added ${queued} tracks to your queue.`,
  };
}
