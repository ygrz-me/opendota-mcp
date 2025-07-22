# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

This is a production-ready OpenDota MCP Server built with TypeScript and Node.js. It provides a Model Context Protocol interface for querying the OpenDota API with both structured tools and natural language support.

## Development Workflow

### Setup and Build
- Use `make dev-setup` for initial environment setup
- Use `make build` to compile TypeScript
- Use `make test` to run the test suite
- Use `make quality` to run all quality checks

### Code Architecture

The project follows these patterns:
- **MCP Protocol**: Implements the Model Context Protocol for tool-based interactions
- **Structured Logging**: Uses Pino for production-grade logging with structured data
- **Error Handling**: Custom error classes with proper error categorization
- **API Client Pattern**: OpenDotaClient abstracts API interactions with logging and error handling
- **Docker Multi-stage**: Production builds use multi-stage Docker for optimization

### Key Components

- `src/index.ts` - Main MCP server with tool handlers and natural language parsing
- `src/opendota-client.ts` - OpenDota API client with logging and error handling
- `src/logger.ts` - Production logging configuration and custom error classes
- `src/types.ts` - TypeScript type extensions

### Testing Strategy

- Unit tests for core functionality
- Integration tests for API interactions
- End-to-end tests for full MCP server validation
- Security scanning and SBOM generation
- Coverage requirements enforced in CI/CD

### Production Considerations

- All code must pass security scans (`make security`)
- SBOM generation is required for compliance
- Docker containers run as non-root users
- Structured logging for observability
- Health checks and graceful shutdowns
- Environment-based configuration

## Commands Reference

Use the Makefile for all operations:
- `make help` - Show all available commands
- `make dev-setup` - Set up development environment  
- `make quality` - Run complete quality pipeline
- `make deploy-local` - Full production deployment