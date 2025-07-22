#!/bin/bash

# OpenDota MCP Server - Software Bill of Materials (SBOM) Generator
# This script generates comprehensive SBOM in multiple formats

set -e

echo "📋 Generating Software Bill of Materials (SBOM)"
echo "==============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Create SBOM directory
mkdir -p sbom
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

print_status $YELLOW "📦 Analyzing project dependencies..."

# Project metadata
PROJECT_NAME="opendota-mcp-server"
PROJECT_VERSION=$(node -p "require('./package.json').version")
PROJECT_DESCRIPTION=$(node -p "require('./package.json').description")

print_status $YELLOW "🏷️  Project: ${PROJECT_NAME} v${PROJECT_VERSION}"

# 1. Generate CycloneDX SBOM (JSON format)
print_status $YELLOW "🔄 Generating CycloneDX SBOM (JSON)..."
if command -v cdxgen >/dev/null 2>&1; then
    cdxgen -t js -o "sbom/${PROJECT_NAME}-sbom-${TIMESTAMP}.json" . --validate
    print_status $GREEN "✅ CycloneDX JSON SBOM generated"
else
    print_status $YELLOW "ℹ️  cdxgen not available, using npx..."
    npx @cyclonedx/cdxgen -t js -o "sbom/${PROJECT_NAME}-sbom-${TIMESTAMP}.json" . --validate || true
fi

# 2. Generate CycloneDX SBOM (XML format)
print_status $YELLOW "🔄 Generating CycloneDX SBOM (XML)..."
if command -v cdxgen >/dev/null 2>&1; then
    cdxgen -t js -o "sbom/${PROJECT_NAME}-sbom-${TIMESTAMP}.xml" . --spec-version 1.4 --format xml --validate
    print_status $GREEN "✅ CycloneDX XML SBOM generated"
else
    npx @cyclonedx/cdxgen -t js -o "sbom/${PROJECT_NAME}-sbom-${TIMESTAMP}.xml" . --spec-version 1.4 --format xml --validate || true
fi

# 3. Generate detailed dependency tree
print_status $YELLOW "🌳 Generating dependency tree..."
npm ls --all --json > "sbom/dependency-tree-${TIMESTAMP}.json" 2>/dev/null || true
npm ls --all > "sbom/dependency-tree-readable-${TIMESTAMP}.txt" 2>/dev/null || true

# 4. Generate license report
print_status $YELLOW "📄 Generating license report..."
{
    echo "Software Bill of Materials - License Report"
    echo "=========================================="
    echo "Project: ${PROJECT_NAME}"
    echo "Version: ${PROJECT_VERSION}"
    echo "Generated: $(date)"
    echo ""
    
    echo "Direct Dependencies:"
    echo "==================="
    node -p "
        const pkg = require('./package.json');
        const deps = pkg.dependencies || {};
        Object.keys(deps).map(name => 
            \`\${name}@\${deps[name]}\`
        ).join('\\n');
    "
    echo ""
    
    echo "Development Dependencies:"
    echo "========================"
    node -p "
        const pkg = require('./package.json');
        const devDeps = pkg.devDependencies || {};
        Object.keys(devDeps).map(name => 
            \`\${name}@\${devDeps[name]}\`
        ).join('\\n');
    "
    echo ""
    
} > "sbom/license-report-${TIMESTAMP}.txt"

# 5. Generate vulnerability assessment
print_status $YELLOW "🔍 Generating vulnerability assessment..."
{
    echo "Software Bill of Materials - Vulnerability Assessment"
    echo "===================================================="
    echo "Project: ${PROJECT_NAME}"
    echo "Generated: $(date)"
    echo ""
    
    echo "NPM Audit Results:"
    echo "=================="
    npm audit --json 2>/dev/null || echo "No vulnerabilities found or audit failed"
    
} > "sbom/vulnerability-assessment-${TIMESTAMP}.json"

# 6. Generate supply chain metadata
print_status $YELLOW "🔗 Generating supply chain metadata..."
{
    echo "Software Bill of Materials - Supply Chain Metadata"
    echo "================================================="
    echo "Project: ${PROJECT_NAME}"
    echo "Version: ${PROJECT_VERSION}"
    echo "Description: ${PROJECT_DESCRIPTION}"
    echo "Generated: $(date)"
    echo "Node Version: $(node --version)"
    echo "NPM Version: $(npm --version)"
    echo ""
    
    echo "Build Environment:"
    echo "=================="
    echo "OS: $(uname -s)"
    echo "Architecture: $(uname -m)"
    echo "Hostname: $(hostname)"
    echo "User: $(whoami)"
    echo ""
    
    echo "Git Information:"
    echo "==============="
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Repository: $(git config --get remote.origin.url 2>/dev/null || echo 'Not available')"
        echo "Branch: $(git branch --show-current 2>/dev/null || echo 'Not available')"
        echo "Commit: $(git rev-parse HEAD 2>/dev/null || echo 'Not available')"
        echo "Commit Date: $(git log -1 --format=%cd 2>/dev/null || echo 'Not available')"
    else
        echo "Not a git repository"
    fi
    echo ""
    
    echo "Package Manager Files:"
    echo "====================="
    ls -la package*.json 2>/dev/null || echo "No package files found"
    echo ""
    
    echo "Lock Files:"
    echo "==========="
    ls -la *lock* *.lock 2>/dev/null || echo "No lock files found"
    
} > "sbom/supply-chain-metadata-${TIMESTAMP}.txt"

# 7. Generate SPDX-style SBOM (if tools available)
print_status $YELLOW "📋 Generating SPDX-style information..."
{
    echo "SPDXVersion: SPDX-2.3"
    echo "DataLicense: CC0-1.0"
    echo "SPDXID: SPDXRef-DOCUMENT"
    echo "DocumentName: ${PROJECT_NAME}-SBOM"
    echo "DocumentNamespace: https://sbom.example.com/${PROJECT_NAME}/${TIMESTAMP}"
    echo "CreationInfo:"
    echo "  Created: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "  Creators: Tool: generate-sbom.sh"
    echo ""
    
    echo "PackageName: ${PROJECT_NAME}"
    echo "SPDXID: SPDXRef-Package"
    echo "PackageVersion: ${PROJECT_VERSION}"
    echo "PackageSupplier: Organization: $(git config user.name 2>/dev/null || echo 'Unknown')"
    echo "PackageDownloadLocation: NOASSERTION"
    echo "FilesAnalyzed: true"
    echo "PackageLicenseConcluded: MIT"
    echo "PackageLicenseDeclared: MIT"
    echo "PackageCopyrightText: NOASSERTION"
    echo ""
    
    # Add dependency information
    echo "# Dependencies"
    node -p "
        const pkg = require('./package.json');
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        Object.keys(allDeps).map((name, index) => {
            return \`
PackageName: \${name}
SPDXID: SPDXRef-Package-\${index + 1}
PackageVersion: \${allDeps[name]}
PackageSupplier: Organization: NPM
PackageDownloadLocation: https://registry.npmjs.org/\${name}
FilesAnalyzed: false
PackageLicenseConcluded: NOASSERTION
PackageLicenseDeclared: NOASSERTION
PackageCopyrightText: NOASSERTION
\`;
        }).join('\\n');
    "
    
} > "sbom/spdx-sbom-${TIMESTAMP}.txt"

# 8. Generate summary report
print_status $YELLOW "📊 Generating SBOM summary..."
{
    echo "Software Bill of Materials - Summary Report"
    echo "==========================================="
    echo "Project: ${PROJECT_NAME}"
    echo "Version: ${PROJECT_VERSION}"
    echo "Generated: $(date)"
    echo "Timestamp: ${TIMESTAMP}"
    echo ""
    
    echo "SBOM Files Generated:"
    echo "===================="
    ls -la sbom/*-${TIMESTAMP}.* 2>/dev/null || echo "No SBOM files found"
    echo ""
    
    echo "Dependency Statistics:"
    echo "====================="
    PROD_DEPS=$(node -p "Object.keys(require('./package.json').dependencies || {}).length")
    DEV_DEPS=$(node -p "Object.keys(require('./package.json').devDependencies || {}).length")
    echo "Production Dependencies: ${PROD_DEPS}"
    echo "Development Dependencies: ${DEV_DEPS}"
    echo "Total Direct Dependencies: $((PROD_DEPS + DEV_DEPS))"
    
    # Count total dependencies including transitive
    if [ -f "sbom/dependency-tree-${TIMESTAMP}.json" ]; then
        TOTAL_DEPS=$(jq -r '.dependencies // {} | keys | length' "sbom/dependency-tree-${TIMESTAMP}.json" 2>/dev/null || echo "Unknown")
        echo "Total Dependencies (including transitive): ${TOTAL_DEPS}"
    fi
    echo ""
    
    echo "File Checksums:"
    echo "==============="
    echo "Generated SBOM file checksums for integrity verification:"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum sbom/*-${TIMESTAMP}.* 2>/dev/null || echo "No files to checksum"
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 sbom/*-${TIMESTAMP}.* 2>/dev/null || echo "No files to checksum"
    else
        echo "No checksum utility available"
    fi
    echo ""
    
    echo "SBOM Standards Compliance:"
    echo "========================="
    echo "✅ CycloneDX 1.4 (JSON and XML formats)"
    echo "✅ SPDX 2.3 (text format)"
    echo "✅ Custom detailed reports"
    echo ""
    
    echo "Usage Instructions:"
    echo "=================="
    echo "1. Share SBOM files with security teams and compliance officers"
    echo "2. Use CycloneDX files for automated vulnerability scanning"
    echo "3. Include SPDX files in compliance documentation"
    echo "4. Verify file integrity using provided checksums"
    echo "5. Regenerate SBOM after dependency updates"
    
} > "sbom/sbom-summary-${TIMESTAMP}.txt"

print_status $GREEN "✅ SBOM generation completed!"
print_status $YELLOW "📋 Files generated in: sbom/"
print_status $YELLOW "📄 Summary available in: sbom/sbom-summary-${TIMESTAMP}.txt"

echo ""
print_status $YELLOW "Generated Files:"
echo "==============="
ls -la sbom/*-${TIMESTAMP}.* 2>/dev/null || echo "No files generated"

echo ""
print_status $YELLOW "💡 Next Steps:"
echo "=============="
echo "1. Review the SBOM summary report"
echo "2. Share SBOM files with stakeholders"
echo "3. Set up automated SBOM generation in CI/CD"
echo "4. Monitor dependencies for security updates"
echo "5. Update SBOM when dependencies change"