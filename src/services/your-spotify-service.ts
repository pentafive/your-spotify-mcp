/**
 * Your Spotify Service
 *
 * Typed wrapper around the Your Spotify HTTP client.
 * Maps to actual Your Spotify API endpoints.
 *
 * Real API endpoints discovered:
 * - /spotify/top/songs - Top tracks
 * - /spotify/top/artists - Top artists
 * - /spotify/top/albums - Top albums
 * - /spotify/time_per - Listening time by day/week/month
 * - /spotify/time_per_hour_of_day - Listening by hour
 * - /spotify/songs_per - Song counts by period
 * - /spotify/listened_to - Total count
 * - /spotify/different_artists_per - Unique artists
 * - /track/:id/stats - Track statistics
 * - /track/:id/rank - Track ranking
 * - /artist/:id/stats - Artist statistics
 * - /artist/:id/rank - Artist ranking
 * - /artist/search/:query - Search artists
 * - /me - User info
 */

import { YourSpotifyClient } from '../lib/your-spotify-client.js';

// ============================================================
// API Response Types
// ============================================================

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  explicit: boolean;
  uri: string;
}

export interface Artist {
  id: string;
  name: string;
  genres?: string[];
}

export interface Album {
  id: string;
  name: string;
  release_date: string;
  images?: { url: string; width: number; height: number }[];
}

export interface TrackStats {
  track: Track;
  total_plays: number;
  total_duration_ms: number;
  first_played: string;
  last_played: string;
  average_plays_per_day: number;
  peak_day: string;
  peak_day_plays: number;
}

export interface ArtistStats {
  artist: Artist;
  total_plays: number;
  total_duration_ms: number;
  first_played: string;
  last_played: string;
  top_tracks: TrackWithPlayCount[];
  listening_time_hours: number;
}

export interface TrackWithPlayCount {
  track: Track;
  play_count: number;
}

export interface TopTracksResponse {
  tracks: TrackWithPlayCount[];
  period: {
    start: string;
    end: string;
  };
  total_count: number;
}

export interface TopArtistsResponse {
  artists: ArtistWithStats[];
  period: {
    start: string;
    end: string;
  };
  total_count: number;
}

export interface ArtistWithStats {
  artist: Artist;
  play_count: number;
  listening_time_ms: number;
}

export interface ListeningHistoryEntry {
  id: string;
  track: Track;
  played_at: string;
  duration_ms: number;
}

export interface ListeningHistoryResponse {
  items: ListeningHistoryEntry[];
  total: number;
  offset: number;
  limit: number;
}

export interface UserInfo {
  id: string;
  username: string;
  public_token?: string;
  settings?: {
    timezone?: string;
  };
}

// ============================================================
// Service Class
// ============================================================

export class YourSpotifyService {
  constructor(private client: YourSpotifyClient) {}

  // ============================================================
  // Tier 1: Core Analytics
  // ============================================================

  /**
   * Get detailed statistics for a specific track
   * Uses /track/:id/stats endpoint
   */
  async getTrackStats(trackId: string): Promise<TrackStats> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any>(`/track/${trackId}/stats`);

    // Handle the nested structure from API
    const track = rawData.track || {};
    const artist = rawData.artist || {};
    const album = rawData.album || {};
    const firstLast = rawData.firstLast || {};
    const bestPeriod = rawData.bestPeriod?.[0]; // bestPeriod is an array
    const total = rawData.total || {};

    return {
      track: {
        id: track.id || trackId,
        name: track.name || 'Unknown',
        artists: [{ id: artist._id || artist.id || '', name: artist.name || 'Unknown' }],
        album: {
          id: album._id || album.id || '',
          name: album.name || 'Unknown',
          release_date: album.release_date || '',
          images: album.images,
        },
        duration_ms: track.duration_ms || rawData.duration_ms || 0,
        explicit: track.explicit || false,
        uri: `spotify:track:${trackId}`,
      },
      total_plays: total.count || 0,
      total_duration_ms: (total.count || 0) * (track.duration_ms || 180000), // Estimate from play count
      first_played: firstLast.first?.played_at || '',
      last_played: firstLast.last?.played_at || '',
      average_plays_per_day: 0,
      peak_day: bestPeriod ? `${bestPeriod._id?.year}-${String(bestPeriod._id?.month || 1).padStart(2, '0')}-${String(bestPeriod._id?.day || 1).padStart(2, '0')}` : '',
      peak_day_plays: bestPeriod?.count || 0,
    };
  }

  /**
   * Get statistics for a specific artist
   * Uses /artist/:id/stats endpoint
   */
  async getArtistStats(artistId: string): Promise<ArtistStats> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any>(`/artist/${artistId}/stats`);

    const artist = rawData.artist || {};
    const firstLast = rawData.firstLast || {};
    const total = rawData.total || {};
    const mostListened = rawData.mostListened || []; // API uses "mostListened" not "songs"

    // Calculate duration from play count * average song length (~3.5 min)
    const totalPlays = total.count || 0;
    const estimatedDurationMs = totalPlays * 210000; // ~3.5 minutes per song

    return {
      artist: {
        id: artist.id || artistId,
        name: artist.name || 'Unknown',
        genres: artist.genres,
      },
      total_plays: totalPlays,
      total_duration_ms: estimatedDurationMs,
      first_played: firstLast.first?.played_at || '',
      last_played: firstLast.last?.played_at || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      top_tracks: mostListened.slice(0, 10).map((s: any) => ({
        track: {
          id: s.track?.id || s._id || '',
          name: s.track?.name || s.name || 'Unknown',
          artists: [{ id: artistId, name: artist.name || '' }],
          album: { id: s.album?.id || '', name: s.album?.name || '', release_date: '' },
          duration_ms: s.track?.duration_ms || s.duration_ms || 0,
          explicit: false,
          uri: `spotify:track:${s.track?.id || s._id || ''}`,
        },
        play_count: s.count || 0,
      })),
      listening_time_hours: Math.round(estimatedDurationMs / 3600000 * 10) / 10,
    };
  }

  /**
   * Get top tracks for a time period
   * Uses /spotify/top/songs endpoint
   */
  async getTopTracks(params: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<TopTracksResponse> {
    const apiParams: Record<string, unknown> = {
      start: params.start_date || '2000-01-01',
      nb: params.limit || 10,
      offset: params.offset || 0,
    };
    if (params.end_date) {
      apiParams.end = params.end_date;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any[]>('/spotify/top/songs', apiParams);

    // Map and sort by play count descending
    const tracks = (rawData || []).map(item => ({
      track: {
        id: item.track?.id || item._id || '',
        name: item.track?.name || 'Unknown',
        artists: [{ id: item.artist?.id || '', name: item.artist?.name || 'Unknown' }],
        album: { id: item.album?.id || '', name: item.album?.name || '', release_date: '' },
        duration_ms: item.track?.duration_ms || 0,
        explicit: false,
        uri: `spotify:track:${item.track?.id || item._id || ''}`,
      },
      play_count: item.count || 0,
    })).sort((a, b) => b.play_count - a.play_count);

    return {
      tracks,
      period: {
        start: params.start_date || '2000-01-01',
        end: params.end_date || new Date().toISOString().split('T')[0],
      },
      total_count: tracks.length,
    };
  }

  /**
   * Get top artists for a time period
   * Uses /spotify/top/artists endpoint
   */
  async getTopArtists(params: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<TopArtistsResponse> {
    const apiParams: Record<string, unknown> = {
      start: params.start_date || '2000-01-01',
      nb: params.limit || 10,
      offset: params.offset || 0,
    };
    if (params.end_date) {
      apiParams.end = params.end_date;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any[]>('/spotify/top/artists', apiParams);

    // Map and sort by play count descending
    const artists = (rawData || []).map(item => ({
      artist: {
        id: item.artist?.id || item._id || '',
        name: item.artist?.name || 'Unknown',
        genres: item.artist?.genres,
      },
      play_count: item.count || 0,
      listening_time_ms: item.duration_ms || 0,
    })).sort((a, b) => b.play_count - a.play_count);

    return {
      artists,
      period: {
        start: params.start_date || '2000-01-01',
        end: params.end_date || new Date().toISOString().split('T')[0],
      },
      total_count: artists.length,
    };
  }

  /**
   * Search listening history
   * Uses /artist/search/:query for artist search (only type available)
   * Note: Full history search is not available in the API
   */
  async searchHistory(params: {
    query: string;
    type?: 'track' | 'artist' | 'album';
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListeningHistoryResponse> {
    // For artist search, find matching artists and get their top tracks
    if (params.type === 'artist') {
      // Artist search API requires at least 3 characters
      // If query is shorter, fall back to local filtering
      if (params.query.length >= 3) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const artists = await this.client.get<any[]>(`/artist/search/${encodeURIComponent(params.query)}`);

          if (artists && artists.length > 0) {
            // Get top tracks and filter by the found artists
            const topTracks = await this.getTopTracks({
              start_date: params.start_date,
              end_date: params.end_date,
              limit: 30,
            });

            // Get set of found artist IDs for efficient lookup (try both id and _id fields)
            const artistIds = new Set(artists.flatMap((a: any) => [a.id, a._id].filter(Boolean)));
            // Also get artist names for fallback matching
            const artistNames = new Set(artists.map((a: any) => (a.name || '').toLowerCase()).filter(Boolean));

            // Filter tracks by found artists (try ID match first, then name match)
            const allFiltered = topTracks.tracks.filter(t =>
              t.track.artists.some(a =>
                artistIds.has(a.id) || artistNames.has(a.name.toLowerCase())
              )
            );

            // If we got results, return them
            if (allFiltered.length > 0) {
              const filtered = allFiltered.slice(params.offset || 0, (params.offset || 0) + (params.limit || 10));
              return {
                items: filtered.map(t => ({
                  id: t.track.id,
                  track: t.track,
                  played_at: '',
                  duration_ms: t.track.duration_ms,
                })),
                total: allFiltered.length,
                offset: params.offset || 0,
                limit: params.limit || 10,
              };
            }
            // If no results from ID/name matching, fall through to local filtering
          }
        } catch {
          // If artist search fails, fall through to local filtering
        }
      }

      // Fall back to local artist name filtering
      const topTracks = await this.getTopTracks({
        start_date: params.start_date,
        end_date: params.end_date,
        limit: 30,
      });

      const query = params.query.toLowerCase();
      const allFiltered = topTracks.tracks.filter(t =>
        t.track.artists.some(a => a.name.toLowerCase().includes(query))
      );
      const filtered = allFiltered.slice(params.offset || 0, (params.offset || 0) + (params.limit || 10));

      return {
        items: filtered.map(t => ({
          id: t.track.id,
          track: t.track,
          played_at: '',
          duration_ms: t.track.duration_ms,
        })),
        total: allFiltered.length,
        offset: params.offset || 0,
        limit: params.limit || 10,
      };
    }

    // For track/album search, use top songs with a filter approach
    // Get all top songs and filter by name (workaround)
    const topTracks = await this.getTopTracks({
      start_date: params.start_date,
      end_date: params.end_date,
      limit: 30,
    });

    const query = params.query.toLowerCase();
    const allFiltered = topTracks.tracks.filter(t =>
      t.track.name.toLowerCase().includes(query) ||
      t.track.artists.some(a => a.name.toLowerCase().includes(query))
    );
    const filtered = allFiltered.slice(params.offset || 0, (params.offset || 0) + (params.limit || 10));

    return {
      items: filtered.map(t => ({
        id: t.track.id,
        track: t.track,
        played_at: '',
        duration_ms: t.track.duration_ms,
      })),
      total: allFiltered.length,
      offset: params.offset || 0,
      limit: params.limit || 10,
    };
  }

  // ============================================================
  // Tier 2: Enhanced Analytics
  // ============================================================

  /**
   * Generate a custom Wrapped summary for any time period
   * Built by aggregating multiple API calls
   */
  async createCustomWrapped(params: {
    start_date: string;
    end_date: string;
  }): Promise<{
    period: { start: string; end: string };
    total_listening_time_ms: number;
    total_tracks_played: number;
    unique_tracks: number;
    unique_artists: number;
    top_tracks: TrackWithPlayCount[];
    top_artists: ArtistWithStats[];
    top_albums: { album: Album; play_count: number }[];
    listening_by_hour: Record<string, number>;
    listening_by_day: Record<string, number>;
  }> {
    const apiParams = { start: params.start_date, end: params.end_date };

    // Fetch all data in parallel
    // Note: /spotify/listened_to returns incorrect data, use total_count from top/songs instead
    const [topTracks, topArtists, topAlbums, hourData, timePer] = await Promise.all([
      this.client.get<any[]>('/spotify/top/songs', { ...apiParams, nb: 10 }),
      this.client.get<any[]>('/spotify/top/artists', { ...apiParams, nb: 10 }),
      this.client.get<any[]>('/spotify/top/albums', { ...apiParams, nb: 5 }),
      this.client.get<any[]>('/spotify/time_per', { ...apiParams, timeSplit: 'hour' }),
      this.client.get<any[]>('/spotify/time_per', { ...apiParams, timeSplit: 'day' }),
    ]);

    // Calculate total duration from timePer (sum of all daily durations)
    let totalDuration = 0;
    (timePer || []).forEach((item: any) => {
      totalDuration += item.count || 0;
    });

    // Transform hour data - aggregate by hour of day
    const listeningByHour: Record<string, number> = {};
    for (let i = 0; i < 24; i++) listeningByHour[String(i)] = 0;
    (hourData || []).forEach((item: any) => {
      const hour = item._id?.hour;
      if (hour !== undefined) {
        listeningByHour[String(hour)] += item.count || 0;
      }
    });

    // Transform day data - aggregate by day name
    const listeningByDay: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayNames.forEach(d => listeningByDay[d] = 0);
    (timePer || []).forEach((item: any) => {
      const id = item._id || {};
      if (id.year && id.month && id.day) {
        const date = new Date(id.year, id.month - 1, id.day);
        const dayName = dayNames[date.getDay()];
        listeningByDay[dayName] += item.count || 0;
      }
    });

    // Estimate unique tracks from top tracks count (best available proxy)
    const uniqueTracks = (topTracks || []).length;

    // Get total plays from top/songs total_count field (more accurate than listened_to)
    const totalTracksPlayed = topTracks?.[0]?.total_count || 0;

    return {
      period: { start: params.start_date, end: params.end_date },
      total_listening_time_ms: totalDuration,
      total_tracks_played: totalTracksPlayed,
      unique_tracks: uniqueTracks,
      unique_artists: (topArtists || []).length,
      top_tracks: (topTracks || []).map((item: any) => ({
        track: {
          id: item.track?.id || item._id || '',
          name: item.track?.name || 'Unknown',
          artists: [{ id: item.artist?.id || '', name: item.artist?.name || '' }],
          album: { id: item.album?.id || '', name: item.album?.name || '', release_date: '' },
          duration_ms: item.track?.duration_ms || 0,
          explicit: false,
          uri: `spotify:track:${item.track?.id || ''}`,
        },
        play_count: item.count || 0,
      })),
      top_artists: (topArtists || []).map((item: any) => ({
        artist: {
          id: item.artist?.id || item._id || '',
          name: item.artist?.name || 'Unknown',
          genres: item.artist?.genres,
        },
        play_count: item.count || 0,
        listening_time_ms: item.duration_ms || 0,
      })),
      top_albums: (topAlbums || []).map((item: any) => ({
        album: {
          id: item.album?.id || item._id || '',
          name: item.album?.name || 'Unknown',
          release_date: '',
        },
        play_count: item.count || 0,
      })),
      listening_by_hour: listeningByHour,
      listening_by_day: listeningByDay,
    };
  }

  /**
   * Analyze listening timeline
   * Uses /spotify/time_per endpoint for duration data
   */
  async getListeningTimeline(params: {
    start_date?: string;
    end_date?: string;
    granularity?: 'day' | 'week' | 'month';
  }): Promise<{
    timeline: { date: string; plays: number; duration_ms: number }[];
  }> {
    const apiParams: Record<string, unknown> = {
      start: params.start_date || '2000-01-01',
      timeSplit: params.granularity || 'day',
    };
    if (params.end_date) {
      apiParams.end = params.end_date;
    }

    // time_per returns duration in ms in the count field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any[]>('/spotify/time_per', apiParams);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timeline: (rawData || []).map((item: any) => {
        const id = item._id || {};
        let date = '';
        if (id.year && id.month && id.day) {
          date = `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
        } else if (id.year && id.month) {
          date = `${id.year}-${String(id.month).padStart(2, '0')}`;
        } else if (id.year && id.week) {
          date = `${id.year}-W${String(id.week).padStart(2, '0')}`;
        }
        const duration = item.count || 0; // time_per returns duration_ms in count field
        return {
          date,
          plays: Math.round(duration / 180000), // Estimate plays from ~3min avg song
          duration_ms: duration,
        };
      }),
    };
  }

  /**
   * Analyze listening affinity between multiple users
   * Uses /spotify/collaborative/top/songs endpoint
   */
  async analyzeAffinity(params: {
    user_ids: string[];
    mode: 'average' | 'minima';
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    users: Array<{ id: string; username: string }>;
    tracks: Array<{
      track: Track;
      score: number;
      play_counts: Record<string, number>;
    }>;
    stats?: {
      overlap_percentage: number;
    };
  }> {
    // Validate user_ids
    if (!params.user_ids || !Array.isArray(params.user_ids)) {
      throw new Error('user_ids must be an array of user IDs');
    }
    if (params.user_ids.length < 2) {
      throw new Error('Affinity analysis requires at least 2 user IDs');
    }
    // Filter out empty strings
    const validUserIds = params.user_ids.filter(id => id && typeof id === 'string' && id.trim());
    if (validUserIds.length < 2) {
      throw new Error('Affinity analysis requires at least 2 valid user IDs (non-empty strings)');
    }

    const apiParams: Record<string, unknown> = {
      ids: validUserIds.join(','),
      mode: params.mode === 'minima' ? 1 : 0, // API uses 0 for average, 1 for minima
      nb: params.limit || 20,
    };
    if (params.start_date) apiParams.start = params.start_date;
    if (params.end_date) apiParams.end = params.end_date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawData: any[];
    try {
      rawData = await this.client.get<any[]>('/spotify/collaborative/top/songs', apiParams);
    } catch (error) {
      // Provide more helpful error for common issues
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('404') || message.includes('not found')) {
        throw new Error(`Affinity analysis failed: One or more user IDs not found. Verify IDs: ${validUserIds.join(', ')}`);
      }
      throw new Error(`Affinity analysis failed: ${message}`);
    }

    return {
      users: validUserIds.map(id => ({ id, username: id })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tracks: (rawData || []).map((item: any) => ({
        track: {
          id: item.track?.id || item._id || '',
          name: item.track?.name || 'Unknown',
          artists: [{ id: item.artist?.id || '', name: item.artist?.name || '' }],
          album: { id: item.album?.id || '', name: item.album?.name || '', release_date: '' },
          duration_ms: item.track?.duration_ms || 0,
          explicit: false,
          uri: `spotify:track:${item.track?.id || ''}`,
        },
        score: item.count || 0,
        // Populate play_counts with per-user data if available, otherwise distribute total
        play_counts: item.play_counts || validUserIds.reduce((acc: Record<string, number>, id: string) => {
          acc[id] = Math.round((item.count || 0) / validUserIds.length);
          return acc;
        }, {}),
      })),
    };
  }

  // ============================================================
  // Tier 4: Account Management
  // ============================================================

  /**
   * Get current user info
   * Uses /me endpoint
   */
  async getCurrentUser(): Promise<UserInfo> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.get<any>('/me');

    if (!response.status || !response.user) {
      throw new Error('Failed to get user info - not authenticated');
    }

    return {
      id: response.user._id,
      username: response.user.username,
      public_token: response.user.publicToken,
      settings: response.user.settings,
    };
  }

  /**
   * Update user settings
   * Note: Settings updates require authenticated session, not public token
   */
  async updateSettings(_settings: {
    timezone?: string;
  }): Promise<{ success: boolean; updated_settings: Record<string, unknown>; message: string }> {
    // Settings endpoint may not be available via public token
    // Return informative error
    throw new Error('Settings updates require authenticated session. Public token access is read-only.');
  }

  /**
   * Generate/get a public share link
   * Returns the existing public token from the user profile
   */
  async generatePublicToken(): Promise<{
    success: boolean;
    public_token: string;
    public_url: string;
    created_at: string;
    message: string;
  }> {
    // Get current user info which includes publicToken
    const user = await this.getCurrentUser();

    if (!user.public_token) {
      throw new Error('No public token found. Generate one via the Your Spotify web interface first.');
    }

    // Construct the public URL (Your Spotify frontend URL)
    const baseUrl = this.client.getBaseUrl();
    // Replace api URL with frontend URL pattern
    const frontendUrl = baseUrl.replace('-api', '').replace('/api', '');

    return {
      success: true,
      public_token: user.public_token,
      public_url: `${frontendUrl}?token=${user.public_token}`,
      created_at: new Date().toISOString(),
      message: `Your public share link is ready. Anyone with this link can view your listening statistics.`,
    };
  }

  /**
   * Revoke public access
   * Note: Token revocation requires authenticated session - cannot be done via API
   */
  async revokePublicAccess(): Promise<{
    success: boolean;
    revoked_token: string;
    message: string;
  }> {
    throw new Error('Public token revocation requires an authenticated web session. Visit Your Spotify settings to revoke access.');
  }

  /**
   * Rename account
   * Note: Account rename requires authenticated session - cannot be done via API
   */
  async renameAccount(): Promise<{
    success: boolean;
    old_username: string;
    new_username: string;
    message: string;
  }> {
    throw new Error('Account rename requires an authenticated web session. Visit Your Spotify settings to change your username.');
  }

  // ============================================================
  // Tier 2: Ranking Methods
  // ============================================================

  /**
   * Get artist ranking
   * Uses /artist/:id/rank endpoint
   */
  async getArtistRank(artistId: string, params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    artist: Artist;
    rank: number;
    total_artists: number;
    play_count: number;
  }> {
    const apiParams: Record<string, unknown> = {};
    if (params?.start_date) apiParams.start = params.start_date;
    if (params?.end_date) apiParams.end = params.end_date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any>(`/artist/${artistId}/rank`, apiParams);

    // Get artist info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artistInfo = await this.client.get<any>(`/artist/${artistId}/stats`);

    // Find this artist's play count in the results array
    const artistPlayCount = rawData.results?.find((r: any) => r.id === artistId)?.count || 0;

    // The API's results array is just a neighborhood (few nearby artists), not all artists
    // Use index+1 as lower bound for total to ensure total >= rank
    const rank = (rawData.index || 0) + 1;
    const resultsLength = rawData.results?.length || 0;
    const totalArtists = Math.max(resultsLength, rank);

    return {
      artist: {
        id: artistId,
        name: artistInfo.artist?.name || 'Unknown',
        genres: artistInfo.artist?.genres,
      },
      rank,
      total_artists: totalArtists,
      play_count: artistPlayCount,
    };
  }

  /**
   * Get track ranking
   * Uses /track/:id/rank endpoint
   */
  async getTrackRank(trackId: string, params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    track: Track;
    rank: number;
    total_tracks: number;
    play_count: number;
  }> {
    const apiParams: Record<string, unknown> = {};
    if (params?.start_date) apiParams.start = params.start_date;
    if (params?.end_date) apiParams.end = params.end_date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any>(`/track/${trackId}/rank`, apiParams);

    // Get track info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackInfo = await this.client.get<any>(`/track/${trackId}/stats`);

    // The API's results array is just a neighborhood (few nearby tracks), not all tracks
    // Use index+1 as lower bound for total to ensure total >= rank
    const rank = (rawData.index || 0) + 1;
    const resultsLength = rawData.results?.length || 0;
    const totalTracks = Math.max(resultsLength, rank);

    return {
      track: {
        id: trackId,
        name: trackInfo.track?.name || 'Unknown',
        artists: [{ id: trackInfo.artist?._id || '', name: trackInfo.artist?.name || '' }],
        album: { id: trackInfo.album?._id || '', name: trackInfo.album?.name || '', release_date: '' },
        duration_ms: trackInfo.track?.duration_ms || 0,
        explicit: false,
        uri: `spotify:track:${trackId}`,
      },
      rank,
      total_tracks: totalTracks,
      play_count: rawData.results?.find((r: any) => r.id === trackId)?.count || 0,
    };
  }

  // ============================================================
  // Tier 3: Power Analytics
  // ============================================================

  /**
   * Analyze listening patterns
   * Uses /spotify/time_per endpoint with timeSplit parameter
   */
  async analyzeListeningPatterns(params: {
    pattern_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    patterns: Array<{
      period: string;
      plays: number;
      duration_ms: number;
    }>;
  }> {
    // API requires start date - default to beginning of all time if not provided
    const apiParams: Record<string, unknown> = {
      start: params.start_date || '2000-01-01',
    };
    if (params.end_date) apiParams.end = params.end_date;

    if (params.pattern_type === 'hourly' || params.pattern_type === 'hour_of_day' || !params.pattern_type) {
      // Get hourly patterns - aggregate all hours across the date range
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = await this.client.get<any[]>('/spotify/time_per', {
        ...apiParams,
        timeSplit: 'hour',
      });

      // Aggregate by hour of day (0-23)
      const hourTotals: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourTotals[i] = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rawData || []).forEach((item: any) => {
        const hour = item._id?.hour;
        if (hour !== undefined) {
          hourTotals[hour] += item.count || 0;
        }
      });

      return {
        patterns: Object.entries(hourTotals).map(([hour, duration]) => ({
          period: `${String(hour).padStart(2, '0')}:00`,
          plays: Math.round(duration / 180000), // Estimate plays from ~3min avg song
          duration_ms: duration,
        })),
      };
    } else if (params.pattern_type === 'day_of_week') {
      // Compute day-of-week from daily data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = await this.client.get<any[]>('/spotify/time_per', {
        ...apiParams,
        timeSplit: 'day',
      });

      // Aggregate by day of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayTotals: Record<number, number> = {};
      for (let i = 0; i < 7; i++) dayTotals[i] = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rawData || []).forEach((item: any) => {
        const id = item._id || {};
        if (id.year && id.month && id.day) {
          const date = new Date(id.year, id.month - 1, id.day);
          const dayOfWeek = date.getDay();
          dayTotals[dayOfWeek] += item.count || 0;
        }
      });

      return {
        patterns: dayNames.map((name, i) => ({
          period: name,
          plays: Math.round(dayTotals[i] / 180000),
          duration_ms: dayTotals[i],
        })),
      };
    } else if (params.pattern_type === 'day_and_time') {
      // Not directly supported - provide helpful message
      throw new Error('day_and_time pattern requires combining hour and day data. Try hour_of_day or day_of_week separately.');
    } else {
      // Get daily/weekly/monthly patterns
      // Map pattern_type to timeSplit value
      const timeSplitMap: Record<string, string> = {
        'day': 'day',
        'daily': 'day',
        'week': 'week',
        'weekly': 'week',
        'month': 'month',
        'monthly': 'month',
      };
      const timeSplit = timeSplitMap[params.pattern_type || 'day'] || 'day';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = await this.client.get<any[]>('/spotify/time_per', {
        ...apiParams,
        timeSplit,
      });

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patterns: (rawData || []).map((item: any) => {
          const id = item._id || {};
          let period = '';
          if (id.year && id.month && id.day) {
            period = `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
          } else if (id.year && id.month) {
            period = `${id.year}-${String(id.month).padStart(2, '0')}`;
          } else if (id.year && id.week) {
            period = `${id.year}-W${String(id.week).padStart(2, '0')}`;
          }
          const duration = item.count || 0;
          return {
            period,
            plays: Math.round(duration / 180000),
            duration_ms: duration,
          };
        }),
      };
    }
  }

  /**
   * Get discovery insights
   * Note: This is approximated since there's no direct "first listen" endpoint
   * We can identify tracks played only a few times as potential new discoveries
   */
  async getDiscoveryInsights(params: {
    start_date: string;
    end_date?: string;
    limit?: number;
  }): Promise<{
    period: { start: string; end: string };
    new_tracks: Array<{
      track: Track;
      first_played: string;
      total_plays: number;
    }>;
    new_artists: Array<{
      artist: Artist;
      first_played: string;
      total_plays: number;
    }>;
    total_new_tracks: number;
    total_new_artists: number;
  }> {
    // Get songs played in the period with low play counts (likely discoveries)
    const apiParams = {
      start: params.start_date,
      end: params.end_date || new Date().toISOString().split('T')[0],
      nb: params.limit || 20,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const songs = await this.client.get<any[]>('/spotify/top/songs', apiParams);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artists = await this.client.get<any[]>('/spotify/top/artists', { ...apiParams, nb: 10 });

    // Filter to tracks with lower play counts (rough approximation of "new")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discoveredTracks = (songs || []).filter((s: any) => s.count <= 5).slice(0, params.limit || 20);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discoveredArtists = (artists || []).filter((a: any) => a.count <= 10).slice(0, 10);

    return {
      period: { start: params.start_date, end: params.end_date || new Date().toISOString().split('T')[0] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new_tracks: discoveredTracks.map((item: any) => ({
        track: {
          id: item.track?.id || item._id || '',
          name: item.track?.name || 'Unknown',
          artists: [{ id: item.artist?.id || '', name: item.artist?.name || '' }],
          album: { id: item.album?.id || '', name: item.album?.name || '', release_date: '' },
          duration_ms: item.track?.duration_ms || 0,
          explicit: false,
          uri: `spotify:track:${item.track?.id || ''}`,
        },
        first_played: params.start_date,
        total_plays: item.count || 0,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new_artists: discoveredArtists.map((item: any) => ({
        artist: {
          id: item.artist?.id || item._id || '',
          name: item.artist?.name || 'Unknown',
        },
        first_played: params.start_date,
        total_plays: item.count || 0,
      })),
      total_new_tracks: discoveredTracks.length,
      total_new_artists: discoveredArtists.length,
    };
  }

  /**
   * Compare listening periods
   * Fetches stats for two periods and compares them
   */
  async compareListeningPeriods(params: {
    period1_start: string;
    period1_end: string;
    period2_start: string;
    period2_end: string;
  }): Promise<{
    period1: {
      total_plays: number;
      total_hours: number;
      unique_tracks: number;
      unique_artists: number;
      top_artist?: { name: string };
      top_track?: { name: string };
    };
    period2: {
      total_plays: number;
      total_hours: number;
      unique_tracks: number;
      unique_artists: number;
      top_artist?: { name: string };
      top_track?: { name: string };
    };
  }> {
    // Fetch data for both periods in parallel (including time_per for actual duration)
    // Note: /spotify/listened_to returns incorrect data, use total_count from top/songs instead
    const [p1Songs, p1Artists, p1Time, p2Songs, p2Artists, p2Time] = await Promise.all([
      this.client.get<any[]>('/spotify/top/songs', { start: params.period1_start, end: params.period1_end, nb: 1 }),
      this.client.get<any[]>('/spotify/top/artists', { start: params.period1_start, end: params.period1_end, nb: 1 }),
      this.client.get<any[]>('/spotify/time_per', { start: params.period1_start, end: params.period1_end, timeSplit: 'day' }),
      this.client.get<any[]>('/spotify/top/songs', { start: params.period2_start, end: params.period2_end, nb: 1 }),
      this.client.get<any[]>('/spotify/top/artists', { start: params.period2_start, end: params.period2_end, nb: 1 }),
      this.client.get<any[]>('/spotify/time_per', { start: params.period2_start, end: params.period2_end, timeSplit: 'day' }),
    ]);

    // Calculate actual duration from time_per
    let p1DurationMs = 0;
    (p1Time || []).forEach((item: any) => { p1DurationMs += item.count || 0; });
    let p2DurationMs = 0;
    (p2Time || []).forEach((item: any) => { p2DurationMs += item.count || 0; });

    // Get total plays from top/songs total_count field (more accurate than listened_to)
    const p1TotalPlays = p1Songs?.[0]?.total_count || 0;
    const p2TotalPlays = p2Songs?.[0]?.total_count || 0;

    return {
      period1: {
        total_plays: p1TotalPlays,
        total_hours: Math.round((p1DurationMs / (1000 * 60 * 60)) * 10) / 10,
        unique_tracks: 0, // Would need different API call
        unique_artists: 0,
        top_artist: p1Artists?.[0] ? { name: p1Artists[0].artist?.name || 'Unknown' } : undefined,
        top_track: p1Songs?.[0] ? { name: p1Songs[0].track?.name || 'Unknown' } : undefined,
      },
      period2: {
        total_plays: p2TotalPlays,
        total_hours: Math.round((p2DurationMs / (1000 * 60 * 60)) * 10) / 10,
        unique_tracks: 0,
        unique_artists: 0,
        top_artist: p2Artists?.[0] ? { name: p2Artists[0].artist?.name || 'Unknown' } : undefined,
        top_track: p2Songs?.[0] ? { name: p2Songs[0].track?.name || 'Unknown' } : undefined,
      },
    };
  }

  /**
   * Export listening data
   * Aggregates data from multiple endpoints
   */
  async exportListeningData(params: {
    start_date?: string;
    end_date?: string;
    format?: string;
    include?: string[];
    limit?: number;
  }): Promise<{
    period: { start: string; end: string };
    data: unknown;
    summary: {
      total_plays: number;
      total_hours: number;
      unique_tracks: number;
      unique_artists: number;
    };
  }> {
    const start = params.start_date || '2000-01-01';
    const end = params.end_date || new Date().toISOString().split('T')[0];
    // Your Spotify API only accepts nb=1-30
    const limit = Math.min(params.limit || 10, 30);

    // Note: /spotify/listened_to returns incorrect data, use total_count from top/songs instead
    const [topTracks, topArtists, timePer] = await Promise.all([
      this.client.get<any[]>('/spotify/top/songs', { start, end, nb: limit }),
      this.client.get<any[]>('/spotify/top/artists', { start, end, nb: limit }),
      this.client.get<any[]>('/spotify/time_per', { start, end, timeSplit: 'day' }),
    ]);

    // Calculate total duration from time_per (actual listening time in ms)
    let totalDurationMs = 0;
    (timePer || []).forEach((item: any) => {
      totalDurationMs += item.count || 0;
    });
    const totalHours = Math.round((totalDurationMs / (1000 * 60 * 60)) * 10) / 10;

    // Get total plays from top/songs total_count field (more accurate than listened_to)
    const totalPlays = topTracks?.[0]?.total_count || 0;

    return {
      period: { start, end },
      data: {
        top_tracks: topTracks || [],
        top_artists: topArtists || [],
      },
      summary: {
        total_plays: totalPlays,
        total_hours: totalHours,
        unique_tracks: (topTracks || []).length,
        unique_artists: (topArtists || []).length,
      },
    };
  }
}
