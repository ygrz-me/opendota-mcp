import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

// End-to-end tests for the MCP server
// These tests verify the server can start, handle requests, and shut down properly

describe('MCP Server E2E', () => {
  const serverPath = join(__dirname, '../../dist/index.js');
  
  beforeAll(async () => {
    // Ensure the server is built
    const { execSync } = require('child_process');
    try {
      execSync('npm run build', { stdio: 'pipe' });
    } catch (error) {
      console.error('Failed to build server:', error);
      throw error;
    }
  });

  describe('Server startup and shutdown', () => {
    it('should start and respond to basic MCP requests', async () => {
      const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let errorOutput = '';

      server.stdout.on('data', (data) => {
        output += data.toString();
      });

      server.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Wait for server to start (look for startup message)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 10000);

        server.stderr.on('data', (data) => {
          if (data.toString().includes('OpenDota MCP Server running')) {
            clearTimeout(timeout);
            resolve(void 0);
          }
        });

        server.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Send a basic MCP request
      const listToolsRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

      // Wait for response
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Response timeout'));
        }, 5000);

        server.stdout.on('data', (data) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.id === 1) {
              expect(response.result).toBeDefined();
              expect(response.result.tools).toBeDefined();
              expect(Array.isArray(response.result.tools)).toBe(true);
              clearTimeout(timeout);
              resolve(void 0);
            }
          } catch (error) {
            // Ignore parsing errors, keep waiting
          }
        });
      });

      // Clean shutdown
      server.kill('SIGTERM');
      
      await new Promise((resolve) => {
        server.on('exit', resolve);
      });

      expect(errorOutput).toContain('OpenDota MCP Server running');
    }, 20000);

    it('should handle tool execution requests', async () => {
      const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test', SKIP_INTEGRATION: 'true' }
      });

      let responses: any[] = [];

      // Wait for server startup
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 10000);

        server.stderr.on('data', (data) => {
          if (data.toString().includes('OpenDota MCP Server running')) {
            clearTimeout(timeout);
            resolve(void 0);
          }
        });
      });

      // Collect responses
      server.stdout.on('data', (data) => {
        try {
          const lines = data.toString().trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              responses.push(JSON.parse(line));
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });

      // Send get_heroes tool request (this should work without API key)
      const toolRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get_heroes',
          arguments: {}
        }
      };

      server.stdin.write(JSON.stringify(toolRequest) + '\n');

      // Wait for response
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Tool execution timeout'));
        }, 15000);

        const checkForResponse = () => {
          const response = responses.find(r => r.id === 2);
          if (response) {
            expect(response.result).toBeDefined();
            expect(response.result.content).toBeDefined();
            expect(Array.isArray(response.result.content)).toBe(true);
            clearTimeout(timeout);
            resolve(void 0);
          } else {
            setTimeout(checkForResponse, 100);
          }
        };

        checkForResponse();
      });

      server.kill('SIGTERM');
      await new Promise((resolve) => server.on('exit', resolve));
    }, 30000);

    it('should handle invalid requests gracefully', async () => {
      const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let responses: any[] = [];

      // Wait for server startup
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 10000);

        server.stderr.on('data', (data) => {
          if (data.toString().includes('OpenDota MCP Server running')) {
            clearTimeout(timeout);
            resolve(void 0);
          }
        });
      });

      // Collect responses
      server.stdout.on('data', (data) => {
        try {
          const lines = data.toString().trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              responses.push(JSON.parse(line));
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });

      // Send invalid request
      const invalidRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'invalid/method',
        params: {}
      };

      server.stdin.write(JSON.stringify(invalidRequest) + '\n');

      // Wait for error response
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Error response timeout'));
        }, 5000);

        const checkForResponse = () => {
          const response = responses.find(r => r.id === 3);
          if (response) {
            expect(response.error).toBeDefined();
            clearTimeout(timeout);
            resolve(void 0);
          } else {
            setTimeout(checkForResponse, 100);
          }
        };

        checkForResponse();
      });

      server.kill('SIGTERM');
      await new Promise((resolve) => server.on('exit', resolve));
    }, 15000);
  });
});