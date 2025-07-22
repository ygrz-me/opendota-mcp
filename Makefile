# OpenDota MCP Server - Production Makefile
# This Makefile orchestrates all development, testing, security, and deployment tasks

.PHONY: help install build test security quality docker clean docs deploy-local

# Default target
help: ## Show this help message
	@echo "OpenDota MCP Server - Make targets:"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Environment setup
NODE_VERSION := $(shell cat .nvmrc 2>/dev/null || echo "20.17.0")
PROJECT_NAME := opendota-mcp-server
TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)

# Development targets
install: ## Install dependencies
	@echo "🔧 Installing dependencies..."
	npm ci
	@echo "✅ Dependencies installed"

install-dev: ## Install all dependencies including dev tools
	@echo "🔧 Installing all dependencies (including dev)..."
	npm install
	@echo "✅ All dependencies installed"

build: ## Build the TypeScript project
	@echo "🏗️  Building project..."
	npm run build
	@echo "✅ Build completed"

build-clean: clean build ## Clean and rebuild the project

# Testing targets
test: ## Run all tests
	@echo "🧪 Running all tests..."
	npm run test
	@echo "✅ All tests completed"

test-unit: ## Run unit tests only
	@echo "🧪 Running unit tests..."
	npm run test:unit
	@echo "✅ Unit tests completed"

test-integration: ## Run integration tests (requires API access)
	@echo "🧪 Running integration tests..."
	@if [ "$$SKIP_INTEGRATION" != "true" ]; then \
		npm run test:integration; \
	else \
		echo "ℹ️  Skipping integration tests (SKIP_INTEGRATION=true)"; \
	fi
	@echo "✅ Integration tests completed"

test-e2e: build ## Run end-to-end tests
	@echo "🧪 Running E2E tests..."
	npm run test:e2e
	@echo "✅ E2E tests completed"

test-coverage: ## Run tests with coverage report
	@echo "🧪 Running tests with coverage..."
	npm run test:coverage
	@echo "✅ Coverage report generated in coverage/"

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	npm run test:watch

# Security and quality targets
security: ## Run comprehensive security scan
	@echo "🔒 Running security scan..."
	@mkdir -p security-reports
	./scripts/security-scan.sh
	@echo "✅ Security scan completed"

sbom: ## Generate Software Bill of Materials
	@echo "📋 Generating SBOM..."
	@mkdir -p sbom
	./scripts/generate-sbom.sh
	@echo "✅ SBOM generated in sbom/"

quality: test-coverage security sbom ## Run all quality checks (tests, security, SBOM)
	@echo "🎯 Quality check summary:"
	@echo "========================"
	@echo "✅ Tests with coverage completed"
	@echo "✅ Security scan completed"
	@echo "✅ SBOM generated"
	@echo "📊 Check reports in:"
	@echo "  - coverage/ (test coverage)"
	@echo "  - security-reports/ (security scan)"
	@echo "  - sbom/ (software bill of materials)"

lint: ## Run linter (placeholder - add linting tools as needed)
	@echo "🧹 Running linter..."
	@echo "ℹ️  Add linting tools like ESLint to package.json and update this target"

# Docker targets  
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t $(PROJECT_NAME):latest .
	docker build -t $(PROJECT_NAME):$(TIMESTAMP) .
	@echo "✅ Docker image built: $(PROJECT_NAME):latest, $(PROJECT_NAME):$(TIMESTAMP)"

docker-run: docker-build ## Run Docker container locally
	@echo "🐳 Starting Docker container..."
	docker-compose up -d
	@echo "✅ Container started. Use 'make docker-logs' to view logs"

docker-stop: ## Stop Docker containers
	@echo "🐳 Stopping Docker containers..."
	docker-compose down
	@echo "✅ Containers stopped"

docker-logs: ## Show Docker container logs
	@echo "🐳 Showing container logs..."
	docker-compose logs -f

docker-shell: ## Open shell in running container
	@echo "🐳 Opening shell in container..."
	docker-compose exec $(PROJECT_NAME) /bin/bash

docker-clean: ## Clean Docker images and containers
	@echo "🐳 Cleaning Docker artifacts..."
	docker-compose down --rmi all --volumes --remove-orphans
	@echo "✅ Docker cleanup completed"

# Production deployment targets
deploy-local: quality docker-build ## Deploy locally (full quality check + Docker)
	@echo "🚀 Deploying locally..."
	@echo "Running full quality pipeline..."
	@$(MAKE) docker-run
	@echo "✅ Local deployment completed!"
	@echo ""
	@echo "🎯 Deployment Summary:"
	@echo "======================"
	@echo "✅ All tests passed with coverage"
	@echo "✅ Security scan completed"
	@echo "✅ SBOM generated"
	@echo "✅ Docker container running"
	@echo ""
	@echo "📝 Next steps:"
	@echo "  - Check logs: make docker-logs"
	@echo "  - Stop container: make docker-stop"
	@echo "  - View reports in security-reports/ and sbom/"

deploy-production: ## Production deployment checklist
	@echo "🚀 Production Deployment Checklist:"
	@echo "==================================="
	@echo "1. Ensure all quality checks pass: make quality"
	@echo "2. Build production image: make docker-build"
	@echo "3. Update environment variables in production"
	@echo "4. Deploy to production infrastructure"
	@echo "5. Monitor logs and health checks"
	@echo ""
	@echo "⚠️  This is a checklist - implement actual deployment scripts per your infrastructure"

# Maintenance targets
clean: ## Clean build artifacts and generated files
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf coverage/
	rm -rf security-reports/
	rm -rf sbom/
	rm -rf node_modules/.cache/
	@echo "✅ Clean completed"

clean-all: clean ## Clean everything including node_modules
	@echo "🧹 Deep cleaning (including node_modules)..."
	rm -rf node_modules/
	@echo "✅ Deep clean completed"

# Development utilities
dev-setup: install build ## Set up development environment
	@echo "🔧 Setting up development environment..."
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "🎯 Available commands:"
	@echo "  make test        - Run tests"
	@echo "  make security    - Security scan"
	@echo "  make docker-run  - Run in Docker"
	@echo "  make quality     - Full quality check"

dev-start: build ## Start development server
	@echo "🚀 Starting development server..."
	npm run dev

# CI/CD targets (for use in CI systems)
ci-install: ## Install dependencies for CI
	@echo "🔧 CI: Installing dependencies..."
	npm ci --prefer-offline --no-audit
	@echo "✅ CI: Dependencies installed"

ci-test: ## Run tests in CI mode
	@echo "🧪 CI: Running tests..."
	npm run test:ci
	@echo "✅ CI: Tests completed"

ci-quality: ci-test security sbom ## Full CI quality pipeline
	@echo "✅ CI: Quality pipeline completed"

# Documentation targets
docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	@mkdir -p docs
	@echo "# OpenDota MCP Server Documentation" > docs/README.md
	@echo "" >> docs/README.md
	@echo "This documentation is generated automatically." >> docs/README.md
	@echo "For detailed information, see the main README.md file." >> docs/README.md
	@echo "✅ Basic documentation generated in docs/"

# Environment validation
check-env: ## Validate environment setup
	@echo "🔍 Checking environment..."
	@echo "Node version: $(NODE_VERSION)"
	@node --version
	@npm --version
	@if command -v docker >/dev/null 2>&1; then echo "Docker: $(shell docker --version)"; else echo "Docker: Not installed"; fi
	@echo "Project: $(PROJECT_NAME)"
	@echo "✅ Environment check completed"

# Git hooks (for development)
setup-hooks: ## Set up Git hooks
	@echo "🔧 Setting up Git hooks..."
	@if [ -d .git ]; then \
		echo "#!/bin/bash" > .git/hooks/pre-commit; \
		echo "make ci-quality" >> .git/hooks/pre-commit; \
		chmod +x .git/hooks/pre-commit; \
		echo "✅ Pre-commit hook installed (runs quality checks)"; \
	else \
		echo "ℹ️  Not a Git repository, skipping hooks setup"; \
	fi

# Monitoring and health checks
health-check: ## Check if the service is healthy
	@echo "🏥 Performing health check..."
	@if docker ps | grep -q $(PROJECT_NAME); then \
		echo "✅ Container is running"; \
		docker ps | grep $(PROJECT_NAME); \
	else \
		echo "❌ Container is not running"; \
		exit 1; \
	fi

logs: docker-logs ## Alias for docker-logs

status: ## Show project status
	@echo "📊 OpenDota MCP Server Status:"
	@echo "=============================="
	@echo "Project: $(PROJECT_NAME)"
	@echo "Timestamp: $(TIMESTAMP)"
	@echo "Node version: $(NODE_VERSION)"
	@echo ""
	@if [ -d "node_modules" ]; then echo "✅ Dependencies installed"; else echo "❌ Dependencies not installed (run: make install)"; fi
	@if [ -d "dist" ]; then echo "✅ Project built"; else echo "❌ Project not built (run: make build)"; fi
	@if [ -d "coverage" ]; then echo "✅ Test coverage available"; else echo "ℹ️  No test coverage (run: make test-coverage)"; fi
	@if [ -d "security-reports" ]; then echo "✅ Security scan available"; else echo "ℹ️  No security scan (run: make security)"; fi
	@if [ -d "sbom" ]; then echo "✅ SBOM available"; else echo "ℹ️  No SBOM (run: make sbom)"; fi
	@if docker images | grep -q $(PROJECT_NAME); then echo "✅ Docker image built"; else echo "ℹ️  Docker image not built (run: make docker-build)"; fi

# Quick shortcuts
all: quality docker-build ## Run everything (quality checks + Docker build)
	@echo "🎯 All tasks completed!"

quick: build test ## Quick development check (build + basic tests)
	@echo "⚡ Quick check completed!"