/**
 * Tool: update_user_settings
 * Tier: 4 (Your Spotify Management)
 *
 * Update user settings in Your Spotify.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const updateUserSettingsInputSchema = z.object({
  timezone: z
    .string()
    .regex(/^[A-Za-z]+\/[A-Za-z_]+$/)
    .optional()
    .describe('IANA timezone identifier (e.g., America/New_York)'),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface UpdateUserSettingsOutput {
  success: boolean;
  updated_settings: Record<string, unknown>;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const updateUserSettingsTool = {
  name: 'update_user_settings',
  description: `Update your Your Spotify account settings.

Currently supports updating timezone preferences.

Example queries:
- "Set my timezone to Pacific Time"
- "Change my timezone to Europe/London"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone identifier (e.g., America/New_York, Europe/London)',
        pattern: '^[A-Za-z]+/[A-Za-z_]+$',
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleUpdateUserSettings(
  input: UpdateUserSettingsInput,
  service: YourSpotifyService
): Promise<UpdateUserSettingsOutput> {
  const response = await service.updateSettings({
    timezone: input.timezone,
  });

  return {
    success: response.success,
    updated_settings: response.updated_settings,
    message: response.message,
  };
}
