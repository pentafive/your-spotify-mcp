/**
 * Tool: get_track_rank
 * Tier: 2 (Enhanced Analytics)
 *
 * Get your ranking/position for a specific track.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getTrackRankInputSchema = z.object({
  track_id: z
    .string()
    .min(1)
    .describe('Spotify track ID or URI'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Start date in YYYY-MM-DD format'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('End date in YYYY-MM-DD format'),
});

export type GetTrackRankInput = z.infer<typeof getTrackRankInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetTrackRankOutput {
  success: boolean;
  track: {
    id: string;
    name: string;
    artists: string[];
  };
  ranking: {
    rank: number;
    total_tracks: number;
    percentile: number;
    play_count: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getTrackRankTool = {
  name: 'get_track_rank',
  description: `Find where a specific track ranks in your listening history.

Shows the track's position among all tracks you've listened to, along with percentile ranking.

Example queries:
- "Where does Bohemian Rhapsody rank in my plays?"
- "Is this song in my top 100?"
- "What percentile is Blinding Lights in my history?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      track_id: {
        type: 'string',
        description: 'Spotify track ID or URI',
      },
      start_date: {
        type: 'string',
        description: 'Start date (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      end_date: {
        type: 'string',
        description: 'End date (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
    },
    required: ['track_id'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetTrackRank(
  input: GetTrackRankInput,
  service: YourSpotifyService
): Promise<GetTrackRankOutput> {
  // Extract track ID from URI if provided
  let trackId = input.track_id;
  if (trackId.startsWith('spotify:track:')) {
    trackId = trackId.replace('spotify:track:', '');
  }

  const response = await service.getTrackRank(trackId, {
    start_date: input.start_date,
    end_date: input.end_date,
  });

  const percentile = Math.round((1 - response.rank / response.total_tracks) * 100);

  return {
    success: true,
    track: {
      id: response.track.id,
      name: response.track.name,
      artists: response.track.artists.map(a => a.name),
    },
    ranking: {
      rank: response.rank,
      total_tracks: response.total_tracks,
      percentile,
      play_count: response.play_count,
    },
    message: `"${response.track.name}" is #${response.rank} out of ${response.total_tracks} tracks (top ${100 - percentile}%) with ${response.play_count} plays.`,
  };
}
