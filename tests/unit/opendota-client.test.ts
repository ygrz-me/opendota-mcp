import MockAdapter from 'axios-mock-adapter';
import { OpenDotaClient, Match, Player, PlayerData, Hero } from '../../src/opendota-client';

// Mock axios at the module level since we're using require in the client
const axios = require('axios');
const mockAxios = new MockAdapter(axios);

describe('OpenDotaClient', () => {
  let client: OpenDotaClient;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.OPENDOTA_API_KEY;
    client = new OpenDotaClient();
    mockAxios.reset();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('constructor', () => {
    it('should initialize without API key', () => {
      expect(client).toBeInstanceOf(OpenDotaClient);
    });

    it('should use API key when provided', () => {
      process.env.OPENDOTA_API_KEY = 'test-key';
      const clientWithKey = new OpenDotaClient();
      expect(clientWithKey).toBeInstanceOf(OpenDotaClient);
    });

    it('should use custom configuration from environment', () => {
      process.env.OPENDOTA_BASE_URL = 'https://custom.api.com';
      process.env.OPENDOTA_TIMEOUT = '10000';
      process.env.USER_AGENT = 'Custom-Agent';
      
      const customClient = new OpenDotaClient();
      expect(customClient).toBeInstanceOf(OpenDotaClient);
    });
  });

  describe('getMatch', () => {
    const mockMatch: Match = {
      match_id: 123456,
      duration: 2400,
      start_time: 1640995200,
      radiant_win: true,
      players: []
    };

    it('should fetch match data successfully', async () => {
      const expectedUrl = `${process.env.OPENDOTA_BASE_URL || 'https://api.opendota.com/api'}/matches/123456`;
      mockAxios.onGet(expectedUrl).reply(200, mockMatch);

      const result = await client.getMatch(123456);
      expect(result).toEqual(mockMatch);
    });

    it('should handle API errors gracefully', async () => {
      const expectedUrl = `${process.env.OPENDOTA_BASE_URL || 'https://api.opendota.com/api'}/matches/123456`;
      mockAxios.onGet(expectedUrl).reply(404, { error: 'Match not found' });

      await expect(client.getMatch(123456)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const expectedUrl = `${process.env.OPENDOTA_BASE_URL || 'https://api.opendota.com/api'}/matches/123456`;
      mockAxios.onGet(expectedUrl).networkError();

      await expect(client.getMatch(123456)).rejects.toThrow();
    });
  });

  describe('getPlayer', () => {
    const mockPlayer: PlayerData = {
      account_id: 123456789,
      profile: {
        personaname: 'TestPlayer',
        name: 'Test Player Real Name'
      }
    };

    it('should fetch player data successfully', async () => {
      mock.onGet('/players/123456789').reply(200, mockPlayer);

      const result = await client.getPlayer(123456789);
      expect(result).toEqual(mockPlayer);
    });

    it('should handle player not found', async () => {
      mock.onGet('/players/123456789').reply(404, { error: 'Player not found' });

      await expect(client.getPlayer(123456789)).rejects.toThrow();
    });
  });

  describe('getPlayerMatches', () => {
    const mockMatches = [
      { match_id: 1, hero_id: 1, kills: 10, deaths: 2, assists: 5 },
      { match_id: 2, hero_id: 2, kills: 8, deaths: 3, assists: 12 }
    ];

    it('should fetch player matches with default options', async () => {
      mock.onGet('/players/123456789/matches').reply(200, mockMatches);

      const result = await client.getPlayerMatches(123456789);
      expect(result).toEqual(mockMatches);
    });

    it('should fetch player matches with custom options', async () => {
      const options = { limit: 10, hero_id: 1 };
      mock.onGet('/players/123456789/matches')
        .reply((config: any) => {
          expect(config.params).toEqual(options);
          return [200, mockMatches];
        });

      const result = await client.getPlayerMatches(123456789, options);
      expect(result).toEqual(mockMatches);
    });
  });

  describe('getPlayerRecentMatches', () => {
    const mockRecentMatches = [
      { match_id: 1, hero_id: 1, kills: 10, deaths: 2, assists: 5 },
      { match_id: 2, hero_id: 2, kills: 8, deaths: 3, assists: 12 }
    ];

    it('should fetch recent matches successfully', async () => {
      mock.onGet('/players/123456789/recentMatches').reply(200, mockRecentMatches);

      const result = await client.getPlayerRecentMatches(123456789);
      expect(result).toEqual(mockRecentMatches);
    });
  });

  describe('getPlayerHeroes', () => {
    const mockHeroes = [
      { hero_id: 1, games: 50, win: 30, with_games: 45, with_win: 28 },
      { hero_id: 2, games: 25, win: 15, with_games: 20, with_win: 12 }
    ];

    it('should fetch player heroes successfully', async () => {
      mock.onGet('/players/123456789/heroes').reply(200, mockHeroes);

      const result = await client.getPlayerHeroes(123456789);
      expect(result).toEqual(mockHeroes);
    });
  });

  describe('getHeroes', () => {
    const mockHeroes: Hero[] = [
      {
        id: 1,
        name: 'antimage',
        localized_name: 'Anti-Mage',
        primary_attr: 'agi',
        attack_type: 'Melee',
        roles: ['Carry', 'Escape', 'Nuker']
      }
    ];

    it('should fetch all heroes successfully', async () => {
      mock.onGet('/heroes').reply(200, mockHeroes);

      const result = await client.getHeroes();
      expect(result).toEqual(mockHeroes);
    });
  });

  describe('searchPlayers', () => {
    const mockSearchResults = [
      { account_id: 123456789, personaname: 'TestPlayer', similarity: 0.9 }
    ];

    it('should search players successfully', async () => {
      mock.onGet('/search')
        .reply((config: any) => {
          expect(config.params).toEqual({ q: 'TestPlayer' });
          return [200, mockSearchResults];
        });

      const result = await client.searchPlayers('TestPlayer');
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('getProMatches', () => {
    const mockProMatches = [
      { match_id: 1, duration: 3600, radiant_win: true },
      { match_id: 2, duration: 2400, radiant_win: false }
    ];

    it('should fetch pro matches successfully', async () => {
      mock.onGet('/proMatches').reply(200, mockProMatches);

      const result = await client.getProMatches();
      expect(result).toEqual(mockProMatches);
    });
  });

  describe('getPublicMatches', () => {
    const mockPublicMatches = [
      { match_id: 1, match_seq_num: 100, radiant_win: true },
      { match_id: 2, match_seq_num: 101, radiant_win: false }
    ];

    it('should fetch public matches successfully', async () => {
      mock.onGet('/publicMatches').reply(200, mockPublicMatches);

      const result = await client.getPublicMatches();
      expect(result).toEqual(mockPublicMatches);
    });
  });

  describe('API key handling', () => {
    beforeEach(() => {
      process.env.OPENDOTA_API_KEY = 'test-api-key';
      client = new OpenDotaClient();
      // @ts-ignore
      mock = new MockAdapter(client.client);
    });

    it('should include API key in GET requests when available', async () => {
      mock.onGet('/heroes')
        .reply((config: any) => {
          expect(config.params).toHaveProperty('api_key', 'test-api-key');
          return [200, []];
        });

      await client.getHeroes();
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      mock.onGet('/heroes').timeout();

      await expect(client.getHeroes()).rejects.toThrow();
    });

    it('should handle server errors', async () => {
      mock.onGet('/heroes').reply(500, { error: 'Internal server error' });

      await expect(client.getHeroes()).rejects.toThrow();
    });

    it('should handle malformed responses', async () => {
      mock.onGet('/heroes').reply(200, 'invalid json');

      // This should not throw as axios handles JSON parsing
      const result = await client.getHeroes();
      expect(result).toBe('invalid json');
    });
  });
});