/**
 * Tool: get_artist_rank
 * Tier: 2 (Enhanced Analytics)
 *
 * Get your ranking/position for a specific artist.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getArtistRankInputSchema = z.object({
  artist_id: z
    .string()
    .min(1)
    .describe('Spotify artist ID or URI'),
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

export type GetArtistRankInput = z.infer<typeof getArtistRankInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetArtistRankOutput {
  success: boolean;
  artist: {
    id: string;
    name: string;
  };
  ranking: {
    rank: number;
    total_artists: number;
    percentile: number;
    play_count: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getArtistRankTool = {
  name: 'get_artist_rank',
  description: `Find where a specific artist ranks in your listening history.

Shows the artist's position among all artists you've listened to, along with percentile ranking.

Example queries:
- "Where does Radiohead rank in my listening?"
- "Is Taylor Swift in my top 10?"
- "What's my percentile for The Beatles?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      artist_id: {
        type: 'string',
        description: 'Spotify artist ID or URI',
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
    required: ['artist_id'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetArtistRank(
  input: GetArtistRankInput,
  service: YourSpotifyService
): Promise<GetArtistRankOutput> {
  // Extract artist ID from URI if provided
  let artistId = input.artist_id;
  if (artistId.startsWith('spotify:artist:')) {
    artistId = artistId.replace('spotify:artist:', '');
  }

  const response = await service.getArtistRank(artistId, {
    start_date: input.start_date,
    end_date: input.end_date,
  });

  const percentile = Math.round((1 - response.rank / response.total_artists) * 100);

  return {
    success: true,
    artist: {
      id: response.artist.id,
      name: response.artist.name,
    },
    ranking: {
      rank: response.rank,
      total_artists: response.total_artists,
      percentile,
      play_count: response.play_count,
    },
    message: `${response.artist.name} is #${response.rank} out of ${response.total_artists} artists (top ${100 - percentile}%) with ${response.play_count} plays.`,
  };
}
