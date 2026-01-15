# Your Spotify MCP Server - Usage Guide

**Server Version:** 0.2.3
**Last Updated:** 2026-01-14

This guide provides practical examples for using the Your Spotify MCP server to analyze your listening history. All examples are based on tested, working functionality.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Queries](#basic-queries)
3. [Deep Dive Statistics](#deep-dive-statistics)
4. [Time-Based Analysis](#time-based-analysis)
5. [Pattern Analysis](#pattern-analysis)
6. [Discovery & Exploration](#discovery--exploration)
7. [Rankings & Comparisons](#rankings--comparisons)
8. [Exporting Your Data](#exporting-your-data)
9. [Sharing Your Stats](#sharing-your-stats)
10. [Multi-Step Workflows](#multi-step-workflows)
11. [Natural Language Examples](#natural-language-examples)

---

## Getting Started

### What You Can Do

The Your Spotify MCP server connects to your Your Spotify instance (self-hosted Spotify analytics) and provides:

- **Analytics** - Track, artist, and album statistics
- **Wrapped Reports** - Custom "Spotify Wrapped" for any date range
- **Pattern Analysis** - When and how you listen
- **Historical Search** - Search your complete listening history
- **Data Export** - Export in JSON, CSV, or summary formats
- **Public Sharing** - Generate shareable links to your stats

### Available Tool Tiers

| Tier | Category | Status |
|------|----------|--------|
| 1 | Core Analytics | ✅ Fully Available |
| 2 | Enhanced Analytics | ✅ Mostly Available* |
| 3 | Power Analytics | ✅ Fully Available |
| 4 | Management | ⚠️ Read-only (some features need web auth) |
| 5 | Spotify Control | ❌ Not configured |

*analyze_affinity has authentication issues

---

## Basic Queries

### Get Your Top Tracks

**All-time top 10:**
```
"What are my most played songs ever?"
```

**Top tracks from a specific period:**
```
"Show me my top 20 tracks from 2024"
"What were my most played songs last month?"
"Top 5 tracks from summer 2024"
```

**With date ranges:**
```
"My top tracks between January and March 2024"
"Most played songs from December 2025"
```

### Get Your Top Artists

**All-time favorites:**
```
"Who are my top 10 artists?"
"My most listened to artists ever"
```

**Time-specific:**
```
"Top 5 artists this year"
"Who did I listen to most in 2024?"
"My favorite artists from the last 6 months"
```

### Search Your History

**Find specific artists:**
```
"Have I listened to Pink Floyd?"
"Search my history for Radiohead"
"Find all times I played Twenty One Pilots"
```

**Find songs by name:**
```
"Find songs with 'love' in the title"
"Search for tracks called 'Ride'"
```

**Find albums:**
```
"Have I listened to the album 'Clancy'?"
"Search my history for 'The Search' album"
```

---

## Deep Dive Statistics

### Track Statistics

Get detailed stats for a specific track:

```
"How many times have I played 'Ride' by Twenty One Pilots?"
"When did I first listen to 'A Thousand Years'?"
"What's my peak listening day for 'I Shall Believe'?"
```

**Returns:**
- Total play count
- Total listening time
- First and last play dates
- Peak listening day
- Average plays per day

### Artist Statistics

Get comprehensive artist data:

```
"How much have I listened to NF?"
"Give me stats on Twenty One Pilots"
"How many hours of Pink Floyd have I played?"
```

**Returns:**
- Total plays across all tracks
- Total listening time in hours
- First discovery date
- Most recent play
- Top 5 tracks by that artist

---

## Time-Based Analysis

### Custom Wrapped Reports

Create your own "Spotify Wrapped" for any period:

**Full year:**
```
"Create my Wrapped for 2024"
"Generate a year-end summary for 2023"
```

**Seasons:**
```
"Make a Wrapped for summer 2024"
"My spring listening summary"
"Winter 2024 Wrapped"
```

**Single month:**
```
"Create a Wrapped for December 2025"
"My November stats"
```

**Custom ranges:**
```
"Wrapped for January through March 2024"
"My listening summary from June 1 to August 31"
```

**Wrapped includes:**
- Total listening hours
- Total tracks played
- Top 5 tracks with play counts
- Top 5 artists with listening time
- Top 5 albums
- Peak listening hour and day
- New artist discoveries

### Listening Timeline

See how your listening varies over time:

**Daily breakdown:**
```
"Show my listening timeline for January 2024"
"Daily play counts for last week"
```

**Weekly overview:**
```
"How has my listening changed week by week this year?"
"Weekly timeline for 2024"
```

**Monthly trends:**
```
"Show my monthly listening for the past 2 years"
"Monthly play counts since 2020"
```

---

## Pattern Analysis

### When Do You Listen?

**By hour of day:**
```
"What time of day do I listen to music most?"
"Am I a morning or evening listener?"
"Show my hourly listening patterns"
```

**By day of week:**
```
"Which day of the week do I listen most?"
"Am I a weekend or weekday listener?"
"Daily listening patterns"
```

**Combined analysis:**
```
"When do I listen the most - hour and day?"
"My complete listening schedule patterns"
```

**Example insights:**
- "Your peak listening is at 7:00 AM (8,298 plays, 6% of total)"
- "Friday is your most active day (21,461 plays, 16%)"
- "Lowest listening at 1:00 PM"

### Period Comparisons

Compare two time periods:

**Quarter vs quarter:**
```
"Compare my listening in Q1 vs Q2 2024"
"How did first quarter compare to second quarter?"
```

**Year over year:**
```
"Compare 2024 to 2023"
"How has my listening changed from last year?"
```

**Season comparisons:**
```
"Summer vs winter listening comparison"
"Compare my spring to fall listening"
```

**Half-year:**
```
"First half of 2024 vs second half"
"Compare H1 to H2"
```

**Returns:**
- Play count difference (absolute and percentage)
- Hours difference
- Top artist for each period
- Top track for each period
- Diversity changes

---

## Discovery & Exploration

### New Music Discovery

Find out what new music you discovered:

```
"What new artists did I discover in 2024?"
"Show me music I discovered this summer"
"New tracks I found last month"
```

**Returns:**
- New artists with first-listen dates
- New tracks discovered
- Summary counts

### Historical Search

Search your complete listening history:

```
"Find all jazz music I've listened to"
"Search for instrumental tracks"
"Have I played anything by [artist name]?"
```

---

## Rankings & Comparisons

### Artist Rankings

See where an artist ranks in your library:

```
"Where does Twenty One Pilots rank in my listening?"
"Is NF in my top 10?"
"What percentile is Pink Floyd in my history?"
```

**Returns:**
- Rank position (e.g., #1 out of 500 artists)
- Percentile (e.g., top 1%)
- Total play count

### Track Rankings

Check a track's position:

```
"Where does 'Ride' rank in my top songs?"
"Is 'A Thousand Years' in my top 100?"
"What's the rank of 'Stressed Out'?"
```

---

## Exporting Your Data

### Export Formats

**JSON (full data):**
```
"Export my 2024 listening data as JSON"
"Give me a JSON export of my stats"
```

**CSV (spreadsheet-friendly):**
```
"Export my top tracks as CSV"
"CSV export of 2024 listening"
```

**Summary (quick overview):**
```
"Give me a summary export"
"Export summary of my listening"
```

### Selective Exports

Choose what to include:

```
"Export just my tracks and artists"
"Export only album data"
"Export tracks, artists, and albums for 2024"
```

### Time-Bounded Exports

```
"Export my 2024 data"
"Export listening from the last 6 months"
"Export January through June 2024"
```

---

## Sharing Your Stats

### Generate Public Links

Create a shareable link to your stats:

```
"Create a public link to share my stats"
"Generate a shareable link"
"Make my listening stats public"
```

**With description:**
```
"Create a share link called 'My 2024 Music Journey'"
"Generate a public link with description 'Summer Vibes'"
```

**Note:** The link allows anyone to view your listening statistics without logging in.

---

## Multi-Step Workflows

### Workflow 1: Artist Deep Dive

"Find out everything about my favorite artist"

1. Get your top artists → Identify #1
2. Get detailed artist stats → Play count, hours, top tracks
3. Get artist rank → Percentile position
4. Search history → All tracks by that artist

### Workflow 2: Year in Review

"Create a comprehensive year summary"

1. Create custom wrapped for the year
2. Compare to previous year
3. Analyze listening patterns (hourly/daily)
4. Export the data

### Workflow 3: Discovery Analysis

"What new music did I find and how much did I listen?"

1. Get discovery insights for the period
2. For each new artist → Get artist stats
3. Get rankings for new favorites

### Workflow 4: Listening Trends

"How has my listening changed over time?"

1. Get monthly timeline for past 2 years
2. Compare H1 vs H2 for each year
3. Analyze pattern changes

### Workflow 5: Data Backup

"Export all my listening data"

1. Export as JSON (complete data)
2. Export as CSV (for spreadsheets)
3. Export summary (quick reference)

---

## Natural Language Examples

The server understands natural language. Here are example queries organized by intent:

### Quick Stats
- "What are my top 10 songs?"
- "Who's my favorite artist?"
- "How much music have I listened to?"

### Time Questions
- "What was I listening to last summer?"
- "My December stats"
- "How was my 2024?"

### Comparisons
- "Am I listening more this year?"
- "Compare my spring to fall listening"
- "Which month did I listen most?"

### Discovery
- "What new music did I find?"
- "Did I discover any new artists recently?"
- "Show me my recent discoveries"

### Patterns
- "When do I listen the most?"
- "Am I a morning listener?"
- "What day do I play the most music?"

### Search
- "Have I heard this artist before?"
- "Find songs with 'night' in the title"
- "Search for electronic music"

### Rankings
- "Where does [artist] rank?"
- "Is [song] in my top 100?"
- "What percentile is [artist]?"

### Export/Share
- "Export my data"
- "Create a shareable link"
- "Give me a CSV of my top tracks"

---

## Tips & Best Practices

### 1. Use Specific Date Ranges

Instead of: "My recent listening"
Use: "My listening from December 2025" or "Last 30 days"

### 2. Combine Queries for Deeper Insights

Start broad, then drill down:
1. "Top artists of 2024" → Identifies favorite
2. "Stats for [artist]" → Deep dive
3. "Rank of [artist]" → Context

### 3. Use Wrapped for Summaries

For any period overview, start with Wrapped:
- Creates comprehensive summary
- Includes top tracks, artists, albums
- Shows patterns and discoveries

### 4. Export Before Comparisons

When doing year-over-year analysis:
1. Export each year's data
2. Compare periods
3. Analyze patterns for each

### 5. Check Rankings for Context

Play counts alone don't tell the whole story:
- "I played X 50 times" → Is that a lot?
- "X is #5 out of 10,000 tracks (top 0.05%)" → Now you know!

---

## Limitations

### Currently Unavailable

1. **Multi-user affinity** - Comparing with friends (auth issues)
2. **Spotify playback control** - Play/pause/skip (Tier 5 not configured)
3. **Playlist management** - Create/edit playlists (Tier 5 not configured)
4. **Account settings** - Requires web authentication
5. **Username changes** - Requires web authentication

### Data Constraints

- History limited to what Your Spotify has collected
- New discoveries only tracked after Your Spotify installation
- Real-time playback data not available without Tier 5

---

## Quick Reference

| Task | Example Query |
|------|---------------|
| Top tracks | "My top 10 songs" |
| Top artists | "Who are my favorite artists?" |
| Artist stats | "How much NF have I listened to?" |
| Track stats | "How many times did I play Ride?" |
| Search | "Find songs with love" |
| Wrapped | "Create my 2024 Wrapped" |
| Timeline | "Monthly listening for 2024" |
| Patterns | "When do I listen most?" |
| Compare | "Q1 vs Q2 2024" |
| Rank | "Where does X rank?" |
| Export | "Export as CSV" |
| Share | "Create a public link" |

---

*Guide created for Your Spotify MCP Server v0.2.3*
