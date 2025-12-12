/**
 * Tool: get_track_stats
 * Tier: 1 (Core Analytics)
 *
 * Get detailed listening statistics for a specific track.
 */

import { z } from 'zod';
import { YourSpotifyService, TrackStats } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getTrackStatsInputSchema = z.object({
  track_id: z
    .string()
    .min(1)
    .describe('Spotify track ID (22 character alphanumeric string) or Spotify URI'),
});

export type GetTrackStatsInput = z.infer<typeof getTrackStatsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetTrackStatsOutput {
  success: boolean;
  track: {
    id: string;
    name: string;
    artists: string[];
    album: string;
    duration_ms: number;
    uri: string;
  };
  stats: {
    total_plays: number;
    total_listening_time_minutes: number;
    first_played: string;
    last_played: string;
    average_plays_per_day: number;
    peak_day: string;
    peak_day_plays: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getTrackStatsTool = {
  name: 'get_track_stats',
  description: `Get detailed listening statistics for a specific track from your listening history.

Returns information including:
- Total play count across all time
- Total listening time
- First and last time you played the track
- Average plays per day
- Your peak listening day for this track

Example queries:
- "How many times have I listened to Bohemian Rhapsody?"
- "When did I first listen to this song?"
- "What's my most played day for this track?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      track_id: {
        type: 'string',
        description: 'Spotify track ID (22 character alphanumeric string) or full Spotify URI (spotify:track:xxx)',
      },
    },
    required: ['track_id'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetTrackStats(
  input: GetTrackStatsInput,
  service: YourSpotifyService
): Promise<GetTrackStatsOutput> {
  // Extract track ID from URI if provided
  let trackId = input.track_id;
  if (trackId.startsWith('spotify:track:')) {
    trackId = trackId.replace('spotify:track:', '');
  }

  // Validate track ID format (basic validation)
  if (!/^[a-zA-Z0-9]{22}$/.test(trackId)) {
    throw new Error(`Invalid track ID format: "${trackId}". Expected 22 alphanumeric characters or a Spotify URI.`);
  }

  // Fetch stats from API
  const stats: TrackStats = await service.getTrackStats(trackId);

  // Format response for LLM consumption
  const totalMinutes = Math.round(stats.total_duration_ms / 60000);

  return {
    success: true,
    track: {
      id: stats.track.id,
      name: stats.track.name,
      artists: stats.track.artists.map(a => a.name),
      album: stats.track.album.name,
      duration_ms: stats.track.duration_ms,
      uri: stats.track.uri,
    },
    stats: {
      total_plays: stats.total_plays,
      total_listening_time_minutes: totalMinutes,
      first_played: stats.first_played,
      last_played: stats.last_played,
      average_plays_per_day: Math.round(stats.average_plays_per_day * 100) / 100,
      peak_day: stats.peak_day,
      peak_day_plays: stats.peak_day_plays,
    },
    message: `You've listened to "${stats.track.name}" by ${stats.track.artists.map(a => a.name).join(', ')} a total of ${stats.total_plays} times (${totalMinutes} minutes). Your peak listening day was ${stats.peak_day} with ${stats.peak_day_plays} plays.`,
  };
}
