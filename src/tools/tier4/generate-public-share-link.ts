/**
 * Tool: generate_public_share_link
 * Tier: 4 (Your Spotify Management)
 *
 * Generate a public link to share your stats.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const generatePublicShareLinkInputSchema = z.object({
  description: z
    .string()
    .max(100)
    .optional()
    .describe('Optional description for the public link'),
});

export type GeneratePublicShareLinkInput = z.infer<typeof generatePublicShareLinkInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface GeneratePublicShareLinkOutput {
  success: boolean;
  public_token: string;
  public_url: string;
  created_at: string;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const generatePublicShareLinkTool = {
  name: 'generate_public_share_link',
  description: `Generate a public link to share your Your Spotify statistics.

Anyone with this link can view your listening history without logging in.
Use revoke_public_access to disable the link when you're done sharing.

Example queries:
- "Create a public link to share my 2024 stats"
- "Generate a shareable link for my profile"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      description: {
        type: 'string',
        description: 'Optional description for this public link',
        maxLength: 100,
      },
    },
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleGeneratePublicShareLink(
  _input: GeneratePublicShareLinkInput,
  service: YourSpotifyService
): Promise<GeneratePublicShareLinkOutput> {
  // This will throw an error since public token generation requires authenticated session
  const response = await service.generatePublicToken();

  return {
    success: response.success,
    public_token: response.public_token,
    public_url: response.public_url,
    created_at: response.created_at,
    message: response.message,
  };
}
