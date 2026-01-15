# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-01-14

### Fixed
- **YourSpotifyError**: Now a proper Error class instead of plain object - fixes "[object Object]" errors, now shows proper HTTP status messages
- **search_listening_history**: Fixed artist search returning 0 results - now matches by both ID formats (`id`/`_id`) AND artist name, with proper fallback chain
- **search_listening_history**: Increased search pool from 10 to 30 tracks for better filtering results
- **export_listening_data**: Fixed limit parameter handling

### Changed
- **API Limit Correction**: Your Spotify API accepts `nb` parameter values 1-30 (not 50 as documented, not 10 as initially thought)
- All Tier 1-3 tool schemas updated: `limit` parameter now has `max: 30` instead of `max: 50`
- Updated tool descriptions to reflect correct limit ranges (1-30)

### Technical Details
- Root cause of v0.2.2 regressions: fixes addressed service-layer logic but actual errors came from HTTP client/API layer
- `YourSpotifyError` now extends `Error` class for proper `instanceof` checks and `String()` conversion
- Service methods now cap limits to 30 before passing to API

### Known Issues
- **analyze_affinity**: Returns HTTP 401 - collaborative endpoint requires authenticated session, not public token (API limitation, not code bug)

## [0.2.2] - 2026-01-14

### Fixed
- **search_listening_history**: Fixed pagination - offset now correctly applied, total returns full dataset size
- **analyze_affinity**: Added response structure validation, fixed empty play_counts object
- **create_custom_wrapped**: Fixed 365-day boundary off-by-one error (now allows leap years)
- **export_listening_data**: Implemented proper format handling (summary/csv/json) at tool level
- **TOON format**: Now actually used - all tool responses use TOON by default

### Changed
- Tool responses now default to TOON format (40-60% token savings)
- Explicit `output_format: "json"` returns standard JSON

### Documentation
- Updated README with complete Tier 3-5 tool documentation
- Clarified Tier 5 tools require separate Spotify Web API credentials
- Updated Roadmap to reflect current completion status

## [0.2.1] - 2026-01-14

### Fixed
- **get_track_stats**: Now correctly reads `total.count` from API response
- **get_artist_stats**: Fixed field mapping to use `mostListened` from API
- **get_artist_rank**: Fixed percentile calculation and total artist count
- **get_track_rank**: Fixed percentile calculation and total track count
- **search_listening_history**: Added fallback for short artist queries (<3 chars)
- **analyze_listening_patterns**: Added required `start` parameter for API calls
- **create_custom_wrapped**: Fixed play count to use `total_count` from top songs
- **compare_listening_periods**: Replaced unreliable `/listened_to` endpoint
- **export_listening_data**: Now uses actual duration from `/time_per` endpoint
- **get_listening_timeline**: Fixed to use correct `/time_per` endpoint
- **analyze_affinity**: Added input validation for user_ids array
- **generate_public_share_link**: Returns existing public token from account

### Added
- `TOOLS.md` - Comprehensive documentation for all 28 tools
- `ARCHITECTURE.md` - System architecture documentation

### Changed
- Improved error message propagation for non-Error objects
- Top tracks/artists results now sorted by play count

## [0.2.0] - 2025-12-12

### Added
- TOON (Token-Oriented Object Notation) format support for 30-60% token savings
- All tools now support `output_format` parameter (`toon` or `json`)
- `toon-utils.ts` library with `formatOutput()`, `formatTracks()`, `formatArtists()` utilities
- Added `@toon-format/toon` dependency

### Changed
- Default output format is now TOON for list responses
- Updated README with TOON format documentation and examples

## [0.1.0] - 2025-12-12

### Added
- Initial release with 28 MCP tools across 5 tiers
- **Tier 1 - Core Analytics:** Top tracks, track stats, artist stats, recent history, listening summary
- **Tier 2 - Enhanced Analytics:** Custom wrapped, affinity analysis, artist rankings, listening timeline, genre breakdown
- **Tier 3 - Power Analytics:** Listening patterns, discovery insights, comparison tools, data export
- **Tier 4 - Account Management:** Settings access, share link generation, track renaming
- **Tier 5 - Spotify Control:** Playback control, playlist management, search functionality
- Your Spotify API client with Bottleneck rate limiting (5 req/sec)
- Spotify Web API integration with OAuth2 authentication
- Comprehensive README with setup instructions
- Apache 2.0 license
- CONTRIBUTING.md and SECURITY.md documentation
