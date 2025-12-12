/**
 * Tool: rename_account
 * Tier: 4 (Your Spotify Management)
 *
 * Change display name in Your Spotify.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const renameAccountInputSchema = z.object({
  new_username: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .describe('New display name (alphanumeric, underscore, hyphen only)'),
});

export type RenameAccountInput = z.infer<typeof renameAccountInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface RenameAccountOutput {
  success: boolean;
  old_username: string;
  new_username: string;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const renameAccountTool = {
  name: 'rename_account',
  description: `Change your display username in Your Spotify.

This only affects your Your Spotify profile, not your actual Spotify account.

Example queries:
- "Change my username to JonDown"
- "Rename my account to MusicFan2024"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      new_username: {
        type: 'string',
        description: 'New display name (1-50 chars, alphanumeric/underscore/hyphen only)',
        minLength: 1,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$',
      },
    },
    required: ['new_username'],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleRenameAccount(
  _input: RenameAccountInput,
  service: YourSpotifyService
): Promise<RenameAccountOutput> {
  // This will throw an error since account rename requires authenticated session
  const response = await service.renameAccount();

  return {
    success: response.success,
    old_username: response.old_username,
    new_username: response.new_username,
    message: response.message,
  };
}
