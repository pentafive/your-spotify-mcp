/**
 * Tool: control_playback
 * Tier: 5 (Spotify Control)
 *
 * Control Spotify playback (play, pause, skip, volume).
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const controlPlaybackInputSchema = z.object({
  action: z
    .enum(['play', 'pause', 'next', 'previous', 'seek', 'volume'])
    .describe('Playback action to perform'),
  device_id: z
    .string()
    .optional()
    .describe('Target device ID (optional, uses active device)'),
  position_ms: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Position in milliseconds (for seek action)'),
  volume_percent: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Volume level 0-100 (for volume action)'),
});

export type ControlPlaybackInput = z.infer<typeof controlPlaybackInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface ControlPlaybackOutput {
  success: boolean;
  action_performed: string;
  device_id?: string;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const controlPlaybackTool = {
  name: 'control_playback',
  description: `Control your Spotify playback.

Available actions: play, pause, next, previous, seek, volume.

Example queries:
- "Pause my music"
- "Skip to next song"
- "Set volume to 50%"
- "Seek to 1 minute 30 seconds"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['play', 'pause', 'next', 'previous', 'seek', 'volume'],
        description: 'Playback action',
      },
      device_id: {
        type: 'string',
        description: 'Target device ID (optional)',
      },
      position_ms: {
        type: 'number',
        description: 'Position in ms (for seek)',
        minimum: 0,
      },
      volume_percent: {
        type: 'number',
        description: 'Volume 0-100 (for volume)',
        minimum: 0,
        maximum: 100,
      },
    },
    required: ['action'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleControlPlayback(
  input: ControlPlaybackInput,
  client: SpotifyClient
): Promise<ControlPlaybackOutput> {
  const params: Record<string, string> = {};
  if (input.device_id) {
    params.device_id = input.device_id;
  }

  switch (input.action) {
    case 'play':
      await client.put('/me/player/play', undefined);
      break;
    case 'pause':
      await client.put('/me/player/pause', undefined);
      break;
    case 'next':
      await client.post('/me/player/next', undefined);
      break;
    case 'previous':
      await client.post('/me/player/previous', undefined);
      break;
    case 'seek':
      if (input.position_ms === undefined) {
        throw new Error('position_ms is required for seek action');
      }
      await client.put(`/me/player/seek?position_ms=${input.position_ms}`, undefined);
      break;
    case 'volume':
      if (input.volume_percent === undefined) {
        throw new Error('volume_percent is required for volume action');
      }
      await client.put(`/me/player/volume?volume_percent=${input.volume_percent}`, undefined);
      break;
  }

  const actionMessages: Record<string, string> = {
    play: 'Resumed playback',
    pause: 'Paused playback',
    next: 'Skipped to next track',
    previous: 'Skipped to previous track',
    seek: `Seeked to ${Math.round((input.position_ms || 0) / 1000)} seconds`,
    volume: `Set volume to ${input.volume_percent}%`,
  };

  return {
    success: true,
    action_performed: input.action,
    device_id: input.device_id,
    message: actionMessages[input.action] || `Performed ${input.action}`,
  };
}
