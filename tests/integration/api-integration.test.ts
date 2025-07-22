import { OpenDotaClient } from '../../src/opendota-client';

// Integration tests - these hit the real API
// Set SKIP_INTEGRATION=true to skip these tests
const skipIntegration = process.env.SKIP_INTEGRATION === 'true';

describe('OpenDota API Integration', () => {
  let client: OpenDotaClient;

  beforeAll(() => {
    if (skipIntegration) {
      console.log('Skipping integration tests - SKIP_INTEGRATION=true');
      return;
    }
    client = new OpenDotaClient();
  });

  describe('Real API calls', () => {
    // Use a well-known match ID that should always exist
    const testMatchId = 6000000000; // A reasonably recent match ID
    const testPlayerId = 32312992; // A known pro player (Arteezy)
    
    it('should fetch heroes data', async () => {
      if (skipIntegration) return;

      const heroes = await client.getHeroes();
      
      expect(Array.isArray(heroes)).toBe(true);
      expect(heroes.length).toBeGreaterThan(100); // Dota has 120+ heroes
      
      const firstHero = heroes[0];
      expect(firstHero).toHaveProperty('id');
      expect(firstHero).toHaveProperty('name');
      expect(firstHero).toHaveProperty('localized_name');
      expect(firstHero).toHaveProperty('primary_attr');
    }, 10000);

    it('should search for players', async () => {
      if (skipIntegration) return;

      const results = await client.searchPlayers('Arteezy');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length > 0) {
        const firstResult = results[0];
        expect(firstResult).toHaveProperty('account_id');
        expect(firstResult).toHaveProperty('personaname');
      }
    }, 10000);

    it('should fetch player data', async () => {
      if (skipIntegration) return;

      const player = await client.getPlayer(testPlayerId);
      
      expect(player).toHaveProperty('account_id', testPlayerId);
      expect(player).toHaveProperty('profile');
      expect(player.profile).toHaveProperty('personaname');
    }, 10000);

    it('should fetch player recent matches', async () => {
      if (skipIntegration) return;

      const matches = await client.getPlayerRecentMatches(testPlayerId);
      
      expect(Array.isArray(matches)).toBe(true);
      // Recent matches might be empty for some players
      if (matches.length > 0) {
        const firstMatch = matches[0];
        expect(firstMatch).toHaveProperty('match_id');
        expect(firstMatch).toHaveProperty('hero_id');
      }
    }, 10000);

    it('should fetch player heroes', async () => {
      if (skipIntegration) return;

      const heroes = await client.getPlayerHeroes(testPlayerId);
      
      expect(Array.isArray(heroes)).toBe(true);
      if (heroes.length > 0) {
        const firstHero = heroes[0];
        expect(firstHero).toHaveProperty('hero_id');
        expect(firstHero).toHaveProperty('games');
        expect(firstHero).toHaveProperty('win');
      }
    }, 10000);

    it('should fetch pro matches', async () => {
      if (skipIntegration) return;

      const matches = await client.getProMatches();
      
      expect(Array.isArray(matches)).toBe(true);
      if (matches.length > 0) {
        const firstMatch = matches[0];
        expect(firstMatch).toHaveProperty('match_id');
        expect(firstMatch).toHaveProperty('duration');
        expect(firstMatch).toHaveProperty('radiant_win');
      }
    }, 10000);

    it('should fetch public matches', async () => {
      if (skipIntegration) return;

      const matches = await client.getPublicMatches();
      
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
      
      const firstMatch = matches[0];
      expect(firstMatch).toHaveProperty('match_id');
      expect(firstMatch).toHaveProperty('match_seq_num');
    }, 10000);

    it('should handle rate limiting gracefully', async () => {
      if (skipIntegration) return;

      // Make multiple requests quickly to test rate limiting handling
      const promises = Array(3).fill(null).map(() => client.getHeroes());
      
      const results = await Promise.allSettled(promises);
      
      // At least some should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle non-existent match gracefully', async () => {
      if (skipIntegration) return;

      const nonExistentMatchId = 999999999999;
      
      await expect(client.getMatch(nonExistentMatchId))
        .rejects
        .toThrow();
    }, 10000);

    it('should handle non-existent player gracefully', async () => {
      if (skipIntegration) return;

      const nonExistentPlayerId = 999999999;
      
      // OpenDota returns an empty object for non-existent players
      // rather than an error, so this should succeed but return minimal data
      const result = await client.getPlayer(nonExistentPlayerId);
      expect(result).toBeDefined();
    }, 10000);
  });

  describe('Error handling', () => {
    it('should handle timeout errors appropriately', async () => {
      if (skipIntegration) return;

      // Create a client with very short timeout
      process.env.OPENDOTA_TIMEOUT = '1';
      const shortTimeoutClient = new OpenDotaClient();
      
      await expect(shortTimeoutClient.getHeroes())
        .rejects
        .toThrow();
        
      // Reset timeout
      delete process.env.OPENDOTA_TIMEOUT;
    }, 5000);
  });
});