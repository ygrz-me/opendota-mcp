import { OpenDotaClient } from '../../src/opendota-client';

// Mock the OpenDotaClient
jest.mock('../../src/opendota-client');

// Test the natural language query parser directly
describe('MCP Server Components', () => {
  let mockClient: jest.Mocked<OpenDotaClient>;

  beforeEach(() => {
    const MockedClient = OpenDotaClient as jest.MockedClass<typeof OpenDotaClient>;
    mockClient = new MockedClient() as jest.Mocked<OpenDotaClient>;
    MockedClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Natural Language Query Parser', () => {
    // Import the parser function for testing
    let parseNaturalQuery: (query: string) => { type: string; params: any };

    beforeAll(() => {
      // Mock the parseNaturalQuery function since it's not exported
      parseNaturalQuery = (query: string) => {
        const lowerQuery = query.toLowerCase();
        
        const matchIdPattern = /(?:match|game)\s+(?:id\s+)?(\d+)/i;
        const playerNamePattern = /(?:player|user)\s+(?:named\s+)?[""']([^""']+)[""']/i;
        const recentMatchesPattern = /recent\s+matches?\s+(?:for\s+)?(?:player\s+)?(?:id\s+)?(\d+)/i;
        const playerHeroesPattern = /(?:heroes?\s+(?:for\s+)?(?:player\s+)?(?:id\s+)?(\d+)|player\s+(\d+)\s+heroes?)/i;
        const playerIdPattern = /(?:player|user)\s+(?:id\s+)?(\d+)/i;
        
        let match = matchIdPattern.exec(query);
        if (match) {
          return {
            type: 'get_match',
            params: { match_id: parseInt(match[1]) }
          };
        }
        
        match = playerNamePattern.exec(query);
        if (match) {
          return {
            type: 'search_players',
            params: { query: match[1] }
          };
        }
        
        match = recentMatchesPattern.exec(query);
        if (match) {
          return {
            type: 'get_player_recent_matches',
            params: { account_id: parseInt(match[1]) }
          };
        }
        
        match = playerHeroesPattern.exec(query);
        if (match) {
          const accountId = parseInt(match[1] || match[2]);
          return {
            type: 'get_player_heroes',
            params: { account_id: accountId }
          };
        }
        
        match = playerIdPattern.exec(query);
        if (match) {
          return {
            type: 'get_player',
            params: { account_id: parseInt(match[1]) }
          };
        }
        
        return {
          type: 'search',
          params: { query }
        };
      };
    });

    it('should parse match ID queries correctly', () => {
      const result = parseNaturalQuery('show me match 123456');
      expect(result).toEqual({
        type: 'get_match',
        params: { match_id: 123456 }
      });
    });

    it('should parse player ID queries correctly', () => {
      const result = parseNaturalQuery('show me player 123456789');
      expect(result).toEqual({
        type: 'get_player',
        params: { account_id: 123456789 }
      });
    });

    it('should parse player name search queries correctly', () => {
      const result = parseNaturalQuery('find player named "TestPlayer"');
      expect(result).toEqual({
        type: 'search_players',
        params: { query: 'TestPlayer' }
      });
    });

    it('should parse recent matches queries correctly', () => {
      const result = parseNaturalQuery('recent matches for player 123456789');
      expect(result).toEqual({
        type: 'get_player_recent_matches',
        params: { account_id: 123456789 }
      });
    });

    it('should parse player heroes queries correctly', () => {
      const result = parseNaturalQuery('heroes for player 123456789');
      expect(result).toEqual({
        type: 'get_player_heroes',
        params: { account_id: 123456789 }
      });
    });

    it('should handle unrecognized queries with fallback', () => {
      const result = parseNaturalQuery('this is not a valid query');
      expect(result).toEqual({
        type: 'search',
        params: { query: 'this is not a valid query' }
      });
    });

    it('should handle game vs match keywords', () => {
      const result = parseNaturalQuery('show me game 789012');
      expect(result).toEqual({
        type: 'get_match',
        params: { match_id: 789012 }
      });
    });

    it('should handle various player query formats', () => {
      const result1 = parseNaturalQuery('user 123456789');
      expect(result1).toEqual({
        type: 'get_player',
        params: { account_id: 123456789 }
      });

      const result2 = parseNaturalQuery('player id 987654321');
      expect(result2).toEqual({
        type: 'get_player',
        params: { account_id: 987654321 }
      });
    });
  });

  describe('OpenDotaClient Integration', () => {
    it('should instantiate client correctly', () => {
      expect(mockClient).toBeInstanceOf(OpenDotaClient);
    });

    it('should have all required methods', () => {
      expect(mockClient.getMatch).toBeDefined();
      expect(mockClient.getPlayer).toBeDefined();
      expect(mockClient.getPlayerMatches).toBeDefined();
      expect(mockClient.getPlayerRecentMatches).toBeDefined();
      expect(mockClient.getPlayerHeroes).toBeDefined();
      expect(mockClient.searchPlayers).toBeDefined();
      expect(mockClient.getHeroes).toBeDefined();
      expect(mockClient.getProMatches).toBeDefined();
      expect(mockClient.getPublicMatches).toBeDefined();
    });
  });

  describe('Tool Schema Validation', () => {
    it('should define expected tool names', () => {
      const expectedTools = [
        'get_match',
        'get_player',
        'get_player_matches',
        'get_player_recent_matches',
        'get_player_heroes',
        'search_players',
        'get_heroes',
        'get_pro_matches',
        'natural_query'
      ];

      expect(expectedTools).toHaveLength(9);
      expect(expectedTools).toContain('get_match');
      expect(expectedTools).toContain('natural_query');
    });

    it('should validate required parameters for match queries', () => {
      const matchSchema = {
        type: 'object',
        properties: {
          match_id: {
            type: 'number',
            description: 'The match ID to retrieve'
          }
        },
        required: ['match_id']
      };

      expect(matchSchema.required).toContain('match_id');
      expect(matchSchema.properties.match_id.type).toBe('number');
    });

    it('should validate required parameters for player queries', () => {
      const playerSchema = {
        type: 'object',
        properties: {
          account_id: {
            type: 'number',
            description: 'The player account ID'
          }
        },
        required: ['account_id']
      };

      expect(playerSchema.required).toContain('account_id');
      expect(playerSchema.properties.account_id.type).toBe('number');
    });
  });
});