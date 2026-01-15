/**
 * Tool: export_listening_data
 * Tier: 3 (Power Analytics)
 *
 * Export listening data in various formats.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const exportListeningDataInputSchema = z.object({
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
  format: z
    .enum(['json', 'csv', 'summary'])
    .default('summary')
    .describe('Export format'),
  include: z
    .array(z.enum(['tracks', 'artists', 'albums', 'history']))
    .default(['tracks', 'artists'])
    .describe('Data types to include'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(10)
    .describe('Maximum items to export (1-30)'),
});

export type ExportListeningDataInput = z.infer<typeof exportListeningDataInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface ExportListeningDataOutput {
  success: boolean;
  format: string;
  period: { start: string; end: string };
  data: unknown;
  summary: {
    total_plays: number;
    total_hours: number;
    unique_tracks: number;
    unique_artists: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const exportListeningDataTool = {
  name: 'export_listening_data',
  description: `Export your listening data in various formats.

Get a structured export of your listening history, top tracks, artists, etc.

Example queries:
- "Export my 2024 listening stats"
- "Give me a summary of my listening data"
- "Export my top 100 tracks as JSON"`,
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
      format: {
        type: 'string',
        enum: ['json', 'csv', 'summary'],
        description: 'Export format (default: summary)',
        default: 'summary',
      },
      include: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['tracks', 'artists', 'albums', 'history'],
        },
        description: 'Data types to include',
        default: ['tracks', 'artists'],
      },
      limit: {
        type: 'number',
        description: 'Maximum items to export (1-30)',
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

export async function handleExportListeningData(
  input: ExportListeningDataInput,
  service: YourSpotifyService
): Promise<ExportListeningDataOutput> {
  const format = input.format || 'summary';

  // Don't pass format to service - it's handled at tool level
  const response = await service.exportListeningData({
    start_date: input.start_date,
    end_date: input.end_date,
    include: input.include,
    limit: input.limit,
  });

  const summary = {
    total_plays: response.summary.total_plays,
    total_hours: Math.round(response.summary.total_hours * 10) / 10,
    unique_tracks: response.summary.unique_tracks,
    unique_artists: response.summary.unique_artists,
  };

  // Handle format at tool level
  let data: unknown;
  if (format === 'summary') {
    // Summary format: no raw data, just statistics
    data = null;
  } else if (format === 'csv') {
    // CSV format: convert top tracks and artists to CSV strings
    const rawData = response.data as { top_tracks: any[]; top_artists: any[] };
    const tracksCsv = ['rank,name,artist,plays']
      .concat((rawData.top_tracks || []).map((t: any, i: number) =>
        `${i + 1},"${(t.track?.name || t.name || '').replace(/"/g, '""')}","${(t.artist?.name || '').replace(/"/g, '""')}",${t.count || 0}`
      ))
      .join('\n');
    const artistsCsv = ['rank,name,plays']
      .concat((rawData.top_artists || []).map((a: any, i: number) =>
        `${i + 1},"${(a.artist?.name || a.name || '').replace(/"/g, '""')}",${a.count || 0}`
      ))
      .join('\n');
    data = { tracks_csv: tracksCsv, artists_csv: artistsCsv };
  } else {
    // JSON format: return full data
    data = response.data;
  }

  return {
    success: true,
    format,
    period: response.period,
    data,
    summary,
    message: `Exported ${format} data: ${summary.total_plays} plays, ${summary.unique_tracks} tracks, ${summary.unique_artists} artists.`,
  };
}
