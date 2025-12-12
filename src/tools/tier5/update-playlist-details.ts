/**
 * Tool: update_playlist_details
 * Tier: 5 (Spotify Control)
 *
 * Update playlist name, description, or privacy.
 */

import { z } from 'zod';
import { SpotifyClient } from '../../lib/spotify-client.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const updatePlaylistDetailsInputSchema = z.object({
  playlist_id: z
    .string()
    .regex(/^[a-zA-Z0-9]{22}$/)
    .describe('Spotify playlist ID'),
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('New playlist name'),
  description: z
    .string()
    .max(300)
    .optional()
    .describe('New playlist description'),
  public: z
    .boolean()
    .optional()
    .describe('Whether playlist should be public'),
});

export type UpdatePlaylistDetailsInput = z.infer<typeof updatePlaylistDetailsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface UpdatePlaylistDetailsOutput {
  success: boolean;
  playlist_id: string;
  updated_fields: string[];
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const updatePlaylistDetailsTool = {
  name: 'update_playlist_details',
  description: `Modify a Spotify playlist's name, description, or privacy setting.

Example queries:
- "Rename my 'Summer Vibes' playlist to 'Summer 2024 Hits'"
- "Make my workout playlist private"
- "Update the description of my road trip playlist"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      playlist_id: {
        type: 'string',
        description: 'Spotify playlist ID',
        pattern: '^[a-zA-Z0-9]{22}$',
      },
      name: {
        type: 'string',
        description: 'New playlist name',
        minLength: 1,
        maxLength: 100,
      },
      description: {
        type: 'string',
        description: 'New description',
        maxLength: 300,
      },
      public: {
        type: 'boolean',
        description: 'Whether public',
      },
    },
    required: ['playlist_id'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleUpdatePlaylistDetails(
  input: UpdatePlaylistDetailsInput,
  client: SpotifyClient
): Promise<UpdatePlaylistDetailsOutput> {
  const body: Record<string, unknown> = {};
  const updated: string[] = [];

  if (input.name !== undefined) {
    body.name = input.name;
    updated.push('name');
  }
  if (input.description !== undefined) {
    body.description = input.description;
    updated.push('description');
  }
  if (input.public !== undefined) {
    body.public = input.public;
    updated.push('public');
  }

  if (updated.length === 0) {
    throw new Error('At least one field (name, description, or public) must be provided');
  }

  await client.put(`/playlists/${input.playlist_id}`, body);

  return {
    success: true,
    playlist_id: input.playlist_id,
    updated_fields: updated,
    message: `Updated playlist: ${updated.join(', ')}`,
  };
}
