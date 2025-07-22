#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { OpenDotaClient } from './opendota-client.js';
import { logger, MCPError, ValidationError, APIError } from './logger.js';

const client = new OpenDotaClient();

// Zod schemas for tool inputs
const GetMatchSchema = z.object({
  match_id: z.number().describe('The match ID to retrieve'),
});

const GetPlayerSchema = z.object({
  account_id: z.number().describe('The player account ID'),
});

const GetPlayerMatchesSchema = z.object({
  account_id: z.number().describe('The player account ID'),
  limit: z.number().optional().describe('Number of matches to return (default: 20)'),
  hero_id: z.number().optional().describe('Filter by specific hero ID'),
});

const SearchPlayersSchema = z.object({
  query: z.string().describe('Search term for player names'),
});

const NaturalQuerySchema = z.object({
  query: z.string().describe('Natural language query about Dota 2 matches or players'),
});

const server = new Server(
  {
    name: 'opendota-mcp-server',
    version: '1.0.0',
  }
);

// Helper function to parse natural language queries
function parseNaturalQuery(query: string): { type: string; params: any } {
  const lowerQuery = query.toLowerCase();
  
  // Match patterns for different query types
  const matchIdPattern = /(?:match|game)\s+(?:id\s+)?(\d+)/i;
  const playerNamePattern = /(?:player|user)\s+(?:named\s+)?[""']([^""']+)[""']/i;
  const playerIdPattern = /(?:player|user)\s+(?:id\s+)?(\d+)/i;
  const recentMatchesPattern = /recent\s+matches?\s+(?:for\s+)?(?:player\s+)?(?:id\s+)?(\d+)/i;
  const playerHeroesPattern = /(?:heroes?\s+(?:for\s+)?(?:player\s+)?(?:id\s+)?(\d+)|player\s+(\d+)\s+heroes?)/i;
  
  // Try to match different patterns
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
  
  match = playerIdPattern.exec(query);
  if (match) {
    return {
      type: 'get_player',
      params: { account_id: parseInt(match[1]) }
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
  
  // Default fallback
  return {
    type: 'search',
    params: { query }
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: 'get_match',
      description: 'Get detailed information about a specific Dota 2 match',
      inputSchema: {
        type: 'object',
        properties: {
          match_id: {
            type: 'number',
            description: 'The match ID to retrieve'
          }
        },
        required: ['match_id']
      },
    },
    {
      name: 'get_player',
      description: 'Get profile information for a specific player',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'number',
            description: 'The player account ID'
          }
        },
        required: ['account_id']
      },
    },
    {
      name: 'get_player_matches',
      description: 'Get match history for a specific player',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'number',
            description: 'The player account ID'
          },
          limit: {
            type: 'number',
            description: 'Number of matches to return (default: 20)'
          },
          hero_id: {
            type: 'number',
            description: 'Filter by specific hero ID'
          }
        },
        required: ['account_id']
      },
    },
    {
      name: 'get_player_recent_matches',
      description: 'Get recent matches for a specific player',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'number',
            description: 'The player account ID'
          }
        },
        required: ['account_id']
      },
    },
    {
      name: 'get_player_heroes',
      description: 'Get hero statistics for a specific player',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'number',
            description: 'The player account ID'
          }
        },
        required: ['account_id']
      },
    },
    {
      name: 'search_players',
      description: 'Search for players by name',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term for player names'
          }
        },
        required: ['query']
      },
    },
    {
      name: 'get_heroes',
      description: 'Get list of all Dota 2 heroes',
      inputSchema: {
        type: 'object',
        properties: {}
      },
    },
    {
      name: 'get_pro_matches',
      description: 'Get recent professional matches',
      inputSchema: {
        type: 'object',
        properties: {}
      },
    },
    {
      name: 'natural_query',
      description: 'Ask questions about Dota 2 matches and players in natural language',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language query about Dota 2 matches or players'
          }
        },
        required: ['query']
      },
    },
  ];
  
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();
  
  logger.debug({
    type: 'tool_request_start',
    toolName: name,
    arguments: args,
  }, `Starting tool execution: ${name}`);
  
  try {
    switch (name) {
      case 'get_match': {
        const { match_id } = GetMatchSchema.parse(args);
        const match = await client.getMatch(match_id);
        
        const duration = Date.now() - startTime;
        logger.logToolExecution({
          toolName: name,
          arguments: args,
          duration,
          success: true,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(match, null, 2),
            },
          ],
        };
      }
      
      case 'get_player': {
        const { account_id } = GetPlayerSchema.parse(args);
        const player = await client.getPlayer(account_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(player, null, 2),
            },
          ],
        };
      }
      
      case 'get_player_matches': {
        const { account_id, limit = 20, hero_id } = GetPlayerMatchesSchema.parse(args);
        const matches = await client.getPlayerMatches(account_id, { limit, hero_id });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(matches, null, 2),
            },
          ],
        };
      }
      
      case 'get_player_recent_matches': {
        const { account_id } = GetPlayerSchema.parse(args);
        const matches = await client.getPlayerRecentMatches(account_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(matches, null, 2),
            },
          ],
        };
      }
      
      case 'get_player_heroes': {
        const { account_id } = GetPlayerSchema.parse(args);
        const heroes = await client.getPlayerHeroes(account_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(heroes, null, 2),
            },
          ],
        };
      }
      
      case 'search_players': {
        const { query } = SearchPlayersSchema.parse(args);
        const players = await client.searchPlayers(query);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(players, null, 2),
            },
          ],
        };
      }
      
      case 'get_heroes': {
        const heroes = await client.getHeroes();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(heroes, null, 2),
            },
          ],
        };
      }
      
      case 'get_pro_matches': {
        const matches = await client.getProMatches();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(matches, null, 2),
            },
          ],
        };
      }
      
      case 'natural_query': {
        const { query } = NaturalQuerySchema.parse(args);
        const parsed = parseNaturalQuery(query);
        
        // Execute the parsed query
        switch (parsed.type) {
          case 'get_match':
            const match = await client.getMatch(parsed.params.match_id);
            return {
              content: [
                {
                  type: 'text',
                  text: `Match ${parsed.params.match_id} information:\n\n${JSON.stringify(match, null, 2)}`,
                },
              ],
            };
            
          case 'get_player':
            const player = await client.getPlayer(parsed.params.account_id);
            return {
              content: [
                {
                  type: 'text',
                  text: `Player ${parsed.params.account_id} information:\n\n${JSON.stringify(player, null, 2)}`,
                },
              ],
            };
            
          case 'search_players':
            const players = await client.searchPlayers(parsed.params.query);
            return {
              content: [
                {
                  type: 'text',
                  text: `Search results for "${parsed.params.query}":\n\n${JSON.stringify(players, null, 2)}`,
                },
              ],
            };
            
          case 'get_player_recent_matches':
            const recentMatches = await client.getPlayerRecentMatches(parsed.params.account_id);
            return {
              content: [
                {
                  type: 'text',
                  text: `Recent matches for player ${parsed.params.account_id}:\n\n${JSON.stringify(recentMatches, null, 2)}`,
                },
              ],
            };
            
          case 'get_player_heroes':
            const playerHeroes = await client.getPlayerHeroes(parsed.params.account_id);
            return {
              content: [
                {
                  type: 'text',
                  text: `Hero statistics for player ${parsed.params.account_id}:\n\n${JSON.stringify(playerHeroes, null, 2)}`,
                },
              ],
            };
            
          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `I couldn't understand your query: "${query}". Please try asking about specific matches, players, or use one of the available tools.`,
                },
              ],
            };
        }
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle different error types
    let mcpError: MCPError;
    
    if (error instanceof z.ZodError) {
      mcpError = new ValidationError(
        'Invalid tool arguments',
        { zodError: error.errors }
      );
    } else if (error instanceof MCPError) {
      mcpError = error;
    } else if (error instanceof Error) {
      mcpError = new MCPError(
        error.message,
        'TOOL_EXECUTION_ERROR',
        500,
        { originalError: error }
      );
    } else {
      mcpError = new MCPError(
        String(error),
        'UNKNOWN_ERROR',
        500,
        { originalError: error }
      );
    }

    logger.logToolExecution({
      toolName: name,
      arguments: args,
      duration,
      success: false,
      error: mcpError,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${mcpError.message}${
            process.env.NODE_ENV === 'development' && mcpError.details 
              ? `\n\nDetails: ${JSON.stringify(mcpError.details, null, 2)}` 
              : ''
          }`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  try {
    logger.logServerStart({
      transport: 'stdio',
      version: process.env.npm_package_version || '1.0.0',
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info('OpenDota MCP Server started and listening on stdio');
  } catch (error) {
    logger.fatal({ error }, 'Failed to start MCP Server');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.fatal({ error }, 'Unhandled error in main function');
  process.exit(1);
});