# Your Spotify MCP Tools Reference

**Version:** 0.2.3
**Total Tools:** 28 across 5 tiers

---

## Overview

The Your Spotify MCP Server provides 28 tools organized into 5 tiers based on functionality:

| Tier | Name | Tools | Description |
|------|------|-------|-------------|
| 1 | Core Analytics | 5 | Basic listening stats and history |
| 2 | Enhanced Analytics | 5 | Custom Wrapped, rankings, affinity |
| 3 | Power Analytics | 4 | Patterns, comparisons, discovery |
| 4 | Your Spotify Management | 4 | Account settings, sharing |
| 5 | Spotify Control | 10 | Playback, playlists, search |

### Output Format

All tools support an `output_format` parameter:
- `"toon"` (default) - Token-efficient TOON format (30-60% smaller)
- `"json"` - Standard JSON format

---

## Tier 1: Core Analytics

Basic listening statistics and history queries.

### get_top_tracks

Get your most played tracks for a time period.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `time_range` | string | No | `"all_time"` | `"last_week"`, `"last_month"`, `"last_year"`, `"all_time"` |
| `start_date` | string | No | - | Custom start date (YYYY-MM-DD) |
| `end_date` | string | No | - | Custom end date (YYYY-MM-DD) |
| `limit` | number | No | 10 | Number of tracks (1-30) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "What are my top 10 songs this month?"
- "Show me my most played tracks in 2024"

---

### get_track_stats

Get detailed statistics for a specific track.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `track_id` | string | Yes | - | Spotify track ID |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "How many times have I played Bohemian Rhapsody?"
- "Get stats for track ID 6rqhFgbbKwnb9MLmUQDhG6"

---

### get_artist_stats

Get listening statistics for a specific artist.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `artist_id` | string | Yes | - | Spotify artist ID |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "How much have I listened to Taylor Swift?"
- "Show me my stats for artist ID 06HL4z0CvFAxyc27GXpf02"

---

### get_top_artists

Get your most played artists for a time period.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `time_range` | string | No | `"all_time"` | `"last_week"`, `"last_month"`, `"last_year"`, `"all_time"` |
| `start_date` | string | No | - | Custom start date (YYYY-MM-DD) |
| `end_date` | string | No | - | Custom end date (YYYY-MM-DD) |
| `limit` | number | No | 10 | Number of artists (1-30) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Who are my top artists this year?"
- "Show my most played artists from summer 2024"

---

### search_listening_history

Search your listening history by artist, track, or genre.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query (any length) |
| `type` | string | No | `"track"` | `"track"`, `"artist"`, `"genre"` |
| `limit` | number | No | 10 | Number of results (1-30) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Have I listened to any Taylor Swift?"
- "Search my history for jazz music"
- "Find songs with 'love' in the title"

**Note:** Artist searches with < 3 characters fall back to local filtering.

---

## Tier 2: Enhanced Analytics

Advanced analytics, rankings, and collaborative features.

### create_custom_wrapped

Generate a Spotify Wrapped-style summary for any time period.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `start_date` | string | Yes | - | Start date (YYYY-MM-DD) |
| `end_date` | string | No | today | End date (YYYY-MM-DD) |
| `top_count` | number | No | 10 | Number of top items (1-30) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Create a Wrapped for summer 2024"
- "Generate my June stats"
- "Make a custom Wrapped for my vacation (July 1-15)"

---

### analyze_affinity

Find musical compatibility between users based on shared listening.

> **Known Issue:** This tool requires an authenticated web session, not just a public token. Currently returns HTTP 401. See [Known Issues](#known-issues) below.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `user_ids` | string[] | Yes | - | Array of user IDs (2-5 users) |
| `mode` | string | No | `"minima"` | `"average"` (songs someone loves) or `"minima"` (songs everyone knows) |
| `limit` | number | No | 10 | Number of tracks to return (1-30) |
| `start_date` | string | No | - | Optional start date filter (YYYY-MM-DD) |
| `end_date` | string | No | - | Optional end date filter (YYYY-MM-DD) |

**Example Queries:**
- "What music do me and Sarah both like?"
- "Calculate affinity between users abc123 and def456"

---

### get_listening_timeline

Get a timeline of your listening history.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `start_date` | string | Yes | - | Start date (YYYY-MM-DD) |
| `end_date` | string | No | today | End date (YYYY-MM-DD) |
| `granularity` | string | No | `"day"` | `"hour"`, `"day"`, `"week"`, `"month"` |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Show my listening timeline for January"
- "How has my listening changed week by week this year?"

---

### get_artist_rank

Get an artist's rank in your listening history.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `artist_id` | string | Yes | - | Spotify artist ID |
| `start_date` | string | No | - | Start date (YYYY-MM-DD) |
| `end_date` | string | No | - | End date (YYYY-MM-DD) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Is Taylor Swift in my top 10 artists?"
- "What percentile is Radiohead in my listening?"

---

### get_track_rank

Get a track's rank in your listening history.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `track_id` | string | Yes | - | Spotify track ID |
| `start_date` | string | No | - | Start date (YYYY-MM-DD) |
| `end_date` | string | No | - | End date (YYYY-MM-DD) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Where does Bohemian Rhapsody rank in my top songs?"
- "Is this track in my top 1%?"

---

## Tier 3: Power Analytics

Advanced pattern analysis, comparisons, and data export.

### analyze_listening_patterns

Analyze patterns in your listening habits by time of day, day of week, etc.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `pattern_type` | string | No | `"hour_of_day"` | `"hour_of_day"`, `"day_of_week"`, `"month"`, `"day_and_time"` |
| `start_date` | string | No | - | Start date (YYYY-MM-DD) |
| `end_date` | string | No | - | End date (YYYY-MM-DD) |

**Example Queries:**
- "What time of day do I listen to music most?"
- "Am I more of a weekend or weekday listener?"
- "Show my listening patterns by month for 2024"

---

### compare_listening_periods

Compare your listening between two time periods.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `period1_start` | string | Yes | - | Period 1 start (YYYY-MM-DD) |
| `period1_end` | string | Yes | - | Period 1 end (YYYY-MM-DD) |
| `period2_start` | string | Yes | - | Period 2 start (YYYY-MM-DD) |
| `period2_end` | string | Yes | - | Period 2 end (YYYY-MM-DD) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Compare my listening in Q1 vs Q2 2024"
- "How did my summer compare to winter?"

---

### export_listening_data

Export your listening data in various formats.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `start_date` | string | Yes | - | Start date (YYYY-MM-DD) |
| `end_date` | string | No | today | End date (YYYY-MM-DD) |
| `format` | string | No | `"json"` | `"json"`, `"csv"`, `"summary"` |
| `include` | string[] | No | all | `["tracks", "artists", "albums", "stats"]` |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "Export my 2024 listening data as CSV"
- "Give me a summary export of last month"

---

### get_discovery_insights

Discover new music you found in a specific time period.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `start_date` | string | Yes | - | Start date (YYYY-MM-DD) |
| `end_date` | string | No | today | End date (YYYY-MM-DD) |
| `limit` | number | No | 10 | Number of discoveries (1-30) |
| `output_format` | string | No | `"toon"` | Output format |

**Example Queries:**
- "What new music did I discover in 2024?"
- "Show me artists I found this summer"

---

## Tier 4: Your Spotify Management

Account settings and sharing features.

### generate_public_share_link

Generate a public link to share your Your Spotify statistics.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `description` | string | No | - | Optional description (max 100 chars) |

**Example Queries:**
- "Create a public link to share my 2024 stats"
- "Generate a shareable link for my profile"

**Note:** Returns existing public token from your account.

---

### rename_account

Change your display username in Your Spotify.

> **Auth Required:** This tool requires an authenticated web session. Public token access is read-only.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `new_username` | string | Yes | - | New name (1-50 chars, alphanumeric/underscore/hyphen) |

**Example Queries:**
- "Change my username to JonDown"
- "Rename my account to MusicFan2024"

**Note:** Only affects Your Spotify profile, not actual Spotify account.

---

### revoke_public_access

Revoke your public share token, disabling the public link.

> **Auth Required:** This tool requires an authenticated web session. Public token access is read-only.

**Parameters:**
None required.

**Example Queries:**
- "Revoke my public share link"
- "Disable public access to my stats"

---

### update_user_settings

Update your Your Spotify account settings.

> **Auth Required:** This tool requires an authenticated web session. Public token access is read-only.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `timezone` | string | No | - | IANA timezone (e.g., `America/New_York`) |

**Example Queries:**
- "Set my timezone to Pacific Time"
- "Change my timezone to Europe/London"

---

## Tier 5: Spotify Control

Direct Spotify playback and playlist control. Requires Spotify OAuth.

### get_current_playback

Get information about what's currently playing.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `market` | string | No | - | ISO 3166-1 country code (e.g., `US`) |

**Example Queries:**
- "What am I currently listening to?"
- "What's playing right now?"

---

### control_playback

Control your Spotify playback.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `action` | string | Yes | - | `"play"`, `"pause"`, `"next"`, `"previous"`, `"seek"`, `"volume"` |
| `device_id` | string | No | - | Target device ID |
| `position_ms` | number | No | - | Position in ms (for seek) |
| `volume_percent` | number | No | - | Volume 0-100 (for volume) |

**Example Queries:**
- "Pause my music"
- "Skip to next song"
- "Set volume to 50%"

---

### play_tracks

Start playing specific tracks, album, or playlist.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `uris` | string[] | No | - | Spotify track URIs (max 100) |
| `context_uri` | string | No | - | Album/playlist/artist URI |
| `offset_position` | number | No | - | Starting position in context |
| `device_id` | string | No | - | Target device ID |

**Note:** Either `uris` or `context_uri` is required.

**Example Queries:**
- "Play my affinity tracks"
- "Start playing my Discover Weekly"

---

### queue_tracks

Add tracks to your Spotify playback queue.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `track_uris` | string[] | Yes | - | Track URIs to queue (1-50) |
| `device_id` | string | No | - | Target device ID |

**Example Queries:**
- "Queue my top 5 tracks from last month"
- "Add this song to my queue"

---

### get_user_playlists

Get a list of your Spotify playlists.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Number of playlists (1-50) |
| `offset` | number | No | 0 | Starting index |

**Example Queries:**
- "Show me my Spotify playlists"
- "List my playlists"

---

### create_playlist_from_query

Create a new Spotify playlist from track URIs.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `playlist_name` | string | Yes | - | Name (1-100 chars) |
| `playlist_description` | string | No | - | Description (max 300 chars) |
| `track_uris` | string[] | Yes | - | Track URIs to add (1-100) |
| `public` | boolean | No | false | Whether playlist is public |

**Example Queries:**
- "Create a playlist called 'Summer 2024' with my top 50 tracks"
- "Make a playlist from my affinity results"

---

### add_tracks_to_playlist

Add tracks to an existing Spotify playlist.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `playlist_id` | string | Yes | - | Spotify playlist ID |
| `track_uris` | string[] | Yes | - | Track URIs to add (1-100) |
| `position` | number | No | end | Position to insert (0 = start) |

**Example Queries:**
- "Add my top 10 tracks to my 'Favorites 2024' playlist"
- "Append these songs to my workout playlist"

---

### remove_from_playlist

Remove specific tracks from a Spotify playlist.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `playlist_id` | string | Yes | - | Spotify playlist ID |
| `track_uris` | string[] | Yes | - | Track URIs to remove (1-100) |
| `snapshot_id` | string | No | - | Playlist version for safe removal |

**Example Queries:**
- "Remove all Christmas songs from my 'Year Round' playlist"
- "Delete this song from my favorites playlist"

---

### update_playlist_details

Modify a Spotify playlist's name, description, or privacy.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `playlist_id` | string | Yes | - | Spotify playlist ID |
| `name` | string | No | - | New name (1-100 chars) |
| `description` | string | No | - | New description (max 300 chars) |
| `public` | boolean | No | - | Whether public |

**Note:** At least one of `name`, `description`, or `public` required.

**Example Queries:**
- "Rename my 'Summer Vibes' playlist to 'Summer 2024 Hits'"
- "Make my workout playlist private"

---

### search_spotify_catalog

Search Spotify's complete catalog for tracks, artists, albums, or playlists.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query (1-200 chars) |
| `type` | string[] | No | `["track"]` | `"track"`, `"artist"`, `"album"`, `"playlist"` |
| `limit` | number | No | 20 | Results per type (1-50) |

**Example Queries:**
- "Search for songs by Radiohead"
- "Find the album OK Computer"
- "Search for playlists about focus music"

**Note:** Searches all of Spotify, not just your listening history.

---

## URI Formats

Spotify uses URIs to identify items:

| Type | Format | Example |
|------|--------|---------|
| Track | `spotify:track:{id}` | `spotify:track:6rqhFgbbKwnb9MLmUQDhG6` |
| Album | `spotify:album:{id}` | `spotify:album:4LH4d3cOWNNsVw41Gqt2kv` |
| Artist | `spotify:artist:{id}` | `spotify:artist:4Z8W4fKeB5YxbusRsdQVPb` |
| Playlist | `spotify:playlist:{id}` | `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M` |

All IDs are 22 alphanumeric characters.

---

## Error Handling

Common error responses:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid request parameters" | Missing required field or invalid format | Check parameter requirements |
| "Unknown error" | API error | Check Your Spotify server logs |
| "No active playback" | Spotify not playing | Start playback on a device first |

---

## API Notes

### Your Spotify API Requirements

- `/spotify/time_per` - Requires `start` parameter
- `/artist/search/:query` - Requires minimum 3 character query
- `/spotify/top/songs` - Use `total_count` field for accurate play counts
- `/spotify/listened_to` - Returns incorrect data (do not use)

### Spotify Web API

Tier 5 tools require Spotify OAuth tokens with appropriate scopes:
- `user-read-playback-state` - Read playback
- `user-modify-playback-state` - Control playback
- `playlist-read-private` - Read playlists
- `playlist-modify-public` - Modify public playlists
- `playlist-modify-private` - Modify private playlists

---

## Known Issues

### analyze_affinity - Authentication Required

**Status:** API Limitation (not a code bug)

The `analyze_affinity` tool requires an authenticated web session to access the Your Spotify collaborative endpoint. Public token authentication is insufficient for cross-user queries.

**Error:** `Authentication failed - check your Your Spotify token`

**Workaround:** None currently available. This would require Your Spotify to either:
1. Expose the affinity endpoint for public token access, or
2. Support dedicated API token authentication (not yet implemented upstream)

### Tier 4 Management Tools - Web Session Required

The following tools require an authenticated web session and cannot be used with public token access:

- `rename_account` - Change display username
- `revoke_public_access` - Revoke public share token
- `update_user_settings` - Update account settings

These return "read-only" errors when accessed via public token. This is expected behavior - public tokens are designed for read-only analytics access.

### API Limit Constraint

The Your Spotify API accepts `nb` (limit) parameter values of 1-30 only. Requests for more than 30 items will be capped to 30.

---

**Last Updated:** 2026-01-14
