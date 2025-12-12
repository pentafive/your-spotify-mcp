# Your Spotify MCP Server

A Model Context Protocol (MCP) server that connects AI assistants to Your Spotify's analytics API and Spotify's Web API.

## Features

### Tier 1: Core Analytics (Your Spotify API)
- **get_track_stats** - Get detailed listening statistics for any track
- **get_top_tracks** - Get your top tracks for any time period

### Coming Soon
- Tier 2: Enhanced Analytics (Custom Wrapped, Affinity)
- Tier 3: Power Analytics (Patterns, Discovery)
- Tier 4: Account Management
- Tier 5: Spotify Control (Playlists, Playback)

## Requirements

- Node.js 18+
- Your Spotify instance (self-hosted)
- Your Spotify API token

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Configure Environment Variables

Required:
- `YOUR_SPOTIFY_API_URL` - Your Your Spotify API URL (e.g., `https://your-spotify-api.example.com`)
- `YOUR_SPOTIFY_TOKEN` - Your Your Spotify API token

Optional (for Tier 5 features):
- `SPOTIFY_CLIENT_ID` - Spotify App Client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify App Client Secret
- `SPOTIFY_ACCESS_TOKEN` - Spotify OAuth Access Token
- `SPOTIFY_REFRESH_TOKEN` - Spotify OAuth Refresh Token

### 4. Configure Claude Desktop

Add to your Claude Desktop config (`~/.config/Claude/claude_desktop_config.json` on Linux):

```json
{
  "mcpServers": {
    "your-spotify": {
      "command": "node",
      "args": ["/path/to/your-spotify-mcp/build/index.js"],
      "env": {
        "YOUR_SPOTIFY_API_URL": "https://your-spotify-api.example.com",
        "YOUR_SPOTIFY_TOKEN": "ys_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

## Usage Examples

Once configured, you can ask Claude:

- "What are my top 10 tracks?"
- "Show me my most played songs from summer 2024"
- "How many times have I listened to [track name]?"
- "When did I first listen to [artist]?"

## Development

```bash
# Build and watch for changes
npm run watch

# Run in development mode
npm run dev
```

## Architecture

```
src/
├── index.ts           # Main entry point, MCP server setup
├── lib/
│   ├── your-spotify-client.ts  # Your Spotify HTTP client
│   └── spotify-client.ts       # Spotify Web API client
├── services/
│   └── your-spotify-service.ts # Business logic layer
└── tools/
    └── tier1/         # Core analytics tools
        ├── get-track-stats.ts
        └── get-top-tracks.ts
```

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.
