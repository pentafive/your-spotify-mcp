/**
 * Your Spotify HTTP Client
 *
 * Handles authenticated requests to the Your Spotify API with rate limiting.
 * Used for Tiers 1-4: Analytics, History, Affinity, and Account Management
 *
 * Rate Limit: 200ms minimum between requests (5 req/sec max)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Bottleneck from 'bottleneck';

export interface YourSpotifyConfig {
  baseUrl: string;
  token: string;
  /**
   * Authentication method:
   * - 'bearer': Use Authorization header (default, for JWT cookie-style tokens)
   * - 'query': Use ?token= query parameter (for public tokens)
   */
  authMethod?: 'bearer' | 'query';
}

export interface YourSpotifyError {
  code: string;
  message: string;
  status: number;
}

export class YourSpotifyClient {
  private client: AxiosInstance;
  private limiter: Bottleneck;
  private token: string;
  private authMethod: 'bearer' | 'query';

  constructor(config: YourSpotifyConfig) {
    // Validate configuration
    if (!config.baseUrl) {
      throw new Error('YOUR_SPOTIFY_API_URL is required');
    }
    if (!config.token) {
      throw new Error('YOUR_SPOTIFY_TOKEN is required');
    }

    this.token = config.token;
    this.authMethod = config.authMethod || 'query'; // Default to query for public tokens

    // Initialize axios client
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add Authorization header if using bearer auth
    if (this.authMethod === 'bearer') {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers,
      timeout: 30000, // 30 second timeout
    });

    // Initialize rate limiter: 200ms minimum between requests
    this.limiter = new Bottleneck({
      minTime: 200, // 200ms between requests
      maxConcurrent: 1, // Sequential requests
    });
  }

  /**
   * Add token to params if using query auth
   */
  private addTokenToParams(params?: Record<string, unknown>): Record<string, unknown> {
    if (this.authMethod === 'query') {
      return { ...params, token: this.token };
    }
    return params || {};
  }

  /**
   * Make a rate-limited GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.get<T>(endpoint, {
          params: this.addTokenToParams(params),
        });
        return response.data;
      } catch (error) {
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Make a rate-limited POST request
   */
  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.post<T>(endpoint, data, {
          params: this.addTokenToParams(),
        });
        return response.data;
      } catch (error) {
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Make a rate-limited PUT request
   */
  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.put<T>(endpoint, data, {
          params: this.addTokenToParams(),
        });
        return response.data;
      } catch (error) {
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Make a rate-limited DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response = await this.client.delete<T>(endpoint, {
          params: this.addTokenToParams(),
        });
        return response.data;
      } catch (error) {
        throw this.normalizeError(error);
      }
    });
  }

  /**
   * Normalize errors for consistent handling
   * Important: Never expose tokens in error messages
   */
  private normalizeError(error: unknown): YourSpotifyError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const status = axiosError.response?.status || 500;
      const message = axiosError.response?.data?.message
        || axiosError.response?.data?.error
        || axiosError.message
        || 'Unknown error';

      // Map common HTTP status codes to user-friendly messages
      const errorMessages: Record<number, string> = {
        400: 'Invalid request parameters',
        401: 'Authentication failed - check your Your Spotify token',
        403: 'Access denied - insufficient permissions',
        404: 'Resource not found',
        429: 'Rate limit exceeded - please wait before retrying',
        500: 'Your Spotify server error',
        502: 'Your Spotify server is temporarily unavailable',
        503: 'Your Spotify service is temporarily unavailable',
      };

      return {
        code: `YOUR_SPOTIFY_${status}`,
        message: errorMessages[status] || message,
        status,
      };
    }

    // Handle non-Axios errors
    return {
      code: 'YOUR_SPOTIFY_UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500,
    };
  }

  /**
   * Validate connection to Your Spotify API
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Try to get current user info to validate token
      await this.get('/me');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a Your Spotify client from environment variables
 *
 * Environment variables:
 * - YOUR_SPOTIFY_API_URL: Base URL (e.g., https://your-spotify-api.example.com)
 * - YOUR_SPOTIFY_TOKEN: Authentication token (public token or JWT)
 * - YOUR_SPOTIFY_AUTH_METHOD: 'query' (default) or 'bearer'
 */
export function createYourSpotifyClient(): YourSpotifyClient {
  const baseUrl = process.env.YOUR_SPOTIFY_API_URL;
  const token = process.env.YOUR_SPOTIFY_TOKEN;
  const authMethod = (process.env.YOUR_SPOTIFY_AUTH_METHOD || 'query') as 'bearer' | 'query';

  if (!baseUrl || !token) {
    throw new Error(
      'Missing Your Spotify configuration. Set YOUR_SPOTIFY_API_URL and YOUR_SPOTIFY_TOKEN environment variables.'
    );
  }

  return new YourSpotifyClient({ baseUrl, token, authMethod });
}
