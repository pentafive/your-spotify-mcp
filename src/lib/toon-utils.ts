/**
 * TOON (Token-Oriented Object Notation) utilities for MCP tool responses.
 *
 * TOON provides 30-60% token savings for tabular data compared to JSON.
 * Reference: https://toonformat.dev | https://github.com/toon-format/toon
 */

import { encode } from '@toon-format/toon';

export type OutputFormat = 'json' | 'toon';

/**
 * Format an array of objects as TOON or JSON based on output_format parameter.
 *
 * @param data - Array of objects to format
 * @param format - 'toon' for compact format, 'json' for standard JSON
 * @returns Formatted string
 */
export function formatOutput<T extends Record<string, unknown>>(
  data: T[],
  format: OutputFormat = 'toon'
): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // Use TOON for compact, token-efficient output
  return encode(data);
}

/**
 * Create a standardized MCP tool response with format metadata.
 *
 * @param success - Whether the operation succeeded
 * @param data - The data to return
 * @param format - Output format used
 * @param meta - Additional metadata (count, etc.)
 */
export function createResponse<T>(
  success: boolean,
  data: T,
  format: OutputFormat,
  meta?: Record<string, unknown>
): {
  success: boolean;
  format: OutputFormat;
  data: T;
  [key: string]: unknown;
} {
  return {
    success,
    format,
    ...meta,
    data,
  };
}

/**
 * Format track data for TOON output.
 * Extracts the most relevant fields for token efficiency.
 */
export function formatTracks(
  tracks: Array<{
    id?: string;
    name?: string;
    artist?: string;
    album?: string;
    duration_ms?: number;
    play_count?: number;
    [key: string]: unknown;
  }>,
  format: OutputFormat = 'toon'
): string {
  if (format === 'json') {
    return JSON.stringify(tracks, null, 2);
  }

  // For TOON, create a clean array with consistent fields
  const cleanTracks = tracks.map((t) => ({
    id: t.id || '',
    name: t.name || '',
    artist: t.artist || '',
    album: t.album || '',
    plays: t.play_count || 0,
    duration_ms: t.duration_ms || 0,
  }));

  return encode({ tracks: cleanTracks });
}

/**
 * Format artist data for TOON output.
 */
export function formatArtists(
  artists: Array<{
    id?: string;
    name?: string;
    play_count?: number;
    track_count?: number;
    [key: string]: unknown;
  }>,
  format: OutputFormat = 'toon'
): string {
  if (format === 'json') {
    return JSON.stringify(artists, null, 2);
  }

  const cleanArtists = artists.map((a) => ({
    id: a.id || '',
    name: a.name || '',
    plays: a.play_count || 0,
    tracks: a.track_count || 0,
  }));

  return encode({ artists: cleanArtists });
}

/**
 * Format listening history entries for TOON output.
 */
export function formatHistory(
  history: Array<{
    played_at?: string;
    track_name?: string;
    artist_name?: string;
    duration_ms?: number;
    [key: string]: unknown;
  }>,
  format: OutputFormat = 'toon'
): string {
  if (format === 'json') {
    return JSON.stringify(history, null, 2);
  }

  const cleanHistory = history.map((h) => ({
    played_at: h.played_at || '',
    track: h.track_name || '',
    artist: h.artist_name || '',
    duration_ms: h.duration_ms || 0,
  }));

  return encode({ history: cleanHistory });
}
