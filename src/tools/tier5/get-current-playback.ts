/**
 * Tool: get_current_playback
 * Tier: 5 (Spotify Control)
 *
 * Get current playback state.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getCurrentPlaybackInputSchema = z.object({
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code (e.g., US)'),
});

export type GetCurrentPlaybackInput = z.infer<typeof getCurrentPlaybackInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetCurrentPlaybackOutput {
  success: boolean;
  is_playing: boolean;
  track?: {
    id: string;
    name: string;
    artists: string[];
    album: string;
    uri: string;
  };
  device?: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  };
  progress_ms?: number;
  shuffle_state?: boolean;
  repeat_state?: string;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getCurrentPlaybackTool = {
  name: 'get_current_playback',
  description: `Get information about what's currently playing on your Spotify.

Returns track details, playback state, device info, and progress.

Example queries:
- "What am I currently listening to?"
- "What's playing right now?"
- "What device is my music on?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      market: {
        type: 'string',
        description: 'Country code (e.g., US)',
        pattern: '^[A-Z]{2}$',
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetCurrentPlayback(
  input: GetCurrentPlaybackInput,
  client: SpotifyClient
): Promise<GetCurrentPlaybackOutput> {
  try {
    const response = await client.get<{
      is_playing: boolean;
      item?: {
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string };
        uri: string;
      };
      device?: {
        id: string;
        name: string;
        type: string;
        volume_percent: number;
      };
      progress_ms?: number;
      shuffle_state?: boolean;
      repeat_state?: string;
    } | null>('/me/player', input.market ? { market: input.market } : undefined);

    if (!response) {
      return {
        success: true,
        is_playing: false,
        message: 'No active playback found. Start playing something on Spotify first.',
      };
    }

    const result: GetCurrentPlaybackOutput = {
      success: true,
      is_playing: response.is_playing,
      progress_ms: response.progress_ms,
      shuffle_state: response.shuffle_state,
      repeat_state: response.repeat_state,
      message: response.is_playing
        ? `Now playing: "${response.item?.name}" by ${response.item?.artists.map(a => a.name).join(', ')}`
        : 'Playback is paused.',
    };

    if (response.item) {
      result.track = {
        id: response.item.id,
        name: response.item.name,
        artists: response.item.artists.map(a => a.name),
        album: response.item.album.name,
        uri: response.item.uri,
      };
    }

    if (response.device) {
      result.device = {
        id: response.device.id,
        name: response.device.name,
        type: response.device.type,
        volume_percent: response.device.volume_percent,
      };
    }

    return result;
  } catch {
    return {
      success: false,
      is_playing: false,
      message: 'No active playback or device found.',
    };
  }
}
