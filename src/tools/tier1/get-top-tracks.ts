/**
 * Tool: get_top_tracks
 * Tier: 1 (Core Analytics)
 *
 * Get your top tracks for any time period.
 */

import { z } from 'zod';
import { YourSpotifyService, TopTracksResponse } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getTopTracksInputSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Start date in YYYY-MM-DD format. If omitted, includes all history.'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('End date in YYYY-MM-DD format. If omitted, includes up to today.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(10)
    .describe('Number of tracks to return (1-30). Default is 10.'),
  output_format: z
    .enum(['json', 'toon'])
    .default('toon')
    .describe('Output format: "toon" (default, 40-60% token savings) or "json"'),
});

export type GetTopTracksInput = z.infer<typeof getTopTracksInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetTopTracksOutput {
  success: boolean;
  period: {
    start: string;
    end: string;
    description: string;
  };
  tracks: Array<{
    rank: number;
    track: {
      id: string;
      name: string;
      artists: string[];
      album: string;
      uri: string;
    };
    play_count: number;
  }>;
  total_unique_tracks: number;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getTopTracksTool = {
  name: 'get_top_tracks',
  description: `Get your most played tracks for any time period.

Returns your top tracks ranked by play count, with full track details and play statistics. This queries your complete listening history (not limited to Spotify's 50 recent tracks).

Time period options:
- Omit dates for all-time top tracks
- Specify start_date only for "since X" queries
- Specify both dates for a specific range

Example queries:
- "What are my top 10 songs?"
- "What were my most played tracks in summer 2024?"
- "Show me my top 20 songs from last month"
- "What are my all-time top tracks?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      start_date: {
        type: 'string',
        description: 'Start date in YYYY-MM-DD format. Omit for all-time.',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      end_date: {
        type: 'string',
        description: 'End date in YYYY-MM-DD format. Omit for up to today.',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      limit: {
        type: 'integer',
        description: 'Number of tracks to return (1-30). Default is 10.',
        minimum: 1,
        maximum: 30,
        default: 10,
      },
      output_format: {
        type: 'string',
        enum: ['json', 'toon'],
        description: 'Output format: "toon" (default, 40-60% token savings) or "json"',
        default: 'toon',
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetTopTracks(
  input: GetTopTracksInput,
  service: YourSpotifyService
): Promise<GetTopTracksOutput> {
  // Validate date range if both provided
  if (input.start_date && input.end_date) {
    const start = new Date(input.start_date);
    const end = new Date(input.end_date);
    if (start > end) {
      throw new Error('start_date must be before end_date');
    }
  }

  // Fetch top tracks from API
  const response: TopTracksResponse = await service.getTopTracks({
    start_date: input.start_date,
    end_date: input.end_date,
    limit: input.limit ?? 10,
  });

  // Format period description for human readability
  let periodDescription: string;
  if (!input.start_date && !input.end_date) {
    periodDescription = 'all time';
  } else if (input.start_date && input.end_date) {
    periodDescription = `${input.start_date} to ${input.end_date}`;
  } else if (input.start_date) {
    periodDescription = `since ${input.start_date}`;
  } else {
    periodDescription = `until ${input.end_date}`;
  }

  // Format tracks for response
  const formattedTracks = response.tracks.map((item, index) => ({
    rank: index + 1,
    track: {
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map(a => a.name),
      album: item.track.album.name,
      uri: item.track.uri,
    },
    play_count: item.play_count,
  }));

  // Generate summary message
  const topTrack = formattedTracks[0];
  const message = topTrack
    ? `Your #1 track for ${periodDescription} is "${topTrack.track.name}" by ${topTrack.track.artists.join(', ')} with ${topTrack.play_count} plays. Found ${response.total_count} unique tracks in this period.`
    : `No listening history found for ${periodDescription}.`;

  return {
    success: true,
    period: {
      start: response.period.start,
      end: response.period.end,
      description: periodDescription,
    },
    tracks: formattedTracks,
    total_unique_tracks: response.total_count,
    message,
  };
}
