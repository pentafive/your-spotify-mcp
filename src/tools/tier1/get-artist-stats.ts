/**
 * Tool: get_artist_stats
 * Tier: 1 (Core Analytics)
 *
 * Get detailed listening statistics for a specific artist.
 */

import { z } from 'zod';
import { YourSpotifyService, ArtistStats } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getArtistStatsInputSchema = z.object({
  artist_id: z
    .string()
    .min(1)
    .describe('Spotify artist ID (22 character alphanumeric string) or Spotify URI'),
});

export type GetArtistStatsInput = z.infer<typeof getArtistStatsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetArtistStatsOutput {
  success: boolean;
  artist: {
    id: string;
    name: string;
    genres?: string[];
  };
  stats: {
    total_plays: number;
    total_listening_time_hours: number;
    first_played: string;
    last_played: string;
    top_tracks: { name: string; play_count: number }[];
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getArtistStatsTool = {
  name: 'get_artist_stats',
  description: `Get detailed listening statistics for a specific artist from your listening history.

Returns information including:
- Total play count across all their tracks
- Total listening time
- First and last time you played any of their tracks
- Your top tracks by this artist

Example queries:
- "How much have I listened to Radiohead?"
- "What are my top songs by The Weeknd?"
- "When did I first discover NF?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      artist_id: {
        type: 'string',
        description: 'Spotify artist ID (22 character alphanumeric string) or full Spotify URI (spotify:artist:xxx)',
      },
    },
    required: ['artist_id'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetArtistStats(
  input: GetArtistStatsInput,
  service: YourSpotifyService
): Promise<GetArtistStatsOutput> {
  // Extract artist ID from URI if provided
  let artistId = input.artist_id;
  if (artistId.startsWith('spotify:artist:')) {
    artistId = artistId.replace('spotify:artist:', '');
  }

  // Validate artist ID format (basic validation)
  if (!/^[a-zA-Z0-9]{22}$/.test(artistId)) {
    throw new Error(`Invalid artist ID format: "${artistId}". Expected 22 alphanumeric characters or a Spotify URI.`);
  }

  // Fetch stats from API
  const stats: ArtistStats = await service.getArtistStats(artistId);

  // Format response for LLM consumption
  const totalHours = Math.round(stats.listening_time_hours * 10) / 10;

  return {
    success: true,
    artist: {
      id: stats.artist.id,
      name: stats.artist.name,
      genres: stats.artist.genres,
    },
    stats: {
      total_plays: stats.total_plays,
      total_listening_time_hours: totalHours,
      first_played: stats.first_played,
      last_played: stats.last_played,
      top_tracks: stats.top_tracks.slice(0, 5).map(t => ({
        name: t.track.name,
        play_count: t.play_count,
      })),
    },
    message: `You've listened to ${stats.artist.name} a total of ${stats.total_plays} times (${totalHours} hours). Your top track is "${stats.top_tracks[0]?.track.name || 'N/A'}" with ${stats.top_tracks[0]?.play_count || 0} plays.`,
  };
}
