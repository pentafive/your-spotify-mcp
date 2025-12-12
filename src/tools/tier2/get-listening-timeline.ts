/**
 * Tool: get_listening_timeline
 * Tier: 2 (Enhanced Analytics)
 *
 * Get listening activity over time with configurable granularity.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const getListeningTimelineInputSchema = z.object({
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
  granularity: z
    .enum(['day', 'week', 'month'])
    .default('day')
    .describe('Time period granularity'),
});

export type GetListeningTimelineInput = z.infer<typeof getListeningTimelineInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GetListeningTimelineOutput {
  success: boolean;
  timeline: {
    date: string;
    plays: number;
    duration_hours: number;
  }[];
  summary: {
    total_plays: number;
    total_hours: number;
    average_plays_per_period: number;
    peak_period: string;
    peak_plays: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const getListeningTimelineTool = {
  name: 'get_listening_timeline',
  description: `Analyze your listening activity over time.

Returns a timeline of plays and listening duration at day, week, or month granularity.

Example queries:
- "Show my listening timeline for 2024"
- "How has my listening changed month over month?"
- "What were my most active listening days last summer?"`,
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
      granularity: {
        type: 'string',
        enum: ['day', 'week', 'month'],
        description: 'Time period granularity (default: day)',
        default: 'day',
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGetListeningTimeline(
  input: GetListeningTimelineInput,
  service: YourSpotifyService
): Promise<GetListeningTimelineOutput> {
  const response = await service.getListeningTimeline({
    start_date: input.start_date,
    end_date: input.end_date,
    granularity: input.granularity,
  });

  const timeline = response.timeline.map(item => ({
    date: item.date,
    plays: item.plays,
    duration_hours: Math.round((item.duration_ms / 3600000) * 10) / 10,
  }));

  // Calculate summary stats
  const totalPlays = timeline.reduce((sum, t) => sum + t.plays, 0);
  const totalHours = timeline.reduce((sum, t) => sum + t.duration_hours, 0);
  const peakPeriod = timeline.reduce((max, t) => t.plays > max.plays ? t : max, timeline[0] || { date: 'N/A', plays: 0 });

  return {
    success: true,
    timeline,
    summary: {
      total_plays: totalPlays,
      total_hours: Math.round(totalHours * 10) / 10,
      average_plays_per_period: Math.round(totalPlays / Math.max(timeline.length, 1)),
      peak_period: peakPeriod?.date || 'N/A',
      peak_plays: peakPeriod?.plays || 0,
    },
    message: `Timeline shows ${totalPlays} total plays over ${timeline.length} ${input.granularity || 'day'}s. Peak was ${peakPeriod?.date} with ${peakPeriod?.plays} plays.`,
  };
}
