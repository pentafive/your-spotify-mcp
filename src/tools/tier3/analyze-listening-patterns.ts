/**
 * Tool: analyze_listening_patterns
 * Tier: 3 (Power Analytics)
 *
 * Analyze listening patterns by time of day, day of week, etc.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const analyzeListeningPatternsInputSchema = z.object({
  pattern_type: z
    .enum(['hour_of_day', 'day_of_week', 'month', 'day_and_time'])
    .default('hour_of_day')
    .describe('Type of pattern to analyze'),
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

export type AnalyzeListeningPatternsInput = z.infer<typeof analyzeListeningPatternsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface AnalyzeListeningPatternsOutput {
  success: boolean;
  pattern_type: string;
  patterns: {
    period: string;
    plays: number;
    duration_hours: number;
    percentage: number;
  }[];
  insights: {
    peak_period: string;
    peak_plays: number;
    lowest_period: string;
    lowest_plays: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const analyzeListeningPatternsTool = {
  name: 'analyze_listening_patterns',
  description: `Analyze your listening patterns over time.

Discover when you listen to music most - by hour of day, day of week, or month.

Example queries:
- "What time of day do I listen to music most?"
- "Which day of the week has the most plays?"
- "Am I a morning or evening listener?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      pattern_type: {
        type: 'string',
        enum: ['hour_of_day', 'day_of_week', 'month', 'day_and_time'],
        description: 'Type of pattern to analyze',
        default: 'hour_of_day',
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
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleAnalyzeListeningPatterns(
  input: AnalyzeListeningPatternsInput,
  service: YourSpotifyService
): Promise<AnalyzeListeningPatternsOutput> {
  const response = await service.analyzeListeningPatterns({
    pattern_type: input.pattern_type,
    start_date: input.start_date,
    end_date: input.end_date,
  });

  const totalPlays = response.patterns.reduce((sum, p) => sum + p.plays, 0);
  const patterns = response.patterns.map(p => ({
    period: p.period,
    plays: p.plays,
    duration_hours: Math.round((p.duration_ms / 3600000) * 10) / 10,
    percentage: Math.round((p.plays / totalPlays) * 100),
  }));

  const peak = patterns.reduce((max, p) => p.plays > max.plays ? p : max, patterns[0]);
  const lowest = patterns.reduce((min, p) => p.plays < min.plays ? p : min, patterns[0]);

  return {
    success: true,
    pattern_type: input.pattern_type || 'hour_of_day',
    patterns,
    insights: {
      peak_period: peak?.period || 'N/A',
      peak_plays: peak?.plays || 0,
      lowest_period: lowest?.period || 'N/A',
      lowest_plays: lowest?.plays || 0,
    },
    message: `Your peak listening is at ${peak?.period} (${peak?.plays} plays, ${peak?.percentage}% of total). Lowest at ${lowest?.period} (${lowest?.plays} plays).`,
  };
}
