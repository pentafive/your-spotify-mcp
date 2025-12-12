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
    const bestPeriod = rawData.bestPeriod;

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
      total_plays: rawData.count || 0,
      total_duration_ms: rawData.duration_ms || 0,
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
    const songs = rawData.songs || [];

    return {
      artist: {
        id: artist.id || artistId,
        name: artist.name || 'Unknown',
        genres: artist.genres,
      },
      total_plays: rawData.count || 0,
      total_duration_ms: rawData.duration_ms || 0,
      first_played: firstLast.first?.played_at || '',
      last_played: firstLast.last?.played_at || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      top_tracks: songs.slice(0, 10).map((s: any) => ({
        track: {
          id: s.track?.id || s._id || '',
          name: s.track?.name || s.name || 'Unknown',
          artists: [{ id: artistId, name: artist.name || '' }],
          album: { id: '', name: '', release_date: '' },
          duration_ms: s.track?.duration_ms || s.duration_ms || 0,
          explicit: false,
          uri: `spotify:track:${s.track?.id || s._id || ''}`,
        },
        play_count: s.count || 0,
      })),
      listening_time_hours: Math.round((rawData.duration_ms || 0) / 3600000 * 10) / 10,
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

    return {
      tracks: (rawData || []).map(item => ({
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
      })),
      period: {
        start: params.start_date || '2000-01-01',
        end: params.end_date || new Date().toISOString().split('T')[0],
      },
      total_count: (rawData || []).length,
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

    return {
      artists: (rawData || []).map(item => ({
        artist: {
          id: item.artist?.id || item._id || '',
          name: item.artist?.name || 'Unknown',
          genres: item.artist?.genres,
        },
        play_count: item.count || 0,
        listening_time_ms: item.duration_ms || 0,
      })),
      period: {
        start: params.start_date || '2000-01-01',
        end: params.end_date || new Date().toISOString().split('T')[0],
      },
      total_count: (rawData || []).length,
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
    // Only artist search is available
    if (params.type === 'artist' || !params.type) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const artists = await this.client.get<any[]>(`/artist/search/${encodeURIComponent(params.query)}`);

      // Return as search results (not history entries)
      return {
        items: [],
        total: (artists || []).length,
        offset: params.offset || 0,
        limit: params.limit || 10,
      };
    }

    // For track/album search, use top songs with a filter approach
    // Get all top songs and filter by name (workaround)
    const topTracks = await this.getTopTracks({
      start_date: params.start_date,
      end_date: params.end_date,
      limit: 100,
    });

    const query = params.query.toLowerCase();
    const filtered = topTracks.tracks.filter(t =>
      t.track.name.toLowerCase().includes(query) ||
      t.track.artists.some(a => a.name.toLowerCase().includes(query))
    ).slice(0, params.limit || 10);

    return {
      items: filtered.map(t => ({
        id: t.track.id,
        track: t.track,
        played_at: '',
        duration_ms: t.track.duration_ms,
      })),
      total: filtered.length,
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
    const [topTracks, topArtists, topAlbums, hourData, songsPer, listenedTo] = await Promise.all([
      this.client.get<any[]>('/spotify/top/songs', { ...apiParams, nb: 10 }),
      this.client.get<any[]>('/spotify/top/artists', { ...apiParams, nb: 10 }),
      this.client.get<any[]>('/spotify/top/albums', { ...apiParams, nb: 5 }),
      this.client.get<any[]>('/spotify/time_per_hour_of_day', apiParams),
      this.client.get<any[]>('/spotify/songs_per', { ...apiParams, timeSplit: 'month' }),
      this.client.get<{ count: number }>('/spotify/listened_to', apiParams),
    ]);

    // Calculate totals
    let totalDuration = 0;
    let uniqueTracks = 0;
    (songsPer || []).forEach((item: any) => {
      uniqueTracks += item.differents || 0;
    });

    // Transform hour data
    const listeningByHour: Record<string, number> = {};
    (hourData || []).forEach((item: any) => {
      listeningByHour[String(item._id)] = item.count || 0;
    });

    // Calculate total duration from top tracks
    (topTracks || []).forEach((item: any) => {
      totalDuration += (item.duration_ms || 0);
    });

    return {
      period: { start: params.start_date, end: params.end_date },
      total_listening_time_ms: totalDuration,
      total_tracks_played: listenedTo?.count || 0,
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
      listening_by_day: {},
    };
  }

  /**
   * Analyze listening timeline
   * Uses /spotify/songs_per endpoint for accurate play counts
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

    // Use songs_per for accurate play counts (not time_per which returns duration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any[]>('/spotify/songs_per', apiParams);

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
        return {
          date,
          plays: item.count || 0, // songs_per returns actual play counts
          duration_ms: (item.count || 0) * 180000, // Estimate ~3min per song
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
    const apiParams: Record<string, unknown> = {
      ids: params.user_ids.join(','),
      mode: params.mode === 'minima' ? 1 : 0, // API uses 0 for average, 1 for minima
      nb: params.limit || 20,
    };
    if (params.start_date) apiParams.start = params.start_date;
    if (params.end_date) apiParams.end = params.end_date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = await this.client.get<any[]>('/spotify/collaborative/top/songs', apiParams);

    return {
      users: params.user_ids.map(id => ({ id, username: id })),
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
        play_counts: {},
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
  async updateSettings(settings: {
    timezone?: string;
  }): Promise<{ success: boolean; updated_settings: Record<string, unknown>; message: string }> {
    // Settings endpoint may not be available via public token
    // Return informative error
    throw new Error('Settings updates require authenticated session. Public token access is read-only.');
  }

  /**
   * Generate a public share link
   * Note: Token generation requires authenticated session
   */
  async generatePublicToken(): Promise<{
    success: boolean;
    public_token: string;
    public_url: string;
    created_at: string;
    message: string;
  }> {
    throw new Error('Public token generation requires authenticated session. Use the Your Spotify web interface.');
  }

  /**
   * Revoke public access
   * Note: Token revocation requires authenticated session
   */
  async revokePublicAccess(): Promise<{
    success: boolean;
    revoked_token: string;
    message: string;
  }> {
    throw new Error('Public token revocation requires authenticated session. Use the Your Spotify web interface.');
  }

  /**
   * Rename account
   * Note: Account rename requires authenticated session
   */
  async renameAccount(): Promise<{
    success: boolean;
    old_username: string;
    new_username: string;
    message: string;
  }> {
    throw new Error('Account rename requires authenticated session. Use the Your Spotify web interface.');
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

    return {
      artist: {
        id: artistId,
        name: artistInfo.artist?.name || 'Unknown',
        genres: artistInfo.artist?.genres,
      },
      rank: (rawData.index || 0) + 1, // API returns 0-indexed
      total_artists: 0, // Not provided by API
      play_count: rawData.results?.[0]?.count || 0,
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
      rank: (rawData.index || 0) + 1, // API returns 0-indexed
      total_tracks: 0, // Not provided by API
      play_count: rawData.results?.find((r: any) => r.id === trackId)?.count || 0,
    };
  }

  // ============================================================
  // Tier 3: Power Analytics
  // ============================================================

  /**
   * Analyze listening patterns
   * Uses /spotify/time_per_hour_of_day for hourly patterns
   * Uses /spotify/songs_per for daily/weekly/monthly patterns
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
    const apiParams: Record<string, unknown> = {};
    if (params.start_date) apiParams.start = params.start_date;
    if (params.end_date) apiParams.end = params.end_date;

    if (params.pattern_type === 'hourly' || params.pattern_type === 'hour_of_day' || !params.pattern_type) {
      // Get hourly patterns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = await this.client.get<any[]>('/spotify/time_per_hour_of_day', apiParams);

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patterns: (rawData || []).map((item: any) => ({
          period: `${String(item._id).padStart(2, '0')}:00`,
          plays: Math.round((item.count || 0) / 180000), // count is duration_ms, estimate plays from ~3min avg
          duration_ms: item.count || 0, // API returns duration in ms in the count field
        })),
      };
    } else if (params.pattern_type === 'day_of_week') {
      // Compute day-of-week from daily data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = await this.client.get<any[]>('/spotify/songs_per', {
        ...apiParams,
        timeSplit: 'day',
      });

      // Aggregate by day of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayTotals: Record<number, { plays: number; duration_ms: number }> = {};
      for (let i = 0; i < 7; i++) dayTotals[i] = { plays: 0, duration_ms: 0 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rawData || []).forEach((item: any) => {
        const id = item._id || {};
        if (id.year && id.month && id.day) {
          const date = new Date(id.year, id.month - 1, id.day);
          const dayOfWeek = date.getDay();
          dayTotals[dayOfWeek].plays += item.count || 0;
          dayTotals[dayOfWeek].duration_ms += (item.count || 0) * 180000;
        }
      });

      return {
        patterns: dayNames.map((name, i) => ({
          period: name,
          plays: dayTotals[i].plays,
          duration_ms: dayTotals[i].duration_ms,
        })),
      };
    } else if (params.pattern_type === 'day_and_time') {
      // Not directly supported - provide helpful message
      throw new Error('day_and_time pattern requires combining hour and day data. Try hour_of_day or day_of_week separately.');
    } else {
      // Get daily/weekly/monthly patterns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = await this.client.get<any[]>('/spotify/songs_per', {
        ...apiParams,
        timeSplit: params.pattern_type || 'day',
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
          }
          return {
            period,
            plays: item.count || 0,
            duration_ms: (item.count || 0) * 180000,
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
    // Fetch data for both periods in parallel
    const [p1Songs, p1Artists, p1Count, p2Songs, p2Artists, p2Count] = await Promise.all([
      this.client.get<any[]>('/spotify/top/songs', { start: params.period1_start, end: params.period1_end, nb: 1 }),
      this.client.get<any[]>('/spotify/top/artists', { start: params.period1_start, end: params.period1_end, nb: 1 }),
      this.client.get<{ count: number }>('/spotify/listened_to', { start: params.period1_start, end: params.period1_end }),
      this.client.get<any[]>('/spotify/top/songs', { start: params.period2_start, end: params.period2_end, nb: 1 }),
      this.client.get<any[]>('/spotify/top/artists', { start: params.period2_start, end: params.period2_end, nb: 1 }),
      this.client.get<{ count: number }>('/spotify/listened_to', { start: params.period2_start, end: params.period2_end }),
    ]);

    return {
      period1: {
        total_plays: p1Count?.count || 0,
        total_hours: Math.round((p1Count?.count || 0) * 3 / 60 * 10) / 10, // Estimate ~3min/song
        unique_tracks: 0, // Would need different API call
        unique_artists: 0,
        top_artist: p1Artists?.[0] ? { name: p1Artists[0].artist?.name || 'Unknown' } : undefined,
        top_track: p1Songs?.[0] ? { name: p1Songs[0].track?.name || 'Unknown' } : undefined,
      },
      period2: {
        total_plays: p2Count?.count || 0,
        total_hours: Math.round((p2Count?.count || 0) * 3 / 60 * 10) / 10,
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
    const limit = params.limit || 50;

    const [topTracks, topArtists, listenedTo] = await Promise.all([
      this.client.get<any[]>('/spotify/top/songs', { start, end, nb: limit }),
      this.client.get<any[]>('/spotify/top/artists', { start, end, nb: limit }),
      this.client.get<{ count: number }>('/spotify/listened_to', { start, end }),
    ]);

    return {
      period: { start, end },
      data: {
        top_tracks: topTracks || [],
        top_artists: topArtists || [],
      },
      summary: {
        total_plays: listenedTo?.count || 0,
        total_hours: Math.round((listenedTo?.count || 0) * 3 / 60 * 10) / 10,
        unique_tracks: (topTracks || []).length,
        unique_artists: (topArtists || []).length,
      },
    };
  }
}
