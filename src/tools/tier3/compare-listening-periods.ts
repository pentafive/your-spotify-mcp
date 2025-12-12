/**
 * Tool: compare_listening_periods
 * Tier: 3 (Power Analytics)
 *
 * Compare listening habits between two time periods.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const compareListeningPeriodsInputSchema = z.object({
  period1_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Start date of first period (YYYY-MM-DD)'),
  period1_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('End date of first period (YYYY-MM-DD)'),
  period2_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Start date of second period (YYYY-MM-DD)'),
  period2_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('End date of second period (YYYY-MM-DD)'),
});

export type CompareListeningPeriodsInput = z.infer<typeof compareListeningPeriodsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface CompareListeningPeriodsOutput {
  success: boolean;
  period1: {
    start: string;
    end: string;
    total_plays: number;
    total_hours: number;
    unique_tracks: number;
    unique_artists: number;
    top_artist: string;
    top_track: string;
  };
  period2: {
    start: string;
    end: string;
    total_plays: number;
    total_hours: number;
    unique_tracks: number;
    unique_artists: number;
    top_artist: string;
    top_track: string;
  };
  comparison: {
    plays_change: number;
    plays_change_percent: number;
    hours_change: number;
    diversity_change: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const compareListeningPeriodsTool = {
  name: 'compare_listening_periods',
  description: `Compare your listening habits between two time periods.

See how your listening volume, diversity, and preferences have changed.

Example queries:
- "Compare my listening in summer 2024 vs summer 2023"
- "How did my music habits change from Q1 to Q2?"
- "Am I listening more this year than last year?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      period1_start: {
        type: 'string',
        description: 'Start date of first period (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      period1_end: {
        type: 'string',
        description: 'End date of first period (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      period2_start: {
        type: 'string',
        description: 'Start date of second period (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      period2_end: {
        type: 'string',
        description: 'End date of second period (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
    },
    required: ['period1_start', 'period1_end', 'period2_start', 'period2_end'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleCompareListeningPeriods(
  input: CompareListeningPeriodsInput,
  service: YourSpotifyService
): Promise<CompareListeningPeriodsOutput> {
  const response = await service.compareListeningPeriods({
    period1_start: input.period1_start,
    period1_end: input.period1_end,
    period2_start: input.period2_start,
    period2_end: input.period2_end,
  });

  const playsChange = response.period2.total_plays - response.period1.total_plays;
  const playsChangePercent = response.period1.total_plays > 0
    ? Math.round((playsChange / response.period1.total_plays) * 100)
    : 0;

  const changeWord = playsChange >= 0 ? 'more' : 'fewer';
  const absChange = Math.abs(playsChange);

  return {
    success: true,
    period1: {
      start: input.period1_start,
      end: input.period1_end,
      total_plays: response.period1.total_plays,
      total_hours: Math.round(response.period1.total_hours * 10) / 10,
      unique_tracks: response.period1.unique_tracks,
      unique_artists: response.period1.unique_artists,
      top_artist: response.period1.top_artist?.name || 'N/A',
      top_track: response.period1.top_track?.name || 'N/A',
    },
    period2: {
      start: input.period2_start,
      end: input.period2_end,
      total_plays: response.period2.total_plays,
      total_hours: Math.round(response.period2.total_hours * 10) / 10,
      unique_tracks: response.period2.unique_tracks,
      unique_artists: response.period2.unique_artists,
      top_artist: response.period2.top_artist?.name || 'N/A',
      top_track: response.period2.top_track?.name || 'N/A',
    },
    comparison: {
      plays_change: playsChange,
      plays_change_percent: playsChangePercent,
      hours_change: Math.round((response.period2.total_hours - response.period1.total_hours) * 10) / 10,
      diversity_change: response.period2.unique_artists - response.period1.unique_artists,
    },
    message: `Period 2 had ${absChange} ${changeWord} plays (${Math.abs(playsChangePercent)}% ${playsChange >= 0 ? 'increase' : 'decrease'}). Top artist changed from ${response.period1.top_artist?.name || 'N/A'} to ${response.period2.top_artist?.name || 'N/A'}.`,
  };
}
