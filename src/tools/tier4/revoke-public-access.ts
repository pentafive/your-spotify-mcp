/**
 * Tool: revoke_public_access
 * Tier: 4 (Your Spotify Management)
 *
 * Revoke public share token.
 */

import { z } from 'zod';
import { YourSpotifyService } from '../../services/your-spotify-service.js';

// ============================================================
// Input Schema (Zod)
// ============================================================

export const revokePublicAccessInputSchema = z.object({});

export type RevokePublicAccessInput = z.infer<typeof revokePublicAccessInputSchema>;

// ============================================================
// Output Type
// ============================================================

export interface RevokePublicAccessOutput {
  success: boolean;
  revoked_token: string;
  message: string;
}

// ============================================================
// Tool Definition (MCP Format)
// ============================================================

export const revokePublicAccessTool = {
  name: 'revoke_public_access',
  description: `Revoke your public share token, immediately disabling the public link.

Use this when you no longer want your stats publicly accessible.

Example queries:
- "Revoke my public share link"
- "Disable public access to my stats"
- "Remove my public profile"`,
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

// ============================================================
// Tool Handler
// ============================================================

export async function handleRevokePublicAccess(
  _input: RevokePublicAccessInput,
  service: YourSpotifyService
): Promise<RevokePublicAccessOutput> {
  const response = await service.revokePublicAccess();

  return {
    success: response.success,
    revoked_token: response.revoked_token,
    message: response.message,
  };
}
