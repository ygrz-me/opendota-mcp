import { logger, APIError, TimeoutError } from './logger.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

export interface Match {
  match_id: number;
  duration: number;
  start_time: number;
  radiant_win: boolean;
  players: Player[];
  [key: string]: any;
}

export interface Player {
  account_id: number;
  hero_id: number;
  player_slot: number;
  kills: number;
  deaths: number;
  assists: number;
  personaname?: string;
  [key: string]: any;
}

export interface PlayerData {
  account_id: number;
  profile: {
    personaname: string;
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Hero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
}

export class OpenDotaClient {
  private baseURL: string;
  private timeout: number;
  private apiKey?: string;
  private userAgent: string;

  constructor() {
    this.apiKey = process.env.OPENDOTA_API_KEY;
    this.baseURL = process.env.OPENDOTA_BASE_URL || 'https://api.opendota.com/api';
    this.timeout = parseInt(process.env.OPENDOTA_TIMEOUT || '30000');
    this.userAgent = process.env.USER_AGENT || 'OpenDota-MCP-Server/1.0.0';
  }

  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    const startTime = Date.now();
    const url = `${this.baseURL}${endpoint}`;
    
    // Add API key if available
    if (this.apiKey) {
      params.api_key = this.apiKey;
    }

    logger.debug({
      type: 'api_request_start',
      method: 'GET',
      url,
      params,
    }, 'Starting OpenDota API request');

    try {
      const response = await axios.get(url, {
        params,
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      const duration = Date.now() - startTime;
      logger.logApiCall({
        method: 'GET',
        url,
        statusCode: response.status,
        duration,
      });

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const statusCode = error.response?.status;

      logger.logApiCall({
        method: 'GET',
        url,
        statusCode,
        duration,
        error: new APIError(
          `OpenDota API request failed: ${error.message}`,
          statusCode || 500,
          {
            code: error.code,
            response: error.response?.data,
          }
        ),
      });

      // Transform axios errors into our custom errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new TimeoutError(
          `OpenDota API request timed out after ${this.timeout}ms`,
          { originalError: error }
        );
      }

      throw new APIError(
        `OpenDota API request failed: ${error.message}`,
        statusCode || 500,
        {
          code: error.code,
          response: error.response?.data,
          originalError: error,
        }
      );
    }
  }

  async getMatch(matchId: number): Promise<Match> {
    return await this.makeRequest(`/matches/${matchId}`);
  }

  async getPlayer(accountId: number): Promise<PlayerData> {
    return await this.makeRequest(`/players/${accountId}`);
  }

  async getPlayerMatches(
    accountId: number,
    options: {
      limit?: number;
      hero_id?: number;
      game_mode?: number;
      lobby_type?: number;
    } = {}
  ): Promise<any[]> {
    return await this.makeRequest(`/players/${accountId}/matches`, options);
  }

  async getPlayerRecentMatches(accountId: number): Promise<any[]> {
    return await this.makeRequest(`/players/${accountId}/recentMatches`);
  }

  async getPlayerHeroes(accountId: number): Promise<any[]> {
    return await this.makeRequest(`/players/${accountId}/heroes`);
  }

  async getHeroes(): Promise<Hero[]> {
    return await this.makeRequest('/heroes');
  }

  async searchPlayers(query: string): Promise<any[]> {
    return await this.makeRequest('/search', { q: query });
  }

  async getProMatches(): Promise<any[]> {
    return await this.makeRequest('/proMatches');
  }

  async getPublicMatches(): Promise<any[]> {
    return await this.makeRequest('/publicMatches');
  }
}