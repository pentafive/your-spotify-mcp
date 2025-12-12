# Your Spotify MCP Server

A Model Context Protocol (MCP) server that connects AI assistants to [Your Spotify](https://github.com/Yooooomi/your_spotify)'s analytics API and Spotify's Web API.

**Requires:** A self-hosted [Your Spotify](https://github.com/Yooooomi/your_spotify) instance for unlimited listening history analytics.

## Why This MCP Server?

| Feature | Spotify API | Your Spotify MCP |
|---------|-------------|------------------|
| Listening history | Last 50 tracks | **Unlimited** |
| Custom time ranges | No | **Yes** (any period) |
| Play count stats | No | **Yes** |
| Collaborative analytics | No | **Yes** (affinity) |
| Custom Wrapped | Annual only | **Any time period** |

## Features

### Tier 1: Core Analytics (Your Spotify API)
- **get_track_stats** - Detailed listening statistics for any track
- **get_top_tracks** - Top tracks for any time period
- **get_top_artists** - Top artists for any time period
- **get_artist_stats** - Artist listening patterns
- **search_listening_history** - Search your complete history

### Tier 2: Enhanced Analytics
- **create_custom_wrapped** - Spotify Wrapped for ANY time period
- **analyze_affinity** - Collaborative listening analysis
- **get_listening_timeline** - Timeline of listening activity
- **get_artist_rank** - Your ranking for an artist
- **get_track_rank** - Your ranking for a track

### Tier 3-5: Power Features
- Listening pattern analysis
- Export functionality
- Spotify playback control
- Playlist management

## Token-Efficient Output (TOON)

This server supports [TOON (Token-Oriented Object Notation)](https://toonformat.dev) for **40-60% token savings** on list responses.

```bash
# JSON output (verbose)
{"tracks": [{"name": "Song A", "artist": "Artist 1", "plays": 42}, ...]}

# TOON output (compact, default)
tracks[10]{name,artist,plays}:
  Song A,Artist 1,42
  Song B,Artist 2,38
  ...
```

Most tools support an `output_format` parameter:
- `"toon"` (default) - Compact format, ideal for AI assistants
- `"json"` - Standard JSON for programmatic use

**TOON Resources:**
- Website: https://toonformat.dev
- GitHub: https://github.com/toon-format/toon
- npm: [@toon-format/toon](https://www.npmjs.com/package/@toon-format/toon)

## Requirements

- Node.js 18+
- [Your Spotify](https://github.com/Yooooomi/your_spotify) instance (self-hosted)
- Your Spotify public token (from Your Spotify settings)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Get Your Spotify Token

1. Open your Your Spotify dashboard
2. Go to Settings
3. Generate/copy your public token

### 4. Configure Environment Variables

Required:
- `YOUR_SPOTIFY_API_URL` - Your Your Spotify API URL (e.g., `https://your-spotify-api.example.com`)
- `YOUR_SPOTIFY_TOKEN` - Your public token from Your Spotify

Optional (for Tier 5 features):
- `SPOTIFY_CLIENT_ID` - Spotify App Client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify App Client Secret
- `SPOTIFY_ACCESS_TOKEN` - Spotify OAuth Access Token
- `SPOTIFY_REFRESH_TOKEN` - Spotify OAuth Refresh Token

### 5. Configure Claude Desktop

Add to your Claude Desktop config (`~/.config/Claude/claude_desktop_config.json` on Linux):

```json
{
  "mcpServers": {
    "your-spotify": {
      "command": "node",
      "args": ["/path/to/your-spotify-mcp/build/index.js"],
      "env": {
        "YOUR_SPOTIFY_API_URL": "https://your-spotify-api.example.com",
        "YOUR_SPOTIFY_TOKEN": "your_public_token_here"
      }
    }
  }
}
```

## Usage Examples

Once configured, you can ask Claude:

- "What are my top 10 tracks?"
- "Show me my most played songs from summer 2024"
- "Create my Spotify Wrapped for Q1 2024"
- "How many times have I listened to [track name]?"
- "What songs would my partner and I both enjoy?" (affinity)

## Development

```bash
# Build and watch for changes
npm run watch

# Run in development mode
npm run dev

# Clean build
npm run clean
```

## Architecture

```
src/
├── index.ts                    # Main entry point, MCP server setup
├── lib/
│   ├── your-spotify-client.ts  # Your Spotify HTTP client
│   ├── spotify-client.ts       # Spotify Web API client
│   └── toon-utils.ts           # TOON format utilities
├── services/
│   └── your-spotify-service.ts # Business logic layer
└── tools/
    ├── tier1/                  # Core analytics
    ├── tier2/                  # Enhanced analytics
    ├── tier3/                  # Power analytics
    ├── tier4/                  # Account management
    └── tier5/                  # Spotify control
```

## Roadmap

### Current (v0.1.x)
- [x] Core analytics tools (Tier 1)
- [x] TOON format support
- [x] Public token authentication

### Planned (v0.2.x)
- [ ] Enhanced analytics (Tier 2) - Custom Wrapped, Affinity
- [ ] Power analytics (Tier 3)

### Future
- [ ] Spotify playback control (Tier 5)
- [ ] Dedicated API token authentication (contribution to Your Spotify upstream)
- [ ] Rate limiting improvements

## Related Projects

- [Your Spotify](https://github.com/Yooooomi/your_spotify) - Self-hosted Spotify tracking dashboard (required)
- [TOON Format](https://github.com/toon-format/toon) - Token-efficient data format for LLMs

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.
