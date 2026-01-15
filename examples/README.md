# Configuration Examples

Example configurations for using Your Spotify MCP Server with different AI assistants.

## Quick Start

1. Copy the appropriate example for your client
2. Replace placeholder values:
   - `/path/to/your-spotify-mcp/build/index.js` - Actual path to built server
   - `YOUR_SPOTIFY_API_URL` - Your Your Spotify instance URL
   - `YOUR_SPOTIFY_TOKEN` - Your public token from Your Spotify settings

## Configuration Files

### Claude Desktop

**File:** `claude-desktop.example.json`
**Location:** `~/.config/Claude/claude_desktop_config.json` (Linux/macOS)

```bash
# Copy and edit
cp examples/claude-desktop.example.json ~/.config/Claude/claude_desktop_config.json
```

Includes optional Tier 5 (Spotify Web API) credentials for playback control.

### Claude Code (CLI)

**File:** `claude-code.example.json`
**Location:** Project `.mcp.json` or `~/.claude/settings.json`

For project-specific configuration:
```bash
cp examples/claude-code.example.json /your/project/.mcp.json
```

For global configuration, add the `mcpServers` object to your Claude Code settings.

### Gemini (with MCP support)

**File:** `gemini.example.json`
**Location:** Varies by Gemini client

Gemini 2.0 Flash supports MCP via stdio transport. Configuration format is similar to Claude's MCP config. Consult your Gemini client's documentation for the exact config file location.

For Google AI Studio or API usage with MCP:
- The server runs as a subprocess via stdio
- Use the same command/args/env structure

## Environment Variables

### Required (Tiers 1-4)

| Variable | Description |
|----------|-------------|
| `YOUR_SPOTIFY_API_URL` | URL to your Your Spotify API (e.g., `https://api.your-spotify.example.com`) |
| `YOUR_SPOTIFY_TOKEN` | Public token from Your Spotify settings page |

### Optional (Tier 5 - Spotify Control)

| Variable | Description |
|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Spotify Developer App Client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer App Client Secret |
| `SPOTIFY_ACCESS_TOKEN` | OAuth access token |
| `SPOTIFY_REFRESH_TOKEN` | OAuth refresh token |

## Getting Your Spotify Token

1. Open your Your Spotify dashboard
2. Navigate to **Settings**
3. Find or generate your **Public Token**
4. Copy the token value

## Verifying Setup

After configuration, test with a simple query:

```
"What are my top 5 tracks?"
```

If successful, you should see your most played tracks. If you see an authentication error, verify your token and API URL.

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot find module" | Wrong path | Verify `args` path points to `build/index.js` |
| "Authentication failed" | Invalid token | Regenerate token in Your Spotify settings |
| "Connection refused" | Wrong URL | Check `YOUR_SPOTIFY_API_URL` is accessible |
| "Tier 5 not configured" | Missing Spotify creds | Add Spotify OAuth tokens for playback control |
