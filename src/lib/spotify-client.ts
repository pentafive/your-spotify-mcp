/**
 * Spotify Web API HTTP Client
 *
 * Handles authenticated requests to Spotify's Web API with OAuth 2.0.
 * Used for Tier 5: Playlist management and playback control.
 *
 * Rate Limit: 180 requests per minute (sliding window)
 * Token Refresh: Automatic when access token expires
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Bottleneck from 'bottleneck';

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
}

export interface SpotifyError {
  code: string;
  message: string;
  status: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export class SpotifyClient {
  private client: AxiosInstance;
  private limiter: Bottleneck;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiresAt: number;

  constructor(config: SpotifyConfig) {
    // Validate required configuration
    if (!config.clientId || !config.clientSecret) {
      throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required');
    }
    if (!config.accessToken || !config.refreshToken) {
      throw new Error('SPOTIFY_ACCESS_TOKEN and SPOTIFY_REFRESH_TOKEN are required');
    }

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    // Assume token needs refresh soon if we don't know when it expires
    this.tokenExpiresAt = Date.now() + (50 * 60 * 1000); // 50 minutes from now

    // Initialize axios client
    this.client = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 30000, // 30 second timeout
    });

    // Initialize rate limiter: 180 requests per minute
    // That's 3 requests per second on average
    this.limiter = new Bottleneck({
      reservoir: 180, // 180 requests
      reservoirRefreshAmount: 180,
      reservoirRefreshInterval: 60 * 1000, // Per minute
      minTime: 50, // 50ms minimum between requests (buffer)
      maxConcurrent: 5, // Allow some concurrency
    });
  }

  /**
   * Get current authorization header, refreshing token if needed
   */
  private async getAuthHeader(): Promise<string> {
    // Refresh token if it expires within 5 minutes
    if (Date.now() > this.tokenExpiresAt - (5 * 60 * 1000)) {
      await this.refreshAccessToken();
    }
    return `Bearer ${this.accessToken}`;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post<TokenResponse>(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiration time (token expires in expires_in seconds)
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
      // Update refresh token if a new one was provided
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
      }
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Make a rate-limited GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.get<T>(endpoint, {
          params,
          headers: {
            'Authorization': await this.getAuthHeader(),
          },
        });
        return response.data;
      } catch (error) {
        // Handle 401 by attempting token refresh
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await this.refreshAccessToken();
          const response = await this.client.get<T>(endpoint, {
            params,
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          });
          return response.data;
        }
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Make a rate-limited POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.post<T>(endpoint, data, {
          headers: {
            'Authorization': await this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await this.refreshAccessToken();
          const response = await this.client.post<T>(endpoint, data, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          return response.data;
        }
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Make a rate-limited PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.put<T>(endpoint, data, {
          headers: {
            'Authorization': await this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await this.refreshAccessToken();
          const response = await this.client.put<T>(endpoint, data, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          return response.data;
        }
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Make a rate-limited DELETE request
   */
  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.delete<T>(endpoint, {
          headers: {
            'Authorization': await this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          data,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await this.refreshAccessToken();
          const response = await this.client.delete<T>(endpoint, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            data,
          });
          return response.data;
        }
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Normalize errors for consistent handling
   * Important: Never expose tokens in error messages
   */
  private normalizeError(error: unknown): SpotifyError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string; status?: number } }>;
      const status = axiosError.response?.status || 500;
      const message = axiosError.response?.data?.error?.message
        || axiosError.message
        || 'Unknown error';

      // Map common Spotify API errors
      const errorMessages: Record<number, string> = {
        400: 'Invalid request - check parameters',
        401: 'Authentication failed - Spotify token may need refresh',
        403: 'Premium required or scope missing',
        404: 'Resource not found on Spotify',
        429: 'Spotify rate limit exceeded - please wait',
        500: 'Spotify server error',
        502: 'Spotify service temporarily unavailable',
        503: 'Spotify service temporarily unavailable',
      };

      return {
        code: `SPOTIFY_${status}`,
        message: errorMessages[status] || message,
        status,
      };
    }

    return {
      code: 'SPOTIFY_UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500,
    };
  }

  /**
   * Validate connection to Spotify API
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.get('/me');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user's Spotify ID
   */
  async getCurrentUserId(): Promise<string> {
    const user = await this.get<{ id: string }>('/me');
    return user.id;
  }
}

/**
 * Create a Spotify client from environment variables
 * Returns null if Spotify credentials are not configured (Tier 5 optional)
 */
export function createSpotifyClient(): SpotifyClient | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  // Spotify API is optional (only needed for Tier 5)
  if (!clientId || !clientSecret || !accessToken || !refreshToken) {
    return null;
  }

  return new SpotifyClient({
    clientId,
    clientSecret,
    accessToken,
    refreshToken,
  });
}
