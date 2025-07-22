# OpenDota MCP Server - Production Deployment Guide

This document provides comprehensive guidance for deploying the OpenDota MCP Server to production environments.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.17.0 or later
- Docker and Docker Compose
- Make (for orchestration)

### Production Deployment
```bash
# Quick production deployment
make deploy-local

# Or step by step:
make quality           # Run all quality checks
make docker-build      # Build production image
make docker-run        # Start production containers
```

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Node.js version matches `.nvmrc` (20.17.0)
- [ ] Docker and Docker Compose installed
- [ ] Environment variables configured
- [ ] Security certificates in place (if needed)

### Quality Assurance
- [ ] All tests passing (`make test`)
- [ ] Security scan completed (`make security`)
- [ ] SBOM generated (`make sbom`)
- [ ] Code coverage meets requirements
- [ ] No critical vulnerabilities found

### Infrastructure
- [ ] Production environment provisioned
- [ ] Monitoring and logging configured
- [ ] Backup procedures in place
- [ ] Health check endpoints accessible
- [ ] Resource limits configured

## 🛠️ Build and Deployment

### Build Process
```bash
# Install dependencies
npm ci --production

# Build application
npm run build

# Run quality checks
make quality
```

### Docker Deployment
```bash
# Build production image
docker build -f Dockerfile.production -t opendota-mcp-server:prod .

# Run with production compose
docker-compose -f docker-compose.production.yml up -d

# Check health
docker-compose -f docker-compose.production.yml ps
```

### Environment Variables
```bash
# Required
NODE_ENV=production
LOG_LEVEL=info

# Optional API configuration
OPENDOTA_API_KEY=your_api_key_here
OPENDOTA_BASE_URL=https://api.opendota.com/api
OPENDOTA_TIMEOUT=30000
USER_AGENT=OpenDota-MCP-Server-Prod/1.0.0

# Logging
LOG_DIR=/app/logs
```

## 🔍 Monitoring and Health Checks

### Health Check Endpoint
The container includes a built-in health check:
```bash
# Manual health check
docker exec <container_id> node -e "console.log('Health check passed')"
```

### Logging
- Production logs are written to `/app/logs/`
- Log level controlled by `LOG_LEVEL` environment variable
- Structured JSON logging for production environments

### Monitoring Integration
```yaml
# Docker Compose monitoring example
version: '3.8'
services:
  opendota-mcp-server:
    # ... service config
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('Health check passed')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🔐 Security Considerations

### Container Security
- Runs as non-root user (`mcp:nodejs`)
- Read-only filesystem where possible
- Security options: `no-new-privileges:true`
- Regular security scans with `make security`

### Network Security
- Use custom Docker networks
- Limit exposed ports
- Implement proper firewall rules
- Use TLS for external communications

### Secrets Management
- Never include secrets in images
- Use environment variables or mounted secrets
- Regularly rotate API keys
- Monitor for hardcoded secrets

## 🔧 Configuration

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 128M
```

### Logging Configuration
```yaml
logging:
  driver: json-file
  options:
    max-size: 10m
    max-file: 3
```

## 📊 Performance Tuning

### Node.js Optimizations
```bash
# Environment variables for production
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=256"
```

### Container Optimizations
- Multi-stage Docker builds
- Minimal base images (Alpine Linux)
- Dependency pruning
- Layer caching optimization

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker-compose logs opendota-mcp-server

# Check health status
docker-compose ps
```

#### High Memory Usage
```bash
# Monitor resource usage
docker stats

# Adjust memory limits in docker-compose.production.yml
```

#### API Connection Issues
```bash
# Test API connectivity
curl -v https://api.opendota.com/api/heroes

# Check network configuration
docker network ls
docker network inspect <network_name>
```

### Debug Mode
```bash
# Run with debug logging
LOG_LEVEL=debug docker-compose up

# Run interactive container
docker run -it --rm opendota-mcp-server:prod /bin/bash
```

## 📈 Scaling

### Horizontal Scaling
```yaml
# Docker Compose scaling
version: '3.8'
services:
  opendota-mcp-server:
    # ... config
    deploy:
      replicas: 3
```

### Load Balancing
Consider using:
- Docker Swarm mode
- Kubernetes deployments
- External load balancers (nginx, haproxy)

## 🔄 Updates and Maintenance

### Update Process
1. Run quality checks on new version
2. Build new production image
3. Test in staging environment
4. Deploy with rolling updates
5. Monitor health and performance
6. Rollback if issues detected

### Maintenance Tasks
```bash
# Regular security scans
make security

# Update SBOM
make sbom

# Check for outdated dependencies
npm audit
```

### Backup Procedures
- Configuration files
- Environment variables
- Log archives
- Container images

## 🎯 Production Best Practices

### Security
- Regular security updates
- Vulnerability scanning
- Least privilege principles
- Audit logging

### Reliability
- Health checks
- Graceful shutdowns
- Error handling
- Retry mechanisms

### Observability
- Structured logging
- Metrics collection
- Distributed tracing
- Alerting

### Performance
- Resource monitoring
- Performance profiling
- Caching strategies
- Connection pooling

## 📞 Support and Contacts

### Emergency Procedures
1. Check health status
2. Review recent logs
3. Verify API connectivity
4. Check resource usage
5. Contact support team

### Maintenance Windows
- Schedule regular updates
- Communicate downtime
- Test rollback procedures
- Monitor post-deployment

## 📚 Additional Resources

- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [OpenDota API Documentation](https://docs.opendota.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

---

**Note**: This guide assumes a containerized deployment. Adapt the instructions based on your specific infrastructure requirements.