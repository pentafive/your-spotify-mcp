/**
 * Tool: search_spotify_catalog
 * Tier: 5 (Spotify Control)
 *
 * Search Spotify's catalog for tracks, artists, albums.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const searchSpotifyCatalogInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe('Search query string'),
  type: z
    .array(z.enum(['track', 'artist', 'album', 'playlist']))
    .min(1)
    .default(['track'])
    .describe('Types of results to return'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Number of results per type'),
});

export type SearchSpotifyCatalogInput = z.infer<typeof searchSpotifyCatalogInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface SearchSpotifyCatalogOutput {
  success: boolean;
  tracks?: {
    id: string;
    name: string;
    artists: string[];
    uri: string;
  }[];
  artists?: {
    id: string;
    name: string;
    genres: string[];
    uri: string;
  }[];
  albums?: {
    id: string;
    name: string;
    artists: string[];
    uri: string;
  }[];
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const searchSpotifyCatalogTool = {
  name: 'search_spotify_catalog',
  description: `Search Spotify's complete catalog for tracks, artists, albums, or playlists.

This searches ALL of Spotify, not just your listening history.

Example queries:
- "Search for songs by Radiohead"
- "Find the album OK Computer"
- "Search for playlists about focus music"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
        minLength: 1,
        maxLength: 200,
      },
      type: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['track', 'artist', 'album', 'playlist'],
        },
        description: 'Types of results (default: track)',
        default: ['track'],
      },
      limit: {
        type: 'number',
        description: 'Results per type (1-50)',
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

export async function handleSearchSpotifyCatalog(
  input: SearchSpotifyCatalogInput,
  client: SpotifyClient
): Promise<SearchSpotifyCatalogOutput> {
  const types = input.type || ['track'];

  const response = await client.get<{
    tracks?: { items: Array<{ id: string; name: string; artists: Array<{ name: string }>; uri: string }> };
    artists?: { items: Array<{ id: string; name: string; genres: string[]; uri: string }> };
    albums?: { items: Array<{ id: string; name: string; artists: Array<{ name: string }>; uri: string }> };
  }>('/search', {
    q: input.query,
    type: types.join(','),
    limit: input.limit || 20,
  });

  const result: SearchSpotifyCatalogOutput = {
    success: true,
    message: `Found results for "${input.query}"`,
  };

  if (response.tracks) {
    result.tracks = response.tracks.items.map(t => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map(a => a.name),
      uri: t.uri,
    }));
  }

  if (response.artists) {
    result.artists = response.artists.items.map(a => ({
      id: a.id,
      name: a.name,
      genres: a.genres || [],
      uri: a.uri,
    }));
  }

  if (response.albums) {
    result.albums = response.albums.items.map(a => ({
      id: a.id,
      name: a.name,
      artists: a.artists.map(ar => ar.name),
      uri: a.uri,
    }));
  }

  return result;
}
