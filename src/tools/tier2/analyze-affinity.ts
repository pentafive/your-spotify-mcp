/**
 * Tool: analyze_affinity
 * Tier: 2 (Enhanced Analytics)
 *
 * Analyze listening overlap between multiple users.
 * Great for finding shared music tastes!
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const analyzeAffinityInputSchema = z.object({
  user_ids: z
    .array(z.string().min(1))
    .min(2)
    .max(5)
    .describe('Array of Your Spotify user IDs to compare (2-5 users)'),
  mode: z
    .enum(['average', 'minima'])
    .default('minima')
    .describe('Analysis mode: "average" (songs someone loves) or "minima" (songs everyone knows)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Number of tracks to return (1-50)'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Optional start date filter (YYYY-MM-DD)'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Optional end date filter (YYYY-MM-DD)'),
});

export type AnalyzeAffinityInput = z.infer<typeof analyzeAffinityInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface AnalyzeAffinityOutput {
  success: boolean;
  mode: 'average' | 'minima';
  mode_description: string;
  users: Array<{
    id: string;
    username: string;
  }>;
  shared_tracks: Array<{
    rank: number;
    track: {
      id: string;
      name: string;
      artists: string[];
      uri: string;
    };
    affinity_score: number;
    play_counts: Record<string, number>;
  }>;
  stats: {
    total_shared_tracks: number;
    highest_affinity_score: number;
    overlap_percentage: number;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const analyzeAffinityTool = {
  name: 'analyze_affinity',
  description: `Analyze listening overlap between multiple Your Spotify users.

Find songs that multiple users share in common - perfect for:
- Creating collaborative playlists
- Road trip music everyone enjoys
- Party playlists where everyone knows the songs
- Understanding shared music tastes with friends

Two analysis modes:
- **minima**: Songs EVERYONE has listened to (highest overlap)
  - Good for: "Songs we ALL know"
  - Score based on lowest listener's play count

- **average**: Songs that satisfy SOME people a lot
  - Good for: "Songs someone will love"
  - Score based on average play count

Example queries:
- "What songs do my girlfriend and I both like?"
- "Find music that everyone at the party knows"
- "What's our shared music taste?"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      user_ids: {
        type: 'array',
        description: 'Your Spotify user IDs to compare (2-5 users)',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 5,
      },
      mode: {
        type: 'string',
        description: 'Analysis mode: "average" or "minima"',
        enum: ['average', 'minima'],
        default: 'minima',
      },
      limit: {
        type: 'integer',
        description: 'Number of tracks to return (1-50)',
        minimum: 1,
        maximum: 50,
        default: 20,
      },
      start_date: {
        type: 'string',
        description: 'Optional start date (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      end_date: {
        type: 'string',
        description: 'Optional end date (YYYY-MM-DD)',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
    },
    required: ['user_ids'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleAnalyzeAffinity(
  input: AnalyzeAffinityInput,
  service: YourSpotifyService
): Promise<AnalyzeAffinityOutput> {
  // Validate user count
  if (input.user_ids.length < 2) {
    throw new Error('At least 2 user IDs are required for affinity analysis');
  }

  if (input.user_ids.length > 5) {
    throw new Error('Maximum 5 users can be compared at once');
  }

  // Check for duplicates
  const uniqueUsers = new Set(input.user_ids);
  if (uniqueUsers.size !== input.user_ids.length) {
    throw new Error('Duplicate user IDs are not allowed');
  }

  // Validate date range if provided
  if (input.start_date && input.end_date) {
    const start = new Date(input.start_date);
    const end = new Date(input.end_date);
    if (start > end) {
      throw new Error('start_date must be before end_date');
    }
  }

  const mode = input.mode || 'minima';

  // Note: This would call the Your Spotify affinity endpoint
  // For now, we'll structure the expected response format
  // The actual endpoint would be something like:
  // GET /collaborative/affinity?ids=user1,user2&mode=minima&limit=20

  // Mock response structure (actual implementation would call service)
  const mockResponse = await service.analyzeAffinity({
    user_ids: input.user_ids,
    mode,
    limit: input.limit || 20,
    start_date: input.start_date,
    end_date: input.end_date,
  });

  // Mode descriptions
  const modeDescriptions = {
    average: 'Songs that at least one person loves (higher scores = stronger individual preferences)',
    minima: 'Songs everyone knows (higher scores = stronger shared listening)',
  };

  // Calculate overlap percentage
  const overlapPercentage = mockResponse.stats?.overlap_percentage || 0;

  // Format shared tracks
  const sharedTracks = mockResponse.tracks.map((item: any, i: number) => ({
    rank: i + 1,
    track: {
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map((a: any) => a.name),
      uri: item.track.uri,
    },
    affinity_score: Math.round(item.score * 100) / 100,
    play_counts: item.play_counts || {},
  }));

  // Find highest score
  const highestScore = sharedTracks.length > 0
    ? Math.max(...sharedTracks.map(t => t.affinity_score))
    : 0;

  // Generate message
  const topTrack = sharedTracks[0];
  let message = `Found ${sharedTracks.length} shared tracks between ${input.user_ids.length} users using ${mode} mode.`;

  if (topTrack) {
    message += ` Top shared track: "${topTrack.track.name}" by ${topTrack.track.artists.join(', ')} (score: ${topTrack.affinity_score}).`;
  }

  if (overlapPercentage > 0) {
    message += ` Overall music taste overlap: ${overlapPercentage}%.`;
  }

  return {
    success: true,
    mode,
    mode_description: modeDescriptions[mode],
    users: mockResponse.users || input.user_ids.map(id => ({ id, username: id })),
    shared_tracks: sharedTracks,
    stats: {
      total_shared_tracks: sharedTracks.length,
      highest_affinity_score: highestScore,
      overlap_percentage: overlapPercentage,
    },
    message,
  };
}
