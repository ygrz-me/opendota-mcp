# OpenDota MCP Server

A production-ready Model Context Protocol (MCP) server for querying the OpenDota API with natural language support. This server provides comprehensive Dota 2 data access including match information, player statistics, hero data, and professional tournament results.

[![Security Scan](https://img.shields.io/badge/security-scanned-green.svg)](./SECURITY.md)
[![Production Ready](https://img.shields.io/badge/production-ready-brightgreen.svg)](./PRODUCTION_DEPLOYMENT.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Example

```
> Retrieve all data on player 71455761, and roast them as a player.

● I'll retrieve all the data on player 71455761 and then give you a thorough roast based on their gameplay! Let me gather their profile, match history, and statistics.

● Task(Get comprehensive player data)
  ⎿  Done (10 tool uses · 21.9k tokens · 1m 8.8s)         

● 🔥 ROAST OF PLAYER 71455761 🔥

  Meet George "Gotchya Bitch" Washington - The Divine One-Trick Wonder

  Alright homie, let's talk about your Dota career...

  🎯 The KotL Prison Warden (Population: You)

  1,269 games of Keeper of the Light. Let that marinate for a second. You've literally played the same hero over ONE THOUSAND times. That's not dedication, that's Stockholm syndrome. You're so committed to this hero that Valve should name a cosmetic set after you.

  You've turned Dota 2 into "Keeper of the Light Simulator" and somehow convinced yourself this counts as playing Dota. Brother, you're not a support player - you're a Keeper of the Light SPECIALIST who occasionally touches other heroes when KotL gets banned.
💀 The "Versatile" Support Player

  🏆 Divine Rank Through Illuminate Spam

  You hit Divine 2 by finding the most brain-dead support combo (Illuminate + Chakra Magic) and riding it to the top. You're like that friend who learned one guitar song really well and keeps playing it at every party.

  58.9% win rate after 1,269 games? At Divine rank, on your MAIN hero, you should be destroying people. Instead you're barely maintaining a positive win rate, which means half the time you're still figuring out where to stand during team fights.

  🎭 The Recent Match Reality Check

  Looking at your recent games:
  - Still spamming KotL in every single match
  - Going 3/12/14 in games you WIN (getting carried much?)
  - Multiple 7+ death games on your main hero

  Bro, you're Divine 2 and still feeding on the hero you've played over 1,000 times. That's like being a professional driver who still crashes in parking lots.

  🔥 The Divine Contradiction

  Here's what kills me: You're simultaneously good enough to reach Divine 2 (top 7% of players) but so one-dimensional that you'd probably lose to Archon players if they banned your comfort pick.

  You've mastered exactly ONE playstyle in a game with 120+ heroes. That's like being a chess grandmaster who only knows how to move pawns.

  💎 The Ultimate Roast

  You're the most successful failure in Dota. You've proven you CAN play at an elite level... but only when holding your emotional support hero. Put you on anything else and you turn into a Divine rank inter.

  You didn't climb to Divine - Keeper of the Light carried you there and you're too scared to let go of his hand.

  Roast Rating: 10/10 🔥

  You're living proof that you can reach high ranks through sheer stubbornness and hero spam. Respect the grind, but damn, learn a second hero!
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.17.0+ (see `.nvmrc`)
- Docker and Docker Compose
- Make (for orchestration)

### Fastest Setup (Docker)
```bash
# Clone the repository
git clone <repository-url>
cd opendota-mcp-server

# Deploy with full quality checks
make deploy-local
```

### Development Setup
```bash
# Set up development environment
make dev-setup

# Run quick development check
make quick
```

## 🔧 Running the Server - Multiple Options

This project uses a comprehensive Makefile for orchestration. Here are all the ways to run and manage the server:

### 1. Production Deployment
```bash
# Full production deployment with quality checks
make deploy-local          # Complete production setup
make quality              # Run all quality checks first
make docker-run           # Start production containers
```

### 2. Development Mode
```bash
# Development setup and execution
make dev-setup            # Set up development environment
make dev-start            # Start development server
make build                # Build TypeScript project
make test-watch           # Run tests in watch mode
```

### 3. Docker Operations
```bash
# Docker container management
make docker-build         # Build production Docker image
make docker-run           # Run container with production config
make docker-stop          # Stop running containers
make docker-logs          # View container logs
make docker-shell         # Open shell in running container
make docker-clean         # Clean Docker artifacts
```

### 4. Testing & Quality Assurance
```bash
# Testing options
make test                 # Run all tests
make test-unit            # Unit tests only
make test-integration     # Integration tests (requires API access)
make test-e2e            # End-to-end tests
make test-coverage       # Tests with coverage report

# Quality checks
make security            # Run security scan
make sbom               # Generate Software Bill of Materials
make quality            # Run all quality checks (tests + security + SBOM)
```

### 5. CI/CD and Automation
```bash
# CI/CD pipeline commands
make ci-install         # Install dependencies for CI
make ci-test           # Run tests in CI mode
make ci-quality        # Full CI quality pipeline

# Maintenance
make clean             # Clean build artifacts
make clean-all         # Deep clean including node_modules
make check-env         # Validate environment setup
make status            # Show project status
```

### 6. Manual Build and Run
```bash
# Manual process
make install           # Install dependencies
make build            # Build TypeScript
npm start             # Start the built server

# Or with development dependencies
make install-dev      # Install all dependencies
make build-clean      # Clean build and rebuild
```

## 📋 Makefile Command Reference

### Essential Commands
| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make deploy-local` | Complete production deployment |
| `make dev-setup` | Set up development environment |
| `make quality` | Run all quality checks |
| `make docker-run` | Start production containers |
| `make test` | Run all tests |

### Development Workflow
```bash
# Daily development workflow
make dev-setup          # One-time setup
make build             # Build changes
make test              # Verify tests pass
make security          # Check security
git commit -m "feat: ..." 
```

### Production Deployment Workflow
```bash
# Production deployment
make quality           # Ensure all checks pass
make docker-build      # Build production image  
make docker-run        # Deploy to production
make health-check      # Verify deployment
make logs             # Monitor logs
```

## 🛠️ Configuration

### Environment Variables
Copy `.env.example` to `.env` for custom configuration:

```bash
# Optional: OpenDota API key (get from https://www.opendota.com/api-keys)
OPENDOTA_API_KEY=your_api_key_here

# Optional: Custom API settings
OPENDOTA_BASE_URL=https://api.opendota.com/api
OPENDOTA_TIMEOUT=30000
USER_AGENT=OpenDota-MCP-Server/1.0.0

# Logging configuration
NODE_ENV=production
LOG_LEVEL=info
LOG_DIR=./logs
```

### MCP Client Setup

#### Claude Desktop Configuration
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opendota": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "opendota-mcp-server:latest"]
    }
  }
}
```

#### Local Node.js Configuration
```json
{
  "mcpServers": {
    "opendota": {
      "command": "node",
      "args": ["/path/to/opendota-mcp-server/dist/index.js"],
      "cwd": "/path/to/opendota-mcp-server"
    }
  }
}
```

## 🔍 Available Tools

### Core Data Tools
1. **get_match** - Get detailed match information
2. **get_player** - Get player profile data
3. **get_player_matches** - Get player's match history
4. **get_player_recent_matches** - Get recent matches
5. **get_player_heroes** - Get player's hero statistics
6. **search_players** - Search players by name
7. **get_heroes** - Get all hero information
8. **get_pro_matches** - Get professional matches

### Natural Language Tool
**natural_query** - Ask questions in plain English:
- "Show me match 6789123456"
- "Recent matches for player 123456789" 
- "Search for player named 'Miracle-'"
- "What heroes does player 123456789 play?"

## 🏗️ Project Structure

```
opendota-mcp-server/
├── src/                    # Source code
│   ├── index.ts           # Main MCP server
│   ├── opendota-client.ts # OpenDota API client
│   ├── logger.ts          # Production logging
│   └── types.ts           # TypeScript definitions
├── tests/                 # Test suites
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── scripts/              # Utility scripts
│   ├── security-scan.sh  # Security scanning
│   └── generate-sbom.sh  # SBOM generation
├── .github/workflows/    # CI/CD pipelines
├── Dockerfile           # Development container
├── Dockerfile.production # Production container
├── docker-compose.yml   # Development compose
├── docker-compose.production.yml # Production compose
├── Makefile            # Build orchestration
├── SECURITY.md         # Security policies
└── PRODUCTION_DEPLOYMENT.md # Deployment guide
```

## 🔒 Security & Production Features

### Security
- **Automated vulnerability scanning** with `make security`
- **Container security hardening** (non-root user, read-only filesystem)
- **Dependency auditing** and license compliance
- **Secret scanning** and secure environment handling
- **Software Bill of Materials** (SBOM) generation

### Production Ready
- **Multi-stage Docker builds** for optimized containers
- **Health checks** and graceful shutdowns
- **Structured JSON logging** with Pino
- **Error handling** with custom error classes
- **Resource limits** and monitoring integration
- **CI/CD pipelines** with quality gates

### Monitoring & Observability
- **Request/response logging** with timing metrics
- **Performance monitoring** integration points
- **Health check endpoints** for container orchestration
- **Log aggregation ready** for production systems

## 🧪 Testing & Quality

### Test Coverage
- **Unit tests**: Core functionality testing
- **Integration tests**: Real API interaction testing  
- **E2E tests**: Full system validation
- **Security tests**: Vulnerability scanning
- **Performance tests**: Load and response time testing

### Quality Gates
All production deployments must pass:
- ✅ Full test suite with coverage requirements
- ✅ Security scan with no critical vulnerabilities
- ✅ SBOM generation and compliance checks
- ✅ Docker build and container security validation
- ✅ Code quality and style checks

## 📊 Monitoring & Health

### Health Checks
```bash
make health-check      # Check if service is healthy
make logs             # View service logs
make status           # Show detailed project status
```

### Performance Monitoring
- Request/response timing
- API rate limit tracking
- Container resource usage
- Error rate monitoring

## 🚀 Deployment Options

### Local Development
```bash
make dev-setup && make dev-start
```

### Docker Development
```bash
make docker-build && make docker-run
```

### Production Deployment
```bash
make deploy-local    # Full local production setup
```

For cloud deployment, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).

## 📚 Documentation

- [Security Policy](./SECURITY.md) - Security procedures and policies
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Comprehensive deployment guide
- [API Documentation](https://docs.opendota.com/) - OpenDota API reference
- [MCP Protocol](https://modelcontextprotocol.io/) - Model Context Protocol specification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run quality checks: `make quality`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Workflow
```bash
# Set up development environment
make dev-setup

# Make changes and test
make quick              # Quick build + basic tests
make quality            # Full quality pipeline

# Before committing
make ci-quality         # Run CI-equivalent checks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Open an issue in this repository
- **OpenDota API**: Check [OpenDota documentation](https://docs.opendota.com/)
- **MCP Protocol**: See [MCP documentation](https://modelcontextprotocol.io/)
- **Security Issues**: See [SECURITY.md](./SECURITY.md) for reporting procedures

## ⭐ Acknowledgments

- [OpenDota](https://www.opendota.com/) for providing the excellent Dota 2 API
- [Anthropic](https://www.anthropic.com/) for the Model Context Protocol
- The Dota 2 community for their continued support and feedback
