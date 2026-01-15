/**
 * Tool: get_top_artists
 * Tier: 1 (Core Analytics)
 *
 * Get top artists for a specified time period.
 */

import { z } from 'zod';
import { YourSpotifyService, TopArtistsResponse } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getTopArtistsInputSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Start date in YYYY-MM-DD format (defaults to all history)'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('End date in YYYY-MM-DD format (defaults to today)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(10)
    .describe('Number of artists to return (1-30, default 10)'),
});

export type GetTopArtistsInput = z.infer<typeof getTopArtistsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetTopArtistsOutput {
  success: boolean;
  artists: {
    rank: number;
    artist: {
      id: string;
      name: string;
    };
    play_count: number;
    listening_time_hours: number;
  }[];
  period: {
    start: string;
    end: string;
  };
  total_artists: number;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getTopArtistsTool = {
  name: 'get_top_artists',
  description: `Get your top artists for a specified time period.

Returns artists ranked by play count including:
- Artist name and Spotify ID
- Total play count
- Total listening time

Example queries:
- "Who are my top 10 artists this year?"
- "What artists did I listen to most in summer 2024?"
- "Show me my all-time top 20 artists"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      start_date: {
        type: 'string',
        description: 'Start date (YYYY-MM-DD). Defaults to all history.',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      end_date: {
        type: 'string',
        description: 'End date (YYYY-MM-DD). Defaults to today.',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      limit: {
        type: 'number',
        description: 'Number of artists to return (1-30, default 10)',
        minimum: 1,
        maximum: 30,
        default: 10,
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetTopArtists(
  input: GetTopArtistsInput,
  service: YourSpotifyService
): Promise<GetTopArtistsOutput> {
  const response: TopArtistsResponse = await service.getTopArtists({
    start_date: input.start_date,
    end_date: input.end_date,
    limit: input.limit,
  });

  const artists = response.artists.map((item, index) => ({
    rank: index + 1,
    artist: {
      id: item.artist.id,
      name: item.artist.name,
    },
    play_count: item.play_count,
    listening_time_hours: Math.round((item.listening_time_ms / 3600000) * 10) / 10,
  }));

  const topArtist = artists[0];
  const periodDesc = input.start_date
    ? `from ${input.start_date} to ${input.end_date || 'today'}`
    : 'across all time';

  return {
    success: true,
    artists,
    period: response.period,
    total_artists: response.total_count,
    message: `Your top artist ${periodDesc} is ${topArtist?.artist.name || 'N/A'} with ${topArtist?.play_count || 0} plays. Found ${artists.length} artists in your top ${input.limit || 10}.`,
  };
}
