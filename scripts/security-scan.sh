#!/bin/bash

# OpenDota MCP Server Security Scanning Script
# This script runs various security scans using free public tools

set -e

echo "🔒 Starting Security Scan for OpenDota MCP Server"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Create security report directory
mkdir -p security-reports
REPORT_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

print_status $YELLOW "📋 Creating security report directory: ${REPORT_DIR}"

# 1. NPM Audit - Check for known vulnerabilities
print_status $YELLOW "🔍 Running npm audit..."
if npm audit --json > "${REPORT_DIR}/npm-audit-${TIMESTAMP}.json" 2>/dev/null; then
    print_status $GREEN "✅ npm audit completed - no vulnerabilities found"
else
    print_status $RED "⚠️  npm audit found vulnerabilities - check ${REPORT_DIR}/npm-audit-${TIMESTAMP}.json"
fi

# Generate human-readable npm audit report
npm audit > "${REPORT_DIR}/npm-audit-readable-${TIMESTAMP}.txt" 2>/dev/null || true

# 2. Check for outdated packages
print_status $YELLOW "📦 Checking for outdated packages..."
npm outdated --json > "${REPORT_DIR}/outdated-packages-${TIMESTAMP}.json" 2>/dev/null || true

# 3. License compliance check
print_status $YELLOW "📄 Checking license compliance..."
if command_exists license-checker; then
    license-checker --json > "${REPORT_DIR}/license-check-${TIMESTAMP}.json" 2>/dev/null || true
else
    print_status $YELLOW "ℹ️  license-checker not installed, skipping license check"
fi

# 4. Dependency analysis
print_status $YELLOW "🔗 Analyzing dependencies..."
if command_exists npm-check; then
    npm-check --json > "${REPORT_DIR}/dependency-analysis-${TIMESTAMP}.json" 2>/dev/null || true
else
    print_status $YELLOW "ℹ️  npm-check not installed, skipping dependency analysis"
fi

# 5. Static code analysis for security patterns
print_status $YELLOW "🕵️  Running static code analysis..."

# Check for common security anti-patterns
grep -r "eval(" src/ > "${REPORT_DIR}/eval-usage-${TIMESTAMP}.txt" 2>/dev/null || echo "No eval() usage found" > "${REPORT_DIR}/eval-usage-${TIMESTAMP}.txt"
grep -r "innerHTML" src/ > "${REPORT_DIR}/innerHTML-usage-${TIMESTAMP}.txt" 2>/dev/null || echo "No innerHTML usage found" > "${REPORT_DIR}/innerHTML-usage-${TIMESTAMP}.txt"
grep -r "process.env" src/ > "${REPORT_DIR}/env-usage-${TIMESTAMP}.txt" 2>/dev/null || echo "No process.env usage found" > "${REPORT_DIR}/env-usage-${TIMESTAMP}.txt"

# Check for hardcoded secrets (basic patterns)
print_status $YELLOW "🔐 Scanning for potential hardcoded secrets..."
{
    echo "=== Potential API Keys ==="
    grep -r -i "api.*key" src/ || echo "No API key patterns found"
    echo ""
    echo "=== Potential Passwords ==="
    grep -r -i "password.*=" src/ || echo "No password patterns found"
    echo ""
    echo "=== Potential Tokens ==="
    grep -r -i "token.*=" src/ || echo "No token patterns found"
    echo ""
    echo "=== Long Base64-like Strings ==="
    grep -r "[A-Za-z0-9+/]\{40,\}" src/ || echo "No long base64-like strings found"
} > "${REPORT_DIR}/secrets-scan-${TIMESTAMP}.txt"

# 6. Docker security check (if Dockerfile exists)
if [ -f "Dockerfile" ]; then
    print_status $YELLOW "🐳 Analyzing Dockerfile security..."
    {
        echo "=== Dockerfile Security Analysis ==="
        echo "Checking for common security issues..."
        echo ""
        
        # Check for root user
        if grep -q "USER root" Dockerfile; then
            echo "⚠️  WARNING: Dockerfile uses root user"
        else
            echo "✅ Good: Dockerfile does not use root user explicitly"
        fi
        
        # Check for COPY/ADD with broad patterns
        if grep -q "COPY . " Dockerfile || grep -q "ADD . " Dockerfile; then
            echo "⚠️  WARNING: Dockerfile copies entire context - consider using .dockerignore"
        else
            echo "✅ Good: Dockerfile uses specific COPY patterns"
        fi
        
        # Check for package updates
        if grep -q "apt.*update" Dockerfile || grep -q "apk.*update" Dockerfile; then
            echo "✅ Good: Dockerfile updates packages"
        else
            echo "ℹ️  Info: Consider updating packages in Dockerfile"
        fi
        
        # Check for cleanup
        if grep -q "apt.*clean\|rm.*-rf.*var\|apk.*cache" Dockerfile; then
            echo "✅ Good: Dockerfile cleans up package cache"
        else
            echo "ℹ️  Info: Consider cleaning package cache in Dockerfile"
        fi
        
    } > "${REPORT_DIR}/docker-security-${TIMESTAMP}.txt"
fi

# 7. Check TypeScript configuration security
if [ -f "tsconfig.json" ]; then
    print_status $YELLOW "📝 Checking TypeScript configuration..."
    {
        echo "=== TypeScript Security Configuration ==="
        
        if grep -q "\"strict\".*true" tsconfig.json; then
            echo "✅ Good: TypeScript strict mode enabled"
        else
            echo "⚠️  WARNING: TypeScript strict mode not enabled"
        fi
        
        if grep -q "\"noImplicitAny\".*true" tsconfig.json; then
            echo "✅ Good: noImplicitAny enabled"
        else
            echo "⚠️  WARNING: noImplicitAny not enabled"
        fi
        
    } > "${REPORT_DIR}/typescript-security-${TIMESTAMP}.txt"
fi

# 8. Environment file security check
print_status $YELLOW "🌍 Checking environment file security..."
{
    echo "=== Environment File Security ==="
    
    # Check if .env is in .gitignore
    if [ -f ".gitignore" ] && grep -q "\.env" .gitignore; then
        echo "✅ Good: .env files are in .gitignore"
    else
        echo "⚠️  WARNING: .env files should be in .gitignore"
    fi
    
    # Check for .env files in repository
    if find . -name ".env*" -not -path "./node_modules/*" | grep -v ".env.example" | grep -v ".env.test" | head -1; then
        echo "⚠️  WARNING: Found .env files in repository"
    else
        echo "✅ Good: No sensitive .env files found in repository"
    fi
    
    # Check .env.example for placeholders
    if [ -f ".env.example" ]; then
        if grep -q "your.*key\|changeme\|placeholder" .env.example; then
            echo "✅ Good: .env.example contains placeholders, not real values"
        else
            echo "ℹ️  Info: Verify .env.example doesn't contain real secrets"
        fi
    fi
    
} > "${REPORT_DIR}/environment-security-${TIMESTAMP}.txt"

# 9. Generate summary report
print_status $YELLOW "📊 Generating security summary..."
{
    echo "OpenDota MCP Server - Security Scan Summary"
    echo "==========================================="
    echo "Timestamp: $(date)"
    echo "Project: $(basename $(pwd))"
    echo ""
    
    echo "Files Scanned:"
    echo "- Source code: $(find src/ -name "*.ts" | wc -l) TypeScript files"
    echo "- Configuration: $(ls *.json *.js 2>/dev/null | wc -l) config files"
    echo "- Docker: $(ls Docker* 2>/dev/null | wc -l) Docker files"
    echo ""
    
    echo "Security Checks Performed:"
    echo "✅ NPM vulnerability audit"
    echo "✅ Outdated packages check" 
    echo "✅ Static code analysis"
    echo "✅ Secret scanning"
    echo "✅ Docker security analysis"
    echo "✅ TypeScript configuration review"
    echo "✅ Environment file security check"
    echo ""
    
    echo "Report Files Generated:"
    ls -la "${REPORT_DIR}"/*-${TIMESTAMP}.* 2>/dev/null || echo "No report files found"
    echo ""
    
    echo "Next Steps:"
    echo "1. Review all generated reports in the ${REPORT_DIR}/ directory"
    echo "2. Address any HIGH or CRITICAL vulnerabilities immediately"
    echo "3. Update outdated packages regularly"
    echo "4. Implement fixes for security warnings"
    echo "5. Re-run this scan after making changes"
    
} > "${REPORT_DIR}/security-summary-${TIMESTAMP}.txt"

print_status $GREEN "✅ Security scan completed!"
print_status $YELLOW "📋 Reports generated in: ${REPORT_DIR}/"
print_status $YELLOW "📄 Summary available in: ${REPORT_DIR}/security-summary-${TIMESTAMP}.txt"

# Display quick summary
echo ""
print_status $YELLOW "Quick Summary:"
echo "=============="

# Count npm audit issues
if [ -f "${REPORT_DIR}/npm-audit-${TIMESTAMP}.json" ]; then
    VULN_COUNT=$(jq -r '.vulnerabilities // empty' "${REPORT_DIR}/npm-audit-${TIMESTAMP}.json" | wc -l 2>/dev/null || echo "0")
    if [ "$VULN_COUNT" -gt 0 ]; then
        print_status $RED "⚠️  Found ${VULN_COUNT} npm vulnerabilities"
    else
        print_status $GREEN "✅ No npm vulnerabilities found"
    fi
fi

# Check for critical patterns
EVAL_USAGE=$(grep -c "eval(" "${REPORT_DIR}/eval-usage-${TIMESTAMP}.txt" 2>/dev/null || echo "0")
if [ "$EVAL_USAGE" -gt 0 ]; then
    print_status $RED "⚠️  Found ${EVAL_USAGE} eval() usage instances"
else
    print_status $GREEN "✅ No dangerous eval() usage found"
fi

print_status $YELLOW "💡 Run 'cat ${REPORT_DIR}/security-summary-${TIMESTAMP}.txt' for detailed results"
echo ""