/**
 * Tool: get_discovery_insights
 * Tier: 3 (Power Analytics)
 *
 * Get insights about new music discoveries in a time period.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getDiscoveryInsightsInputSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Start date in YYYY-MM-DD format'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('End date in YYYY-MM-DD format (defaults to today)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Number of discoveries to return'),
});

export type GetDiscoveryInsightsInput = z.infer<typeof getDiscoveryInsightsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetDiscoveryInsightsOutput {
  success: boolean;
  period: { start: string; end: string };
  new_tracks: {
    id: string;
    name: string;
    artists: string[];
    first_played: string;
    total_plays: number;
  }[];
  new_artists: {
    id: string;
    name: string;
    first_played: string;
    total_plays: number;
  }[];
  summary: {
    total_new_tracks: number;
    total_new_artists: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getDiscoveryInsightsTool = {
  name: 'get_discovery_insights',
  description: `Discover new music you found in a specific time period.

Shows tracks and artists you listened to for the first time during the period.

Example queries:
- "What new music did I discover in 2024?"
- "Show me artists I found this summer"
- "What were my new discoveries last month?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
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
      limit: {
        type: 'number',
        description: 'Number of discoveries to return (1-50)',
        minimum: 1,
        maximum: 50,
        default: 20,
      },
    },
    required: ['start_date'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetDiscoveryInsights(
  input: GetDiscoveryInsightsInput,
  service: YourSpotifyService
): Promise<GetDiscoveryInsightsOutput> {
  const response = await service.getDiscoveryInsights({
    start_date: input.start_date,
    end_date: input.end_date,
    limit: input.limit,
  });

  return {
    success: true,
    period: response.period,
    new_tracks: response.new_tracks.map(t => ({
      id: t.track.id,
      name: t.track.name,
      artists: t.track.artists.map(a => a.name),
      first_played: t.first_played,
      total_plays: t.total_plays,
    })),
    new_artists: response.new_artists.map(a => ({
      id: a.artist.id,
      name: a.artist.name,
      first_played: a.first_played,
      total_plays: a.total_plays,
    })),
    summary: {
      total_new_tracks: response.total_new_tracks,
      total_new_artists: response.total_new_artists,
    },
    message: `You discovered ${response.total_new_tracks} new tracks and ${response.total_new_artists} new artists in this period.`,
  };
}
