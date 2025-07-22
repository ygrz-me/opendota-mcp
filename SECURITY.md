# Security Policy and Procedures

## 🔒 Security Overview

The OpenDota MCP Server implements multiple layers of security controls to protect against common vulnerabilities and ensure safe operation in production environments.

## 🛡️ Security Features

### Container Security
- **Non-root execution**: Application runs as `mcp` user (UID 1001)
- **Read-only filesystem**: Minimizes attack surface
- **No new privileges**: Prevents privilege escalation
- **Minimal base image**: Alpine Linux with security updates
- **Multi-stage builds**: Reduces final image size and attack surface

### Application Security
- **Input validation**: All API inputs validated using Zod schemas
- **Error handling**: Structured error responses without information leakage
- **Logging**: Security events logged with appropriate detail levels
- **Timeout controls**: API requests have configurable timeouts
- **Rate limiting**: Built-in request throttling capabilities

### API Security
- **Optional API key authentication**: Supports OpenDota API keys
- **HTTPS enforcement**: All external API calls use HTTPS
- **User-Agent identification**: Proper identification for API calls
- **Error sanitization**: External API errors are sanitized before logging

## 🔍 Security Scanning

### Automated Scanning
The project includes automated security scanning:

```bash
# Run comprehensive security scan
make security

# Manual security scan
./scripts/security-scan.sh
```

### Scan Coverage
- **Dependency vulnerabilities**: npm audit integration
- **Static code analysis**: Pattern-based vulnerability detection
- **Secret scanning**: Detection of hardcoded credentials
- **Docker security**: Container configuration analysis
- **License compliance**: License compatibility checks

### Scan Reports
Security scan results are saved to `security-reports/`:
- `npm-audit-*.json` - Dependency vulnerability reports
- `secrets-scan-*.txt` - Potential secret detection results
- `docker-security-*.txt` - Container security analysis
- `security-summary-*.txt` - Consolidated security summary

## 🚨 Vulnerability Response

### Critical Vulnerabilities (CVSS 9.0+)
- **Response time**: 24 hours
- **Actions**: Immediate patching, emergency deployment
- **Communication**: Security advisory, stakeholder notification

### High Vulnerabilities (CVSS 7.0-8.9)
- **Response time**: 72 hours
- **Actions**: Priority patching, scheduled deployment
- **Communication**: Security update notification

### Medium/Low Vulnerabilities (CVSS <7.0)
- **Response time**: Next maintenance window
- **Actions**: Regular update cycle
- **Communication**: Release notes inclusion

## 🔐 Secrets Management

### Environment Variables
- Never commit secrets to version control
- Use `.env.example` for documentation
- Validate all `.env` files are in `.gitignore`

### API Keys
- Store OpenDota API keys in environment variables
- Rotate API keys regularly
- Monitor API key usage for anomalies

### Container Secrets
```bash
# Mount secrets at runtime (recommended)
docker run -v /host/secrets:/app/secrets:ro opendota-mcp-server

# Or use environment variables
docker run -e OPENDOTA_API_KEY="${API_KEY}" opendota-mcp-server
```

## 🏗️ Secure Development

### Code Security Practices
- Input validation on all external data
- Parameterized queries (if database is added)
- Secure error handling without information leakage
- Regular dependency updates
- Security-focused code reviews

### Development Environment
```bash
# Install with security audit
npm ci --audit

# Regular security updates
npm audit fix

# Check for outdated packages
npm outdated
```

## 📋 Security Checklist

### Pre-deployment
- [ ] All dependencies scanned for vulnerabilities
- [ ] No secrets in source code or containers
- [ ] Container runs as non-root user
- [ ] Security scan passes without critical issues
- [ ] Environment variables properly configured
- [ ] HTTPS endpoints verified

### Production Deployment
- [ ] Security-hardened container configuration
- [ ] Network security (firewalls, VPNs)
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Incident response plan activated
- [ ] Regular security updates scheduled

### Ongoing Security
- [ ] Regular dependency updates
- [ ] Security scan automation (CI/CD)
- [ ] Log monitoring for security events
- [ ] Access control reviews
- [ ] Security training for team members
- [ ] Penetration testing (if applicable)

## 🔒 Security Headers and Configurations

### HTTP Security Headers (when HTTP server is added)
```javascript
// Recommended security headers
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
}
```

### Docker Security Configuration
```yaml
# docker-compose.yml security settings
services:
  opendota-mcp-server:
    security_opt:
      - no-new-privileges:true
    read_only: true
    user: "1001:1001"
    cap_drop:
      - ALL
```

## 📊 Security Monitoring

### Log Analysis
- Monitor for unusual API access patterns
- Track authentication failures
- Detect potential DDoS attacks
- Analyze error rates and types

### Security Metrics
- Failed authentication attempts
- API rate limit violations
- Container restart frequency
- Resource usage anomalies

### Alerting Rules
```bash
# Example monitoring queries
# High error rates
sum(rate(errors_total[5m])) > 10

# Unusual API response times
histogram_quantile(0.95, api_request_duration) > 5s

# Container resource limits
container_memory_usage > container_memory_limit * 0.9
```

## 🚨 Incident Response

### Security Incident Classification
1. **P1 - Critical**: Active breach, service compromise
2. **P2 - High**: Vulnerability exploitation attempt
3. **P3 - Medium**: Security policy violation
4. **P4 - Low**: Minor security configuration issue

### Response Procedures
1. **Detection**: Automated alerts or manual discovery
2. **Assessment**: Impact and scope determination
3. **Containment**: Immediate threat mitigation
4. **Investigation**: Root cause analysis
5. **Recovery**: Service restoration
6. **Lessons Learned**: Post-incident review

### Contact Information
- Security Team: security@your-org.com
- Incident Response: incident@your-org.com
- Emergency Hotline: [Emergency contact number]

## 📚 Security Resources

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Container Security Guidelines](https://www.nist.gov/publications/application-container-security-guide)

### Internal Documentation
- [API Security Guidelines](./docs/api-security.md)
- [Container Security Policy](./docs/container-security.md)
- [Incident Response Playbook](./docs/incident-response.md)

## 🔄 Security Updates

This security policy is reviewed and updated:
- **Quarterly**: Regular policy review
- **After incidents**: Post-incident policy updates
- **Version releases**: Security feature additions
- **Compliance requirements**: Regulatory changes

---

**Last Updated**: 2024-07-22
**Next Review**: 2024-10-22
**Policy Version**: 1.0.0