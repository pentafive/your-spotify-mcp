# Architecture

This document describes the architecture of the Your Spotify MCP Server.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Assistant (Claude, etc.)              │
└──────────────────────────┬──────────────────────────────────┘
                           │ MCP Protocol (JSON-RPC 2.0)
                           │ Transport: STDIO
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Your Spotify MCP Server (TypeScript)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 28 MCP Tools (5 Tiers)                                 │ │
│  │ - Tier 1-3: Analytics (Your Spotify API)               │ │
│  │ - Tier 4: Account Management (Your Spotify API)        │ │
│  │ - Tier 5: Spotify Control (Spotify Web API)            │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐ │
│  │ Service Layer                                          │ │
│  │ - your-spotify-service.ts (analytics, history)         │ │
│  │ - spotify-service.ts (playlists, playback)             │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐ │
│  │ HTTP Clients                                           │ │
│  │ - your-spotify-client.ts (API token auth)              │ │
│  │ - spotify-client.ts (OAuth 2.0)                        │ │
│  │ - Rate limiting via Bottleneck (5 req/sec)             │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS
           ┌────────────────┴────────────────┐
           │                                 │
           ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│ Your Spotify API     │          │ Spotify Web API      │
│ (self-hosted)        │          │ api.spotify.com      │
│                      │          │                      │
│ - Unlimited history  │          │ - Playback control   │
│ - Play count stats   │          │ - Playlist CRUD      │
│ - Affinity analysis  │          │ - Search catalog     │
└──────────────────────┘          └──────────────────────┘
```

## Directory Structure

```
your-spotify-mcp/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── lib/
│   │   ├── your-spotify-client.ts  # Your Spotify HTTP client
│   │   ├── spotify-client.ts       # Spotify API HTTP client
│   │   └── toon-utils.ts           # TOON format utilities
│   ├── services/
│   │   └── your-spotify-service.ts # Business logic layer
│   └── tools/
│       ├── tier1/               # Core analytics (5 tools)
│       ├── tier2/               # Enhanced analytics (5 tools)
│       ├── tier3/               # Power analytics (4 tools)
│       ├── tier4/               # Account management (4 tools)
│       └── tier5/               # Spotify control (10 tools)
├── test/
│   ├── mock-server.js           # Mock Your Spotify API
│   ├── test-tools.js            # Tool integration tests
│   └── test-real-api.js         # Live API tests
└── build/                       # Compiled JavaScript
```

## Three-Layer Architecture

### Layer 1: MCP Tools

Tools are the interface exposed to AI assistants. Each tool:
- Has a unique name (lowercase_with_underscores)
- Validates input with Zod schemas
- Returns structured responses
- Supports TOON format for token efficiency

### Layer 2: Service Layer

Services contain business logic and data transformation:
- `your-spotify-service.ts` - Wraps Your Spotify API operations
- Maps REST endpoints to typed TypeScript methods
- Handles data formatting and aggregation

### Layer 3: HTTP Clients

Centralized HTTP handling:
- Authentication (API token or OAuth)
- Rate limiting (Bottleneck: 200ms between requests)
- Error normalization
- Request/response handling

## Tool Tiers

| Tier | Purpose | API | Tools |
|------|---------|-----|-------|
| 1 | Core Analytics | Your Spotify | 5 |
| 2 | Enhanced Analytics | Your Spotify | 5 |
| 3 | Power Analytics | Your Spotify | 4 |
| 4 | Account Management | Your Spotify | 4 |
| 5 | Spotify Control | Spotify Web | 10 |

## Authentication

### Your Spotify API
- Bearer token authentication
- Token configured via environment variable
- Used for all analytics and account tools (Tiers 1-4)

### Spotify Web API
- OAuth 2.0 with refresh tokens
- Scopes: `user-read-playback-state`, `user-modify-playback-state`, `playlist-*`
- Used for playback and playlist tools (Tier 5)

## Rate Limiting

Both APIs are rate-limited using Bottleneck:
- Minimum 200ms between requests (5 req/sec max)
- Prevents API abuse and ensures stability
- Configurable via client initialization

## TOON Format

Tools support [TOON (Token-Oriented Object Notation)](https://toonformat.dev) for 30-60% token savings:

```typescript
// All list-returning tools accept output_format parameter
{
  output_format: 'toon' | 'json'  // default: 'toon'
}
```

See `src/lib/toon-utils.ts` for formatting utilities.

## Error Handling

- All tools catch and normalize errors
- Error messages are sanitized (no token exposure)
- Structured error responses for AI interpretation
- Timeout handling for long-running queries

## Adding New Tools

1. Create tool file in appropriate tier directory
2. Define Zod schema for input validation
3. Implement handler using service layer
4. Export from tier's `index.ts`
5. Register in `src/index.ts`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.
