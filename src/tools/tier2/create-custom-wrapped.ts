/**
 * Tool: create_custom_wrapped
 * Tier: 2 (Enhanced Analytics)
 *
 * Generate a Spotify Wrapped-style summary for any custom time period.
 * This is a key differentiator - create Wrapped for summer, a semester, etc.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const createCustomWrappedInputSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Start date in YYYY-MM-DD format'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('End date in YYYY-MM-DD format'),
});

export type CreateCustomWrappedInput = z.infer<typeof createCustomWrappedInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface CreateCustomWrappedOutput {
  success: boolean;
  period: {
    start: string;
    end: string;
    days: number;
    description: string;
  };
  summary: {
    total_listening_time_hours: number;
    total_tracks_played: number;
    unique_tracks: number;
    unique_artists: number;
    average_tracks_per_day: number;
  };
  top_tracks: Array<{
    rank: number;
    name: string;
    artists: string[];
    play_count: number;
    uri: string;
  }>;
  top_artists: Array<{
    rank: number;
    name: string;
    play_count: number;
    listening_time_hours: number;
  }>;
  top_albums: Array<{
    rank: number;
    name: string;
    artist: string;
    play_count: number;
  }>;
  patterns: {
    peak_hour: string;
    peak_day_of_week: string;
    most_active_date: string;
  };
  discoveries: {
    new_artists_count: number;
    new_tracks_count: number;
    top_new_artist?: string;
  };
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const createCustomWrappedTool = {
  name: 'create_custom_wrapped',
  description: `Generate a custom Spotify Wrapped summary for ANY time period.

Unlike Spotify's official Wrapped (limited to the past year), this creates personalized listening summaries for any date range you choose.

Perfect for:
- Seasonal summaries ("My Summer 2024 Wrapped")
- Event-based recaps ("Music during my vacation")
- Comparative analysis ("This semester vs last semester")
- Monthly or weekly reviews

Returns comprehensive statistics including:
- Total listening time and track counts
- Top 5 tracks, artists, and albums
- Listening patterns (peak hours, days)
- New music discoveries in that period

Example queries:
- "Create my Spotify Wrapped for summer 2024"
- "What did my music look like during my road trip in March?"
- "Generate a wrapped for the first half of 2024"
- "Show me my December listening stats"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      start_date: {
        type: 'string',
        description: 'Start date in YYYY-MM-DD format',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      end_date: {
        type: 'string',
        description: 'End date in YYYY-MM-DD format',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
    },
    required: ['start_date', 'end_date'],
  },
};

// ============================================================
// Helper Functions
// ============================================================

function formatHours(ms: number): number {
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}

function getPeakHour(hourData: Record<string, number>): string {
  const entries = Object.entries(hourData);
  if (entries.length === 0) return 'Unknown';

  const [peakHour] = entries.reduce((max, curr) =>
    curr[1] > max[1] ? curr : max
  );

  const hour = parseInt(peakHour, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}${ampm}`;
}

function getPeakDay(dayData: Record<string, number>): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const entries = Object.entries(dayData);
  if (entries.length === 0) return 'Unknown';

  // Find the entry with highest value
  const [peakDay, peakValue] = entries.reduce((max, curr) =>
    curr[1] > max[1] ? curr : max
  );

  // If no plays at all, return Unknown
  if (peakValue === 0) return 'Unknown';

  // Check if key is already a day name
  if (dayNames.includes(peakDay)) {
    return peakDay;
  }

  // Otherwise try to parse as numeric index
  const dayIndex = parseInt(peakDay, 10);
  return dayNames[dayIndex] || 'Unknown';
}

function describePeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${months[start.getMonth()]} ${start.getFullYear()}`;
  }

  // Common period names
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  // Summer (June-August)
  if (startMonth >= 5 && startMonth <= 7 && endMonth >= 5 && endMonth <= 8) {
    return `Summer ${start.getFullYear()}`;
  }

  // Winter (December-February)
  if ((startMonth === 11 || startMonth <= 1) && (endMonth === 11 || endMonth <= 1)) {
    return `Winter ${end.getFullYear()}`;
  }

  // Default: Month range
  return `${months[startMonth]} - ${months[endMonth]} ${end.getFullYear()}`;
}

// ============================================================
// Tool Handler
// ============================================================

export async function handleCreateCustomWrapped(
  input: CreateCustomWrappedInput,
  service: YourSpotifyService
): Promise<CreateCustomWrappedOutput> {
  // Validate date range
  const start = new Date(input.start_date);
  const end = new Date(input.end_date);

  if (start > end) {
    throw new Error('start_date must be before end_date');
  }

  // Calculate inclusive day count (Jan 1 to Jan 1 = 1 day, Jan 1 to Dec 31 = 365 days)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Allow up to 366 days to accommodate leap years and inclusive counting
  if (days > 366) {
    throw new Error('Date range cannot exceed 365 days for custom Wrapped');
  }

  // Fetch wrapped data from API
  const data = await service.createCustomWrapped({
    start_date: input.start_date,
    end_date: input.end_date,
  });

  // Format top tracks
  const topTracks = data.top_tracks.slice(0, 5).map((item, i) => ({
    rank: i + 1,
    name: item.track.name,
    artists: item.track.artists.map(a => a.name),
    play_count: item.play_count,
    uri: item.track.uri,
  }));

  // Format top artists
  const topArtists = data.top_artists.slice(0, 5).map((item, i) => ({
    rank: i + 1,
    name: item.artist.name,
    play_count: item.play_count,
    listening_time_hours: formatHours(item.listening_time_ms),
  }));

  // Format top albums
  const topAlbums = data.top_albums.slice(0, 5).map((item, i) => ({
    rank: i + 1,
    name: item.album.name,
    artist: item.album.name, // Will need to extract from album data
    play_count: item.play_count,
  }));

  // Calculate patterns
  const peakHour = getPeakHour(data.listening_by_hour);
  const peakDay = getPeakDay(data.listening_by_day);

  // Find most active date
  const dateEntries = Object.entries(data.listening_by_day);
  const mostActiveDate = dateEntries.length > 0
    ? dateEntries.reduce((max, curr) => curr[1] > max[1] ? curr : max)[0]
    : input.start_date;

  // Format summary
  const totalHours = formatHours(data.total_listening_time_ms);
  const avgTracksPerDay = Math.round((data.total_tracks_played / days) * 10) / 10;
  const periodDescription = describePeriod(input.start_date, input.end_date);

  // Build response
  const response: CreateCustomWrappedOutput = {
    success: true,
    period: {
      start: input.start_date,
      end: input.end_date,
      days,
      description: periodDescription,
    },
    summary: {
      total_listening_time_hours: totalHours,
      total_tracks_played: data.total_tracks_played,
      unique_tracks: data.unique_tracks,
      unique_artists: data.unique_artists,
      average_tracks_per_day: avgTracksPerDay,
    },
    top_tracks: topTracks,
    top_artists: topArtists,
    top_albums: topAlbums,
    patterns: {
      peak_hour: peakHour,
      peak_day_of_week: peakDay,
      most_active_date: mostActiveDate,
    },
    discoveries: {
      new_artists_count: 0, // Discovery data requires first-listen tracking (not available via API)
      new_tracks_count: 0,
      top_new_artist: undefined,
    },
    message: generateWrappedMessage(periodDescription, totalHours, topTracks, topArtists, data.unique_artists),
  };

  return response;
}

function generateWrappedMessage(
  period: string,
  hours: number,
  topTracks: CreateCustomWrappedOutput['top_tracks'],
  topArtists: CreateCustomWrappedOutput['top_artists'],
  uniqueArtists: number
): string {
  const topTrack = topTracks[0];
  const topArtist = topArtists[0];

  let message = `Your ${period} Wrapped: You listened to ${hours} hours of music across ${uniqueArtists} artists.`;

  if (topTrack) {
    message += ` Your #1 track was "${topTrack.name}" by ${topTrack.artists.join(', ')} (${topTrack.play_count} plays).`;
  }

  if (topArtist) {
    message += ` ${topArtist.name} was your top artist with ${topArtist.listening_time_hours} hours.`;
  }

  return message;
}
