/**
 * Tool: search_listening_history
 * Tier: 1 (Core Analytics)
 *
 * Search through your complete listening history.
 */

import { z } from 'zod';
import { YourSpotifyService, ListeningHistoryResponse } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const searchListeningHistoryInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Search query (track name, artist name, or album name)'),
  type: z
    .enum(['track', 'artist', 'album'])
    .optional()
    .default('track')
    .describe('Type of search: track, artist, or album'),
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
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Number of results to return (1-50, default 20)'),
});

export type SearchListeningHistoryInput = z.infer<typeof searchListeningHistoryInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface SearchListeningHistoryOutput {
  success: boolean;
  results: {
    track: {
      id: string;
      name: string;
      artists: string[];
      album: string;
    };
    played_at: string;
  }[];
  total_results: number;
  query: string;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const searchListeningHistoryTool = {
  name: 'search_listening_history',
  description: `Search through your complete Spotify listening history.

Unlike Spotify's recent tracks (limited to 50), this searches your ENTIRE history stored in Your Spotify.

Example queries:
- "Find all times I listened to Radiohead"
- "Search for songs with 'love' in the title"
- "When did I listen to OK Computer?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query (track name, artist name, or album name)',
      },
      type: {
        type: 'string',
        enum: ['track', 'artist', 'album'],
        description: 'Type of search (default: track)',
        default: 'track',
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
      limit: {
        type: 'number',
        description: 'Number of results (1-50, default 20)',
        minimum: 1,
        maximum: 50,
        default: 20,
      },
    },
    required: ['query'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleSearchListeningHistory(
  input: SearchListeningHistoryInput,
  service: YourSpotifyService
): Promise<SearchListeningHistoryOutput> {
  const response: ListeningHistoryResponse = await service.searchHistory({
    query: input.query,
    type: input.type,
    start_date: input.start_date,
    end_date: input.end_date,
    limit: input.limit,
  });

  const results = response.items.map(item => ({
    track: {
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map(a => a.name),
      album: item.track.album.name,
    },
    played_at: item.played_at,
  }));

  return {
    success: true,
    results,
    total_results: response.total,
    query: input.query,
    message: `Found ${response.total} plays matching "${input.query}". Showing ${results.length} results.`,
  };
}
